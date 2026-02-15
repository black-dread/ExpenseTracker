'use client';

import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import AccountsPanel from '@/components/AccountsPanel';
import InvestmentsPanel from '@/components/InvestmentsPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new' | 'list' | 'accounts' | 'investments'>('dashboard');

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <nav className="border-b" style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        borderColor: 'var(--border-color)' 
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, var(--blue-primary), var(--accent-cyan))'
              }}>
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Expense Tracker
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Manage your finances
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'new', label: 'New', icon: '➕' },
                { id: 'list', label: 'History', icon: '📋' },
                { id: 'accounts', label: 'Accounts', icon: '🏦' },
                { id: 'investments', label: 'Invest', icon: '💎' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm ${
                    activeTab === tab.id ? 'shadow-lg' : ''
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? 'var(--blue-primary)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                    border: activeTab === tab.id ? 'none' : '1px solid var(--border-color)'
                  }}
                >
                  <span className="text-lg sm:text-xl">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-in">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'new' && <TransactionForm />}
        {activeTab === 'list' && <TransactionList />}
        {activeTab === 'accounts' && <AccountsPanel />}
        {activeTab === 'investments' && <InvestmentsPanel />}
      </main>
    </div>
  );
}