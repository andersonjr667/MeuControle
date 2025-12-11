// Script to fix swapped month/day for transactions likely intended for December
// Criteria: if date has day === 12 and month !== 12, swap day<->month so month becomes December and day becomes original month.
// Uses jsonStore to respect encryption and atomic write.

const jsonStore = require('../config/jsonStore');

function fixDates() {
  const data = jsonStore.read();
  if (!data.transactions || !Array.isArray(data.transactions)) {
    console.log('Nenhuma transação encontrada.');
    return;
  }

  let changed = 0;
  const fixed = data.transactions.map(tx => {
    if (!tx.date) return tx;
    const dt = new Date(tx.date);
    if (isNaN(dt)) return tx;

    const day = dt.getUTCDate();
    const month = dt.getUTCMonth() + 1; // 1-12
    const year = dt.getUTCFullYear();

    // Heurística: se o dia é 12 e o mês não é 12, assumimos que houve inversão (ex.: 12/08 deveria ser 08/12)
    if (day === 12 && month !== 12) {
      const newDay = month; // dia correto vira o mês original
      const newMonth = 12; // queremos dezembro
      const newDate = new Date(Date.UTC(year, newMonth - 1, newDay));
      const iso = newDate.toISOString();
      if (iso !== tx.date) {
        changed += 1;
        return { ...tx, date: iso, updatedAt: new Date().toISOString() };
      }
    }

    return tx;
  });

  if (changed > 0) {
    data.transactions = fixed;
    jsonStore.write(data);
    console.log(`Corrigidas ${changed} transações com inversão de mês/dia (agora todas em dezembro).`);
  } else {
    console.log('Nenhuma transação necessitava correção.');
  }
}

fixDates();
