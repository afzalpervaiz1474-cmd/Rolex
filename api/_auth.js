import supabase from './db-client.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@aether.store')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export async function getUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function ensureProfile(user) {
  const email = (user.email || '').toLowerCase();
  const shouldBeAdmin = ADMIN_EMAILS.includes(email);
  const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (existing) {
    if (existing.role !== 'admin' && shouldBeAdmin) {
      const { data: updated } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()
        .single();
      return updated || existing;
    }
    return existing;
  }
  const meta = user.user_metadata || {};
  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: meta.full_name || meta.name || '',
      role: shouldBeAdmin ? 'admin' : 'customer',
      avatar_url: meta.avatar_url || meta.picture || '',
      phone: '',
    })
    .select()
    .single();
  if (error) {
    // Race condition: another request created the profile first
    const { data: again } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (again) return again;
    throw error;
  }
  return created;
}

export async function getAuth(req) {
  const user = await getUser(req);
  if (!user) return { user: null, profile: null, isAdmin: false };
  const profile = await ensureProfile(user);
  return { user, profile, isAdmin: profile?.role === 'admin' };
}

export async function requireUser(req, res) {
  const auth = await getAuth(req);
  if (!auth.user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return auth;
}

export async function requireAdmin(req, res) {
  const auth = await getAuth(req);
  if (!auth.user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  if (!auth.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return auth;
}

export const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
