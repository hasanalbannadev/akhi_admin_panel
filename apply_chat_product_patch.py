#!/usr/bin/env python3
"""Adds a 🛍 "send a product" button to the chat box. Usage: cd admin && python3 apply_chat_product_patch.py src (safe twice, .bak saved)
Edits ONLY sections/ChatSection.jsx (4 small insertions). Copy sections/ChatProductPicker.jsx first."""
import shutil
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else "src")
f = root / "sections/ChatSection.jsx"
s = f.read_text(encoding="utf-8")
if "ChatProductPicker" in s:
    print("ChatSection.jsx: already done")
    raise SystemExit
if not (root / "sections/ChatProductPicker.jsx").exists():
    raise SystemExit("First copy sections/ChatProductPicker.jsx - nothing was changed")
pairs = [
    ("import { dt, timeAgo } from '@/lib/format';\n", "import { dt, timeAgo } from '@/lib/format';\nimport ChatProductPicker from './ChatProductPicker';\n"),
    ("  const [fwd, setFwd] = useState(null);\n", "  const [fwd, setFwd] = useState(null);\n  const [prodPick, setProdPick] = useState(false);\n"),
    ("onClick={() => fileRef.current && fileRef.current.click()}>📎</button>\n",
     "onClick={() => fileRef.current && fileRef.current.click()}>📎</button>\n"
     "                  <button type=\"button\" className=\"btn\" aria-label=\"Send a product\" title=\"Send a product\" onClick={() => setProdPick(true)}>🛍</button>\n"),
    ("      {fwd && (\n        <div onClick={() => setFwd(null)}",
     "      {prodPick && sel && <ChatProductPicker thread={sel} onClose={() => setProdPick(false)} onSent={() => { setProdPick(false); msgs.reload(); threads.reload(); }} />}\n"
     "      {fwd && (\n        <div onClick={() => setFwd(null)}"),
]
for a, b in pairs:
    if s.count(a) != 1:
        raise SystemExit(f"ChatSection.jsx: expected place not found ({a[:50]!r}) - nothing was changed")
    s = s.replace(a, b)
shutil.copy(f, str(f) + ".bak")
f.write_text(s, encoding="utf-8")
print("ChatSection.jsx: product button added")
