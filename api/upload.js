import supabase from './db-client.js';
import { cors, requireAdmin, parseBody } from './_auth.js';

const BUCKET = 'product-images';
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
const MAX_BYTES = 6 * 1024 * 1024;

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const body = parseBody(req);
    const { fileName, fileBase64, contentType } = body;
    if (!fileName || !fileBase64) return res.status(400).json({ error: 'File is required' });
    if (!ALLOWED.includes(contentType)) return res.status(400).json({ error: 'Only PNG, JPEG, WebP, GIF or AVIF images are allowed' });
    const buffer = Buffer.from(String(fileBase64).replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (buffer.length > MAX_BYTES) return res.status(400).json({ error: 'Image must be smaller than 6MB' });
    const ext = String(fileName).split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const safeBase = String(fileName).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'image';
    const path = `${Date.now()}-${safeBase}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl, path });
  } catch (err) {
    console.error('upload API error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
