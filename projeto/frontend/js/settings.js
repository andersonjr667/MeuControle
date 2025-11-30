 (async function(){
  // wait for Auth then initialize settings
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
    // Elements
    const incomeList = document.getElementById('incomeCategories');
    const expenseList = document.getElementById('expenseCategories');
    const paymentList = document.getElementById('paymentMethods');
    const emptyIncome = document.getElementById('emptyIncome');
    const emptyExpense = document.getElementById('emptyExpense');
    const emptyPayment = document.getElementById('emptyPayment');
  const btnRestoreDefaults = document.getElementById('btnRestoreDefaults');

    // modal
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const modalName = document.getElementById('modalName');
    const modalType = document.getElementById('modalType');
    const modalId = document.getElementById('modalId');
    const modalCancel = document.getElementById('modalCancel');
    const modalBackdrop = document.getElementById('modalBackdrop');

    function showModal(type, data){
      modal.setAttribute('aria-hidden','false');
      modalTitle.textContent = data && data.id ? 'Editar' : 'Nova';
      modalName.value = data && data.name ? data.name : '';
      modalType.value = type;
      modalId.value = data && data.id ? data.id : '';
      setTimeout(()=> modalName.focus(), 50);
    }
    function closeModal(){
      modal.setAttribute('aria-hidden','true');
      modalForm.reset();
    }

    modalCancel?.addEventListener('click', closeModal);
    modalBackdrop?.addEventListener('click', closeModal);

    modalForm?.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const name = (modalName.value || '').trim();
      const type = modalType.value;
      const id = modalId.value;
      if (!name){ alert('Informe um nome válido'); modalName.focus(); return; }

      const endpointMap = { income: 'income_categories', expense: 'expense_categories', payment: 'payment_methods' };
      const endpoint = endpointMap[type];
      if (!endpoint) { alert('Tipo inválido'); return; }

      try{
        if (id){
          await API.put(`/settings/${endpoint}/${id}`, { name });
        }else{
          await API.post(`/settings/${endpoint}`, { name });
        }
        // notify other pages
        try{ localStorage.setItem('categories_updated', String(Date.now())); }catch(e){}
        try{ window.dispatchEvent(new Event('categories:updated')); }catch(e){}
        closeModal();
        await load();
      }catch(err){ console.error(err); alert(err.message || 'Erro'); }
    });

    document.getElementById('btnNewIncome')?.addEventListener('click', ()=> showModal('income'));
    document.getElementById('btnNewExpense')?.addEventListener('click', ()=> showModal('expense'));
    document.getElementById('btnNewPayment')?.addEventListener('click', ()=> showModal('payment'));

    // Restore default categories/methods when requested
    async function restoreDefaults(){
      if (!confirm('Restaurar categorias e métodos para os valores padrão?')) return;
  const incomeDefaults = ['Salário','Investimentos','Freelance','Presentes','Reembolso','Outros'];
  const expenseDefaults = ['Alimentação','Moradia','Transporte','Saúde','Lazer','Educação','Vestuário','Internet','Serviços','Impostos','Assinaturas','Outros'];
  const paymentDefaults = ['PIX','Dinheiro','Cartão de Crédito','Cartão de Débito','Transferência','Vale','Cheque'];
      try{
        const [inc, exp, pay] = await Promise.all([
          API.get('/settings/income_categories'),
          API.get('/settings/expense_categories'),
          API.get('/settings/payment_methods')
        ]);

        const ops = [];
        if (!inc || inc.length === 0){ incomeDefaults.forEach(n=> ops.push(API.post('/settings/income_categories',{ name: n }))); }
        if (!exp || exp.length === 0){ expenseDefaults.forEach(n=> ops.push(API.post('/settings/expense_categories',{ name: n }))); }
        if (!pay || pay.length === 0){ paymentDefaults.forEach(n=> ops.push(API.post('/settings/payment_methods',{ name: n }))); }

        if (ops.length === 0){ alert('Já existem categorias ou métodos cadastrados. Nada a restaurar.'); return; }
        await Promise.all(ops);
        try{ localStorage.setItem('categories_updated', String(Date.now())); }catch(e){}
        try{ window.dispatchEvent(new Event('categories:updated')); }catch(e){}
        await load();
        alert('Padrões restaurados com sucesso.');
      }catch(err){ console.error(err); alert(err.message || 'Erro ao restaurar padrões'); }
    }

    btnRestoreDefaults?.addEventListener('click', restoreDefaults);

    async function load(){
      try{
        const [inc, exp, pay] = await Promise.all([
          API.get('/settings/income_categories'),
          API.get('/settings/expense_categories'),
          API.get('/settings/payment_methods')
        ]);

        renderList(incomeList, inc, 'income', emptyIncome);
        renderList(expenseList, exp, 'expense', emptyExpense);
        renderList(paymentList, pay, 'payment', emptyPayment);
      }catch(err){ console.error(err); }
    }

    function renderList(container, items, type, emptyEl){
      container.innerHTML = '';
      if (!items || items.length === 0){ emptyEl.style.display = 'block'; return; } else { emptyEl.style.display = 'none'; }

      items.forEach(i=>{
        const li = document.createElement('li');
        const span = document.createElement('span'); span.className = 'item-name'; span.textContent = i.name;
        const actions = document.createElement('div'); actions.className = 'items-actions';
        const btnEdit = document.createElement('button'); btnEdit.textContent='Editar'; btnEdit.className='edit btn btn-icon'; btnEdit.dataset.id = i.id; btnEdit.dataset.name = i.name; btnEdit.dataset.type = type;
        const btnDel = document.createElement('button'); btnDel.textContent='Excluir'; btnDel.className='del btn btn-icon'; btnDel.dataset.id = i.id; btnDel.dataset.type = type;
        actions.appendChild(btnEdit); actions.appendChild(btnDel);
        li.appendChild(span); li.appendChild(actions);
        container.appendChild(li);
      });
    }

    // delegate edit/delete
    document.addEventListener('click', async (e)=>{
      const t = e.target;
      if (t.matches('.del')){
        const id = t.dataset.id; const type = t.dataset.type;
        if (!confirm('Excluir?')) return;
        const endpointMap = { income: 'income_categories', expense: 'expense_categories', payment: 'payment_methods' };
        const endpoint = endpointMap[type];
        try{ await API.delete(`/settings/${endpoint}/${id}`); await load(); }catch(err){ console.error(err); alert(err.message||'Erro'); }
        return;
      }

      if (t.matches('.edit')){
        const id = t.dataset.id; const type = t.dataset.type; const name = t.dataset.name || '';
        showModal(type, { id, name });
        return;
      }
    });

    // initial load
    load();
  });
})();
