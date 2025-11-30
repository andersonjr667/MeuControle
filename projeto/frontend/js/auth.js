// auth.js - handles login/register
(async function(){
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginMsg = document.getElementById('loginMessage');
  const globalMsg = document.getElementById('message');

  function showMessage(elem, text, time=4000){ if(!elem) return; elem.textContent = text; if(time>0) setTimeout(()=>{ if(elem) elem.textContent = '' }, time); }

  async function post(path, body){
    // use global API when available
    if (window.API && window.API.post) return window.API.post(path, body);
    const res = await fetch('http://localhost:4000/api' + path, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  }

  // helper to set token either in localStorage (remember) or sessionStorage
  function storeAuth(token, user, remember){
    const raw = JSON.stringify(user || {});
    if (remember){
      localStorage.setItem('token', token);
      localStorage.setItem('user', raw);
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', raw);
      // also remove any previous local token to avoid confusion
      localStorage.removeItem('token'); localStorage.removeItem('user');
    }
  }

  if (loginForm){
    // show/hide password toggle
    loginForm.addEventListener('click', (e)=>{
      if (e.target && e.target.classList && e.target.classList.contains('pw-toggle')){
        const tid = e.target.getAttribute('data-target');
        const inp = document.getElementById(tid);
        if (!inp) return;
        if (inp.type === 'password'){ inp.type = 'text'; e.target.textContent = 'Ocultar'; }
        else { inp.type = 'password'; e.target.textContent = 'Mostrar'; }
      }
    });

    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      const form = new FormData(loginForm);
      const remember = document.getElementById('rememberMe')?.checked;
      try{
        if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }
        const body = { email: form.get('email'), password: form.get('password') };
        const data = await post('/auth/login', body);
        storeAuth(data.token, data.user, remember);
        updateHeader();
        // after login, go to dashboard
        window.location.href = 'dashboard.html';
      }catch(err){
        console.error('login error', err);
        showMessage(loginMsg, err && err.message ? err.message : (typeof err === 'string' ? err : 'Erro ao efetuar login'));
      }finally{ if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; } }
    });
  }

  // helper to read stored user
  function readStoredUser(){
    const local = localStorage.getItem('user');
    if (local) return JSON.parse(local);
    const sess = sessionStorage.getItem('user');
    if (sess) return JSON.parse(sess);
    return null;
  }
  // update header UI; query elements at runtime because header is injected asynchronously
  function updateHeader() {
    const u = readStoredUser();
    const hdrUserEl = document.getElementById('hdrUser');
    const hdrLogoutEl = document.getElementById('hdrLogout');
    if (u) {
      if (hdrUserEl) hdrUserEl.textContent = `Olá, ${u.name}`;
      if (hdrLogoutEl) hdrLogoutEl.classList.remove('hidden');
    } else {
      if (hdrUserEl) hdrUserEl.textContent = '';
      if (hdrLogoutEl) hdrLogoutEl.classList.add('hidden');
    }
  }

  // attach logout handler once header exists
  function attachHdrLogout(){
    const btn = document.getElementById('hdrLogout');
    if (!btn) return;
    // ensure we don't attach twice
    if (btn.__logout_attached) return; btn.__logout_attached = true;
    btn.addEventListener('click', (e)=>{ e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('user'); sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); updateHeader(); const inPages = location.pathname.indexOf('/pages/') !== -1; window.location.href = inPages ? 'login.html' : './pages/login.html'; });
  }

  // if header already present or header was already loaded earlier, update now; otherwise wait for header:ready
  if (document.getElementById('hdrUser') || document.getElementById('hdrLogout') || window.__headerReady){
    updateHeader(); attachHdrLogout();
  } else {
    window.addEventListener('header:ready', ()=>{ updateHeader(); attachHdrLogout(); });
  }

  // expose helpers
  window.Auth = {
    isAuthenticated: () => !!(localStorage.getItem('token') || sessionStorage.getItem('token')),
    getUser: () => { try { return readStoredUser() } catch(e){ return null } },
    logout: () => { localStorage.removeItem('token'); localStorage.removeItem('user'); sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); updateHeader(); const inPages = location.pathname.indexOf('/pages/') !== -1; window.location.href = inPages ? 'login.html' : './pages/login.html'; }
  };
  // mark auth ready so other scripts can wait for it instead of racing on load order
  try{ window.__authReady = true; window.dispatchEvent(new Event('auth:ready')); }catch(e){ /* ignore */ }

  if (registerForm){
    registerForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const form = new FormData(registerForm);
      try{
        const body = { name: form.get('name'), email: form.get('email'), password: form.get('password') };
        await post('/auth/register', body);
        showMessage(globalMsg, 'Registrado. Faça login.');
      }catch(err){
        showMessage(globalMsg, err && err.message ? err.message : JSON.stringify(err));
      }
    });
  }
})();
