const transactionsModel = require('../models/transactionsModel');

async function createTransaction(req, res) {
  try {
    const userId = req.user.id;
    const { type, date, month, description, category_id, amount, payment_method_id, notes } = req.body;
    if (!type || !date || !amount) return res.status(400).json({ message: 'Campos obrigatórios faltando' });
    const item = { type, date, month: month || null, description: description || null, category_id: category_id || null, amount, payment_method_id: payment_method_id || null, notes: notes || null };
    const inserted = await transactionsModel.createTransaction(userId, item);
    return res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function listTransactions(req, res) {
  try {
    const userId = req.user.id;
    const { start_date, end_date, category_id, type } = req.query;
    const rows = await transactionsModel.listTransactions(userId, { start_date, end_date, category_id, type });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function getTotals(req, res) {
  try {
    const userId = req.user.id;
    const totals = await transactionsModel.getTotals(userId);
    return res.json(totals);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function updateTransaction(req, res) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const { type, date, month, description, category_id, amount, payment_method_id, notes } = req.body;
    const patch = { type, date, month: month || null, description: description || null, category_id: category_id || null, amount, payment_method_id: payment_method_id || null, notes: notes || null };
    const updated = await transactionsModel.updateTransaction(id, userId, patch);
    if (!updated) return res.status(404).json({ message: 'Transação não encontrada' });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function deleteTransaction(req, res) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const ok = await transactionsModel.deleteTransaction(id, userId);
    if (!ok) return res.status(404).json({ message: 'Transação não encontrada' });
    return res.json({ message: 'Deletado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

// Distribuição por categoria (soma por category_id) - por padrão considera tipo 'expense', mas aceita ?type=income
async function getCategoryDistribution(req, res) {
  try {
    const userId = req.user.id;
    const type = req.query.type || 'expense';
    const rows = await transactionsModel.getCategoryDistribution(userId, type);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

// Saldo mensal ao longo do tempo (agrupa por ano-mês)
async function getMonthlyBalance(req, res) {
  try {
    const userId = req.user.id;
    const rows = await transactionsModel.getMonthlyBalance(userId);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

module.exports = {
  createTransaction,
  listTransactions,
  getTotals,
  // agregações
  getCategoryDistribution,
  getMonthlyBalance,
  updateTransaction,
  deleteTransaction
};
