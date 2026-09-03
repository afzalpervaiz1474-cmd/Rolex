import supabase from './db-client.js';
import { cors, parseBody, isEmail, requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'POST') {
      const body = parseBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const subject = String(body.subject || '').trim();
      const message = String(body.message || '').trim();
      if (name.length < 2) return res.status(400).json({ error: 'Please tell us your name' });
      if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
      if (subject.length < 3) return res.status(400).json({ error: 'Please add a subject' });
      if (message.length < 10) return res.status(400).json({ error: 'Your message should be at least 10 characters' });
      const { data, error } = await supabase
        .from('contact_messages')
        .insert({ name, email, subject, message: message.slice(0, 4000), status: 'new' })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ ok: true, id: data.id });
    }

    const auth = await requireAdmin(req, res);
    if (!auth) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'PUT') {
      const body = parseBody(req);
      const id = Number(body.id);
      const status = String(body.status || '');
      if (!id) return res.status(400).json({ error: 'Message id is required' });
      if (!['new', 'read', 'archived'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const { data, error } = await supabase.from('contact_messages').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const body = parseBody(req);
      const id = Number(body.id || req.query?.id);
      if (!id) return res.status(400).json({ error: 'Message id is required' });
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('contact API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
