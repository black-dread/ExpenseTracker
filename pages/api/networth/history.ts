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
    // Fetch all net worth history starting from December 17, 2023
    const startDate = '2023-12-17';
    
    const history = await sql`
      SELECT date, net_worth
      FROM net_worth_history
      WHERE date >= ${startDate}
      ORDER BY date ASC
    `;

    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching net worth history:', error);
    res.status(500).json({ error: 'Failed to fetch net worth history' });
  }
}