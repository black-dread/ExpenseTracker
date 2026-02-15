import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/db';
import { DashboardStats } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get total balance across all non-virtual accounts that should be included in net worth
    const balanceResult = await sql`
      SELECT COALESCE(SUM(balance), 0) as total
      FROM accounts
      WHERE include_in_net_worth = true
    `;
    const totalBalance = Number(balanceResult[0]?.total || 0);

    // Get current month's date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const monthStart = firstDayOfMonth.toISOString().split('T')[0];
    const monthEnd = firstDayOfNextMonth.toISOString().split('T')[0];

    // Get current month's income
    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE transaction_type = 'income'
      AND is_refund = false
      AND date >= ${monthStart}
      AND date < ${monthEnd}
    `;
    const monthlyIncome = Number(incomeResult[0]?.total || 0);

    // Get current month's expenses (including borrowing debt transactions)
    const expenseResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE (
        (transaction_type = 'expense')
        OR (transaction_type = 'debt' AND debt_type = 'borrowing')
      )
      AND date >= ${monthStart}
      AND date < ${monthEnd}
    `;
    const monthlyExpense = Number(expenseResult[0]?.total || 0);

    // Category breakdown for current month (expenses only, not debt)
    const categoryBreakdown = await sql`
      SELECT 
        c.name as category,
        SUM(t.amount) as amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.transaction_type = 'expense'
      AND t.date >= ${monthStart}
      AND t.date < ${monthEnd}
      GROUP BY c.name
      ORDER BY amount DESC
      LIMIT 10
    `;

    

    // Net Worth History starting from December 17, 2023
    const startDate = '2023-12-17';
    const netWorthHistory = await sql`
      SELECT date, net_worth
      FROM net_worth_history
      WHERE date >= ${startDate}
      ORDER BY date ASC
    `;

    // Auto-record today's net worth if it doesn't exist
    const today = now.toISOString().split('T')[0];
    const todayExists = netWorthHistory.some((row: any) => row.date === today);
    
    // Check if it's past 2 PM (14:00)
    const isPast2PM = now.getHours() >= 14;
    
    if (!todayExists && isPast2PM) {
      // Record today's net worth
      await sql`
        INSERT INTO net_worth_history (date, net_worth)
        VALUES (${today}, ${totalBalance})
        ON CONFLICT (date) DO NOTHING
      `;
      
      // Add to the result
      netWorthHistory.push({ date: today, net_worth: totalBalance });
    }

    // Get last 12 months spending
    const monthlySpendHistory = await sql`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount) as spending
      FROM transactions
      WHERE transaction_type = 'expense'
      AND date >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `;

    const averageMonthlySpend = monthlySpendHistory.length > 0
      ? monthlySpendHistory.reduce((sum, m) => sum + Number(m.spending), 0) / monthlySpendHistory.length
      : 0;

    const stats: DashboardStats = {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyNet: monthlyIncome - monthlyExpense,
      categoryBreakdown: (categoryBreakdown || []).map(row => ({
        category: row.category,
        amount: Number(row.amount)
      })),
      netWorthHistory: (netWorthHistory || []).map(row => ({
        date: row.date,
        net_worth: Number(row.net_worth)
      })),
      monthlySpendHistory: (monthlySpendHistory || []).map(row => ({
        month: row.month,
        spending: Number(row.spending)
      })).reverse(), // Reverse to show oldest first
      averageMonthlySpend
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}