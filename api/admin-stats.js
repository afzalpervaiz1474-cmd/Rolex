import supabase from './db-client.js';
import { cors, requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    const [ordersRes, productsRes, profilesRes, reviewsRes, messagesRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id,name,slug,stock,status,price,images'),
      supabase.from('profiles').select('id,created_at'),
      supabase.from('reviews').select('id,status'),
      supabase.from('contact_messages').select('id,status'),
    ]);
    if (ordersRes.error) throw ordersRes.error;

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const profiles = profilesRes.data || [];
    const reviews = reviewsRes.data || [];
    const messages = messagesRes.data || [];

    const live = orders.filter((o) => o.status !== 'cancelled');
    const revenue = live.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const now = Date.now();
    const dayMs = 86400000;
    const last30 = live.filter((o) => now - new Date(o.created_at).getTime() < 30 * dayMs);
    const prev30 = live.filter((o) => {
      const age = now - new Date(o.created_at).getTime();
      return age >= 30 * dayMs && age < 60 * dayMs;
    });
    const sum = (list) => list.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const growth = (cur, prev) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));

    const revenueByDay = [];
    for (let i = 13; i >= 0; i -= 1) {
      const day = new Date(now - i * dayMs);
      const key = day.toISOString().slice(0, 10);
      const total = live
        .filter((o) => String(o.created_at).slice(0, 10) === key)
        .reduce((s, o) => s + (Number(o.total) || 0), 0);
      revenueByDay.push({ date: key, revenue: Math.round(total * 100) / 100 });
    }

    const productSales = new Map();
    live.forEach((o) => {
      (o.items || []).forEach((it) => {
        const cur = productSales.get(it.product_id) || { product_id: it.product_id, name: it.name, slug: it.slug, image: it.image, quantity: 0, revenue: 0 };
        cur.quantity += Number(it.quantity) || 0;
        cur.revenue += (Number(it.price) || 0) * (Number(it.quantity) || 0);
        productSales.set(it.product_id, cur);
      });
    });
    const topProducts = [...productSales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      revenue: Math.round(revenue * 100) / 100,
      revenue_30d: Math.round(sum(last30) * 100) / 100,
      revenue_growth: growth(sum(last30), sum(prev30)),
      orders_count: orders.length,
      orders_30d: last30.length,
      orders_growth: growth(last30.length, prev30.length),
      average_order: live.length ? Math.round((revenue / live.length) * 100) / 100 : 0,
      customers_count: profiles.length,
      products_count: products.length,
      active_products: products.filter((p) => p.status === 'active').length,
      pending_orders: statusCounts.pending || 0,
      pending_reviews: reviews.filter((r) => r.status === 'pending').length,
      new_messages: messages.filter((m) => m.status === 'new').length,
      status_counts: statusCounts,
      low_stock: products
        .filter((p) => p.status === 'active' && p.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6)
        .map((p) => ({ id: p.id, name: p.name, slug: p.slug, stock: p.stock, image: Array.isArray(p.images) ? p.images[0] || '' : '' })),
      recent_orders: orders.slice(0, 8),
      revenue_by_day: revenueByDay,
      top_products: topProducts,
    });
  } catch (err) {
    console.error('admin-stats API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
