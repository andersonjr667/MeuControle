const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.resolve(__dirname, '..', '..', 'alsj1520.json');
const outDir = path.resolve(__dirname, '..', 'data');

try {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const obj = JSON.parse(raw);
  const transacoes = obj.transacoes || [];

  // Write JSON with only transacoes
  const outJsonPath = path.join(outDir, 'alsj1520_transacoes.json');
  fs.writeFileSync(outJsonPath, JSON.stringify({ transacoes }, null, 2), 'utf8');

  // Write CSV
  const outCsvPath = path.join(outDir, 'alsj1520_transacoes.csv');
  const headers = ['data_lancamento','historico','descricao','valor','saldo_apos_transacao','categoria'];
  const escape = (s) => {
    if (s === null || s === undefined) return '';
    const str = String(s);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  const rows = [headers.join(',')];
  for (const t of transacoes) {
    const row = [
      escape(t.data_lancamento),
      escape(t.historico),
      escape(t.descricao),
      escape(t.valor),
      escape(t.saldo_apos_transacao),
      escape(t.categoria)
    ].join(',');
    rows.push(row);
  }
  fs.writeFileSync(outCsvPath, rows.join('\n'), 'utf8');

  console.log('Export completo. Registros:', transacoes.length);
  console.log('JSON:', outJsonPath);
  console.log('CSV :', outCsvPath);
} catch (err) {
  console.error('Erro ao exportar:', err.message);
  process.exit(1);
}
