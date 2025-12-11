let transactions = [];
let editingId = null;
let categories = {
  income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Investimentos', 'Outros']
};

// Helper: normaliza strings de data para um objeto Date robusto
function normalizeToDate(dateStr) {
  if (!dateStr) return new Date();
  // já é Date
  if (dateStr instanceof Date) return dateStr;
  // ISO-like (contains T or '-')
  if (typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.includes('-'))) {
    const d = new Date(dateStr);
    if (!isNaN(d)) return d;
  }
  // formato DD/MM/YYYY
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const parts = dateStr.split('/').map(p => parseInt(p, 10));
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const d = new Date(year, month - 1, day);
      if (!isNaN(d)) return d;
    }
  }
  // formato YYYY-MM-DD simples
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d)) return d;
  }
  // fallback
  return new Date(dateStr);
}

function formatDateForInput(dateStr) {
  const d = normalizeToDate(dateStr);
  return d.toISOString().split('T')[0];
}

// Elements
const modal = document.getElementById('transaction-modal');
const form = document.getElementById('transaction-form');
const addBtn = document.getElementById('add-transaction-btn');
const closeBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const filterType = document.getElementById('filter-type');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');

// Carregar categorias das configurações
async function loadCategories() {
  try {
    const response = await api.getSettings();
    if (response.data.sucesso && response.data.configuracoes.categories) {
      categories = response.data.configuracoes.categories;
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

// Atualizar opções de categoria com base no tipo
function updateCategoryOptions() {
  const type = typeSelect.value;
  
  if (!type) {
    categorySelect.innerHTML = '<option value="">Selecione um tipo primeiro</option>';
    categorySelect.disabled = true;
    return;
  }
  
  categorySelect.disabled = false;
  const categoryList = type === 'entrada' ? categories.income : categories.expense;
  
  categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>' + 
    categoryList.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Listener para mudança de tipo
typeSelect.addEventListener('change', updateCategoryOptions);

// Abrir modal para criar
addBtn.addEventListener('click', () => {
  editingId = null;
  form.reset();
  document.getElementById('modal-title').textContent = 'Nova Transação';
  document.getElementById('date').valueAsDate = new Date();
  updateCategoryOptions(); // Resetar categorias
  modal.classList.add('active');
});

// Fechar modal
closeBtn.addEventListener('click', () => modal.classList.remove('active'));
cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

// Filtrar transações
filterType.addEventListener('change', displayTransactions);

// Submeter formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Pegar a data e adicionar horário local (meio-dia) para evitar problema de timezone
  const dateValue = document.getElementById('date').value;
  const dateWithTime = dateValue ? new Date(`${dateValue}T12:00:00`).toISOString() : new Date().toISOString();

  const data = {
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    amount: parseFloat(document.getElementById('amount').value),
    description: document.getElementById('description').value,
    date: dateWithTime
  };

  console.log('Enviando dados:', data);

  try {
    let response;
    if (editingId) {
      response = await api.updateTransaction(editingId, data);
    } else {
      response = await api.createTransaction(data);
    }

    console.log('Resposta:', response);

    modal.classList.remove('active');
    loadTransactions();
  } catch (error) {
    console.error('Erro completo:', error);
    alert('Erro ao salvar transação: ' + (error.response?.data?.mensagem || error.message));
  }
});

// Carregar transações
async function loadTransactions() {
  try {
    const response = await api.getTransactions();
    if (response.data.sucesso) {
      transactions = response.data.transacoes;
      displayTransactions();
      updateBalance();
    }
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
  }
}

// Exibir transações
function displayTransactions() {
  const container = document.getElementById('transactions-table');
  const filter = filterType.value;

  let filtered = transactions;
  if (filter !== 'all') {
    filtered = transactions.filter(t => t.type === filter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><span class="icon icon-empty"></span></div>
        <p>Nenhuma transação encontrada</p>
      </div>
    `;
    return;
  }

  const html = `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th>Tipo</th>
          <th>Valor</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(t => `
          <tr>
            <td>${normalizeToDate(t.date).toLocaleDateString('pt-BR')}</td>
            <td>${t.description || 'Sem descrição'}</td>
            <td>${t.category || '-'}</td>
            <td><span class="type-badge ${t.type}">${t.type}</span></td>
            <td class="amount ${t.type === 'entrada' ? 'positive' : 'negative'}">
              ${t.type === 'entrada' ? '+' : '-'} R$ ${t.amount.toFixed(2).replace('.', ',')}
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-small btn-secondary" onclick="editTransaction('${t.id}')">Editar</button>
                <button class="btn btn-small btn-danger" onclick="deleteTransaction('${t.id}')">Excluir</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// Editar transação
async function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;

  editingId = id;
  document.getElementById('modal-title').textContent = 'Editar Transação';
  document.getElementById('type').value = transaction.type;
  updateCategoryOptions(); // Atualizar categorias antes de selecionar
  document.getElementById('category').value = transaction.category;
  document.getElementById('amount').value = transaction.amount;
  document.getElementById('description').value = transaction.description;
  document.getElementById('date').value = formatDateForInput(transaction.date);

  modal.classList.add('active');
}

// Deletar transação
async function deleteTransaction(id) {
  if (!confirm('Deseja realmente excluir esta transação?')) return;

  try {
    await api.deleteTransaction(id);
    loadTransactions();
  } catch (error) {
    alert('Erro ao excluir transação');
  }
}

// Atualizar saldo
async function updateBalance() {
  try {
    const response = await api.getBalance();
    if (response.data.sucesso) {
      const balance = response.data.saldo;
      const balanceEl = document.getElementById('total-balance');
      balanceEl.textContent = `R$ ${balance.toFixed(2).replace('.', ',')}`;
      balanceEl.className = balance >= 0 ? 'stat-value positive' : 'stat-value negative';
    }
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error);
  }
}

// Carregar ao iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadTransactions();
});
