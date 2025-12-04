let investments = [];
let editingId = null;
let simulationChart = null;

const modal = document.getElementById('investment-modal');
const form = document.getElementById('investment-form');
const addBtn = document.getElementById('add-investment-btn');
const closeBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');

// Controle do simulador
const simulatorCard = document.getElementById('simulator-card');
const toggleSimulatorBtn = document.getElementById('toggle-simulator-btn');
const closeSimulatorBtn = document.getElementById('close-simulator-btn');

toggleSimulatorBtn.addEventListener('click', () => {
  simulatorCard.style.display = simulatorCard.style.display === 'none' ? 'block' : 'none';
  if (simulatorCard.style.display === 'block') {
    simulatorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

closeSimulatorBtn.addEventListener('click', () => {
  simulatorCard.style.display = 'none';
  // Resetar resultados ao fechar
  document.getElementById('simulator-results').style.display = 'none';
});

addBtn.addEventListener('click', () => {
  editingId = null;
  form.reset();
  document.getElementById('modal-title').textContent = 'Novo Investimento';
  document.getElementById('startDate').valueAsDate = new Date();
  modal.classList.add('active');
});

closeBtn.addEventListener('click', () => modal.classList.remove('active'));
cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById('name').value,
    type: document.getElementById('type').value,
    amount: parseFloat(document.getElementById('amount').value),
    initialAmount: parseFloat(document.getElementById('initialAmount').value) || parseFloat(document.getElementById('amount').value),
    returnRate: parseFloat(document.getElementById('returnRate').value) || 0,
    description: document.getElementById('description').value,
    startDate: document.getElementById('startDate').value,
    status: document.getElementById('status').value
  };

  try {
    if (editingId) {
      await api.updateInvestment(editingId, data);
    } else {
      await api.createInvestment(data);
    }

    modal.classList.remove('active');
    loadInvestments();
  } catch (error) {
    alert('Erro ao salvar investimento');
  }
});

async function loadInvestments() {
  try {
    const response = await api.getInvestments();
    if (response.data.sucesso) {
      investments = response.data.investimentos;
      displayInvestments();
      updateTotal();
    }
  } catch (error) {
    console.error('Erro ao carregar investimentos:', error);
  }
}

function displayInvestments() {
  const container = document.getElementById('investments-container');

  if (investments.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><span class="icon icon-chart"></span></div><p>Nenhum investimento cadastrado</p></div>';
    return;
  }

  const html = investments.map(inv => `
    <div class="investment-card">
      <div class="investment-header">
        <div>
          <div class="investment-name">${inv.name}</div>
          <span class="investment-type">${inv.type || 'N/A'}</span>
        </div>
        <span class="status-badge ${inv.status}">${inv.status}</span>
      </div>
      <div class="investment-details">
        <div class="detail-item">
          <div class="detail-label">Valor Atual</div>
          <div class="detail-value amount positive">R$ ${inv.amount.toFixed(2).replace('.', ',')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Valor Inicial</div>
          <div class="detail-value">R$ ${inv.initialAmount.toFixed(2).replace('.', ',')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Retorno</div>
          <div class="detail-value return-rate">${inv.returnRate}%</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Início</div>
          <div class="detail-value">${new Date(inv.startDate).toLocaleDateString('pt-BR')}</div>
        </div>
      </div>
      ${inv.description ? `<p style="color: #666; margin-top: 10px;">${inv.description}</p>` : ''}
      <div class="action-buttons" style="margin-top: 15px;">
        <button class="btn btn-small btn-secondary" onclick="editInvestment('${inv.id}')">Editar</button>
        <button class="btn btn-small btn-danger" onclick="deleteInvestment('${inv.id}')">Excluir</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

async function editInvestment(id) {
  const investment = investments.find(i => i.id === id);
  if (!investment) return;

  editingId = id;
  document.getElementById('modal-title').textContent = 'Editar Investimento';
  document.getElementById('name').value = investment.name;
  document.getElementById('type').value = investment.type || '';
  document.getElementById('amount').value = investment.amount;
  document.getElementById('initialAmount').value = investment.initialAmount;
  document.getElementById('returnRate').value = investment.returnRate;
  document.getElementById('description').value = investment.description || '';
  document.getElementById('startDate').value = investment.startDate.split('T')[0];
  document.getElementById('status').value = investment.status;

  modal.classList.add('active');
}

async function deleteInvestment(id) {
  if (!confirm('Deseja realmente excluir este investimento?')) return;

  try {
    await api.deleteInvestment(id);
    loadInvestments();
  } catch (error) {
    alert('Erro ao excluir investimento');
  }
}

function updateTotal() {
  const total = investments.filter(i => i.status === 'ativo').reduce((sum, i) => sum + i.amount, 0);
  document.getElementById('total-invested').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Simulador de Investimentos
let currentInvestmentType = 'custom';

function selectInvestmentType(type) {
  currentInvestmentType = type;
  
  // Atualizar botões ativos
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.tab-btn[data-type="${type}"]`).classList.add('active');
  
  // Definir taxa baseada no tipo
  const rates = {
    'custom': 10,
    'savings': 6.17,  // Poupança atual
    'cdi': 12.75,     // CDI aproximado
    'stocks': 15,     // Média ações
    'real-estate': 8  // Fundos imobiliários
  };
  
  document.getElementById('sim-rate').value = rates[type];
}

