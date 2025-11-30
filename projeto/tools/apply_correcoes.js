const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.resolve(__dirname, '..', '..', 'alsj1520.json');
const outDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function writeCsv(transacoes, outCsvPath) {
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
}

try {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const obj = JSON.parse(raw);
  const transacoes = obj.transacoes || [];

  // Find two oldest "Gasto (Compra" transactions
  // The file is newest-first; oldest are at the end.
  const indices = [];
  for (let i = transacoes.length - 1; i >= 0; i--) {
    const t = transacoes[i];
    if (t.categoria && t.categoria.includes('Gasto (Compra')) {
      indices.push(i);
      if (indices.length >= 2) break;
    }
  }

  if (indices.length < 2) {
    console.error('Não encontrei duas transações de compra antigas para ajustar. Achei:', indices.length);
    process.exit(1);
  }

  // Plan: apply R$100 to the oldest purchase, and R$14.52 to the next oldest
  const adjustments = [
    { idx: indices[0], amount: 100.00 },
    { idx: indices[1], amount: 14.52 }
  ];

  const changes = [];
  let totalDelta = 0;

  for (const adj of adjustments) {
    const t = transacoes[adj.idx];
    const oldValor = Number(t.valor);
    const newValor = Number((oldValor - adj.amount).toFixed(2)); // more negative
    const delta = Number((newValor - oldValor).toFixed(2));

    // Update transaction
    t.valor = newValor;
    t.descricao = (t.descricao || '') + ` (ajuste R$${adj.amount.toFixed(2)})`;
    // Update saldo of this transaction and all more recent ones (indices 0..idx)
    for (let j = 0; j <= adj.idx; j++) {
      transacoes[j].saldo_apos_transacao = Number((Number(transacoes[j].saldo_apos_transacao) + delta).toFixed(2));
    }

    changes.push({ index: adj.idx, data_lancamento: t.data_lancamento, oldValor, newValor, delta });
    totalDelta = Number((totalDelta + delta).toFixed(2));
  }

  // Update informacoes_gerais.saldo_final if present
  if (!obj.informacoes_gerais) obj.informacoes_gerais = {};
  const oldSaldoFinal = Number(obj.informacoes_gerais.saldo_final || 0);
  const newSaldoFinal = Number((oldSaldoFinal + totalDelta).toFixed(2));
  obj.informacoes_gerais.saldo_final = newSaldoFinal;

  // Save fixed JSON
  const outJsonPath = path.join(outDir, 'alsj1520_fixed.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(obj, null, 2), 'utf8');

  // Save fixed CSV
  const outCsvPath = path.join(outDir, 'alsj1520_fixed.csv');
  writeCsv(transacoes, outCsvPath);

  console.log('Correções aplicadas com sucesso.');
  console.log('Transações alteradas:');
  for (const c of changes) {
    console.log(`- idx=${c.index} date=${c.data_lancamento} old=${c.oldValor} new=${c.newValor} delta=${c.delta}`);
  }
  console.log('Delta total aplicado aos saldos (soma dos deltas):', totalDelta);
  console.log('Saldo final antigo:', oldSaldoFinal, 'novo:', newSaldoFinal);
  console.log('Arquivos gerados:');
  console.log('JSON:', outJsonPath);
  console.log('CSV :', outCsvPath);

} catch (err) {
  console.error('Erro ao aplicar correções:', err.message);
  process.exit(1);
}
