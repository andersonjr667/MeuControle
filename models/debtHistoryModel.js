const db = require('../config/db');

async function createMovement(userId, debtorId, data) {
  const item = { user_id: userId, debtor_id: debtorId, ...data };
  const inserted = await db.insert('debt_history', item);
  return inserted.id;
}

async function listByDebtor(userId, debtorId) {
  return db.list('debt_history', d => String(d.user_id) === String(userId) && String(d.debtor_id) === String(debtorId));
}

async function listAll(userId) {
  return db.list('debt_history', d => String(d.user_id) === String(userId));
}

module.exports = { createMovement, listByDebtor, listAll };
