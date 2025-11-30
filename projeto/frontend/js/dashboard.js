// dashboard.js - fetch totals and show simple charts
 (async function(){
  // wait for Auth to be ready and then run dashboard init
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
    // when transactions change in other tabs, reload to update totals
    window.addEventListener('storage', (e)=>{
      if (e.key === 'transactions_updated'){
        try{ if (typeof refreshDashboard === 'function') refreshDashboard(); }catch(err){ /* ignore */ }
      }
    });

    let pieChart = null, lineChart = null;
    const loading = document.getElementById('loadingOverlay');
    function showLoading(){ loading && loading.classList.remove('hidden'); }
    function hideLoading(){ loading && loading.classList.add('hidden'); }

    const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    function invAmountToReais(raw){
      if (raw === null || raw === undefined) return 0;
      if (typeof raw === 'string'){
        const t = raw.replace(',','.');
        const v = parseFloat(t);
        if (!isNaN(v)) return v;
      }
      const num = Number(raw);
      if (isNaN(num)) return 0;
      if (Number.isInteger(num) && Math.abs(num) >= 100 && num % 100 === 0) return num / 100;
      return num;
    }

    async function updateTotals(){
      const totals = await API.get('/transactions/totals');
      // include investments (they are considered expenses)
      let investmentsSumCents = 0;
      try{
        const invItems = await API.get('/investments') || [];
        const invSum = (invItems || []).reduce((s,i)=> s + (Number(i.amount) || 0), 0);
        investmentsSumCents = Math.round(invSum * 100);
      }catch(e){ investmentsSumCents = 0; }
      totals.total_expense = (totals.total_expense || 0) + investmentsSumCents;
      totals.balance = (totals.balance || 0) - investmentsSumCents;

      // incorporate debt history into balance as net (devido - recebido)
      try{
        const debts = await API.get('/debt_history') || [];
        let totalDebtorReceived = 0, totalDebtorLent = 0;
        (debts || []).forEach(d => { const mv = Number(d.movement || 0); if (mv >= 0) totalDebtorReceived += mv; else totalDebtorLent += Math.abs(mv); });
        const netDebtors = (totalDebtorLent || 0) - (totalDebtorReceived || 0);
        totals.balance = (totals.balance || 0) - netDebtors;
        document.getElementById('totalDebtorReceived').textContent = fmt.format((totalDebtorReceived||0)/100);
        document.getElementById('totalDebtorLent').textContent = fmt.format((totalDebtorLent||0)/100);
      }catch(e){ /* ignore debt errors */ }

      document.getElementById('totalIncome').textContent = fmt.format((totals.total_income||0)/100);
      document.getElementById('totalExpense').textContent = fmt.format((totals.total_expense||0)/100);
      document.getElementById('balance').textContent = fmt.format((totals.balance||0)/100);
    }

    async function updateRecentTransactions(){
      const apiTx = await API.get('/transactions') || [];
      const ul = document.getElementById('recentTransactions');
      let investmentsTx = [];
      try{
        const invItems = await API.get('/investments') || [];
        investmentsTx = (invItems || []).map(i => ({ date: i.date || '', type: 'expense', description: (i.name || '') + ' (Investimento)', amount: Math.round((invAmountToReais(i.amount) || 0) * 100), _source: 'investment' }));
      }catch(e){ investmentsTx = []; }

      let debtTxs = [];
      try{
        const debts = await API.get('/debt_history') || [];
        const debtors = await API.get('/debtors') || [];
        const debtorMap = {};
        (debtors || []).forEach(d => debtorMap[String(d.id)] = d.name);
        (debts || []).forEach(d => {
          const mv = Number(d.movement || 0);
          debtTxs.push({ date: d.date || '', type: mv >= 0 ? 'income' : 'expense', description: (debtorMap[String(d.debtor_id)] || ('Devedor ' + d.debtor_id)) + ' (Devedor)', amount: mv, _source: 'debt' });
        });
      }catch(e){ debtTxs = []; }

      const allTx = (apiTx || []).concat(investmentsTx).concat(debtTxs);
      allTx.sort((a,b)=>{ const da = a.date ? new Date(a.date).getTime() : 0; const db = b.date ? new Date(b.date).getTime() : 0; return (db - da) || 0; });
      if (allTx && allTx.length){ ul.innerHTML = ''; allTx.slice(0,10).forEach(t=>{
        const li = document.createElement('li'); li.className = 'tx-item';
        const link = document.createElement('a'); link.className = 'tx-link'; link.href = '/pages/transactions.html';
        const left = document.createElement('div'); left.className = 'tx-left';
        const dateSpan = document.createElement('span'); dateSpan.className = 'tx-date'; dateSpan.textContent = t.date || '';
        const typeSpan = document.createElement('span'); let typeLabel = t.type === 'income' ? 'Entrada' : 'Saída'; if (t._source === 'investment') typeLabel = 'Investimento'; if (t._source === 'debt') typeLabel = (t.amount >= 0 ? 'Recebido' : 'Emprestado'); typeSpan.className = 'tx-type ' + (t.type === 'income' ? 'income' : 'expense'); typeSpan.textContent = typeLabel;
        const descSpan = document.createElement('span'); descSpan.className = 'tx-desc'; descSpan.textContent = t.description || '';
        left.appendChild(dateSpan); left.appendChild(typeSpan); left.appendChild(descSpan);
        const amt = document.createElement('div'); amt.className = 'tx-amount'; amt.textContent = fmt.format((t.amount||0)/100);
        link.appendChild(left); link.appendChild(amt); link.addEventListener('click', (e)=>{ e.preventDefault(); window.location.href = '/pages/transactions.html'; }); li.appendChild(link); ul.appendChild(li);
      }); } else { ul.innerHTML = '<li>Nenhuma transação</li>'; }
    }

    async function updateCharts(){
      // Pie chart
      try{
        const catData = await API.get('/transactions/aggregates/categories?type=expense');
        let expenseMap = {};
        try{ const expenseCats = await API.get('/settings/expense_categories'); expenseCats.forEach(c=> expenseMap[String(c.id)] = c.name); }catch(e){}
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        const pieLabels = (catData||[]).map(r => (r.category_id ? (expenseMap[String(r.category_id)] || 'Categoria '+r.category_id) : 'Sem categoria'));
        const pieValues = (catData||[]).map(r => Number(r.total || 0)/100);
        const pieColumn = document.getElementById('pieChart')?.closest('.chart-col');
        const pieTotal = pieValues.reduce((s,v)=>s+Number(v||0), 0);
        if (!pieValues || pieValues.length === 0 || pieTotal <= 0){ if (pieColumn) pieColumn.style.display = 'none'; if (pieChart) { pieChart.destroy(); pieChart = null; } }
        else { if (pieColumn) pieColumn.style.display = ''; if (pieChart) pieChart.destroy(); pieChart = new Chart(pieCtx, { type: 'pie', data: { labels: pieLabels, datasets:[{data:pieValues,backgroundColor: pieLabels.map((_,i)=>['#1e8f4a','#2b7cff','#ff6384','#ffcd56','#4bc0c0'][i%5])}] } }); }
      }catch(e){ console.warn('pie error', e); }

      // Line chart (monthly)
      try{
        const monthly = await API.get('/transactions/aggregates/monthly');
        const lineCtx = document.getElementById('lineChart').getContext('2d');
        const months = (monthly||[]).map(m=>m.month);
        const balances = (monthly||[]).map(m=> (m.balance || 0)/100 );
        if (lineChart) lineChart.destroy();
  // pick a primary border color for the line chart (fallback to green)
  lineChart = new Chart(lineCtx, { type: 'line', data: { labels: months, datasets:[{label:'Saldo',data:balances,borderColor:'#1e8f4a',fill:false}] }, options:{responsive:true, maintainAspectRatio:false} });
      }catch(e){ console.warn('line error', e); }
    }

    async function refreshDashboard(){ showLoading(); try{ await Promise.all([updateTotals(), updateRecentTransactions(), updateCharts()]); }catch(e){ console.error('refresh error', e); } finally{ hideLoading(); } }

    // initial load
    await refreshDashboard();
  });
})();
