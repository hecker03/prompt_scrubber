// Run: node tests/test_js.js   (uses tests/cases.json, shared with the Python test)
const assert = require('assert');
global.chrome = { storage: { local: { get: () => Promise.resolve({}), set() {} }, onChanged: { addListener() {} } } };
global.document = { addEventListener() {} };
const { redact } = require('../content.js');
const cases = require('./cases.json');

for (const c of cases) {
  const out = redact(c.in, { terms: c.terms || [], ips: !!c.ips, disabled: c.disabled || [] }).text;
  assert.strictEqual(out, c.out, 'JS: ' + JSON.stringify(c.in));
}
console.log(`JS: ${cases.length} cases passed`);
