const debtorModel = require('../models/debtorModel');
const debtHistoryModel = require('../models/debtHistoryModel');

async function createDebtor(req, res) {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nome obrigatório' });
    const id = await debtorModel.createDebtor(userId, name);
    const debtor = await debtorModel.findDebtorById(id, userId);
    return res.status(201).json(debtor);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function listDebtors(req, res) {
  try {
    const userId = req.user.id;
    const rows = await debtorModel.listDebtors(userId);
    // attach current balance from debt history (simple calculation)
    const enhanced = await Promise.all(rows.map(async d => {
      const movements = await debtHistoryModel.listByDebtor(userId, d.id);
      const balance = movements.reduce((acc, m) => acc + Number(m.movement || 0), 0);
      return { ...d, balance };
    }));
    return res.json(enhanced);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function getDebtor(req, res) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const debtor = await debtorModel.findDebtorById(id, userId);
    if (!debtor) return res.status(404).json({ message: 'Devedor não encontrado' });
    const history = await debtHistoryModel.listByDebtor(userId, id);
    return res.json({ debtor, history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function deleteDebtor(req, res) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const affected = await debtorModel.deleteDebtor(id, userId);
    if (!affected) return res.status(404).json({ message: 'Devedor não encontrado' });
    return res.json({ message: 'Deletado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

module.exports = { createDebtor, listDebtors, getDebtor, deleteDebtor };
