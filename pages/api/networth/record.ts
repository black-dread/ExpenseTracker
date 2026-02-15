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
    // Calculate current net worth
    const balanceResult = await sql`
      SELECT COALESCE(SUM(balance), 0) as total
      FROM accounts
      WHERE include_in_net_worth = true
    `;
    const netWorth = Number(balanceResult[0]?.total || 0);

    // Get today's date in local timezone
    const today = new Date().toISOString().split('T')[0];

    // Insert or update today's net worth
    await sql`
      INSERT INTO net_worth_history (date, net_worth)
      VALUES (${today}, ${netWorth})
      ON CONFLICT (date) 
      DO UPDATE SET net_worth = ${netWorth}, recorded_at = CURRENT_TIMESTAMP
    `;

    res.status(200).json({ 
      date: today, 
      net_worth: netWorth,
      message: 'Net worth recorded successfully' 
    });
  } catch (error) {
    console.error('Error recording net worth:', error);
    res.status(500).json({ error: 'Failed to record net worth' });
  }
}