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
  // If the course PDFs are not deployed alongside the site (e.g. a public copy without files/),
  // render source chips as plain labels instead of dead links.
  try {
    fetch(encodeURI(SC.sources['09'].path), { method: 'HEAD' })
      .then((r) => { if (!r.ok) document.body.classList.add('nofiles'); })
      .catch(() => { /* file:// or offline: leave links alone */ });
  } catch (e) { /* ignore */ }
  SC.start();
})();
