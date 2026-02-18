// lib/db.js
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const DB_PATH = path.join(process.cwd(), 'auth.db');
const db = new Database(DB_PATH);

// Create users table if not exists
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT
);
`);

// Helper functions
export function findUserByEmail(email) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return row || null;
}

export function findUserById(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row || null;
}

export async function createUser({ email, password, name }) {
  // hash password
  const hashed = await bcrypt.hash(password, 10);
  const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
  const info = stmt.run(email, hashed, name || null);
  return findUserById(info.lastInsertRowid);
}

export async function verifyPassword(email, inputPassword) {
  const user = findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(inputPassword, user.password);
  return ok ? user : null;
}
