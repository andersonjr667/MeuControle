// Variáveis para os gráficos
let monthlyChart = null;
let expensesChart = null;
let evolutionChart = null;

// Helper: normaliza strings de data para um objeto Date robusto
function normalizeToDateDashboard(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.includes('-'))) {
    const d = new Date(dateStr);
    if (!isNaN(d)) return d;
  }
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const parts = dateStr.split('/').map(p => parseInt(p, 10));
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const d = new Date(year, month - 1, day);
      if (!isNaN(d)) return d;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d)) return d;
  }
  return new Date(dateStr);
}

function formatDateForInputDashboard(dateStr) {
  return normalizeToDateDashboard(dateStr).toISOString().split('T')[0];
}

// Calcular valor atual e rendimento do investimento
function calculateInvestmentEarnings(investment) {
  if (!investment.returnRate || investment.returnRate <= 0 || investment.status !== 'ativo') {
    return {
      currentValue: investment.amount,
      earnings: 0,
      daysElapsed: 0
    };
  }

  const startDate = new Date(investment.startDate);
  const today = new Date();
  const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  if (daysElapsed <= 0) {
    return {
      currentValue: investment.initialAmount || investment.amount,
      earnings: 0,
      daysElapsed: 0
    };
  }

  // Cálculo de juros compostos diários
  const initialAmount = investment.initialAmount || investment.amount;
  const annualRate = investment.returnRate / 100;
  const dailyRate = Math.pow(1 + annualRate, 1/365) - 1;
  const currentValue = initialAmount * Math.pow(1 + dailyRate, daysElapsed);
  const earnings = currentValue - initialAmount;

  return {
    currentValue: currentValue,
    earnings: earnings,
    daysElapsed: daysElapsed,
    returnPercentage: (earnings / initialAmount) * 100
  };
}

