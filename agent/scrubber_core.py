"""Core redaction logic shared with the browser extension via ../rules.json."""
import getpass
import json
import os
import re
import socket
import subprocess
from pathlib import Path

RULES_PATH = Path(__file__).resolve().parent.parent / 'rules.json'
CONFIG_PATH = Path.home() / '.prompt-scrubber' / 'config.json'
DEFAULT_CONFIG = {
    'terms': [], 'ips': False, 'disabled': [], 'auto_learn': True,
    'hotkey': '<ctrl>+<alt>+s', 'pause_hotkey': '<ctrl>+<alt>+p',
}
# Words too generic to treat as "your name" when auto-learning.
IGNORE = {'user', 'root', 'admin', 'administrator', 'guest', 'default', 'ubuntu',
          'test', 'none', 'system', 'localhost', 'home', 'pi', 'kali'}


def _conv(rep):
    """JS-style $1 -> Python \\g<1>."""
    return re.sub(r'\$(\d)', r'\\g<\1>', rep)


def load_rules(path=RULES_PATH):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    rules = []
    for r in data['rules']:
        flags = re.ASCII | (re.I if 'i' in r.get('flags', '') else 0)
        rules.append({'id': r['id'], 're': re.compile(r['pattern'], flags),
                      'rep': _conv(r['replace']), 'default': r.get('default', True)})
    return rules


def redact(text, rules, terms=(), ips=False, disabled=()):
    """Return (redacted_text, number_of_replacements)."""
    n = 0
    active = [(r['re'], r['rep']) for r in rules
              if r['id'] not in disabled and (r['default'] or (r['id'] == 'ip' and ips))]
    for t in terms:
        t = t.strip()
        if t:
            active.append((re.compile(r'(?<!\w)' + re.escape(t) + r'(?!\w)', re.I | re.ASCII), '[NAME]'))
    for rx, rep in active:
        text, k = rx.subn(rep, text)
        n += k
    return text, n


def _git(key):
    try:
        out = subprocess.run(['git', 'config', '--global', key], capture_output=True, text=True, timeout=3)
        return out.stdout.strip()
    except Exception:
        return ''


def learn_terms():
    """OS username, hostname, home folder and git identity, so bare names get redacted too."""
    raw = set()
    for v in (getpass.getuser(), socket.gethostname(), Path.home().name,
              os.environ.get('USERNAME'), os.environ.get('COMPUTERNAME'), os.environ.get('USERDOMAIN')):
        if v:
            raw.add(v)
            raw.add(v.split('.')[0])
    name = _git('user.name')
    if name:
        raw.add(name)
        raw.update(w for w in re.split(r'\s+', name) if w)
    email = _git('user.email')
    if email and '@' in email:
        raw.add(email.split('@')[0])
    return sorted(t for t in raw if len(t) >= 3 and t.lower() not in IGNORE)


def load_config(path=CONFIG_PATH):
    cfg = dict(DEFAULT_CONFIG)
    p = Path(path)
    if p.exists():
        cfg.update(json.loads(p.read_text(encoding='utf-8')))
    else:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(DEFAULT_CONFIG, indent=2), encoding='utf-8')
    return cfg
