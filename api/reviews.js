import supabase from './db-client.js';
import { cors, getAuth, requireUser, requireAdmin, parseBody } from './_auth.js';

async function recalcProduct(productId) {
  const { data } = await supabase.from('reviews').select('rating').eq('product_id', productId).eq('status', 'approved');
  const list = data || [];
  const count = list.length;
  const avg = count ? Math.round((list.reduce((s, r) => s + Number(r.rating), 0) / count) * 10) / 10 : 0;
  await supabase.from('products').update({ rating: avg, review_count: count }).eq('id', productId);
}

async function withProducts(rows) {
  const ids = [...new Set(rows.map((r) => r.product_id))];
  if (!ids.length) return rows;
  const { data: products } = await supabase.from('products').select('id,name,slug,images').in('id', ids);
  const map = new Map((products || []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = map.get(r.product_id);
    return { ...r, product: p ? { id: p.id, name: p.name, slug: p.slug, image: Array.isArray(p.images) ? p.images[0] || '' : '' } : null };
  });
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const q = req.query || {};
      if (q.all === '1') {
        const auth = await requireAdmin(req, res);
        if (!auth) return;
        let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (q.status) query = query.eq('status', String(q.status));
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(await withProducts(data || []));
      }
      if (q.mine === '1') {
        const auth = await requireUser(req, res);
        if (!auth) return;
        const { data, error } = await supabase.from('reviews').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(await withProducts(data || []));
      }
      const productId = Number(q.product_id);
      if (!productId) return res.status(400).json({ error: 'product_id is required' });
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    const body = parseBody(req);

    if (req.method === 'POST') {
      const auth = await requireUser(req, res);
      if (!auth) return;
      const product_id = Number(body.product_id);
      const rating = Number(body.rating);
      const title = String(body.title || '').trim();
      const text = String(body.body || '').trim();
      if (!product_id) return res.status(400).json({ error: 'Product is required' });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      if (title.length < 3) return res.status(400).json({ error: 'Title must be at least 3 characters' });
      if (text.length < 10) return res.status(400).json({ error: 'Review must be at least 10 characters' });
      const { data: product } = await supabase.from('products').select('id').eq('id', product_id).maybeSingle();
      if (!product) return res.status(404).json({ error: 'Product not found' });
      const { data: existing } = await supabase.from('reviews').select('id').eq('product_id', product_id).eq('user_id', auth.user.id).maybeSingle();
      if (existing) return res.status(400).json({ error: 'You have already reviewed this object' });
      const author_name = auth.profile?.full_name || String(auth.user.email || '').split('@')[0];
      const { data, error } = await supabase
        .from('reviews')
        .insert({ product_id, user_id: auth.user.id, author_name, rating, title, body: text, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const auth = await requireAdmin(req, res);
      if (!auth) return;
      const id = Number(body.id);
      const status = String(body.status || '');
      if (!id) return res.status(400).json({ error: 'Review id is required' });
      if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const { data, error } = await supabase.from('reviews').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      await recalcProduct(data.product_id);
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const auth = await getAuth(req);
      if (!auth.user) return res.status(401).json({ error: 'Authentication required' });
      const id = Number(body.id || req.query?.id);
      if (!id) return res.status(400).json({ error: 'Review id is required' });
      const { data: review } = await supabase.from('reviews').select('*').eq('id', id).maybeSingle();
      if (!review) return res.status(404).json({ error: 'Review not found' });
      if (!auth.isAdmin && review.user_id !== auth.user.id) return res.status(403).json({ error: 'Forbidden' });
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      await recalcProduct(review.product_id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('reviews API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
