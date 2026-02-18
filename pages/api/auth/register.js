// pages/api/auth/register.js
import { createUser, findUserByEmail } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // check existing
  const existing = findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'User already exists' });

  try {
    const user = await createUser({ email, password, name });
    return res.status(201).json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creating user' });
  }
}
