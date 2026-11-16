#!/usr/bin/env python3
"""Adds "🛍 Send a product" to the website's own Customer Chat. Usage: cd admin && python3 apply_support_product_patch.py src (safe twice, .bak saved)
Edits ONLY sections/SupportSection.jsx (4 small insertions). Needs sections/ChatProductPicker.jsx. The product goes as a normal chat message:
name, price and the product page link (the customer taps the link and orders on the website)."""
import shutil
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else "src")
f = root / "sections/SupportSection.jsx"
if not f.exists():
    print("SupportSection.jsx: not found in this admin - skipped (your website Customer Chat page has another file name; tell me and I will adapt)")
    raise SystemExit(0)
s = f.read_text(encoding="utf-8")
if "ChatProductPicker" in s:
    print("SupportSection.jsx: already done")
    raise SystemExit
if not (root / "sections/ChatProductPicker.jsx").exists():
    raise SystemExit("First copy sections/ChatProductPicker.jsx - nothing was changed")
pairs = [
    ("import { dt, getParam, timeAgo } from '@/lib/format';\n", "import { dt, getParam, timeAgo } from '@/lib/format';\nimport ChatProductPicker from './ChatProductPicker';\n"),
    ("  const [sending, setSending] = useState(false);\n", "  const [sending, setSending] = useState(false);\n  const [prodPick, setProdPick] = useState(false);\n"),
    ("              <ChatComposer text={text} onText={setText} images={imgs} onImages={setImgs} onSend={send} sending={sending} />\n",
     "              <div style={{ padding: '4px 12px 0' }}><button type=\"button\" className=\"btn sm\" onClick={() => setProdPick(true)}>🛍 Send a product</button></div>\n"
     "              <ChatComposer text={text} onText={setText} images={imgs} onImages={setImgs} onSend={send} sending={sending} />\n"
     "              {prodPick && <ChatProductPicker thread={sel} onClose={() => setProdPick(false)} onSent={() => { setProdPick(false); conv.reload(); threads.reload(); }}\n"
     "                onPick={(p) => api(`/admin/support/threads/${sel.user_id}/messages`, { method: 'POST', body: { text: `${p.name}\\n${p.price} Tk\\n${p.link}`, images: [] } })} />}\n"),
]
for a, b in pairs:
    if s.count(a) != 1:
        raise SystemExit(f"SupportSection.jsx: expected place not found ({a[:50]!r}) - nothing was changed")
    s = s.replace(a, b)
shutil.copy(f, str(f) + ".bak")
f.write_text(s, encoding="utf-8")
print("SupportSection.jsx: product button added")
