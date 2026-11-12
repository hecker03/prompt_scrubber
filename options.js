const DEF = { enabled: true, ips: false, terms: [], disabled: [] };
chrome.storage.local.get('scrub').then(({ scrub }) => {
  document.getElementById('c').value = JSON.stringify(scrub || DEF, null, 2);
});
document.getElementById('s').onclick = async () => {
  const m = document.getElementById('m');
  try {
    await chrome.storage.local.set({ scrub: JSON.parse(document.getElementById('c').value) });
    m.textContent = 'Saved';
  } catch (e) { m.textContent = 'Invalid JSON: ' + e.message; }
};
