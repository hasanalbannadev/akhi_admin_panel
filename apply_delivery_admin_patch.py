#!/usr/bin/env python3
"""Adds "Delivery Rules" to the admin menu. Usage: cd admin && python3 apply_delivery_admin_patch.py src  (safe twice)"""
import shutil
import sys
from pathlib import Path

f = Path(sys.argv[1] if len(sys.argv) > 1 else "src") / "components/Shell.jsx"
s = f.read_text(encoding="utf-8")
if "'/delivery-rules'" in s:
    print("Shell.jsx: already done")
    raise SystemExit
import re
m = re.search(r"^( *)\{ href: '/delivery[^\n]*\n", s, re.M)  # right after the existing Delivery Zones item
if not m:
    a = "  { href: '/chat', label: 'Chat & Messages', icon: 'chat', badge: 'chat' },\n"
    if s.count(a) != 1:
        raise SystemExit("Shell.jsx: anchor not found - nothing was changed")
    pos = s.index(a) + len(a)
else:
    pos = m.end()
shutil.copy(f, str(f) + ".bak")
s = s[:pos] + "  { href: '/delivery-rules', label: 'Delivery Rules', icon: 'truck' },\n" + s[pos:]
f.write_text(s, encoding="utf-8")
print("Shell.jsx: menu item added (backup Shell.jsx.bak)")
