"""Generate rules.js (for the browser extension) from rules.json.
Run from the repo root: python tools/build_rules.py"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def render():
    data = json.loads((ROOT / 'rules.json').read_text(encoding='utf-8'))
    return ('// GENERATED from rules.json by tools/build_rules.py. Do not edit.\n'
            'const RULES_JSON = ' + json.dumps(data, indent=2) + ';\n'
            "if (typeof module !== 'undefined') module.exports = RULES_JSON;\n")


if __name__ == '__main__':
    (ROOT / 'rules.js').write_text(render(), encoding='utf-8')
    print('wrote rules.js')
