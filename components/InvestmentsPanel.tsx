'use client';

import { useState, useEffect } from 'react';
import { Account } from '@/lib/types';
import { formatINR, toNumber } from '@/lib/utils';

export default function InvestmentsPanel() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [values, setValues] = useState<{ [key: number]: string }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const res = await fetch('/api/investments');
      const data = await res.json();
      setAccounts(data);
      
      // Initialize values with current balances
      const initialValues: { [key: number]: string } = {};
      data.forEach((acc: Account) => {
        initialValues[acc.id] = acc.balance.toString();
      });
      setValues(initialValues);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (accountId: number) => {
    setUpdating(accountId);
    setMessage(null);

    try {
      const res = await fetch('/api/investments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          newBalance: parseFloat(values[accountId])
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Investment value updated! 🎉' });
        fetchInvestments(); // Refresh data
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to update investment' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating investment' });
    } finally {
      setUpdating(null);
    }
  };

  const handleValueChange = (accountId: number, value: string) => {
    setValues(prev => ({ ...prev, [accountId]: value }));
  };

  const getAccountIcon = (name: string) => {
    if (name.includes('Mutual')) return '📊';
    if (name.includes('Stock')) return '📈';
    if (name.includes('Qualcomm')) return '💎';
    return '💼';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 rounded-full animate-spin" 
               style={{ borderColor: 'var(--blue-primary)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading investments...</p>
        </div>
      </div>
    );
  }

  const totalValue = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, var(--blue-primary), var(--accent-cyan))'
        }}>
          <span className="text-2xl">📊</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Update Investments
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Manually update investment account values
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'border-green-500/30 bg-green-500/10' 
            : 'border-red-500/30 bg-red-500/10'
        }`}>
          <p style={{ color: message.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
            {message.text}
          </p>
        </div>
      )}

      {/* Total Investment Value Card */}
      <div className="card p-6">
        <div className="p-6 rounded-lg" style={{ 
          background: 'linear-gradient(135deg, var(--blue-primary), var(--accent-cyan))'
        }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-white opacity-90">
            Total Investment Value
          </h3>
          <p className="text-4xl font-bold text-white">
            {formatINR(totalValue)}
          </p>
        </div>
      </div>

      {/* Investment Accounts */}
      <div className="card p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center" style={{ color: 'var(--text-primary)' }}>
          <span className="mr-2">💎</span>
          Investment Accounts
        </h3>

        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account.id} 
                 className="p-6 rounded-lg border" 
                 style={{ 
                   backgroundColor: 'var(--bg-tertiary)', 
                   borderColor: 'var(--border-color)' 
                 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">{getAccountIcon(account.name)}</span>
                  <div>
                    <h4 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                      {account.name}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Current: {formatINR(toNumber(account.balance))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                         style={{ color: 'var(--text-muted)' }}>
                    New Value (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={values[account.id] || ''}
                    onChange={(e) => handleValueChange(account.id, e.target.value)}
                    className="input-field w-full text-lg"
                    placeholder="Enter new value"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => handleUpdate(account.id)}
                    disabled={updating === account.id || values[account.id] === account.balance.toString()}
                    className="btn-primary px-6 flex items-center space-x-2"
                  >
                    {updating === account.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Update</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Show change preview */}
              {values[account.id] && parseFloat(values[account.id]) !== account.balance && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Change:</span>
                    <span className="font-bold" style={{ 
                      color: parseFloat(values[account.id]) > account.balance ? 'var(--success)' : 'var(--error)' 
                    }}>
                      {parseFloat(values[account.id]) > account.balance ? '+' : ''}
                      {formatINR(parseFloat(values[account.id]) - toNumber(account.balance))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              No investment accounts found
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Add investment accounts to track them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}