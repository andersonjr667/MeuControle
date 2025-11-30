(function(){
  // wait for Auth to be ready (avoid race conditions with header/auth script load order)
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
    const tableBody = document.querySelector('#transactionsTable tbody');
    const btnNew = document.getElementById('btnNew');
    const modal = document.getElementById('modal');
    const form = document.getElementById('transactionForm');
    const btnCancel = document.getElementById('btnCancel');

    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    function parseAmountInput(raw){
      if (raw === null || raw === undefined) return 0;
      // allow commas as decimal separators (e.g. "1.234,56" => 1234.56)
      const cleaned = String(raw).trim().replace(/\./g, '').replace(',', '.');
      const f = parseFloat(cleaned);
      if (isNaN(f)) return 0;
      return Math.round(f * 100);
    }

    function formatAmount(cents){
      return currencyFormatter.format(Number(cents || 0) / 100);
    }

    async function load(){
      try{
        const data = await API.get('/transactions');
        tableBody.innerHTML = '';
        data.forEach(t=>{
          const tr = document.createElement('tr');
          const catName = (t.category_id && categoryMap[String(t.category_id)]) ? categoryMap[String(t.category_id)] : (t.category_id || '');
          const payName = (t.payment_method_id && paymentMap[String(t.payment_method_id)]) ? paymentMap[String(t.payment_method_id)] : '';
          tr.innerHTML = `<td>${t.date}</td><td>${t.type}</td><td>${catName}</td><td>${t.description||''}${payName?('<div class="tx-small">'+payName+'</div>'):''}</td><td>${formatAmount(t.amount)}</td>
            <td><button data-id="${t.id}" class="edit">Editar</button> <button data-id="${t.id}" class="del">Excluir</button></td>`;
          tableBody.appendChild(tr);
        });
      }catch(err){ console.error(err); alert(err.message || 'Erro ao carregar transações'); }
    }

    // category/payment caches
    const categoryMap = {};
    const paymentMap = {};

    async function loadLists(){
      try{
        const inc = await API.get('/settings/income_categories');
        const exp = await API.get('/settings/expense_categories');
        const pay = await API.get('/settings/payment_methods');
        // populate maps and selects
        const catSelect = form.elements['category_id'];
        // keep lists for filtering by type
        window.__tx_inc_cats = inc || [];
        window.__tx_exp_cats = exp || [];
        catSelect.innerHTML = '<option value="">-- Nenhuma --</option>';
        [...inc, ...exp].forEach(c=>{ categoryMap[String(c.id)] = c.name; });
        // initially populate with both
        [...inc, ...exp].forEach(c=>{ const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; catSelect.appendChild(opt); });
        const paySelect = form.elements['payment_method_id'];
        paySelect.innerHTML = '<option value="">-- Nenhum --</option>';
        pay.forEach(p=>{ paymentMap[String(p.id)] = p.name; const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; paySelect.appendChild(opt); });
      }catch(err){ console.warn('Could not load categories/payment methods', err); }
    }

    btnNew.addEventListener('click', ()=>{ modal.classList.remove('hidden'); document.getElementById('modalTitle').textContent='Nova transação'; form.reset(); form.elements['id'].value = ''; });
    btnCancel.addEventListener('click', ()=> modal.classList.add('hidden'));

    // close modal when clicking outside form
    modal.addEventListener('click', (e)=>{ if (e.target === modal) modal.classList.add('hidden'); });

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const id = fd.get('id');
      const rawAmount = fd.get('amount');
      const amount = parseAmountInput(rawAmount);
      const body = { type: fd.get('type'), date: fd.get('date'), description: fd.get('description'), amount };
      // include optional category/payment
      const catId = fd.get('category_id'); if (catId) body.category_id = catId;
      const payId = fd.get('payment_method_id'); if (payId) body.payment_method_id = payId;
      try{
        if (id) {
          await API.put('/transactions/' + id, body);
        } else {
          await API.post('/transactions', body);
        }
        modal.classList.add('hidden');
        // notify other tabs (dashboard) that transactions changed
        try{ localStorage.setItem('transactions_updated', String(Date.now())); }catch(e){}
        load();
      }catch(err){ console.error(err); alert(err.message || 'Erro ao salvar transação'); }
    });

    tableBody.addEventListener('click', async (e)=>{
      if (e.target.matches('.del')){
        const id = e.target.dataset.id;
        if (!confirm('Deletar?')) return;
        try{ await API.delete('/transactions/'+id); try{ localStorage.setItem('transactions_updated', String(Date.now())); }catch(e){}; load(); }catch(err){ console.error(err); alert(err.message||'Erro ao deletar'); }
      }
      if (e.target.matches('.edit')){
        const id = e.target.dataset.id;
        try{
          const tx = (await API.get('/transactions')).find(t=>String(t.id)===String(id));
          if (!tx) return alert('Transação não encontrada');
          modal.classList.remove('hidden');
          document.getElementById('modalTitle').textContent = 'Editar transação';
          form.elements['id'].value = tx.id;
          form.elements['type'].value = tx.type;
          form.elements['date'].value = tx.date;
          form.elements['description'].value = tx.description || '';
          form.elements['amount'].value = tx.amount ? ( (Number(tx.amount)/100).toFixed(2).replace('.', ',') ) : '';
          form.elements['category_id'].value = tx.category_id || '';
          form.elements['payment_method_id'].value = tx.payment_method_id || '';
        }catch(err){ console.error(err); alert('Erro ao carregar transação'); }
      }
    });

    // initial load of lists and transactions
    // amount input behavior: unformat on focus, format on blur
    const amountInput = form.elements['amount'];
    amountInput?.addEventListener('focus', (e)=>{ const v = e.target.value || ''; e.target.value = String(v).replace(',', '.').replace(/[R$\s]/g,''); });
    amountInput?.addEventListener('blur', (e)=>{ const cents = parseAmountInput(e.target.value); e.target.value = (cents/100).toFixed(2).replace('.', ','); });

    // filter categories when type changes (show income or expense categories)
    form.elements['type']?.addEventListener('change', (e)=>{
      const catSelect = form.elements['category_id'];
      const t = e.target.value;
      catSelect.innerHTML = '<option value="">-- Nenhuma --</option>';
      if (t === 'income'){
        (window.__tx_inc_cats || []).forEach(c=>{ const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; catSelect.appendChild(opt); });
      } else if (t === 'expense'){
        (window.__tx_exp_cats || []).forEach(c=>{ const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; catSelect.appendChild(opt); });
      } else {
        ([...(window.__tx_inc_cats||[]), ...(window.__tx_exp_cats||[])]).forEach(c=>{ const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; catSelect.appendChild(opt); });
      }
    });

    // listen for category changes from settings page (other tab or same tab)
    window.addEventListener('storage', (e)=>{
      if (e.key === 'categories_updated'){
        loadLists().then(()=>load());
      }
    });
    window.addEventListener('categories:updated', ()=>{ loadLists().then(()=>load()); });

    loadLists().then(()=>load());
  });
})();
