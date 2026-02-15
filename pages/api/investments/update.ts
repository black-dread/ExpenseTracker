import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountId, newBalance } = req.body;

    if (!accountId || newBalance === undefined) {
      return res.status(400).json({ error: 'Account ID and new balance are required' });
    }

    // Update the account balance directly (no transaction created)
    await sql`
      UPDATE accounts 
      SET balance = ${parseFloat(newBalance)},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(accountId)}
    `;

    // Get updated account info
    const result = await sql`
      SELECT * FROM accounts WHERE id = ${parseInt(accountId)}
    `;

    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
}