const db = require('../config/db');

async function list(req, res) {
  try {
    const userId = req.user.id;
    const type = req.params.type; // income_categories | expense_categories | payment_methods
    const rows = await db.list(type, r => String(r.user_id) === String(userId));
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function create(req, res) {
  try {
    const userId = req.user.id;
    const type = req.params.type;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nome obrigatório' });
    const inserted = await db.insert(type, { user_id: userId, name });
    return res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function update(req, res) {
  try {
    const userId = req.user.id;
    const type = req.params.type;
    const id = req.params.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nome obrigatório' });
    const record = await db.findById(type, id);
    if (!record || String(record.user_id) !== String(userId)) return res.status(404).json({ message: 'Não encontrado' });
    const updated = await db.update(type, id, { name });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function remove(req, res) {
  try {
    const userId = req.user.id;
    const type = req.params.type;
    const id = req.params.id;
    const record = await db.findById(type, id);
    if (!record || String(record.user_id) !== String(userId)) return res.status(404).json({ message: 'Não encontrado' });
    await db.remove(type, id);
    return res.json({ message: 'Deletado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function restoreDefaults(req, res){
  try{
    const userId = req.user.id;
    const defaults = {
      income_categories: ['Salário','Investimentos','Freelance','Presentes','Reembolso','Outros'],
      expense_categories: ['Alimentação','Moradia','Transporte','Saúde','Lazer','Educação','Vestuário','Internet','Serviços','Impostos','Assinaturas','Outros'],
      payment_methods: ['PIX','Dinheiro','Cartão de Crédito','Cartão de Débito','Transferência','Vale','Cheque']
    };

    const created = {};

    for (const type of Object.keys(defaults)){
      const existing = await db.list(type, r => String(r.user_id) === String(userId));
      const names = (existing || []).map(x => String(x.name || '').toLowerCase());
      created[type] = [];
      for (const name of defaults[type]){
        if (!names.includes(String(name).toLowerCase())){
          const ins = await db.insert(type, { user_id: userId, name });
          created[type].push(ins);
        }
      }
    }

    return res.json({ message: 'Padrões aplicados', created });
  }catch(err){
    console.error(err);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

module.exports = { list, create, update, remove, restoreDefaults };
