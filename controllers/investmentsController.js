const investmentsModel = require('../models/investmentsModel');

async function list(req, res){
  try{
    const userId = req.user.id;
    const rows = await investmentsModel.listInvestments(userId);
    return res.json(rows);
  }catch(err){ console.error(err); return res.status(500).json({ message: 'Erro interno' }); }
}

async function create(req, res){
  try{
    const userId = req.user.id;
    const { name, type, amount, date } = req.body;
    if (!name || amount === undefined) return res.status(400).json({ message: 'Campos obrigatórios: name, amount' });
    const item = await investmentsModel.createInvestment(userId, { name, type, amount, date });
    return res.status(201).json(item);
  }catch(err){ console.error(err); return res.status(500).json({ message: 'Erro interno' }); }
}

async function update(req, res){
  try{
    const userId = req.user.id;
    const id = req.params.id;
    const patch = req.body;
    const updated = await investmentsModel.updateInvestment(userId, id, patch);
    if (!updated) return res.status(404).json({ message: 'Investimento não encontrado' });
    return res.json(updated);
  }catch(err){ console.error(err); return res.status(500).json({ message: 'Erro interno' }); }
}

async function remove(req, res){
  try{
    const userId = req.user.id;
    const id = req.params.id;
    const ok = await investmentsModel.removeInvestment(userId, id);
    if (!ok) return res.status(404).json({ message: 'Investimento não encontrado' });
    return res.json({ ok: true });
  }catch(err){ console.error(err); return res.status(500).json({ message: 'Erro interno' }); }
}

module.exports = { list, create, update, remove };