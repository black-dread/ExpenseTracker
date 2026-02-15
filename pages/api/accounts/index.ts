import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/db';
import { Account } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const accounts = await sql`
        SELECT * FROM accounts 
        ORDER BY name
      `;
      res.status(200).json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, account_type, balance, include_in_net_worth, show_in_investments } = req.body;
      
      const result = await sql`
        INSERT INTO accounts (name, account_type, balance, is_virtual, include_in_net_worth, show_in_investments)
        VALUES (
          ${name}, 
          ${account_type}, 
          ${balance || 0}, 
          false, 
          ${include_in_net_worth !== false}, 
          ${show_in_investments || false}
        )
        RETURNING *
      `;
      
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}