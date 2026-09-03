import supabase from './db-client.js';
import { cors, requireAdmin, parseBody, slugify } from './_auth.js';

async function withCounts(rows) {
  const { data: products } = await supabase.from('products').select('collection_id').eq('status', 'active');
  const counts = new Map();
  (products || []).forEach((p) => counts.set(p.collection_id, (counts.get(p.collection_id) || 0) + 1));
  return rows.map((c) => ({ ...c, product_count: counts.get(c.id) || 0 }));
}

function normalize(body, partial) {
  const out = {};
  const errors = [];
  const text = (k, required = false) => {
    if (body[k] !== undefined) {
      out[k] = String(body[k] ?? '').trim();
      if (required && !out[k]) errors.push(`${k} is required`);
    } else if (required && !partial) errors.push(`${k} is required`);
  };
  text('name', true);
  text('slug');
  text('tagline');
  text('description');
  text('image_url');
  if (body.featured !== undefined) out.featured = Boolean(body.featured);
  if (body.sort_order !== undefined && body.sort_order !== '') {
    const n = Number(body.sort_order);
    if (Number.isNaN(n)) errors.push('sort order must be a number');
    else out.sort_order = n;
  }
  if (!partial && out.name && !out.slug) out.slug = slugify(out.name);
  if (out.slug !== undefined) {
    out.slug = slugify(out.slug);
    if (!out.slug) errors.push('slug is required');
  }
  return { out, errors };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const q = req.query || {};
      let query = supabase.from('collections').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true });
      if (q.slug) query = query.eq('slug', String(q.slug));
      if (q.featured === '1') query = query.eq('featured', true);
      const { data, error } = await query;
      if (error) throw error;
      const rows = await withCounts(data || []);
      if (q.slug) {
        if (!rows.length) return res.status(404).json({ error: 'Collection not found' });
        return res.status(200).json(rows[0]);
      }
      return res.status(200).json(rows);
    }

    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const body = parseBody(req);

    if (req.method === 'POST') {
      const { out, errors } = normalize(body, false);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      const { data: dupe } = await supabase.from('collections').select('id').eq('slug', out.slug).maybeSingle();
      if (dupe) return res.status(400).json({ error: 'A collection with this slug already exists' });
      const row = { tagline: '', description: '', image_url: '', featured: false, sort_order: 0, ...out };
      const { data, error } = await supabase.from('collections').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json({ ...data, product_count: 0 });
    }

    if (req.method === 'PUT') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Collection id is required' });
      const { out, errors } = normalize(body, true);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      if (out.slug) {
        const { data: dupe } = await supabase.from('collections').select('id').eq('slug', out.slug).neq('id', id).maybeSingle();
        if (dupe) return res.status(400).json({ error: 'A collection with this slug already exists' });
      }
      const { data, error } = await supabase.from('collections').update(out).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json((await withCounts([data]))[0]);
    }

    if (req.method === 'DELETE') {
      const id = Number(body.id || req.query?.id);
      if (!id) return res.status(400).json({ error: 'Collection id is required' });
      await supabase.from('products').update({ collection_id: null }).eq('collection_id', id);
      const { error } = await supabase.from('collections').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('collections API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
