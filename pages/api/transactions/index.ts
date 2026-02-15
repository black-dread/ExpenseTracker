import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/db';
import { Transaction } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { limit = '25', offset = '0', type } = req.query;
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      
      let transactions;
      let countResult;
      
      if (type && type !== 'all') {
        // Query with type filter
        transactions = await sql`
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
          WHERE t.transaction_type = ${type}
          ORDER BY t.date DESC, t.created_at DESC
          LIMIT ${limitNum}
          OFFSET ${offsetNum}
        `;
        
        countResult = await sql`
          SELECT COUNT(*) as total 
          FROM transactions 
          WHERE transaction_type = ${type}
        `;
      } else {
        // Query without filter
        transactions = await sql`
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
          ORDER BY t.date DESC, t.created_at DESC
          LIMIT ${limitNum}
          OFFSET ${offsetNum}
        `;
        
        countResult = await sql`SELECT COUNT(*) as total FROM transactions`;
      }
      
      const total = Number(countResult[0]?.total || 0);
      
      res.status(200).json({
        transactions,
        total,
        limit: limitNum,
        offset: offsetNum
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  } else if (req.method === 'POST') {
    try {
      const txData = req.body;
      
      const result = await sql`
        INSERT INTO transactions (
          date, name, category_id, amount, transaction_type,
          income_account_id, expense_account_id, expense_instrument,
          outflow_account_id, inflow_account_id,
          debt_type, involved_account_id, counterparty_name,
          is_refund, notes
        ) VALUES (
          ${txData.date},
          ${txData.name},
          ${txData.category_id || null},
          ${txData.amount},
          ${txData.transaction_type},
          ${txData.income_account_id || null},
          ${txData.expense_account_id || null},
          ${txData.expense_instrument || null},
          ${txData.outflow_account_id || null},
          ${txData.inflow_account_id || null},
          ${txData.debt_type || null},
          ${txData.involved_account_id || null},
          ${txData.counterparty_name || null},
          ${txData.is_refund || false},
          ${txData.notes || null}
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