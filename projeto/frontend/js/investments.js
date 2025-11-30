 (async function(){
  // wait for Auth then init investments
  function ensureAuthThenRun(fn){
    const runIfAuthed = ()=>{
      if (!window.Auth || !window.Auth.isAuthenticated()){
        const inPages = location.pathname.indexOf('/pages/') !== -1;
        window.location.href = inPages ? 'login.html' : './pages/login.html';
        return;
      }
      try{ fn(); }catch(e){ console.error(e); }
    };
    if (window.Auth && typeof window.Auth.isAuthenticated === 'function') return runIfAuthed();
    window.addEventListener('auth:ready', runIfAuthed);
  }

  ensureAuthThenRun(async ()=>{
    const listEl = document.getElementById('investmentsList');
    const emptyEl = document.getElementById('emptyInvestments');
    const totalEl = document.getElementById('totalInvested');

    // modal elements
    const modal = document.getElementById('invModal');
    const backdrop = document.getElementById('invBackdrop');
    const form = document.getElementById('invForm');
    const nameInput = document.getElementById('invName');
    const typeInput = document.getElementById('invType');
    const amountInput = document.getElementById('invAmount');
    const dateInput = document.getElementById('invDate');
    const idInput = document.getElementById('invId');
    const btnNew = document.getElementById('btnNewInvestment');
    const btnCancel = document.getElementById('invCancel');

    // Backend-backed storage via API
    async function readStore(){
      try{ return await API.get('/investments') || []; }catch(e){ console.warn('Erro lendo investimentos do API, fallback vazio', e); return []; }
    }
    async function writeStore(items){
      // Not used - operations use specific endpoints (post/put/delete)
    }

    function showModal(data){
      modal.setAttribute('aria-hidden','false');
      if (data){
        document.getElementById('invModalTitle').textContent = 'Editar investimento';
        nameInput.value = data.name || '';
        typeInput.value = data.type || 'outro';
        amountInput.value = data.amount != null ? Number(data.amount).toFixed(2) : '';
        dateInput.value = data.date || '';
        idInput.value = data.id || '';
      }else{
        document.getElementById('invModalTitle').textContent = 'Novo investimento';
        form.reset(); idInput.value='';
      }
      setTimeout(()=> nameInput.focus(), 50);
    }
    function closeModal(){ modal.setAttribute('aria-hidden','true'); form.reset(); }

    btnNew?.addEventListener('click', ()=> showModal());
    btnCancel?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);

    form?.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const name = (nameInput.value || '').trim();
      const type = typeInput.value;
      const amount = parseFloat(amountInput.value || 0) || 0;
      const date = dateInput.value || (new Date()).toISOString().slice(0,10);
      const id = idInput.value;
      if (!name){ alert('Informe o nome'); nameInput.focus(); return; }
      if (amount <= 0){ alert('Informe um valor maior que zero'); amountInput.focus(); return; }

      try{
        if (id){
          await API.put('/investments/' + id, { name, type, amount, date });
        } else {
          await API.post('/investments', { name, type, amount, date });
        }
        closeModal();
        await render();
      }catch(err){ console.error(err); alert(err.message || 'Erro ao salvar investimento'); }
    });

    function formatBRL(v){
      try{ return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }catch(e){ return 'R$ ' + v; }
    }

    async function render(){
      const items = await readStore();
      listEl.innerHTML = '';
      if (!items || items.length === 0){ emptyEl.style.display = 'block'; totalEl.textContent = formatBRL(0); return; } else { emptyEl.style.display = 'none'; }

      let total = 0;
      items.forEach(it=>{
        total += Number(it.amount || 0);
        const li = document.createElement('li');
        const left = document.createElement('div');
        const name = document.createElement('strong'); name.textContent = it.name;
        const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `${it.type} • ${it.date || ''}`;
        left.appendChild(name); left.appendChild(meta);

        const right = document.createElement('div');
        const amt = document.createElement('div'); amt.textContent = formatBRL(it.amount);
        const actions = document.createElement('div');
        const edit = document.createElement('button'); edit.className='btn btn-icon'; edit.textContent='Editar'; edit.dataset.id = it.id;
        const del = document.createElement('button'); del.className='btn btn-icon'; del.textContent='Excluir'; del.dataset.id = it.id;
        actions.appendChild(edit); actions.appendChild(del);
        right.appendChild(amt); right.appendChild(actions);

        li.appendChild(left); li.appendChild(right);
        listEl.appendChild(li);
      });
      totalEl.textContent = formatBRL(total);
    }

    // migrate existing localStorage items if present and server is empty
    async function migrateIfNeeded(){
      try{
        const raw = localStorage.getItem('investments_v1');
        if (!raw) return;
        const localItems = JSON.parse(raw || '[]');
        if (!Array.isArray(localItems) || localItems.length === 0) { localStorage.removeItem('investments_v1'); return; }
        const serverItems = await readStore();
        if (!serverItems || serverItems.length === 0){
          for (const it of localItems){
            try{ await API.post('/investments', { name: it.name, type: it.type, amount: it.amount, date: it.date }); }catch(e){ console.warn('falha ao migrar item', it, e); }
          }
          localStorage.removeItem('investments_v1');
        }
      }catch(e){ console.warn('migration investments failed', e); }
    }

    // delegate
    document.addEventListener('click', async (e)=>{
      const t = e.target;
      if (t.textContent === 'Excluir' && t.dataset.id){
        if (!confirm('Excluir investimento?')) return;
        try{
          await API.delete('/investments/' + t.dataset.id);
          await render();
        }catch(err){ console.error(err); alert(err.message || 'Erro ao excluir investimento'); }
        return;
      }
      if (t.textContent === 'Editar' && t.dataset.id){
        try{
          const item = (await API.get('/investments')).find(i=>String(i.id) === String(t.dataset.id));
          if (item) showModal(item);
        }catch(err){ console.error(err); alert('Erro ao carregar investimento'); }
        return;
      }
    });

    // initial
    await migrateIfNeeded();
    render();
  });
})();
