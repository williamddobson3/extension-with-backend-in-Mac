document.addEventListener('DOMContentLoaded', () => {
  const apiBaseInput = document.getElementById('apiBase');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  // Load current value
  chrome.storage.local.get(['apiBase'], (result) => {
    if (result && result.apiBase) apiBaseInput.value = result.apiBase;
  });

  saveBtn.addEventListener('click', () => {
    const val = apiBaseInput.value.trim();
    chrome.storage.local.set({ apiBase: val }, () => {
      status.textContent = 'Saved.';
      setTimeout(() => status.textContent = '', 2000);
    });
  });
});