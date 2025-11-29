const db = require('../config/db');

async function createTransaction(userId, data) {
  const item = { user_id: userId, ...data };
  const inserted = await db.insert('transactions', item);
  return inserted;
}

async function listTransactions(userId, filters = {}) {
  const rows = await db.list('transactions', t => String(t.user_id) === String(userId));
  let res = rows;
  if (filters.type) res = res.filter(r => r.type === filters.type);
  if (filters.category_id) res = res.filter(r => String(r.category_id) === String(filters.category_id));
  if (filters.start_date) res = res.filter(r => r.date >= filters.start_date);
  if (filters.end_date) res = res.filter(r => r.date <= filters.end_date);
  // order desc by date then created_at
  res.sort((a,b) => (b.date||'') .localeCompare(a.date||'') || (b.created_at||'').localeCompare(a.created_at||''));
  return res;
}

async function getTotals(userId) {
  const rows = await db.list('transactions', t => String(t.user_id) === String(userId));
  const income = rows.filter(r => r.type === 'income').reduce((s,r)=>s+Number(r.amount||0),0);
  // expenses may be stored as negative amounts; normalize to absolute sum
  const expense = rows.filter(r => r.type === 'expense').reduce((s,r)=>s+Math.abs(Number(r.amount||0)),0);
  return { total_income: income, total_expense: expense, balance: income - expense };
}

async function updateTransaction(id, userId, patch) {
  const tx = await db.findById('transactions', id);
  if (!tx || String(tx.user_id) !== String(userId)) return null;
  const updated = await db.update('transactions', id, patch);
  return updated;
}

async function deleteTransaction(id, userId) {
  const tx = await db.findById('transactions', id);
  if (!tx || String(tx.user_id) !== String(userId)) return false;
  return db.remove('transactions', id);
}

async function getCategoryDistribution(userId, type='expense') {
  const rows = await db.list('transactions', t => String(t.user_id) === String(userId) && t.type === type);
  const map = {};
  rows.forEach(r => {
    const k = r.category_id || 'null';
    const amt = type === 'expense' ? Math.abs(Number(r.amount||0)) : Number(r.amount||0);
    map[k] = (map[k]||0) + amt;
  });
  return Object.keys(map).map(k => ({ category_id: k === 'null' ? null : k, total: map[k] }));
}

async function getMonthlyBalance(userId) {
  const rows = await db.list('transactions', t => String(t.user_id) === String(userId));
  const map = {};
  rows.forEach(r => {
    const m = (r.month && r.month) || (r.date ? r.date.slice(0,7) : 'unknown');
    map[m] = map[m] || { total_income:0, total_expense:0 };
    if (r.type === 'income') map[m].total_income += Number(r.amount||0);
    else if (r.type === 'expense') map[m].total_expense += Math.abs(Number(r.amount||0));
  });
  const months = Object.keys(map).sort();
  return months.map(m => ({ month: m, total_income: map[m].total_income, total_expense: map[m].total_expense, balance: map[m].total_income - map[m].total_expense }));
}

module.exports = { createTransaction, listTransactions, getTotals, updateTransaction, deleteTransaction, getCategoryDistribution, getMonthlyBalance };
