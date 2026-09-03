import { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, X, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { fileToBase64 } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import ProductImage from '../ui/ProductImage';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  single?: boolean;
}

export default function ImageUploader({ images, onChange, max = 6, single = false }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files).slice(0, single ? 1 : Math.max(0, max - images.length));
    if (!list.length) {
      toast.error('Limit reached', `You can add up to ${max} images.`);
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of list) {
        if (file.size > 6 * 1024 * 1024) throw new Error(`${file.name} is larger than 6MB`);
        const fileBase64 = await fileToBase64(file);
        const res = await api<{ url: string }>('/api/upload', { method: 'POST', body: { fileName: file.name, fileBase64, contentType: file.type } });
        urls.push(res.url);
      }
      onChange(single ? urls : [...images, ...urls]);
      toast.success(`${urls.length} image${urls.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast.error('Upload failed', errorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    if (!/^(https?:\/\/|\/)/.test(v)) {
      toast.error('Invalid URL', 'Use an absolute URL or a path beginning with /');
      return;
    }
    onChange(single ? [v] : [...images, v].slice(0, max));
    setUrl('');
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img, i) => (
            <li key={img + i} className="group relative aspect-square overflow-hidden rounded-sm border border-edge bg-surface">
              <ProductImage src={img} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && !single && <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-wider text-void">Primary</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-void/70 p-1.5 opacity-0 transition group-hover:opacity-100">
                {!single && (
                  <>
                    <button type="button" onClick={() => move(i, -1)} className="rounded p-1 text-ivory hover:text-gold disabled:opacity-30" disabled={i === 0} aria-label="Move earlier">
                      <ArrowUp size={12} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} className="rounded p-1 text-ivory hover:text-gold disabled:opacity-30" disabled={i === images.length - 1} aria-label="Move later">
                      <ArrowDown size={12} />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="rounded p-1 text-ivory hover:text-danger" aria-label="Remove image">
                  <X size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-edge-strong px-4 py-4 text-xs text-muted transition hover:border-gold/60 hover:text-gold">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading…' : single ? 'Upload image' : `Upload images (${images.length}/${max})`}
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple={!single} className="sr-only" onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
        </label>
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
              placeholder="Or paste an image URL"
              aria-label="Image URL"
              className="h-12 w-full rounded-sm border border-edge bg-white/[0.03] pl-9 pr-3 text-xs text-ivory placeholder:text-dim focus:border-gold/60 focus:outline-none"
            />
          </div>
          <button type="button" onClick={addUrl} className="h-12 rounded-sm border border-edge px-4 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted transition hover:border-gold/60 hover:text-gold">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
