import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/db';
import { CreateTransactionDTO } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { limit = '100', offset = '0', type } = req.query;
      
      let query = `
        SELECT 
          t.*,
          c.name as category_name,
          ia.name as income_account_name,
          ea.name as expense_account_name,
          oa.name as outflow_account_name,
          ifa.name as inflow_account_name,
          inv.name as involved_account_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts ia ON t.income_account_id = ia.id
        LEFT JOIN accounts ea ON t.expense_account_id = ea.id
        LEFT JOIN accounts oa ON t.outflow_account_id = oa.id
        LEFT JOIN accounts ifa ON t.inflow_account_id = ifa.id
        LEFT JOIN accounts inv ON t.involved_account_id = inv.id
      `;
      
      if (type) {
        query += ` WHERE t.transaction_type = '${type}'`;
      }
      
      query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      
      const transactions = await sql(query);
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  } else if (req.method === 'POST') {
    try {
      const dto: CreateTransactionDTO = req.body;
      
      const result = await sql`
        INSERT INTO transactions (
          date, name, category_id, amount, transaction_type,
          income_account_id, expense_account_id, expense_instrument,
          outflow_account_id, inflow_account_id,
          debt_type, involved_account_id, counterparty_name,
          is_benki, notes
        ) VALUES (
          ${dto.date}, 
          ${dto.name}, 
          ${dto.category_id || null},
          ${dto.amount},
          ${dto.transaction_type},
          ${dto.income_account_id || null},
          ${dto.expense_account_id || null},
          ${dto.expense_instrument || null},
          ${dto.outflow_account_id || null},
          ${dto.inflow_account_id || null},
          ${dto.debt_type || null},
          ${dto.involved_account_id || null},
          ${dto.counterparty_name || null},
          ${dto.is_benki || false},
          ${dto.notes || null}
        )
        RETURNING *
      `;
      
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
