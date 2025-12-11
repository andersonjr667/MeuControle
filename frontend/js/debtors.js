let debtors = [];
let editingId = null;

// Helper: normaliza strings de data para um objeto Date robusto
function normalizeToDateDebtors(dateStr) {
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

const addBtn = document.getElementById('add-debtor-btn');

// Quick entry card elements (creation-only)
const quickCard = document.getElementById('quick-debtor-card');
const quickName = document.getElementById('quick-name');
const quickDesc = document.getElementById('quick-desc');
const quickContinue = document.getElementById('quick-continue');
const quickCancel = document.getElementById('quick-cancel');
const quickError = document.getElementById('quick-error');

addBtn.addEventListener('click', () => {
  editingId = null;
  // reset quick card fields
  quickError.style.display = 'none';
  quickName.value = '';
  quickDesc.value = '';
  quickCard.style.display = 'block';
  quickName.focus();
});

// Quick card actions
quickContinue.addEventListener('click', async () => {
  const nameVal = (quickName.value || '').trim();
  if (!nameVal) {
    quickError.style.display = 'block';
    quickName.focus();
    return;
  }

  // Criar apenas o registro do devedor (pessoa). Valor inicial = 0.
  const data = {
    name: nameVal,
    description: quickDesc.value || '',
    amount: 0
  };

  try {
    if (editingId) {
      // se estiver editando, atualiza apenas nome/descrição
      await api.updateDebtor(editingId, { name: data.name, description: data.description });
    } else {
      await api.createDebtor(data);
    }
    quickCard.style.display = 'none';
    editingId = null;
    loadDebtors();
  } catch (error) {
    console.error('Erro ao salvar devedor:', error);
    quickError.textContent = 'Erro ao salvar devedor';
    quickError.style.display = 'block';
  }
});

quickCancel.addEventListener('click', () => {
  quickCard.style.display = 'none';
  editingId = null;
});

async function loadDebtors() {
  try {
    const response = await api.getDebtors();
    if (response.data.sucesso) {
      // armazenar devedores e calcular status dinâmico (label + classe CSS)
      debtors = response.data.devedores.map(d => {
        const label = computeDebtorStatus(d); // ex: 'em dia', 'pendente', 'atrasado'
        const cls = String(label).toLowerCase().replace(/\s+/g, '-'); // ex: 'em-dia'
        return { ...d, computedStatusLabel: label, computedStatusClass: cls };
      });
      displayDebtors();
      updateTotal();
    }
  } catch (error) {
    console.error('Erro ao carregar devedores:', error);
  }
}

function computeDebtorStatus(d) {
  // Se o valor é zero, considera 'em dia'
  const amount = Number(d.amount) || 0;
  if (amount === 0) return 'em dia';

  // se houver data de vencimento e já passou -> 'atrasado'
  if (d.dueDate) {
    try {
      const due = normalizeToDateDebtors(d.dueDate);
      // comparar somente a parte da data (sem hora)
      const dueYMD = due.toISOString().split('T')[0];
      const todayYMD = new Date().toISOString().split('T')[0];
      if (dueYMD < todayYMD) return 'atrasado';
    } catch (e) {
      // se parsing falhar, ignorar
    }
  }

  return 'pendente';
}

function displayDebtors() {
  const container = document.getElementById('debtors-table');

  if (!debtors || debtors.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><span class="icon icon-people"></span></div><p>Nenhum devedor cadastrado</p></div>';
    return;
  }

  const rows = debtors.map(d => `
    <tr>
      <td>${d.name}</td>
      <td class="amount negative">R$ ${d.amount.toFixed(2).replace('.', ',')}</td>
      <td>${d.description || '-'}</td>
      <td>${d.dueDate ? normalizeToDateDebtors(d.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
      <td><span class="status-badge ${d.computedStatusClass}">${d.computedStatusLabel}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-small btn-secondary" onclick="showBalanceForm('${d.id}')">Saldo</button>
          <button class="btn btn-small btn-danger" onclick="deleteDebtor('${d.id}')">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');

  const html = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Valor</th>
          <th>Descrição</th>
          <th>Vencimento</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

async function editDebtor(id) {
  const debtor = debtors.find(d => d.id === id);
  if (!debtor) return;

  editingId = id;
  // Preencher quick-card para edição
  quickError.style.display = 'none';
  quickName.value = debtor.name;
  quickDesc.value = debtor.description || '';
  quickCard.style.display = 'block';
  quickName.focus();
}

async function deleteDebtor(id) {
  if (!confirm('Deseja realmente excluir este devedor?')) return;

  try {
    await api.deleteDebtor(id);
    loadDebtors();
  } catch (error) {
    alert('Erro ao excluir devedor');
  }
}

function updateTotal() {
  const total = debtors.filter(d => (d.computedStatusLabel || computeDebtorStatus(d)) !== 'em dia').reduce((sum, d) => sum + d.amount, 0);
  document.getElementById('total-debt').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

document.addEventListener('DOMContentLoaded', loadDebtors);

// Remove any existing balance form
function removeBalanceForm() {
  const existing = document.getElementById('balance-form-row');
  if (existing) existing.remove();
}

// Mostrar formulário inline para registrar pagamento/emprestimo
window.showBalanceForm = function(debtorId) {
  removeBalanceForm();
  const debtor = debtors.find(d => d.id === debtorId);
  if (!debtor) return;

  // localizar tabela e inserir uma linha abaixo do primeiro header (ou abaixo do item)
  const table = document.querySelector('#debtors-table table');
  if (!table) return;

  // criar linha de formulário
  const tr = document.createElement('tr');
  tr.id = 'balance-form-row';
  tr.innerHTML = `
    <td colspan="6">
      <div class="balance-form" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <select id="balance-action" style="padding:8px; border-radius:6px; border:1px solid #e5e7eb;">
          <option value="pagou">Pagou (reduz dívida)</option>
          <option value="emprestou">Emprestou (aumenta dívida)</option>
        </select>
        <input id="balance-amount" type="number" step="0.01" min="0" placeholder="Valor (R$)" style="padding:8px; border-radius:6px; border:1px solid #e5e7eb; width:160px;">
        <input id="balance-date" type="date" style="padding:8px; border-radius:6px; border:1px solid #e5e7eb;">
        <input id="balance-desc" type="text" placeholder="Descrição (opcional)" style="flex:1; padding:8px; border-radius:6px; border:1px solid #e5e7eb;">
        <button id="balance-save" class="btn btn-primary">Salvar</button>
        <button id="balance-cancel" class="btn btn-secondary">Cancelar</button>
        <div id="balance-error" style="color:#b91c1c; font-size:13px; display:none; margin-left:8px;">Valor obrigatório</div>
      </div>
    </td>
  `;

  // inserir logo após a linha do devedor (encontrar a linha com o botão)
  const rowButton = Array.from(table.querySelectorAll('button')).find(b => b.getAttribute('onclick')?.includes(debtorId));
  if (rowButton) {
    const row = rowButton.closest('tr');
    row.parentNode.insertBefore(tr, row.nextSibling);
  } else {
    // se não encontrou, acrescenta no final
    table.querySelector('tbody').appendChild(tr);
  }

  // preenche data com hoje
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('balance-date');
  dateInput.value = today;

  document.getElementById('balance-cancel').addEventListener('click', () => removeBalanceForm());

  document.getElementById('balance-save').addEventListener('click', async () => {
    const action = document.getElementById('balance-action').value;
    const amount = parseFloat(document.getElementById('balance-amount').value);
    const date = document.getElementById('balance-date').value;
    const desc = document.getElementById('balance-desc').value;
    const errorEl = document.getElementById('balance-error');

    if (isNaN(amount) || amount <= 0) {
      errorEl.style.display = 'block';
      return;
    }

    // calcular novo montante da dívida
    // Para permitir registrar que o usuário agora deve à pessoa,
    // não truncamos para zero quando a ação for 'pagou' — permitimos saldo negativo.
    let newAmount = debtor.amount;
    if (action === 'pagou') {
      // Subtrai o valor (pode resultar em saldo negativo)
      newAmount = newAmount - amount;
    } else {
      // emprestou -> aumenta dívida
      newAmount = newAmount + amount;
    }

    try {
      // atualizar devedor
      await api.updateDebtor(debtorId, { amount: newAmount, updatedAt: new Date().toISOString() });

      // criar transação para histórico e balance
      const tx = {
        type: action === 'pagou' ? 'entrada' : 'saida',
        category: `${action === 'pagou' ? 'Recebimento' : 'Empréstimo'} - Devedor: ${debtor.name}`,
        amount: amount,
        description: desc || (action === 'pagou' ? 'Pagamento recebido' : 'Novo empréstimo'),
        date: date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString()
      };
      await api.createTransaction(tx);

      removeBalanceForm();
      loadDebtors();
    } catch (error) {
      console.error('Erro ao atualizar saldo do devedor:', error);
      errorEl.textContent = 'Erro ao salvar';
      errorEl.style.display = 'block';
    }
  });
}