// Carregar dados do dashboard
async function loadDashboard() {
  try {
    // Carregar saldo
    const balanceResponse = await api.getBalance();
    if (balanceResponse.data.sucesso) {
      document.getElementById('total-balance').textContent = 
        `R$ ${balanceResponse.data.saldo.toFixed(2).replace('.', ',')}`;
    }

    // Carregar total de rendimento dos investimentos
    const investmentsResponse = await api.getInvestments();
    if (investmentsResponse.data.sucesso) {
      const activeInvestments = investmentsResponse.data.investimentos.filter(inv => inv.status === 'ativo');
      
      // Calcular apenas o rendimento (lucro), não o valor total
      const totalEarnings = activeInvestments.reduce((sum, inv) => {
        const calc = calculateInvestmentEarnings(inv);
        return sum + calc.earnings;
      }, 0);
      
      document.getElementById('total-investments').textContent = 
        `R$ ${totalEarnings.toFixed(2).replace('.', ',')}`;
      
      // Mostrar investimentos ativos
      displayActiveInvestments(investmentsResponse.data.investimentos);
    }

    // Carregar total em dívidas
    const debtorsResponse = await api.getDebtors();
    if (debtorsResponse.data.sucesso) {
      // calcular status dinamicamente para consistência com a página Devedores
      const debtorsWithStatus = debtorsResponse.data.devedores.map(d => ({
        ...d,
        _computedStatus: computeDebtorStatus(d) // 'em dia' | 'pendente' | 'atrasado'
      }));

      const totalDebts = debtorsWithStatus
        .filter(debtor => (debtor._computedStatus || '').toLowerCase() !== 'em dia')
        .reduce((sum, debtor) => sum + debtor.amount, 0);
      
      document.getElementById('total-debts').textContent = 
        `R$ ${totalDebts.toFixed(2).replace('.', ',')}`;
      
      // Mostrar devedores recentes (usar status calculado)
      displayRecentDebtors(debtorsWithStatus);
    }

    // Carregar transações
    const transactionsResponse = await api.getTransactions();
    if (transactionsResponse.data.sucesso) {
      const transactions = transactionsResponse.data.transacoes;
      
      // Contar transações de hoje (normalize date strings first)
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = transactions.filter(t => (
        normalizeToDateDashboard(t.date).toISOString().split('T')[0] === today
      ));
      
      document.getElementById('transactions-today').textContent = todayTransactions.length;
      
      // Mostrar transações recentes
      displayRecentTransactions(transactions);
      
      // Criar gráficos
      createMonthlyChart(transactions);
      createExpensesChart(transactions);
      createEvolutionChart(transactions);
    }
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

// Mostrar transações recentes
function displayRecentTransactions(transactions) {
  const container = document.getElementById('recent-transactions');
  
  if (transactions.length === 0) {
    return;
  }

  const recent = transactions.slice(0, 5);
  
  const html = `
    <table>
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Tipo</th>
          <th>Valor</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        ${recent.map(t => `
          <tr>
            <td>${t.description || 'Sem descrição'}</td>
            <td><span class="type-badge ${t.type}">${t.type}</span></td>
            <td class="amount ${t.type === 'entrada' ? 'positive' : 'negative'}">
              ${t.type === 'entrada' ? '+' : '-'} R$ ${t.amount.toFixed(2).replace('.', ',')}
            </td>
            <td>${normalizeToDateDashboard(t.date).toLocaleDateString('pt-BR')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// Mostrar devedores recentes
function displayRecentDebtors(debtors) {
  const container = document.getElementById('recent-debtors');
  
  if (debtors.length === 0) {
    return;
  }

  const recent = debtors.slice(0, 5);
  
      const html = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Valor</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${recent.map(d => {
          // normalizar/usar status calculado (suporta _computedStatus ou status antigo)
          const stRaw = (d._computedStatus || d.status || '').toLowerCase();
          const label = (stRaw === 'pago' || stRaw === 'em dia') ? 'em dia' : (stRaw || 'pendente');
          const cls = label.replace(/\s+/g, '-');
          return `
          <tr>
            <td>${d.name}</td>
            <td class="amount negative">R$ ${d.amount.toFixed(2).replace('.', ',')}</td>
            <td><span class="status-badge ${cls}">${label}</span></td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// Mostrar investimentos ativos
function displayActiveInvestments(investments) {
  const container = document.getElementById('active-investments');
  
  const active = investments.filter(inv => inv.status === 'ativo');
  
  if (active.length === 0) {
    return;
  }

  const html = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Rendimento</th>
          <th>Taxa</th>
        </tr>
      </thead>
      <tbody>
        ${active.map(inv => {
          const calc = calculateInvestmentEarnings(inv);
          return `
          <tr>
            <td>${inv.name}</td>
            <td>${inv.type || 'N/A'}</td>
            <td class="amount ${calc.earnings > 0 ? 'positive' : ''}">
              ${calc.earnings > 0 ? '+' : ''}R$ ${calc.earnings.toFixed(2).replace('.', ',')}
              ${calc.earnings > 0 ? `<small style="color: #6b7280; font-size: 11px;"> (+${calc.returnPercentage.toFixed(2)}%)</small>` : ''}
            </td>
            <td class="return-rate">${inv.returnRate || 0}% a.a.</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// Criar gráfico de resumo mensal (Receitas vs Despesas vs Saldo)
function createMonthlyChart(transactions) {
  const ctx = document.getElementById('monthly-chart');
  if (!ctx) return;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const income = monthTransactions
    .filter(t => t.type === 'income' || t.type === 'entrada')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthTransactions
    .filter(t => t.type === 'expense' || t.type === 'saida')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Receitas', 'Despesas', 'Saldo'],
      datasets: [{
        label: 'Valor (R$)',
        data: [income, expense, balance],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          balance >= 0 ? 'rgba(59, 130, 246, 0.7)' : 'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
          balance >= 0 ? 'rgb(59, 130, 246)' : 'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'R$ ' + context.parsed.y.toFixed(2).replace('.', ',');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

// Criar gráfico de gastos por categoria (Pizza)
function createExpensesChart(transactions) {
  const ctx = document.getElementById('expenses-chart');
  if (!ctx) return;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthExpenses = transactions.filter(t => {
    const date = new Date(t.date);
    return (t.type === 'expense' || t.type === 'saida') && 
           date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear;
  });

  const categoryTotals = {};
  monthExpenses.forEach(t => {
    const category = t.category || 'Outros';
    categoryTotals[category] = (categoryTotals[category] || 0) + t.amount;
  });

  const categories = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  const colors = [
    'rgba(239, 68, 68, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(148, 163, 184, 0.8)'
  ];

  if (expensesChart) expensesChart.destroy();

  expensesChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, categories.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return context.label + ': R$ ' + context.parsed.toFixed(2).replace('.', ',') + ' (' + percentage + '%)';
            }
          }
        }
      }
    }
  });
}

// Criar gráfico de evolução financeira (Linha - Últimos 6 meses)
function createEvolutionChart(transactions) {
  const ctx = document.getElementById('evolution-chart');
  if (!ctx) return;

  const months = [];
  const incomeData = [];
  const expenseData = [];
  const balanceData = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth();
    const year = date.getFullYear();

    months.push(date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));

    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === month && tDate.getFullYear() === year;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income' || t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
      .filter(t => t.type === 'expense' || t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0);

    incomeData.push(income);
    expenseData.push(expense);
    balanceData.push(income - expense);
  }

  if (evolutionChart) evolutionChart.destroy();

  evolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        },
        {
          label: 'Despesas',
          data: expenseData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        },
        {
          label: 'Saldo',
          data: balanceData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 15,
            font: {
              size: 13,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': R$ ' + context.parsed.y.toFixed(2).replace('.', ',');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

// Função utilitária para calcular status de devedor (mesma lógica usada em debtors.js)
function computeDebtorStatus(d) {
  const amount = Number(d.amount) || 0;
  if (amount === 0) return 'em dia';

  if (d.dueDate) {
    try {
      const due = new Date(d.dueDate);
      const dueYMD = due.toISOString().split('T')[0];
      const todayYMD = new Date().toISOString().split('T')[0];
      if (dueYMD < todayYMD) return 'atrasado';
    } catch (e) {
      // ignore parse errors
    }
  }

  return 'pendente';
}

// Carregar ao iniciar
document.addEventListener('DOMContentLoaded', loadDashboard);
