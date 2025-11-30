// header.js - injects shared header fragment and styles synchronously so pages can rely on #hdrUser / #hdrLogout
(function(){
  // determine paths relative to current page
  const inPages = location.pathname.indexOf('/pages/') !== -1;
  const headerPath = inPages ? '../header.html' : './header.html';
  const cssPath = inPages ? '../css/header.css' : './css/header.css';

  // insert CSS link
  try{
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = cssPath; document.head.appendChild(l);
  }catch(e){ console.warn('Could not append header css', e); }

  // insert a lightweight placeholder header immediately to avoid a visual flash
  const placeholderHtml = '<header class="app-header" id="header-placeholder">' +
    '<div class="container header-inner">' +
    '<a class="logo" href="#">GestãoFinanceira</a>' +
    '<nav class="navbar"><span style="opacity:.6">Carregando…</span></nav>' +
    '</div></header>';

  if (document.body) document.body.insertAdjacentHTML('afterbegin', placeholderHtml);
  else document.addEventListener('DOMContentLoaded', ()=> document.body.insertAdjacentHTML('afterbegin', placeholderHtml));

  // load header asynchronously and replace the placeholder when ready
  fetch(headerPath).then(resp=>{
    if (!resp.ok) throw new Error('Header not found');
    return resp.text();
  }).then(html=>{
    const replaceFn = ()=>{
      const ph = document.getElementById('header-placeholder');
      if (ph) ph.outerHTML = html;
      else document.body.insertAdjacentHTML('afterbegin', html);
      // mark ready and notify listeners that header is ready
      try{ window.__headerReady = true; window.dispatchEvent(new Event('header:ready')); }catch(e){ console.warn('Could not dispatch header:ready', e); }
    };
    if (document.body) replaceFn(); else document.addEventListener('DOMContentLoaded', replaceFn);
  }).catch(err=>{ console.warn('Failed to load shared header asynchronously', err); });

})();
