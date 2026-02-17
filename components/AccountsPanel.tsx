'use client';

import { useState, useEffect } from 'react';
import { Account } from '@/lib/types';
import { formatINR, toNumber } from '@/lib/utils';

export default function AccountsPanel() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      account_type: 'Bank' as Account['account_type'],
      balance: '0',
      include_in_net_worth: true,
      show_in_investments: false
    });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          account_type: formData.account_type,
          balance: parseFloat(formData.balance),
          include_in_net_worth: formData.include_in_net_worth,
          show_in_investments: formData.show_in_investments
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Account added successfully! 🎉' });
        setFormData({ name: '', account_type: 'Bank', balance: '0', include_in_net_worth: true,show_in_investments: false });
        setShowAddForm(false);
        fetchAccounts();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to add account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding account' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 rounded-full animate-spin" 
               style={{ borderColor: 'var(--blue-primary)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading accounts...</p>
        </div>
      </div>
    );
  }

  // Separate debt account from other accounts
  const debtAccount = accounts.find(a => a.name === 'Debt');
  const realAccounts = accounts.filter(a => !a.is_virtual && a.name !== 'Debt');

// Group accounts by type using actual database values
const groupOrder = ['Bank', 'Credit', 'Cash', 'Debit', 'Investments'];
const groupedAccounts: { [key: string]: Account[] } = {
  'Bank': [],
  'Credit': [],
  'Cash': [],
  'Debit': [],
  'Investments': []
};

realAccounts.forEach(acc => {
  const type = acc.account_type;
  if (groupedAccounts[type]) {
    groupedAccounts[type].push(acc);
  }
});

// Sort within each group by balance (highest first)
Object.keys(groupedAccounts).forEach(type => {
  groupedAccounts[type].sort((a, b) => toNumber(b.balance) - toNumber(a.balance));
});

// Flatten into single sorted array
const sortedAccounts = groupOrder.flatMap(type => groupedAccounts[type] || []);
  // Only include accounts where include_in_net_worth is true for total balance
  const netWorthAccounts = accounts.filter(a => a.is_virtual && a.include_in_net_worth !== false);
  const totalBalance = netWorthAccounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Bank': return '🏦';
      case 'Credit': return '💳';
      case 'Cash': return '💵';
      case 'Investments': return '📈';
      default: return '💼';
    }
  };

  const getDebtColor = (balance: number) => {
    if (balance > 0) return 'var(--success)'; // People owe you
    if (balance < 0) return 'var(--error)';   // You owe people
    return 'var(--text-primary)';             // Neutral
  };

  const getDebtDescription = (balance: number) => {
    if (balance > 0) return 'People owe you';
    if (balance < 0) return 'You owe';
    return 'All settled';
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, var(--blue-primary), var(--accent-cyan))'
          }}>
            <span className="text-2xl">🏦</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Accounts
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Manage your financial accounts
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <span>{showAddForm ? '❌' : '➕'}</span>
          <span>{showAddForm ? 'Cancel' : 'Add Account'}</span>
        </button>
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

      {showAddForm && (
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
            <span className="mr-2">✨</span>
            Add New Account
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                     style={{ color: 'var(--text-muted)' }}>
                Account Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field w-full"
                placeholder="e.g., ICICI Savings"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                     style={{ color: 'var(--text-muted)' }}>
                Account Type
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as Account['account_type'] })}
                className="input-field w-full"
              >
                <option value="Bank">🏦 Bank Account</option>
                <option value="Credit">💳 Credit Card</option>
                <option value="Cash">💵 Cash</option>
                <option value="Debit">💼 Debit</option>
                <option value="Investments">📈 Investment</option>
                
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                     style={{ color: 'var(--text-muted)' }}>
                Initial Balance (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="input-field w-full"
                placeholder="0.00"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeNetWorth"
                  checked={formData.include_in_net_worth}
                  onChange={(e) => setFormData({ ...formData, include_in_net_worth: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--blue-primary)' }}
                />
                <label htmlFor="includeNetWorth" className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                  Include in Net Worth
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showInvestments"
                  checked={formData.show_in_investments}
                  onChange={(e) => setFormData({ ...formData, show_in_investments: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--blue-primary)' }}
                />
                <label htmlFor="showInvestments" className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                  Show in Investments Page
                </label>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              ✨ Create Account
            </button>
          </form>
        </div>
      )}

      <div className="card p-6">
        <div className="mb-6 p-6 rounded-lg" style={{ 
          background: 'linear-gradient(135deg, var(--blue-primary), var(--accent-cyan))'
        }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-white opacity-90">
            Total Net Worth
          </h3>
          <p className="text-4xl font-bold text-white">
            {formatINR(totalBalance)}
          </p>
          <p className="text-xs mt-2 text-white opacity-75">
            Excludes: Mutual Funds(I), Stocks
          </p>
        </div>

        <div className="space-y-3">
          {/* Debt Account - Show First */}
          {debtAccount && (
            <div className="p-5 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]" 
                 style={{ 
                   backgroundColor: 'var(--bg-tertiary)', 
                   borderColor: getDebtColor(toNumber(debtAccount.balance)),
                   boxShadow: `0 4px 12px ${getDebtColor(toNumber(debtAccount.balance))}33`
                 }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">🤝</span>
                  <div>
                    <h4 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                      {debtAccount.name}
                    </h4>
                    <p className="text-xs uppercase tracking-wider font-bold" 
                       style={{ color: getDebtColor(toNumber(debtAccount.balance)) }}>
                      {getDebtDescription(toNumber(debtAccount.balance))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" 
                     style={{ color: getDebtColor(toNumber(debtAccount.balance)) }}>
                    {formatINR(Math.abs(toNumber(debtAccount.balance)))}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Separator */}
          {debtAccount && realAccounts.length > 0 && (
            <div className="my-4 border-t" style={{ borderColor: 'var(--border-color)' }}></div>
          )}

          {/* Regular Accounts */}
          {sortedAccounts.map((account) => (
            <div key={account.id} 
                 className="p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02]" 
                 style={{ 
                   backgroundColor: 'var(--bg-tertiary)', 
                   borderColor: 'var(--border-color)',
                   opacity: account.include_in_net_worth === false ? 0.6 : 1
                 }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getAccountIcon(account.account_type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                        {account.name}
                      </h4>
                      {account.include_in_net_worth === false && (
                        <span className="text-xs px-2 py-1 rounded font-bold" style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--warning)'
                        }}>
                          NOT IN NET WORTH
                        </span>
                      )}
                    </div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {account.account_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: 'var(--blue-bright)' }}>
                    {formatINR(toNumber(account.balance))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {realAccounts.length === 0 && !debtAccount && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏦</div>
            <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              No accounts yet
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Add your first account to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}