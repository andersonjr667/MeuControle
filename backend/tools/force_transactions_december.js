// Force transactions to December (keep day, set month=12) for all transactions not already in December.
// Works on JSON store via jsonStore (respects encryption if enabled).

const jsonStore = require('../config/jsonStore');

function forceDecember() {
  const data = jsonStore.read();
  if (!Array.isArray(data.transactions)) {
    console.log('Nenhuma transação encontrada.');
    return;
  }

  let changed = 0;
  const updated = data.transactions.map(tx => {
    if (!tx.date) return tx;
    const d = new Date(tx.date);
    if (isNaN(d)) return tx;

    const day = d.getUTCDate();
    const month = d.getUTCMonth(); // 0-11
    const year = d.getUTCFullYear();

    if (month !== 11) {
      const newDate = new Date(Date.UTC(year, 11, day)); // set to December, same day
      const iso = newDate.toISOString();
      if (iso !== tx.date) {
        changed += 1;
        return { ...tx, date: iso, updatedAt: new Date().toISOString() };
      }
    }
    return tx;
  });

  if (changed > 0) {
    data.transactions = updated;
    jsonStore.write(data);
    console.log(`Transações ajustadas para dezembro: ${changed}`);
  } else {
    console.log('Nenhuma transação precisou de ajuste para dezembro.');
  }
}

forceDecember();
