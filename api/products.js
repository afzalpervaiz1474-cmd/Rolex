import supabase from './db-client.js';
import { cors, getAuth, requireAdmin, parseBody, slugify } from './_auth.js';

const STATUSES = ['active', 'draft', 'archived'];

async function withCollections(rows) {
  const { data: cols } = await supabase.from('collections').select('id,name,slug');
  const map = new Map((cols || []).map((c) => [c.id, c]));
  return rows.map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : [],
    specs: Array.isArray(p.specs) ? p.specs : [],
    features: Array.isArray(p.features) ? p.features : [],
    collection: p.collection_id ? map.get(p.collection_id) || null : null,
  }));
}

const label = (k) => k.replace(/_/g, ' ');

function normalize(body, partial) {
  const out = {};
  const errors = [];
  const text = (k, required = false) => {
    if (body[k] !== undefined) {
      out[k] = String(body[k] ?? '').trim();
      if (required && !out[k]) errors.push(`${label(k)} is required`);
    } else if (required && !partial) {
      errors.push(`${label(k)} is required`);
    }
  };
  const number = (k, { nullable = false, required = false, min = 0 } = {}) => {
    if (body[k] === undefined) {
      if (required && !partial) errors.push(`${label(k)} is required`);
      return;
    }
    if (body[k] === '' || body[k] === null) {
      if (nullable) out[k] = null;
      else if (required) errors.push(`${label(k)} is required`);
      return;
    }
    const n = Number(body[k]);
    if (Number.isNaN(n) || n < min) errors.push(`${label(k)} must be a number of at least ${min}`);
    else out[k] = n;
  };

  text('name', true);
  text('slug');
  text('short_description');
  text('description');
  text('sku');
  text('materials');
  text('status');
  number('price', { required: true });
  number('compare_at_price', { nullable: true });
  number('stock');
  number('collection_id', { nullable: true });

  if (body.featured !== undefined) out.featured = Boolean(body.featured);
  if (body.images !== undefined) {
    out.images = Array.isArray(body.images) ? body.images.map((s) => String(s || '').trim()).filter(Boolean) : [];
  }
  if (body.specs !== undefined) {
    out.specs = Array.isArray(body.specs)
      ? body.specs
          .filter((s) => s && String(s.label || '').trim() && String(s.value || '').trim())
          .map((s) => ({ label: String(s.label).trim(), value: String(s.value).trim() }))
      : [];
  }
  if (body.features !== undefined) {
    out.features = Array.isArray(body.features) ? body.features.map((f) => String(f || '').trim()).filter(Boolean) : [];
  }
  if (out.status && !STATUSES.includes(out.status)) errors.push('Invalid status');
  if (out.stock !== undefined && !Number.isInteger(out.stock)) errors.push('stock must be a whole number');
  if (!partial && out.name && !out.slug) out.slug = slugify(out.name);
  if (out.slug !== undefined) {
    out.slug = slugify(out.slug);
    if (!out.slug) errors.push('slug is required');
  }
  if (out.compare_at_price != null && out.price != null && out.compare_at_price <= out.price) {
    errors.push('Compare-at price must be greater than the price');
  }
  return { out, errors };
}

async function handleGet(req, res) {
  const q = req.query || {};
  let isAdmin = false;
  if (q.all === '1') {
    const auth = await getAuth(req);
    isAdmin = auth.isAdmin;
  }
  let query = supabase.from('products').select('*');
  if (!isAdmin) query = query.eq('status', 'active');
  if (q.slug) query = query.eq('slug', String(q.slug));
  if (q.id) query = query.eq('id', Number(q.id));
  if (q.collection) {
    const { data: col } = await supabase.from('collections').select('id').eq('slug', String(q.collection)).maybeSingle();
    if (!col) return res.status(200).json([]);
    query = query.eq('collection_id', col.id);
  }
  if (q.collection_id) query = query.eq('collection_id', Number(q.collection_id));
  if (q.featured === '1') query = query.eq('featured', true);
  if (q.status && isAdmin && STATUSES.includes(String(q.status))) query = query.eq('status', String(q.status));
  if (q.search) {
    const s = String(q.search).replace(/[%,()"'\\]/g, '').trim();
    if (s) {
      query = query.or(
        `name.ilike.%${s}%,short_description.ilike.%${s}%,materials.ilike.%${s}%,sku.ilike.%${s}%`
      );
    }
  }
  if (q.min_price) query = query.gte('price', Number(q.min_price));
  if (q.max_price) query = query.lte('price', Number(q.max_price));
  if (q.exclude) query = query.neq('id', Number(q.exclude));

  switch (q.sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    default:
      query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
  }
  query = query.order('id', { ascending: true });
  if (q.limit) query = query.limit(Number(q.limit));

  const { data, error } = await query;
  if (error) throw error;
  const rows = await withCollections(data || []);
  if (q.slug || q.id) {
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json(rows[0]);
  }
  return res.status(200).json(rows);
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') return await handleGet(req, res);

    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const body = parseBody(req);
    const now = new Date().toISOString();

    if (req.method === 'POST') {
      const { out, errors } = normalize(body, false);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      const row = {
        status: 'active',
        stock: 0,
        featured: false,
        images: [],
        specs: [],
        features: [],
        short_description: '',
        description: '',
        sku: '',
        materials: '',
        rating: 0,
        review_count: 0,
        compare_at_price: null,
        collection_id: null,
        ...out,
        updated_at: now,
      };
      const { data: dupe } = await supabase.from('products').select('id').eq('slug', row.slug).maybeSingle();
      if (dupe) return res.status(400).json({ error: 'A product with this slug already exists' });
      const { data, error } = await supabase.from('products').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json((await withCollections([data]))[0]);
    }

    if (req.method === 'PUT') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Product id is required' });
      const { out, errors } = normalize(body, true);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      if (out.slug) {
        const { data: dupe } = await supabase.from('products').select('id').eq('slug', out.slug).neq('id', id).maybeSingle();
        if (dupe) return res.status(400).json({ error: 'A product with this slug already exists' });
      }
      const { data, error } = await supabase
        .from('products')
        .update({ ...out, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json((await withCollections([data]))[0]);
    }

    if (req.method === 'DELETE') {
      const id = Number(body.id || req.query?.id);
      if (!id) return res.status(400).json({ error: 'Product id is required' });
      await supabase.from('reviews').delete().eq('product_id', id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('products API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
