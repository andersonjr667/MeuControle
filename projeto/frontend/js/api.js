// Global API helper (uses localStorage token)
;(function(){
  const API_BASE = 'http://localhost:4000/api';

  function getAuthHeaders(headers = {}){
    // prefer localStorage (remember me) but fall back to sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const h = Object.assign({}, headers);
    if (token) h['Authorization'] = 'Bearer ' + token;
    h['Content-Type'] = 'application/json';
    return h;
  }

  async function request(path, opts = {}){
    const final = Object.assign({}, opts || {});
    final.headers = getAuthHeaders(final.headers || {});
    const res = await fetch(API_BASE + path, final);
    const text = await res.text();
    let data = null;
    try{ data = text ? JSON.parse(text) : null } catch(e){ data = text }
    if (!res.ok){
      if (res.status === 401){
          // clear and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          const inPages = location.pathname.indexOf('/pages/') !== -1;
          window.location.href = inPages ? 'login.html' : './pages/login.html';
          return;
        }
      const err = data || { message: 'Erro desconhecido' };
      throw err;
    }
    return data;
  }

  async function get(path){ return request(path, { method: 'GET' }); }
  async function post(path, body){ return request(path, { method: 'POST', body: JSON.stringify(body) }); }
  async function put(path, body){ return request(path, { method: 'PUT', body: JSON.stringify(body) }); }
  async function del(path){ return request(path, { method: 'DELETE' }); }

  window.API = { request, get, post, put, delete: del };
})();
