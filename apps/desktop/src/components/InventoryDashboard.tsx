"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

interface RecentItem {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  soldBy: string | null;
  isRefunded: boolean;
  refundReason: string | null;
  createdAt: string;
  discountAmount: number;
  items: {
    quantity: number;
    price: number;
    variant: {
      product: {
        name: string;
      };
    };
  }[];
}

interface Summary {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  lowStockCount: number;
  todaySales: number;
  todayTransactions: number;
  yesterdaySales: number;
  yesterdayTransactions: number;
  myTodaySales?: number;
  myTodayTransactions?: number;
  recentTransactions: RecentItem[];
  topProductToday: { name: string; quantity: number; revenue: number } | null;
  chartData: { name: string; value: number }[];
}

interface LowStockAlert {
  variant: {
    sku: string;
    size: string | null;
    color: string | null;
    product: {
      name: string;
    };
  };
  quantity: number;
  reorderLevel: number;
}

export default function InventoryDashboard() {
  const { isOnline, user } = useAuth();
  const [currency, setCurrency] = useState('GH₵');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
      if (parsed.exchangeRate) setExchangeRate(parsed.exchangeRate);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const queryParam = user?.id ? `?userId=${user.id}` : '';
      const [sumRes, alertRes] = await Promise.all([
        fetch(`/api/analytics/summary${queryParam}`),
        fetch('/api/inventory/low-stock') // Corrected API endpoint
      ]);
      
      const sumData = await sumRes.json();
      const alertData = await alertRes.json();
      
      setSummary(sumData);
      setAlerts(alertData);
    } catch (error) {
      console.error('Dashboard fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const renderTrend = (percent: number) => {
    const isUp = percent >= 0;
    return (
      <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
        isUp ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
      }`}>
        {isUp ? '▲' : '▼'} {Math.abs(percent).toFixed(0)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2.5em] text-slate-400 animate-pulse">Checking Store Feeds...</p>
      </div>
    );
  }

  const cur = currency;
  const rate = currency === 'GH₵' ? 1 : (exchangeRate || 1);

  const tSales = summary?.todaySales || 0;
  const ySales = summary?.yesterdaySales || 0;
  const tTrans = summary?.todayTransactions || 0;
  const yTrans = summary?.yesterdayTransactions || 0;

  const mySales = summary?.myTodaySales || 0;
  const myTrans = summary?.myTodayTransactions || 0;

  const salesPop = getPercentageChange(tSales, ySales);
  const transPop = getPercentageChange(tTrans, yTrans);

  // Dynamically build metrics grid based on user role
  const role = user?.role || 'STAFF';
  let stats: { label: string; value: string; sub: React.ReactNode; detail: string; icon: React.ReactNode }[] = [];

  if (role === 'STAFF') {
    stats = [
      { 
        label: "My Sales Today", 
        value: `${cur}${(mySales / rate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
        sub: (
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">PERSONAL</span>
        ),
        detail: 'your shift total',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        ) 
      },
      { 
        label: "My Tickets Today", 
        value: `${myTrans} Completed`, 
        sub: (
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">PERSONAL</span>
        ),
        detail: 'tickets checked out',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        ) 
      },
      { 
        label: 'Low Stock Items', 
        value: (summary?.lowStockCount || 0).toString(), 
        sub: (
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
            alerts.length > 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}>
            {alerts.length > 0 ? 'REORDER' : 'OPTIMAL'}
          </span>
        ),
        detail: 'requiring attention',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        ) 
      }
    ];
  } else if (role === 'SUPERVISOR') {
    stats = [
      { 
        label: "Today's Store Sales", 
        value: `${cur}${(tSales / rate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
        sub: renderTrend(salesPop),
        detail: 'vs yesterday',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        ) 
      },
      { 
        label: "Today's Tickets", 
        value: `${tTrans} Completed`, 
        sub: renderTrend(transPop),
        detail: 'vs yesterday',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        ) 
      },
      { 
        label: 'Low Stock Count', 
        value: (summary?.lowStockCount || 0).toString(), 
        sub: (
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
            alerts.length > 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}>
            {alerts.length > 0 ? 'REORDER' : 'OPTIMAL'}
          </span>
        ),
        detail: 'requiring attention',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        ) 
      }
    ];
  } else {
    // ADMIN view: Detailed financials including gross profit, margins, lifetime revenue, etc.
    const profitToday = summary?.totalProfit || 0; // Let's use today's calculations or total
    // Calculating today's approximate profit for display
    const grossMargin = tSales > 0 ? ((summary?.totalProfit || 0) / (summary?.totalRevenue || 1)) * 100 : 0;
    stats = [
      { 
        label: "Today's Store Sales", 
        value: `${cur}${(tSales / rate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
        sub: renderTrend(salesPop),
        detail: 'vs yesterday',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        ) 
      },
      { 
        label: "Gross Margin %", 
        value: `${grossMargin.toFixed(1)}%`, 
        sub: (
          <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">STABLE</span>
        ),
        detail: 'overall store average',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        ) 
      },
      { 
        label: 'Low Stock Count', 
        value: (summary?.lowStockCount || 0).toString(), 
        sub: (
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
            alerts.length > 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}>
            {alerts.length > 0 ? 'REORDER' : 'OPTIMAL'}
          </span>
        ),
        detail: 'requiring attention',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        ) 
      },
      { 
        label: 'Lifetime Revenue', 
        value: `${cur}${((summary?.totalRevenue || 0) / rate).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, 
        sub: (
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">LIFETIME</span>
        ),
        detail: `across ${summary?.totalOrders || 0} bills`,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        ) 
      },
    ];
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 bg-brand-bg/50 min-h-full pb-12">
      {/* Real-time Hero Card */}
      <section className="bg-surface/40 p-8 rounded-xl border border-border-subtle relative overflow-hidden backdrop-blur-sm">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-2 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-orange-500" /> {role} Operational Outlook
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2 uppercase">
              Welcome Back, <span className="text-orange-500">{user?.username}</span>
            </h1>
            <p className="text-slate-500 font-medium italic text-xs">
              Live operational metrics and inventory tasks requiring immediate attention.
            </p>
          </div>
          
          <div className="bg-brand-bg/60 px-5 py-3 rounded-lg border border-border-subtle flex flex-col items-end backdrop-blur-md">
            <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest">System Date</span>
            <span className="text-xs font-bold text-foreground mt-0.5">{todayStr}</span>
            <div className={`text-[8.5px] font-black flex items-center justify-end gap-1.5 mt-1 ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} /> {isOnline ? 'LIVE FEED ACTIVE' : 'FEED INTERRUPTED'}
            </div>
          </div>
        </div>
      </section>

      {/* Row of Performance stats */}
      <div className={`grid grid-cols-1 ${role === 'STAFF' || role === 'SUPERVISOR' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-surface p-6 rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow group relative flex flex-col justify-between space-y-4"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center group-hover:scale-115 transition-transform text-orange-500">
                {stat.icon}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tight">{stat.value}</h3>
              <div className="flex items-center gap-2 mt-2">
                {stat.sub}
                <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">{stat.detail}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Primary operational grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Live Feed (Recent Transactions) & Top Product Today */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="bg-surface p-8 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-orange-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.02 6.02 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                <div>
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">Live Sales Feed</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time transactions recorded across register terminals</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[8.5px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                POLLING ACTIVE
              </span>
            </div>

              <div className="space-y-3">
                {(!summary || summary.recentTransactions.length === 0) ? (
                  <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest opacity-40">No sales transactions found today.</div>
                ) : summary.recentTransactions.map((tx, idx) => (
                  <div key={tx.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-brand-bg/30 ${
                    tx.isRefunded ? 'bg-rose-950/20 border-rose-500/20 text-rose-300' : 'bg-brand-bg/40 border-border-subtle/50 text-foreground'
                  }`}>
                    <div className="space-y-1 max-w-[65%]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          #{tx.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">
                          {(() => {
                            const date = new Date(tx.createdAt);
                            const today = new Date();
                            const isToday = date.getDate() === today.getDate() &&
                                            date.getMonth() === today.getMonth() &&
                                            date.getFullYear() === today.getFullYear();
                            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            return isToday ? timeStr : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${timeStr}`;
                          })()}
                        </span>
                        {tx.isRefunded && (
                          <span className="text-[7.5px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">REFUNDED / VOID</span>
                        )}
                        {tx.discountAmount > 0 && !tx.isRefunded && (
                          <span className="text-[7.5px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">DISCOUNTED</span>
                        )}
                      </div>
                      <p className="text-xs font-black truncate uppercase text-foreground">
                        {tx.items.map(i => `${i.variant.product.name} (x${i.quantity})`).join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-sm font-black">{cur}{(tx.totalAmount / rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest">
                        {tx.paymentMethod.toUpperCase()} • BY {tx.soldBy || 'SYSTEM'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          {/* Top product today */}
          {role !== 'STAFF' && summary?.topProductToday && (
            <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                </div>
                <div>
                  <div className="text-[8px] uppercase font-bold text-emerald-500 tracking-[0.2em]">Peak Mover Today</div>
                  <h4 className="text-base font-black text-foreground uppercase tracking-tight">{summary.topProductToday.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {summary.topProductToday.quantity} items sold today
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase font-black text-slate-500 tracking-widest">Today's Revenue</p>
                <p className="text-lg font-black text-emerald-500 mt-0.5">{cur}{(summary.topProductToday.revenue / rate).toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Low-stock Alerts (Actual names & counts) */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-surface p-8 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between h-full min-h-[460px]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground uppercase tracking-tight">Critical Stock</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Actions required to prevent stockout</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {alerts.length === 0 ? (
                  <div className="bg-brand-bg/40 p-8 rounded-xl border border-border-subtle/50 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Stock Health Perfect</p>
                      <p className="text-[8.5px] text-slate-500 leading-relaxed font-bold uppercase tracking-wide">
                        All monitored variant configurations exceed minimum threshold levels.
                      </p>
                    </div>
                  </div>
                ) : (
                  alerts.map((al, i) => (
                    <div key={i} className="bg-brand-bg/40 p-4 rounded-xl border border-border-subtle/50 flex justify-between items-center transition-all hover:border-rose-500/30 group">
                      <div className="space-y-1 max-w-[70%]">
                        <p className="text-[10px] font-black text-foreground uppercase truncate group-hover:text-orange-500 transition-colors">
                          {al.variant.product.name}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          {al.variant.size || 'N/A'} • {al.variant.color || 'N/A'} • SKU: {al.variant.sku}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                          {al.quantity} Left
                        </span>
                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Reorder @ {al.reorderLevel}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {alerts.length > 0 && (
              <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl text-center text-[9px] font-bold uppercase tracking-widest text-rose-400 mt-4 leading-relaxed">
                ⚠ {alerts.length} configurations are below safe thresholds. Issue supplier purchase orders immediately.
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