function applyPreset(initial, monthly, years) {
  document.getElementById('sim-initial').value = initial;
  document.getElementById('sim-monthly').value = monthly;
  document.getElementById('sim-period').value = years;
}

function toggleAdvancedOptions() {
  const options = document.getElementById('advanced-options');
  const text = document.getElementById('toggle-text');
  
  if (options.style.display === 'none') {
    options.style.display = 'block';
    text.textContent = 'Ocultar Opções Avançadas';
  } else {
    options.style.display = 'none';
    text.textContent = 'Mostrar Opções Avançadas';
  }
}

function resetSimulator() {
  document.getElementById('sim-initial').value = 1000;
  document.getElementById('sim-monthly').value = 100;
  document.getElementById('sim-rate').value = 10;
  document.getElementById('sim-period').value = 5;
  document.getElementById('sim-inflation').value = 4.5;
  document.getElementById('sim-tax').value = 15;
  document.getElementById('sim-increase').value = 0;
  document.getElementById('simulator-results').style.display = 'none';
}

function simulateInvestment() {
  const initial = parseFloat(document.getElementById('sim-initial').value) || 0;
  const monthly = parseFloat(document.getElementById('sim-monthly').value) || 0;
  const rate = parseFloat(document.getElementById('sim-rate').value) || 0;
  const years = parseInt(document.getElementById('sim-period').value) || 1;
  
  // Opções avançadas
  const inflation = parseFloat(document.getElementById('sim-inflation').value) || 0;
  const taxRate = parseFloat(document.getElementById('sim-tax').value) || 0;
  const yearlyIncrease = parseFloat(document.getElementById('sim-increase').value) || 0;

  if (initial < 0 || monthly < 0 || rate < 0 || years < 1) {
    alert('Por favor, preencha valores válidos');
    return;
  }

  const monthlyRate = rate / 100 / 12;
  const monthlyInflation = inflation / 100 / 12;
  const months = years * 12;
  
  let balance = initial;
  let currentMonthly = monthly;
  const balanceHistory = [initial];
  const investedHistory = [initial];
  const realValueHistory = [initial];
  let totalInvested = initial;

  // Calcular mês a mês
  for (let i = 1; i <= months; i++) {
    // Aumentar aporte anualmente
    if (i % 12 === 0 && yearlyIncrease > 0) {
      currentMonthly = currentMonthly * (1 + yearlyIncrease / 100);
    }
    
    balance = balance * (1 + monthlyRate) + currentMonthly;
    totalInvested += currentMonthly;
    
    // Valor real (descontando inflação)
    const realValue = balance / Math.pow(1 + monthlyInflation, i);
    
    balanceHistory.push(balance);
    investedHistory.push(totalInvested);
    realValueHistory.push(realValue);
  }

  const finalBalance = balance;
  const grossEarnings = finalBalance - totalInvested;
  const taxes = (grossEarnings * taxRate) / 100;
  const netEarnings = grossEarnings - taxes;
  const finalValue = totalInvested + netEarnings;
  const realFinalValue = realValueHistory[realValueHistory.length - 1];
  
  const returnPercentage = ((netEarnings / totalInvested) * 100).toFixed(2);
  const yearlyReturn = (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100;
  const monthlyReturn = (finalValue - totalInvested) / months;

  // Exibir resultados principais
  document.getElementById('result-invested').textContent = 
    'R$ ' + totalInvested.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  document.getElementById('result-earnings').textContent = 
    'R$ ' + grossEarnings.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  document.getElementById('result-tax').textContent = 
    'R$ ' + taxes.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  document.getElementById('result-total').textContent = 
    'R$ ' + finalValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Métricas adicionais
  document.getElementById('metric-return').textContent = returnPercentage + '%';
  document.getElementById('metric-yearly').textContent = yearlyReturn.toFixed(2) + '% a.a.';
  document.getElementById('metric-real').textContent = 
    'R$ ' + realFinalValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  document.getElementById('metric-real-gain').textContent = 
    'R$ ' + (realFinalValue - totalInvested).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Informações adicionais
  document.getElementById('info-period').textContent = months;
  document.getElementById('info-years').textContent = years;
  document.getElementById('info-contributions').textContent = (months - 1);
  document.getElementById('info-monthly-return').textContent = 
    'R$ ' + monthlyReturn.toFixed(2).replace('.', ',');

  // Criar comparação com outros investimentos
  createComparison(initial, monthly, years, months);

  document.getElementById('simulator-results').style.display = 'block';
  
  // Scroll suave até os resultados
  setTimeout(() => {
    document.getElementById('simulator-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);

  // Criar gráfico
  createSimulationChart(balanceHistory, investedHistory, realValueHistory, years);
}

function createComparison(initial, monthly, years, months) {
  const investments = [
    { name: 'Poupança', rate: 6.17 },
    { name: 'CDI (100%)', rate: 12.75 },
    { name: 'Tesouro Selic', rate: 12.25 },
    { name: 'LCI/LCA', rate: 10.8 },
    { name: 'Ações (histórico)', rate: 15 }
  ];

  const comparisonGrid = document.getElementById('comparison-grid');
  comparisonGrid.innerHTML = '';

  investments.forEach(inv => {
    const monthlyRate = inv.rate / 100 / 12;
    let balance = initial;
    let totalInvested = initial;

    for (let i = 1; i <= months; i++) {
      balance = balance * (1 + monthlyRate) + monthly;
      totalInvested += monthly;
    }

    const item = document.createElement('div');
    item.className = 'comparison-item';
    item.innerHTML = `
      <div class="comparison-name">${inv.name}</div>
      <div class="comparison-rate">${inv.rate}% ao ano</div>
      <div class="comparison-value">R$ ${balance.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</div>
    `;
    
    comparisonGrid.appendChild(item);
  });
}

function createSimulationChart(balanceHistory, investedHistory, realValueHistory, years) {
  const ctx = document.getElementById('simulation-chart');
  if (!ctx) return;

  const months = balanceHistory.length;
  const labels = [];
  
  // Criar labels (mostrar apenas alguns pontos)
  const step = Math.ceil(months / 12);
  for (let i = 0; i < months; i += step) {
    const year = Math.floor(i / 12);
    const month = i % 12;
    labels.push(year === 0 && month === 0 ? 'Início' : `${year}a ${month}m`);
  }
  labels.push(`${years} anos`);

  // Dados para o gráfico (amostragem)
  const balanceData = [];
  const investedData = [];
  const realData = [];
  
  for (let i = 0; i < months; i += step) {
    balanceData.push(balanceHistory[i]);
    investedData.push(investedHistory[i]);
    realData.push(realValueHistory[i]);
  }
  balanceData.push(balanceHistory[months - 1]);
  investedData.push(investedHistory[months - 1]);
  realData.push(realValueHistory[months - 1]);

  if (simulationChart) simulationChart.destroy();

  simulationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Montante Total (Nominal)',
          data: balanceData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3
        },
        {
          label: 'Valor Real (descontada inflação)',
          data: realData,
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: false,
          borderWidth: 2,
          borderDash: [5, 5]
        },
        {
          label: 'Total Investido',
          data: investedData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          tension: 0.4,
          fill: false,
          borderWidth: 2,
          borderDash: [10, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += 'R$ ' + context.parsed.y.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }
          }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', loadInvestments);
