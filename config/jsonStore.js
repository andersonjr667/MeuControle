const fs = require('fs').promises;
const path = require('path');

const STORE_FILE = path.join(__dirname, '..', '..', 'database', 'store.json');

const INITIAL = {
  users: [],
  income_categories: [],
  expense_categories: [],
  payment_methods: [],
  investments: [],
  transactions: [],
  debtors: [],
  debt_history: []
};

async function load() {
  try {
    const txt = await fs.readFile(STORE_FILE, 'utf8');
    const db = JSON.parse(txt);
    // Ensure any collections added to INITIAL after the DB file was created
    // are present to avoid "Coleção inexistente" errors on insert/update.
    for (const k of Object.keys(INITIAL)) {
      if (!(k in db)) db[k] = JSON.parse(JSON.stringify(INITIAL[k]));
    }
    return db;
  } catch (err) {
    if (err.code === 'ENOENT') {
      await save(INITIAL);
      return JSON.parse(JSON.stringify(INITIAL));
    }
    throw err;
  }
}

async function save(data) {
  // Write directly to the store file. The previous implementation used a
  // temporary file + rename which on some Windows environments (locked files
  // or antivirus) could fail with ENOENT during rename. Writing directly is
  // simpler and sufficient for this small local JSON store.
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(arr) {
  if (!arr || arr.length === 0) return 1;
  return Math.max(...arr.map(x => x.id || 0)) + 1;
}

async function insert(collection, item) {
  const db = await load();
  const col = db[collection];
  if (!col) throw new Error('Coleção inexistente: ' + collection);
  const id = nextId(col);
  const now = new Date().toISOString();
  const toInsert = { id, ...item, created_at: now, updated_at: now };
  col.push(toInsert);
  await save(db);
  return toInsert;
}

async function list(collection, filterFn) {
  const db = await load();
  const col = db[collection] || [];
  if (filterFn) return col.filter(filterFn);
  return col.slice();
}

async function findById(collection, id) {
  const db = await load();
  const col = db[collection] || [];
  return col.find(x => String(x.id) === String(id));
}

async function update(collection, id, patch) {
  const db = await load();
  const col = db[collection] || [];
  const idx = col.findIndex(x => String(x.id) === String(id));
  if (idx === -1) return null;
  col[idx] = { ...col[idx], ...patch, updated_at: new Date().toISOString() };
  await save(db);
  return col[idx];
}

async function remove(collection, id) {
  const db = await load();
  const col = db[collection] || [];
  const idx = col.findIndex(x => String(x.id) === String(id));
  if (idx === -1) return false;
  col.splice(idx, 1);
  await save(db);
  return true;
}

async function query(collection, predicate) {
  const db = await load();
  const col = db[collection] || [];
  return col.filter(predicate);
}

module.exports = { load, save, insert, list, findById, update, remove, query };
