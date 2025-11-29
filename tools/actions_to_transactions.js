const fs = require('fs');
const path = require('path');

const STORE = path.resolve(__dirname, '..', '..', 'database', 'store.json');

function read() { return JSON.parse(fs.readFileSync(STORE, 'utf8')); }
function write(obj){ fs.writeFileSync(STORE, JSON.stringify(obj, null, 2) + '\n', 'utf8'); }

function normalizeName(s){ return (s||'').toString().trim().toLowerCase(); }

console.log('Converter user_actions -> transactions: iniciando...');
if (!fs.existsSync(STORE)) { console.error('store.json não encontrado em', STORE); process.exit(1); }
const db = read();

// backup
const bak = STORE + '.bak.' + new Date().toISOString().replace(/[:.]/g,'-');
fs.copyFileSync(STORE, bak);
console.log('Backup criado em', bak);

db.transactions = Array.isArray(db.transactions) ? db.transactions : [];
const startId = (db.transactions.length === 0) ? 1 : (Math.max(...db.transactions.map(t=>t.id||0)) + 1);
let nextId = startId;
const existingSignatures = new Set(db.transactions.map(t => `${t.date}::${t.amount}::${normalizeName(t.description||'')}`));

// build maps
const categories = [...(db.income_categories||[]), ...(db.expense_categories||[])];
const catMap = {};
categories.forEach(c=> catMap[normalizeName(c.name)] = c.id);
const payMap = {};
(db.payment_methods||[]).forEach(p => payMap[normalizeName(p.name)] = p.id);

const userId = (db.users && db.users[0] && db.users[0].id) ? db.users[0].id : 1;

let added = 0, skipped = 0;
for (const a of (db.user_actions||[])){
  if (!a || a.action !== 'create_transaction') continue;
  const date = (a.timestamp && a.timestamp.slice(0,10)) || null;
  const amount = Number(a.amount_cents || 0);
  const desc = a.details && a.details.description ? a.details.description : '';
  const sig = `${date}::${amount}::${normalizeName(desc)}`;
  if (existingSignatures.has(sig)) { skipped++; continue; }
  const tx = {
    id: nextId++,
    user_id: userId,
    type: (Number(a.amount_cents||0) >= 0) ? 'income' : 'expense',
    date: date,
    month: date ? date.slice(0,7) : null,
    description: desc || null,
    amount: amount,
    category_id: catMap[normalizeName(a.category)] || null,
    payment_method_id: payMap[normalizeName(a.payment_method)] || null,
    created_at: a.timestamp || new Date().toISOString(),
    updated_at: a.timestamp || new Date().toISOString()
  };
  db.transactions.push(tx);
  existingSignatures.add(sig);
  added++;
}

write(db);
console.log(`Conversão finalizada. Adicionadas: ${added}, Puladas (duplicadas): ${skipped}`);
console.log('store.json atualizado em', STORE);
