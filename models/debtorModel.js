const db = require('../config/db');

async function createDebtor(userId, name) {
  const inserted = await db.insert('debtors', { user_id: userId, name });
  return inserted.id;
}

async function listDebtors(userId) {
  return db.list('debtors', d => String(d.user_id) === String(userId));
}

async function findDebtorById(id, userId) {
  const d = await db.findById('debtors', id);
  if (!d || String(d.user_id) !== String(userId)) return null;
  return d;
}

async function deleteDebtor(id, userId) {
  const d = await db.findById('debtors', id);
  if (!d || String(d.user_id) !== String(userId)) return 0;
  // remove associated debt_history entries first
  try{
    const debts = await db.list('debt_history', h => String(h.user_id) === String(userId) && String(h.debtor_id) === String(id));
    for (const h of debts){
      try{ await db.remove('debt_history', h.id); }catch(e){ /* continue on error */ }
    }
  }catch(e){ /* ignore listing errors */ }

  const ok = await db.remove('debtors', id);
  return ok ? 1 : 0;
}

module.exports = { createDebtor, listDebtors, findDebtorById, deleteDebtor };
