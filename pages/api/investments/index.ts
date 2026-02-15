import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get investment accounts (the ones we want to manually update)
    const investmentAccounts = await sql`
      SELECT * FROM accounts 
      WHERE name IN ('Mutual Funds(V)', 'Stocks (V)', 'Qualcomm Shares')
      ORDER BY name
    `;

    res.status(200).json(investmentAccounts);
  } catch (error) {
    console.error('Error fetching investment accounts:', error);
    res.status(500).json({ error: 'Failed to fetch investment accounts' });
  }
}