#!/usr/bin/env python3
"""Adds "SEO & Sitemap" to the admin side menu.  Usage: cd admin && python3 apply_seo_admin_patch.py src   (safe twice)"""
import shutil
import sys
from pathlib import Path

f = Path(sys.argv[1] if len(sys.argv) > 1 else "src") / "components/Shell.jsx"
s = f.read_text(encoding="utf-8")
if "'/seo'" in s:
    print("Shell.jsx: already done")
    raise SystemExit
a = "  { href: '/chat', label: 'Chat & Messages', icon: 'chat', badge: 'chat' },\n"
if s.count(a) != 1:
    raise SystemExit("Shell.jsx: anchor not found - nothing was changed")
shutil.copy(f, str(f) + ".bak")
f.write_text(s.replace(a, a + "  { href: '/seo', label: 'SEO & Sitemap', icon: 'search' },\n"), encoding="utf-8")
print("Shell.jsx: menu item added (backup Shell.jsx.bak)")
