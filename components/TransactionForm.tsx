'use client';

import { useState, useEffect } from 'react';
import { TransactionType, DebtType, Account, Category } from '@/lib/types';

export default function TransactionForm() {
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    category_id: '',
    amount: '',
    expense_instrument: '',
    income_account_id: '',
    expense_account_id: '',
    outflow_account_id: '',
    inflow_account_id: '',
    debt_type: '' as DebtType | '',
    involved_account_id: '',
    counterparty_name: '',
    is_benki: false,
    notes: ''
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch('/api/accounts');
    const data = await res.json();
    setAccounts(data);
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        date: formData.date,
        name: formData.name,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        amount: parseFloat(formData.amount),
        transaction_type: transactionType,
        is_benki: formData.is_benki,
        notes: formData.notes || null,
      };

      if (transactionType === 'income') {
        Object.assign(payload, {
          income_account_id: parseInt(formData.income_account_id),
        });
      } else if (transactionType === 'expense') {
        Object.assign(payload, {
          expense_account_id: parseInt(formData.expense_account_id),
          expense_instrument: formData.expense_instrument,
        });
      } else if (transactionType === 'transfer') {
        Object.assign(payload, {
          outflow_account_id: parseInt(formData.outflow_account_id),
          inflow_account_id: parseInt(formData.inflow_account_id),
        });
      } else if (transactionType === 'debt') {
        Object.assign(payload, {
          debt_type: formData.debt_type,
          involved_account_id: formData.involved_account_id ? parseInt(formData.involved_account_id) : null,
          counterparty_name: formData.counterparty_name,
        });
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Transaction added successfully! 🎉' });
        setFormData({
          date: new Date().toISOString().split('T')[0],
          name: '',
          category_id: '',
          amount: '',
          expense_instrument: '',
          income_account_id: '',
          expense_account_id: '',
          outflow_account_id: '',
          inflow_account_id: '',
          debt_type: '',
          involved_account_id: '',
          counterparty_name: '',
          is_benki: false,
          notes: ''
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to add transaction' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding transaction' });
    } finally {
      setLoading(false);
    }
  };

  const realAccounts = accounts.filter(a => !a.is_virtual);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8 animate-slide-in">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, var(--blue-primary), var(--accent-cyan))'
          }}>
            <span className="text-2xl">➕</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Add New Transaction
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Record your financial activity
            </p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'border-green-500/30 bg-green-500/10' 
              : 'border-red-500/30 bg-red-500/10'
          }`}>
            <p style={{ color: message.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Selection */}
          <div>
            <label className="block text-sm font-bold mb-3 uppercase tracking-wider" 
                   style={{ color: 'var(--text-muted)' }}>
              Transaction Type
            </label>
            <div className="grid grid-cols-4 gap-3">
              {(['expense', 'income', 'transfer', 'debt'] as TransactionType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTransactionType(type)}
                  className={`px-4 py-3 rounded-lg font-bold transition-all duration-200 border ${
                    transactionType === type ? 'shadow-lg transform scale-105' : ''
                  }`}
                  style={{
                    backgroundColor: transactionType === type ? 'var(--blue-primary)' : 'var(--bg-tertiary)',
                    color: transactionType === type ? 'white' : 'var(--text-secondary)',
                    borderColor: transactionType === type ? 'var(--blue-primary)' : 'var(--border-color)'
                  }}
                >
                  <div className="text-2xl mb-1">
                    {type === 'expense' ? '💸' : type === 'income' ? '💰' : type === 'transfer' ? '🔄' : '🤝'}
                  </div>
                  <div className="text-xs uppercase">{type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                     style={{ color: 'var(--text-muted)' }}>
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                     style={{ color: 'var(--text-muted)' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field w-full"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                   style={{ color: 'var(--text-muted)' }}>
              Description
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field w-full"
              placeholder="What's this transaction for?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                   style={{ color: 'var(--text-muted)' }}>
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="input-field w-full"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Type-specific Fields */}
          {transactionType === 'income' && (
            <div className="p-4 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              borderColor: 'var(--border-color)' 
            }}>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                     style={{ color: 'var(--text-muted)' }}>
                Income Account
              </label>
              <select
                value={formData.income_account_id}
                onChange={(e) => setFormData({ ...formData, income_account_id: e.target.value })}
                className="input-field w-full"
                required
              >
                <option value="">Select Account</option>
                {realAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {transactionType === 'expense' && (
            <div className="space-y-4 p-4 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              borderColor: 'var(--border-color)' 
            }}>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                       style={{ color: 'var(--text-muted)' }}>
                  Expense Account
                </label>
                <select
                  value={formData.expense_account_id}
                  onChange={(e) => setFormData({ ...formData, expense_account_id: e.target.value })}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select Account</option>
                  {realAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                       style={{ color: 'var(--text-muted)' }}>
                  Payment Method
                </label>
                <select
                  value={formData.expense_instrument}
                  onChange={(e) => setFormData({ ...formData, expense_instrument: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">Select Method</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-opacity-50" 
                   style={{ backgroundColor: 'var(--bg-secondary)' }}
                   onClick={() => setFormData({ ...formData, is_benki: !formData.is_benki })}>
                <input
                  type="checkbox"
                  checked={formData.is_benki}
                  onChange={(e) => setFormData({ ...formData, is_benki: e.target.checked })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: 'var(--blue-primary)' }}
                />
                <label className="text-sm font-bold cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  Mark as Refund
                </label>
              </div>
            </div>
          )}

          {transactionType === 'transfer' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              borderColor: 'var(--border-color)' 
            }}>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                       style={{ color: 'var(--text-muted)' }}>
                  From Account
                </label>
                <select
                  value={formData.outflow_account_id}
                  onChange={(e) => setFormData({ ...formData, outflow_account_id: e.target.value })}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select Account</option>
                  {realAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                       style={{ color: 'var(--text-muted)' }}>
                  To Account
                </label>
                <select
                  value={formData.inflow_account_id}
                  onChange={(e) => setFormData({ ...formData, inflow_account_id: e.target.value })}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select Account</option>
                  {realAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {transactionType === 'debt' && (
            <div className="space-y-4 p-4 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              borderColor: 'var(--border-color)' 
            }}>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                       style={{ color: 'var(--text-muted)' }}>
                  Debt Type
                </label>
                <select
                  value={formData.debt_type}
                  onChange={(e) => setFormData({ ...formData, debt_type: e.target.value as DebtType })}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select Debt Type</option>
                  <option value="lending">💸 Lending (I lend money)</option>
                  <option value="borrowing">💰 Borrowing (I borrow money)</option>
                  <option value="sending">📤 Sending (I pay off debt)</option>
                  <option value="receiving">📥 Receiving (They pay me back)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                       style={{ color: 'var(--text-muted)' }}>
                  Person/Entity
                </label>
                <input
                  type="text"
                  value={formData.counterparty_name}
                  onChange={(e) => setFormData({ ...formData, counterparty_name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Name of person/entity"
                  required
                />
              </div>
              {(formData.debt_type === 'lending' || formData.debt_type === 'sending' || formData.debt_type === 'receiving') && (
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                         style={{ color: 'var(--text-muted)' }}>
                    Account
                  </label>
                  <select
                    value={formData.involved_account_id}
                    onChange={(e) => setFormData({ ...formData, involved_account_id: e.target.value })}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select Account</option>
                    {realAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider" 
                   style={{ color: 'var(--text-muted)' }}>
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field w-full"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg"
          >
            {loading ? '⏳ Adding...' : '✨ Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}