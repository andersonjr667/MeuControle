const fs = require('fs');
const path = require('path');

const STORE = path.resolve(__dirname, '..', '..', 'database', 'store.json');
if (!fs.existsSync(STORE)) { console.error('store.json não encontrado:', STORE); process.exit(1); }

const cutoff = new Date('2025-01-18T00:00:00.000Z');
function parseDateIso(s){ if(!s) return null; const d = new Date(s); return isNaN(d.getTime())? null : d; }

const db = JSON.parse(fs.readFileSync(STORE, 'utf8'));
const bak = STORE + '.bak.purge.' + new Date().toISOString().replace(/[:.]/g,'-');
fs.copyFileSync(STORE, bak);
console.log('Backup criado em', bak);

let removedUserActions = 0;
if (Array.isArray(db.user_actions)){
  const before = db.user_actions.length;
  db.user_actions = db.user_actions.filter(a => {
    const d = parseDateIso(a.timestamp);
    if (!d) return true; // keep if no timestamp
    if (d < cutoff) { removedUserActions++; return false; }
    return true;
  });
  console.log('user_actions: antes', before, 'depois', db.user_actions.length, 'removidos', removedUserActions);
} else {
  console.log('user_actions não existe ou não é array');
}

let removedTx = 0;
if (Array.isArray(db.transactions)){
  const before = db.transactions.length;
  db.transactions = db.transactions.filter(t => {
    let d = null;
    if (t.date) d = parseDateIso(t.date);
    if (!d && t.created_at) d = parseDateIso(t.created_at);
    if (!d) return true; // keep if no date
    if (d < cutoff) { removedTx++; return false; }
    return true;
  });
  console.log('transactions: antes', before, 'depois', db.transactions.length, 'removidos', removedTx);
} else {
  console.log('transactions não existe ou não é array');
}

fs.writeFileSync(STORE, JSON.stringify(db, null, 2) + '\n', 'utf8');
console.log('Gravado store.json atualizado.');
console.log('Resumo: user_actions removidos =', removedUserActions, ', transactions removidos =', removedTx);
