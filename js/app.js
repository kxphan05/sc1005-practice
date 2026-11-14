/* Bootstrap */
(function () {
  'use strict';
  const SC = window.SC;
  const btn = document.getElementById('themeBtn');
  btn.onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('sc1005:theme', next); } catch (e) { /* ignore */ }
  };
  SC.start();
})();
