// Redacts sensitive text on paste into any text box. Everything runs locally; nothing is sent anywhere.
const RULES = [
  ['privkey', /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[PRIVATE_KEY]'],
  ['urlcred', /(\b[a-z][a-z0-9+.-]*:\/\/)[^\s\/:@]+:[^\s\/@]+@/gi, '$1[CRED]@'],
  ['jwt', /\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]{8,}\b/g, '[JWT]'],
  ['aws', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, '[AWS_KEY]'],
  ['ghtoken', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/g, '[GITHUB_TOKEN]'],
  ['slack', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, '[SLACK_TOKEN]'],
  ['google', /\bAIza[0-9A-Za-z_-]{35}\b/g, '[GOOGLE_KEY]'],
  ['bearer', /\b(Bearer\s+)[A-Za-z0-9._~+\/=-]{16,}/gi, '$1[TOKEN]'],
  ['secretkv', /\b((?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|token)\s*[:=]\s*)(["']?)[^\s"',;]+\2/gi, '$1$2[REDACTED]$2'],
  ['userip', /\b[\w.-]+@(\d{1,3}(?:\.\d{1,3}){3})\b/g, 'user@$1'],
  ['email', /\b[A-Za-z0-9._%+-]+@(?!\d{1,3}(?:\.\d{1,3}){3}\b)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+\b/g, '[EMAIL]'],
  ['prompt', /\b[A-Za-z_][\w.-]*@[A-Za-z0-9_-]+(?=:|\s*[$#%>]|\s+(?:MINGW\d*|UCRT64|CLANG\w*|MSYS)\b|\s+[~\/])/g, 'user@host'],
  ['homelinux', /\/home\/(?!user\b)[^\/\s:]+/g, '/home/user'],
  ['homemac', /\/Users\/(?!user\b)[^\/\s:]+/g, '/Users/user'],
  ['homewin', /([A-Za-z]:\\Users\\)(?!user\b)[^\\\s]+/gi, '$1user']
];
const IP_RULE = ['ip', /\b(?!127\.|0\.0\.0\.0)(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]'];

let cfg = { enabled: true, ips: false, terms: [], disabled: [] };
chrome.storage.local.get('scrub').then(r => { if (r.scrub) cfg = { ...cfg, ...r.scrub }; });
chrome.storage.onChanged.addListener(c => { if (c.scrub) cfg = { ...cfg, ...c.scrub.newValue }; });

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function redact(text) {
  let n = 0;
  const rules = RULES.filter(r => !cfg.disabled.includes(r[0]));
  if (cfg.ips) rules.push(IP_RULE);
  for (const t of cfg.terms) {
    if (t && t.trim()) rules.push(['term', new RegExp('(?<![\\w])' + esc(t.trim()) + '(?![\\w])', 'gi'), '[NAME]']);
  }
  for (const [, re, rep] of rules) {
    const m = text.match(re);
    if (m) { n += m.length; text = text.replace(re, rep); }
  }
  return { text, count: n };
}

function isEditable(el) {
  if (!el || !el.tagName) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') return !['password', 'checkbox', 'radio', 'file', 'button', 'submit'].includes(el.type);
  return !!el.isContentEditable;
}

function insert(el, text) {
  if (document.execCommand('insertText', false, text)) return;
  if (el.setRangeText) {
    el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;background:#222;color:#fff;padding:8px 12px;border-radius:6px;font:13px system-ui';
  (document.body || document.documentElement).appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

document.addEventListener('paste', e => {
  if (!cfg.enabled) return;
  const el = e.composedPath()[0];
  if (!isEditable(el)) return;
  const text = e.clipboardData && e.clipboardData.getData('text/plain');
  if (!text) return;
  const r = redact(text);
  if (!r.count) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  insert(el, r.text);
  toast('Scrubbed ' + r.count + ' item(s)');
}, true);

if (typeof module !== 'undefined') module.exports = { redact, cfgRef: () => cfg };
