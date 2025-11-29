const fs = require('fs');
const path = require('path');

// Paths: resolve store.json relative to this script and try several candidate locations for the source file
const STORE_FILE = path.resolve(__dirname, '..', '..', 'database', 'store.json');

const candidates = [
  path.resolve(__dirname, '..', '..', 'alsj1520.json'), // projeto/alsj1520.json
  path.resolve(__dirname, '..', '..', '..', 'alsj1520.json'), // workspace root alsj1520.json
  path.resolve(__dirname, '..', '..', '..', 'projeto', 'alsj1520.json'),
  path.resolve(__dirname, 'alsj1520.json')
];

let ALSJ_FILE = null;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    ALSJ_FILE = c;
    break;
  }
}

function readJson(file) {
  try {
    const s = fs.readFileSync(file, 'utf8');
    return JSON.parse(s);
  } catch (err) {
    console.error('Erro ao ler ou parsear', file, err.message);
    process.exit(1);
  }
}

function writeJson(file, obj) {
  try {
    fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.error('Erro ao gravar', file, err.message);
    process.exit(1);
  }
}

// Main
console.log('Importador de ações: iniciando...');

const storePath = STORE_FILE;
const alsjPath = ALSJ_FILE;

if (!fs.existsSync(alsjPath)) {
  console.error('Arquivo de origem não encontrado:', alsjPath);
  process.exit(1);
}
if (!fs.existsSync(storePath)) {
  console.error('Arquivo store.json não encontrado:', storePath);
  process.exit(1);
}

const store = readJson(storePath);
const actions = readJson(alsjPath);

if (!Array.isArray(actions)) {
  console.error('Arquivo de origem não contém um array JSON. Abortando.');
  process.exit(1);
}

store.user_actions = Array.isArray(store.user_actions) ? store.user_actions : [];

const existingIds = new Set(store.user_actions.map(a => a.id));
let imported = 0;
let skipped = 0;

for (const a of actions) {
  if (a == null || typeof a !== 'object') continue;
  if (typeof a.id === 'number') {
    if (existingIds.has(a.id)) {
      skipped++;
    } else {
      store.user_actions.push(a);
      existingIds.add(a.id);
      imported++;
    }
  } else {
    // If no numeric id, generate a new id
    let nextId = 1;
    while (existingIds.has(nextId)) nextId++;
    a.id = nextId;
    store.user_actions.push(a);
    existingIds.add(a.id);
    imported++;
  }
}

// Backup
const bakPath = storePath + '.bak.' + new Date().toISOString().replace(/[:.]/g, '-') ;
fs.copyFileSync(storePath, bakPath);
console.log('Backup criado em:', bakPath);

// Write
writeJson(storePath, store);

console.log(`Import concluído. Importados: ${imported}, Pulados (duplicados): ${skipped}`);
console.log('store.json atualizado em:', storePath);
