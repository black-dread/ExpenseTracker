'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatINR, toNumber } from '@/lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      
      // Ensure arrays are initialized
      const normalizedData = {
        ...data,
        categoryBreakdown: data.categoryBreakdown || [],
        netWorthHistory: data.netWorthHistory || []
      };
      
      setStats(normalizedData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordNetWorth = async () => {
    setRecording(true);
    try {
      await fetch('/api/networth/record', { method: 'POST' });
      // Refresh stats to show updated graph
      await fetchStats();
    } catch (error) {
      console.error('Error recording net worth:', error);
    } finally {
      setRecording(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 rounded-full animate-spin" 
               style={{ borderColor: 'var(--blue-primary)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--error)' }}>Failed to load dashboard</p>
      </div>
    );
  }

  // Format net worth history for the chart
  const chartData = stats.netWorthHistory.map(item => ({
    date: item.date,
    displayDate: new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }),
    netWorth: toNumber(item.net_worth)
  }));

  // Generate x-axis ticks for January 1st and July 1st of each year
  const generateXAxisTicks = () => {
    if (chartData.length === 0) return [];
    
    const ticks = [];
    const firstDate = new Date(chartData[0].date);
    const lastDate = new Date(chartData[chartData.length - 1].date);
    
    let currentYear = firstDate.getFullYear();
    const lastYear = lastDate.getFullYear();
    
    while (currentYear <= lastYear) {
      const jan1 = `${currentYear}-01-01`;
      const jul1 = `${currentYear}-07-01`;
      
      // Only include if within our data range
      if (jan1 >= chartData[0].date && jan1 <= chartData[chartData.length - 1].date) {
        ticks.push(jan1);
      }
      if (jul1 >= chartData[0].date && jul1 <= chartData[chartData.length - 1].date) {
        ticks.push(jul1);
      }
      
      currentYear++;
    }
    
    return ticks;
  };

  const xAxisTicks = generateXAxisTicks();

  // Custom tick formatter for x-axis
  const formatXAxisTick = (date: string) => {
    const d = new Date(date);
    const month = d.toLocaleDateString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    return `${month} ${year}`;
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards - Now with 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Total Balance
            </h3>
            <span className="text-2xl">💼</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatINR(toNumber(stats.totalBalance))}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Month Income
            </h3>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
            {formatINR(toNumber(stats.monthlyIncome))}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Month Expense
            </h3>
            <span className="text-2xl">📉</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--error)' }}>
            {formatINR(toNumber(stats.monthlyExpense))}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Month Net
            </h3>
            <span className="text-2xl">{stats.monthlyNet >= 0 ? '✅' : '⚠️'}</span>
          </div>
          <p className="text-2xl font-bold" style={{ 
            color: stats.monthlyNet >= 0 ? 'var(--success)' : 'var(--error)' 
          }}>
            {formatINR(toNumber(stats.monthlyNet))}
          </p>
        </div>


      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown - Current Month */}
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center" style={{ color: 'var(--text-primary)' }}>
            <span className="mr-2">📊</span>
            This Month by Category
          </h3>
          {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis 
                  dataKey="category" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  stroke="var(--text-muted)"
                  style={{ fontSize: '11px', fontFamily: 'Space Mono' }}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  style={{ fontSize: '12px', fontFamily: 'Space Mono' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'Space Mono'
                  }}
                  formatter={(value) => formatINR(toNumber(value))}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" fill="var(--blue-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-center" style={{ color: 'var(--text-muted)' }}>
                No expenses this month
              </p>
            </div>
          )}
        </div>

        {/* Net Worth Over Time */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center" style={{ color: 'var(--text-primary)' }}>
              <span className="mr-2">📈</span>
              Net Worth Over Time
            </h3>
            <button
              onClick={handleRecordNetWorth}
              disabled={recording}
              className="text-xs px-3 py-1 rounded font-bold transition-all"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {recording ? '⏳ Recording...' : '💾 Record Now'}
            </button>
          </div>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis 
                  dataKey="date"
                  ticks={xAxisTicks}
                  tickFormatter={formatXAxisTick}
                  stroke="var(--text-muted)"
                  style={{ fontSize: '11px', fontFamily: 'Space Mono' }}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  style={{ fontSize: '12px', fontFamily: 'Space Mono' }}
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                  domain={['dataMin - 50000', 'dataMax + 50000']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'Space Mono'
                  }}
                  formatter={(value) => [formatINR(toNumber(value)), 'Net Worth']}
                  labelFormatter={(label) => {
                    return new Date(label).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    });
                  }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="var(--accent-cyan)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-center mb-4" style={{ color: 'var(--text-muted)' }}>
                No net worth data yet
                <br />
                <span className="text-xs">Starting from 17/12/2023</span>
              </p>
              <button
                onClick={handleRecordNetWorth}
                disabled={recording}
                className="btn-primary"
              >
                {recording ? '⏳ Recording...' : '💾 Record First Snapshot'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}