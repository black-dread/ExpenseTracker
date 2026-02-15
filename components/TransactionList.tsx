'use client';

import { useState, useEffect } from 'react';
import { TransactionWithDetails, TransactionType } from '@/lib/types';
import { formatINR, toNumber } from '@/lib/utils';

export default function TransactionList() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const url = filterType === 'all' 
        ? '/api/transactions?limit=25' 
        : `/api/transactions?limit=25&type=${filterType}`;
      const res = await fetch(url);
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDetails = (txn: TransactionWithDetails) => {
    switch (txn.transaction_type) {
      case 'income':
        return `→ ${txn.income_account_name}`;
      case 'expense':
        return `${txn.expense_account_name} (${txn.expense_instrument || 'N/A'})`;
      case 'transfer':
        return `${txn.outflow_account_name} → ${txn.inflow_account_name}`;
      case 'debt':
        return `${txn.debt_type} - ${txn.counterparty_name} ${txn.involved_account_name ? `(${txn.involved_account_name})` : ''}`;
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 rounded-full animate-spin" 
               style={{ borderColor: 'var(--blue-primary)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-slide-in">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, var(--blue-primary), var(--accent-cyan))'
            }}>
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Transaction History
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Last 25 transactions {filterType !== 'all' && `(${filterType})`}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {(['all', 'expense', 'income', 'transfer', 'debt'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 border text-sm ${
                  filterType === type ? 'shadow-lg' : ''
                }`}
                style={{
                  backgroundColor: filterType === type ? 'var(--blue-primary)' : 'var(--bg-tertiary)',
                  color: filterType === type ? 'white' : 'var(--text-secondary)',
                  borderColor: filterType === type ? 'var(--blue-primary)' : 'var(--border-color)'
                }}
              >
                {type === 'all' ? '🔍 All' : 
                 type === 'expense' ? '💸 Expense' : 
                 type === 'income' ? '💰 Income' : 
                 type === 'transfer' ? '🔄 Transfer' : '🤝 Debt'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" 
                    style={{ color: 'var(--text-muted)' }}>Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" 
                    style={{ color: 'var(--text-muted)' }}>Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" 
                    style={{ color: 'var(--text-muted)' }}>Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" 
                    style={{ color: 'var(--text-muted)' }}>Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" 
                    style={{ color: 'var(--text-muted)' }}>Details</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider" 
                    style={{ color: 'var(--text-muted)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(txn.date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {txn.name}
                    {txn.is_benki && (
                      <span className="ml-2 text-xs px-2 py-1 rounded font-bold" style={{
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        color: '#a855f7'
                      }}>
                        BENKI
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`badge badge-${txn.transaction_type}`}>
                      {txn.transaction_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {txn.category_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {getTransactionDetails(txn)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold" 
                      style={{ color: 'var(--blue-bright)' }}>
                    {formatINR(toNumber(txn.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              No transactions found
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}