import { useEffect } from 'react';

const BRAND = 'AETHER';
const DEFAULT_DESCRIPTION =
  'AETHER — objects for the next century. Timepieces, audio, eyewear, wearables and home objects engineered with obsessive precision.';

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    const [attrName, attrValue] = selector.replace(/^meta\[/, '').replace(/\]$/, '').split('=');
    el.setAttribute(attrName, attrValue.replace(/"/g, ''));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function useSEO(title?: string, description?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BRAND}` : `${BRAND} — Objects for the Next Century`;
    const desc = description || DEFAULT_DESCRIPTION;
    document.title = fullTitle;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', desc);
  }, [title, description]);
}
