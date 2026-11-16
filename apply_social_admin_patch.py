#!/usr/bin/env python3
"""Adds "Social Posts" to the admin menu. Usage: cd admin && python3 apply_social_admin_patch.py src (safe twice)"""
import shutil
import sys
from pathlib import Path

f = Path(sys.argv[1] if len(sys.argv) > 1 else "src") / "components/Shell.jsx"
s = f.read_text(encoding="utf-8")
if "'/social'" in s:
    print("Shell.jsx: already done")
    raise SystemExit
a = "  { href: '/chat', label: 'Chat & Messages', icon: 'chat', badge: 'chat' },\n"
if s.count(a) != 1:
    raise SystemExit("Shell.jsx: anchor not found - nothing was changed")
shutil.copy(f, str(f) + ".bak")
f.write_text(s.replace(a, a + "  { href: '/social', label: 'Social Posts', icon: 'send' },\n"), encoding="utf-8")
print("Shell.jsx: Social Posts menu item added")
