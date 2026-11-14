"""Run: python tests/test_core.py   (uses tests/cases.json, shared with the JS test)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'agent'))
sys.path.insert(0, str(ROOT / 'tools'))
from scrubber_core import load_rules, redact  # noqa: E402
from build_rules import render  # noqa: E402

rules = load_rules()
cases = json.loads((Path(__file__).parent / 'cases.json').read_text(encoding='utf-8'))
for c in cases:
    out, _ = redact(c['in'], rules, c.get('terms', []), c.get('ips', False), c.get('disabled', []))
    assert out == c['out'], f"PY: {c['in']!r} -> {out!r} (expected {c['out']!r})"
assert (ROOT / 'rules.js').read_text(encoding='utf-8') == render(), 'rules.js is stale: run python tools/build_rules.py'
print(f'PY: {len(cases)} cases passed, rules.js in sync')
