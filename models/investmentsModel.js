const db = require('../config/jsonStore');

async function createInvestment(userId, data){
  const item = Object.assign({}, data, { user_id: userId });
  const inserted = await db.insert('investments', item);
  return inserted;
}

async function listInvestments(userId){
  return db.list('investments', i => String(i.user_id) === String(userId));
}

async function findById(userId, id){
  const r = await db.findById('investments', id);
  if (!r) return null;
  if (String(r.user_id) !== String(userId)) return null;
  return r;
}

async function updateInvestment(userId, id, patch){
  const existing = await findById(userId, id);
  if (!existing) return null;
  return db.update('investments', id, patch);
}

async function removeInvestment(userId, id){
  const existing = await findById(userId, id);
  if (!existing) return false;
  return db.remove('investments', id);
}

module.exports = { createInvestment, listInvestments, findById, updateInvestment, removeInvestment };