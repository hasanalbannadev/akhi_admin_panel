'use client';
/** Product photos AND videos. Same as the photo uploader, plus videos (MP4 / MOV / WEBM, up to 50 MB).
 *  The first item must be a photo (it is the product's main picture), so a video can never become the first one. */
import { useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { useToast } from '@/components/Providers';
import { assetUrl, discardImage, uploadImage } from '@/lib/api';

export const isVideoUrl = (u) => /\.(mp4|webm)(\?|$)/i.test(u || '');
const MAX_VIDEO_MB = 50;

/** keeps a photo in front: if a video would be first, the first photo moves to the front instead */
function photoFirst(list) {
  if (!list.length || !isVideoUrl(list[0])) return list;
  const i = list.findIndex((u) => !isVideoUrl(u));
  if (i < 0) return null;
  const a = [...list]; const [p] = a.splice(i, 1);
  return [p, ...a];
}

export default function MediaUploader({ value, onChange, max = 12 }) {
  const toast = useToast();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const list = value || [];

  async function pick(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      const added = []; const failed = [];
      for (const f of files.slice(0, max - list.length)) {
        const vid = /^video\//.test(f.type);
        if (vid && f.size > MAX_VIDEO_MB * 1024 * 1024) { failed.push(`${f.name}: video must be ${MAX_VIDEO_MB} MB or smaller`); continue; }
        try { added.push(await uploadImage(f)); } catch (err) { failed.push(`${f.name}: ${err.message}`); }
      }
      if (added.length) {
        const next = photoFirst([...list, ...added]);
        if (next) await onChange(next);
        else { added.forEach(discardImage); toast.error('Add at least one photo first: the main picture must be a photo, not a video'); }
      }
      if (failed.length) toast.error(failed.join(' | '));
    } finally { setBusy(false); }
  }

  function apply(next) {
    const fixed = photoFirst(next);
    if (!fixed) return toast.error('The main picture must be a photo: keep at least one photo');
    onChange(fixed);
  }
  function move(i, dir) {
    const a = [...list]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; apply(a);
  }

  return (
    <div>
      <div className="imgs">
        {list.map((u, i) => (
          <div className="im" key={u + i}>
            {isVideoUrl(u)
              ? <><video src={assetUrl(u)} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 22, textShadow: '0 1px 4px rgba(0,0,0,.6)', pointerEvents: 'none' }}>▶</span></>
              : <img src={assetUrl(u)} alt="" />}
            {i === 0 && <span className="first">Main</span>}
            <button type="button" onClick={() => { const next = list.filter((_, k) => k !== i); const fixed = photoFirst(next); if (!fixed && next.length) return toast.error('Keep at least one photo: the main picture must be a photo'); discardImage(u); onChange(fixed || []); }} aria-label="Remove"><Icon name="x" size={13} /></button>
            {list.length > 1 && (
              <div style={{ position: 'absolute', bottom: 3, right: 3, display: 'flex', gap: 2 }}>
                {i > 0 && <button type="button" style={{ position: 'static', width: 20, height: 20 }} onClick={() => move(i, -1)} aria-label="Move left">‹</button>}
                {i < list.length - 1 && <button type="button" style={{ position: 'static', width: 20, height: 20 }} onClick={() => move(i, 1)} aria-label="Move right">›</button>}
              </div>
            )}
          </div>
        ))}
        {list.length < max && (
          <button type="button" className="add" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <span className="spin" /> : <span><Icon name="upload" /><br />Upload</span>}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime" multiple hidden onChange={pick} />
      <div className="hint muted sm" style={{ marginTop: 6 }}>Photos: JPG, PNG or WEBP (made smaller automatically). Videos: MP4, MOV or WEBM, up to {MAX_VIDEO_MB} MB. The first item is the main picture and must be a photo. A tapped video thumbnail plays in the big picture on the shop page.</div>
    </div>
  );
}
