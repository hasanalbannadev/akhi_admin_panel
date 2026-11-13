#!/usr/bin/env python3
"""Update 5 - admin panel edits WITHOUT replacing your files (so anything you changed yourself stays).
Usage:   python3 apply_update5_admin_patch.py /path/to/admin/src          (the 'src' folder of the admin panel)
Edits (one to three lines each): components/Shell.jsx (menu item), sections/ProductsSection.jsx (photo + video uploader),
       components/ui.jsx (chat composer accepts videos), sections/SupportSection.jsx (videos show in the chat)
A backup <file>.bak is saved before each change. Safe to run twice. If an expected place is not found it changes NOTHING."""
import shutil
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")


def once(s, old, new, label):
    if s.count(old) != 1:
        raise SystemExit(f"{label}: could not find the expected place (found {s.count(old)}x) - nothing was changed")
    return s.replace(old, new)


def shell_jsx(s):
    if "/product-orders" in s:
        return s
    return once(s, "  { href: '/orders', label: 'Orders', icon: 'cart', badge: 'orders' },\n",
                "  { href: '/orders', label: 'Orders', icon: 'cart', badge: 'orders' },\n"
                "  { href: '/product-orders', label: 'Product Orders', icon: 'package' },\n", "Shell.jsx")


def products_jsx(s):
    if "MediaUploader" in s:
        return s
    s = once(s, "import { useAsync", "import MediaUploader from '@/components/MediaUploader';\nimport { useAsync", "ProductsSection.jsx (import)")
    return once(s, "<ImageUploader value={images} onChange={onImages} />", "<MediaUploader value={images} onChange={onImages} />",
                "ProductsSection.jsx (uploader)")


def ui_jsx(s):
    if "video/mp4" in s:
        return s
    s = once(s, '<div className="im" key={u + i}><img src={assetUrl(u)} alt="" />',
             '<div className="im" key={u + i}>{/\\.(mp4|webm)(\\?|$)/i.test(u) ? <video src={assetUrl(u)} muted preload="metadata" style={{ width: \'100%\', height: \'100%\', objectFit: \'cover\' }} /> : <img src={assetUrl(u)} alt="" />}',
             "ui.jsx (preview)")
    return once(s, '<input ref={ref} type="file" accept="image/*" multiple hidden onChange={pick} />',
                '<input ref={ref} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple hidden onChange={pick} />',
                "ui.jsx (accept)")


def support_jsx(s):
    if "<video" in s:
        return s
    return once(s, "<img src={assetUrl(u)} alt=\"\" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />",
                "{/\\.(mp4|webm)(\\?|$)/i.test(u) ? <video src={assetUrl(u)} controls preload=\"metadata\" style={{ width: 160, maxHeight: 200, borderRadius: 8, background: '#000' }} /> : <img src={assetUrl(u)} alt=\"\" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />}",
                "SupportSection.jsx")


FILES = (("components/Shell.jsx", shell_jsx), ("sections/ProductsSection.jsx", products_jsx),
         ("components/ui.jsx", ui_jsx), ("sections/SupportSection.jsx", support_jsx))
jobs = {}
for rel, fn in FILES:
    p = root / rel
    if not p.exists():
        raise SystemExit(f"{p} not found - give the path of the admin 'src' folder")
    old = p.read_text(encoding="utf-8")
    jobs[p] = (old, fn(old))
for p, (old, new) in jobs.items():
    if new == old:
        print(f"{p.name}: already done")
    else:
        shutil.copy(p, str(p) + ".bak")
        p.write_text(new, encoding="utf-8")
        print(f"{p.name}: updated (backup {p.name}.bak)")
print("DONE")
