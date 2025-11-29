const db = require('../config/db');

async function createUser(name, email, passwordHash) {
  const inserted = await db.insert('users', { name, email, password_hash: passwordHash });
  return inserted.id;
}

async function findUserByEmail(email) {
  const rows = await db.query('users', u => u.email === email);
  return rows[0];
}

async function findUserById(id) {
  return db.findById('users', id);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
