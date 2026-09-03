import supabase from './db-client.js';
import { cors, getAuth, parseBody, isEmail } from './_auth.js';
import { getSettings, evaluateCoupon, computeTotals, round } from './_pricing.js';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const ADDRESS_FIELDS = ['full_name', 'line1', 'city', 'state', 'postal_code', 'country'];

function orderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AE-${ts}-${rand}`;
}

async function restock(items) {
  for (const item of items || []) {
    const { data: p } = await supabase.from('products').select('stock').eq('id', item.product_id).maybeSingle();
    if (p) await supabase.from('products').update({ stock: (p.stock || 0) + item.quantity }).eq('id', item.product_id);
  }
}

async function handleGet(req, res) {
  const q = req.query || {};
  const auth = await getAuth(req);

  if (q.id || q.number) {
    let query = supabase.from('orders').select('*');
    query = q.number ? query.eq('order_number', String(q.number)) : query.eq('id', Number(q.id));
    const { data: order, error } = await query.maybeSingle();
    if (error) throw error;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const emailMatch = q.email && String(q.email).toLowerCase() === String(order.email || '').toLowerCase();
    const ownerMatch =
      auth.user && (order.user_id === auth.user.id || String(order.email || '').toLowerCase() === String(auth.user.email || '').toLowerCase());
    if (!(auth.isAdmin || ownerMatch || emailMatch)) {
      return res.status(403).json({ error: 'You do not have access to this order' });
    }
    return res.status(200).json(order);
  }

  if (!auth.user) return res.status(401).json({ error: 'Authentication required' });
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (!auth.isAdmin) {
    const email = String(auth.user.email || '').replace(/[,()]/g, '');
    query = query.or(`user_id.eq.${auth.user.id},email.eq.${email}`);
  } else {
    if (q.status && STATUSES.includes(String(q.status))) query = query.eq('status', String(q.status));
    if (q.user_id) query = query.eq('user_id', String(q.user_id));
    if (q.search) {
      const s = String(q.search).replace(/[%,()"'\\]/g, '').trim();
      if (s) query = query.or(`order_number.ilike.%${s}%,email.ilike.%${s}%`);
    }
  }
  if (q.limit) query = query.limit(Number(q.limit));
  const { data, error } = await query;
  if (error) throw error;
  return res.status(200).json(data || []);
}

async function handleCreate(req, res) {
  const body = parseBody(req);
  const auth = await getAuth(req);
  const email = String(body.email || auth.user?.email || '').trim().toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ error: 'A valid email address is required' });

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return res.status(400).json({ error: 'Your cart is empty' });

  const address = body.shipping_address || {};
  for (const f of ADDRESS_FIELDS) {
    if (!String(address[f] || '').trim()) return res.status(400).json({ error: `Shipping ${f.replace('_', ' ')} is required` });
  }
  const shipping_address = {
    full_name: String(address.full_name).trim(),
    line1: String(address.line1).trim(),
    line2: String(address.line2 || '').trim(),
    city: String(address.city).trim(),
    state: String(address.state).trim(),
    postal_code: String(address.postal_code).trim(),
    country: String(address.country).trim(),
    phone: String(address.phone || '').trim(),
  };

  const payment = body.payment || {};
  const last4 = String(payment.last4 || '').replace(/\D/g, '').slice(-4);
  if (last4.length !== 4) return res.status(400).json({ error: 'Payment details are incomplete' });

  const ids = [...new Set(items.map((i) => Number(i.product_id)).filter(Boolean))];
  const { data: products, error: pErr } = await supabase.from('products').select('*').in('id', ids).eq('status', 'active');
  if (pErr) throw pErr;
  const byId = new Map((products || []).map((p) => [p.id, p]));

  const lineItems = [];
  let subtotal = 0;
  for (const item of items) {
    const product = byId.get(Number(item.product_id));
    const qty = Math.floor(Number(item.quantity));
    if (!product) return res.status(400).json({ error: 'One of the items in your cart is no longer available' });
    if (!qty || qty < 1) return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
    if (product.stock < qty) {
      return res.status(400).json({ error: `Only ${product.stock} unit${product.stock === 1 ? '' : 's'} of ${product.name} remain` });
    }
    subtotal += Number(product.price) * qty;
    lineItems.push({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: Number(product.price),
      quantity: qty,
      image: Array.isArray(product.images) && product.images[0] ? product.images[0] : '',
    });
  }
  subtotal = round(subtotal);

  let discount = 0;
  let coupon = null;
  const couponCode = String(body.coupon_code || '').trim().toUpperCase();
  if (couponCode) {
    const { data: c } = await supabase.from('coupons').select('*').eq('code', couponCode).maybeSingle();
    const evalResult = evaluateCoupon(c, subtotal);
    if (!evalResult.ok) return res.status(400).json({ error: evalResult.error });
    discount = evalResult.discount;
    coupon = c;
  }

  const settings = await getSettings();
  const totals = computeTotals({ subtotal, discount, settings });

  const row = {
    order_number: orderNumber(),
    user_id: auth.user ? auth.user.id : null,
    email,
    status: 'pending',
    items: lineItems,
    ...totals,
    coupon_code: coupon ? coupon.code : null,
    shipping_address,
    payment_method: 'card',
    payment_last4: last4,
    notes: String(body.notes || '').trim().slice(0, 1000),
    updated_at: new Date().toISOString(),
  };

  const { data: order, error } = await supabase.from('orders').insert(row).select().single();
  if (error) throw error;

  for (const li of lineItems) {
    const product = byId.get(li.product_id);
    await supabase.from('products').update({ stock: Math.max(0, product.stock - li.quantity) }).eq('id', li.product_id);
  }
  if (coupon) {
    await supabase.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);
  }
  return res.status(201).json(order);
}

async function handleUpdate(req, res) {
  const body = parseBody(req);
  const auth = await getAuth(req);
  if (!auth.user) return res.status(401).json({ error: 'Authentication required' });
  const id = Number(body.id);
  const status = String(body.status || '');
  if (!id) return res.status(400).json({ error: 'Order id is required' });
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (!auth.isAdmin) {
    const owner = order.user_id === auth.user.id || String(order.email).toLowerCase() === String(auth.user.email).toLowerCase();
    if (!owner) return res.status(403).json({ error: 'You do not have access to this order' });
    if (status !== 'cancelled' || order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }
  }

  if (status === 'cancelled' && order.status !== 'cancelled') await restock(order.items);

  const patch = { status, updated_at: new Date().toISOString() };
  if (auth.isAdmin && body.notes !== undefined) patch.notes = String(body.notes).slice(0, 1000);
  const { data, error } = await supabase.from('orders').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return res.status(200).json(data);
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') return await handleGet(req, res);
    if (req.method === 'POST') return await handleCreate(req, res);
    if (req.method === 'PUT') return await handleUpdate(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('orders API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
