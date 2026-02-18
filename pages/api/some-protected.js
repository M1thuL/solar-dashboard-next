// pages/api/some-protected.js
import { getServerSession } from 'next-auth/next';
import authOptions from './auth/[...nextauth]'; // path may vary

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  // session.user available
  res.json({ ok: true, user: session.user });
}
