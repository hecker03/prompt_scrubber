// Redacts sensitive text on paste into any text box. Runs locally; nothing is sent anywhere.
// Rules live in rules.json (generated into rules.js).
const _RULES = (typeof RULES_JSON !== 'undefined' ? RULES_JSON : require('./rules.js')).rules;

let cfg = { enabled: true, ips: false, terms: [], disabled: [] };
chrome.storage.local.get('scrub').then(r => { if (r.scrub) cfg = { ...cfg, ...r.scrub }; });
chrome.storage.onChanged.addListener(c => { if (c.scrub) cfg = { ...cfg, ...c.scrub.newValue }; });

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function redact(text, c = cfg) {
  let n = 0;
  const active = _RULES
    .filter(r => !(c.disabled || []).includes(r.id) && (r.default !== false || (r.id === 'ip' && c.ips)))
    .map(r => [new RegExp(r.pattern, 'g' + (r.flags || '')), r.replace]);
  for (const t of c.terms || []) {
    if (t && t.trim()) active.push([new RegExp('(?<![\\w])' + esc(t.trim()) + '(?![\\w])', 'gi'), '[NAME]']);
  }
  for (const [re, rep] of active) {
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

if (typeof module !== 'undefined') module.exports = { redact };
