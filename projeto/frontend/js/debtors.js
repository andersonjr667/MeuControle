 (async function(){
  // wait for Auth to be ready then run
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
    const list = document.getElementById('debtorsList');
    const btnAdd = document.getElementById('btnAddDebtor');
    const debtorModal = document.getElementById('debtorModal');
    const debtorInfo = document.getElementById('debtorInfo');
    const debtorHistory = document.getElementById('debtorHistory');
    const movementForm = document.getElementById('movementForm');
    const btnCloseDebtor = document.getElementById('btnCloseDebtor');

    const currency = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});

    async function load(){
      try{
        const data = await API.get('/debtors');
        list.innerHTML = '';
        data.forEach(d=>{
          const li = document.createElement('li');
          const left = document.createElement('div'); left.className='left';
          const name = document.createElement('div'); name.className='name'; name.textContent = d.name;
          const bal = document.createElement('div'); bal.className='balance'; bal.textContent = 'Saldo: ' + currency.format((d.balance||0)/100);
          left.appendChild(name); left.appendChild(bal);

          const actions = document.createElement('div'); actions.className='actions';
          const btnView = document.createElement('button'); btnView.textContent='Ver'; btnView.className='view'; btnView.dataset.id = d.id;
          const btnMove = document.createElement('button'); btnMove.textContent='Adicionar Movimento'; btnMove.className='move'; btnMove.dataset.id = d.id;
          const btnDel = document.createElement('button'); btnDel.textContent='Excluir'; btnDel.className='del'; btnDel.dataset.id = d.id;
          actions.appendChild(btnView); actions.appendChild(btnMove); actions.appendChild(btnDel);

          li.appendChild(left); li.appendChild(actions);
          list.appendChild(li);
        });
      }catch(err){ console.error(err); alert(err.message || 'Erro ao carregar devedores'); }
    }

    if (btnAdd){ btnAdd.addEventListener('click', async ()=>{ const name = prompt('Nome do devedor'); if (!name) return; try{ await API.post('/debtors', { name }); load(); }catch(err){ console.error(err); alert(err.message || 'Erro ao criar devedor'); } }); }

    // open modal view
    list.addEventListener('click', async (e)=>{
      if (e.target.matches('.del')){
        const id = e.target.dataset.id;
        if (!confirm('Deletar devedor?')) return;
        try{ await API.delete('/debtors/'+id); try{ localStorage.setItem('transactions_updated', String(Date.now())); }catch(e){}; load(); }catch(err){ console.error(err); alert(err.message||'Erro ao deletar devedor'); }
      }
      if (e.target.matches('.view')){
        const id = e.target.dataset.id;
        try{
          const res = await API.get('/debtors/'+id);
          const debtor = res.debtor; const history = res.history || [];
          // compute totals for positive/negative movements
          const total = history.reduce((s,h)=>s + Number(h.movement||0), 0);
          const totalReceived = history.reduce((s,h)=> s + (Number(h.movement) > 0 ? Number(h.movement) : 0), 0);
          const totalLent = history.reduce((s,h)=> s + (Number(h.movement) < 0 ? Math.abs(Number(h.movement)) : 0), 0);

          debtorInfo.innerHTML = `
            <strong>${debtor.name}</strong>
            <div>Id: ${debtor.id}</div>
            <div class="debtor-summary">
              <div>Saldo atual:<br><strong>${currency.format(total/100)}</strong></div>
              <div>Recebido:<br><strong>${currency.format(totalReceived/100)}</strong></div>
              <div>Emprestado:<br><strong>${currency.format(totalLent/100)}</strong></div>
            </div>
          `;

          debtorHistory.innerHTML = '';
          if (history.length===0){ debtorHistory.innerHTML = '<li>Nenhum movimento</li>'; }
          history.forEach(h=>{
            const li = document.createElement('li'); li.className='tx-item';
            const amt = Number(h.movement||0);
            const cls = amt >= 0 ? 'positive' : 'negative';
            li.innerHTML = `<div class="tx-left"><span class="tx-date">${h.date}</span><span class="tx-desc">${h.description||''}</span></div><div class="tx-amount ${cls}">${currency.format(amt/100)}</div>`;
            debtorHistory.appendChild(li);
          });

          movementForm.elements['debtor_id'].value = debtor.id;
          // when viewing a debtor, only show history and summary — hide the add-movement form
          movementForm.classList.add('hidden');
          debtorModal.classList.remove('hidden');
        }catch(err){ console.error(err); alert('Erro ao carregar devedor'); }
      }
      if (e.target.matches('.move')){
        const id = e.target.dataset.id;
        // open modal and prefill debtor id
        movementForm.elements['debtor_id'].value = id;
        // show the movement form when user explicitly clicks "Adicionar Movimento"
        movementForm.classList.remove('hidden');
        debtorModal.classList.remove('hidden');
        // clear debtorInfo when opening for adding movement
        debtorInfo.innerHTML = '';
        debtorHistory.innerHTML = '';
      }
    });

    // close modal
    btnCloseDebtor.addEventListener('click', ()=> debtorModal.classList.add('hidden'));
    debtorModal.addEventListener('click', (e)=>{ if (e.target === debtorModal) debtorModal.classList.add('hidden'); });

    // movement form submit
    movementForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(movementForm);
      const debtor_id = fd.get('debtor_id');
      const date = fd.get('date');
      const raw = fd.get('movement');
      // read select state (caixa de seleção)
      const direction = fd.get('direction') || 'paid';
      // normalize input: remove thousands separators and accept comma as decimal
      const cleaned = String(raw).trim().replace(/\./g,'').replace(',','.');
      const base = Math.round((Math.abs(parseFloat(cleaned))||0)*100);
      // Pagou = positive (credit to debtor), Emprestou = negative (debtor owes)
      const movement = direction === 'lent' ? -base : base;
      const description = fd.get('description');
      try{
        // backend route is mounted at /api/debt_history (underscore), so use that path
        await API.post('/debt_history/debtor/'+debtor_id, { date, movement, description });
        alert('Movimento registrado');
        // refresh modal content
        const res = await API.get('/debtors/'+debtor_id);
        const history = res.history || [];
        debtorHistory.innerHTML = '';
        history.forEach(h=>{
          const li = document.createElement('li'); li.className='tx-item';
          li.innerHTML = `<div class="tx-left"><span class="tx-date">${h.date}</span><span class="tx-desc">${h.description||''}</span></div><div class="tx-amount">${currency.format((h.movement||0)/100)}</div>`;
          debtorHistory.appendChild(li);
        });
        load();
        // notify dashboard/other tabs that transactions/debt history changed
        try{ localStorage.setItem('transactions_updated', String(Date.now())); }catch(e){}
      }catch(err){ console.error(err); alert(err.message || 'Erro ao criar movimento'); }
    });

    load();
  });
})();
