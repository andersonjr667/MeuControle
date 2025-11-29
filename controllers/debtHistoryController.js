const debtHistoryModel = require('../models/debtHistoryModel');
const debtorModel = require('../models/debtorModel');

async function createMovement(req, res){
  try{
    const userId = req.user.id;
    const debtorId = req.params.debtorId || req.body.debtor_id;
    const debtor = await debtorModel.findDebtorById(debtorId, userId);
    if (!debtor) return res.status(404).json({ message: 'Devedor não encontrado' });

    const { date, month, description, category_id, amount, payment_method_id, type, movement } = req.body;
    if (!date || movement === undefined) return res.status(400).json({ message: 'Campos obrigatórios: date, movement' });

    // compute accumulated_balance simply by summing previous movements + this
    const prev = await debtHistoryModel.listByDebtor(userId, debtorId);
    const prevBal = prev.reduce((acc, p) => acc + Number(p.movement || 0), 0);
    const accumulated = prevBal + Number(movement);

    const id = await debtHistoryModel.createMovement(userId, debtorId, {
      date, month: month || null, description, category_id, amount: amount || 0, payment_method_id: payment_method_id || null,
      type: type || 'lent', movement: Number(movement), accumulated_balance: accumulated, notes: req.body.notes || null
    });

    const rows = await debtHistoryModel.listByDebtor(userId, debtorId);
    return res.status(201).json({ id, accumulated, history: rows });
  }catch(err){
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function listAll(req, res){
  try{
    const userId = req.user.id;
    const rows = await debtHistoryModel.listAll(userId);
    return res.json(rows);
  }catch(err){
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

module.exports = { createMovement, listAll };
