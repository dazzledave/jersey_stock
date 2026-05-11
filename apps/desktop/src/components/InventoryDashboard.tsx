"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ChartItem {
  name: string;
  value: number;
}

interface Summary {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  lowStockCount: number;
  chartData: ChartItem[];
}

interface Alert {
  variant: {
    sku: string;
    product: {
      name: string;
    };
  };
  quantity: number;
  reorderLevel: number;
}

export default function InventoryDashboard() {
  const [currency, setCurrency] = useState('GH₵');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
      if (parsed.exchangeRate) setExchangeRate(parsed.exchangeRate);
    }
    fetchData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, alertRes] = await Promise.all([
        fetch('http://localhost:4000/api/analytics/summary'),
        fetch('http://localhost:4000/api/analytics/low-stock')
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

  const stats = [
    { 
      label: 'Total Revenue', 
      value: `${currency}${((summary?.totalRevenue || 0) / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
      sub: `Across ${summary?.totalOrders || 0} transactions`, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      ) 
    },
    { 
      label: 'Marginal Profit', 
      value: `${currency}${((summary?.totalProfit || 0) / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
      sub: 'Net business earnings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
      ) 
    },
    { 
      label: 'Inventory Health', 
      value: (summary?.lowStockCount || 0).toString(), 
      sub: 'Low stock alerts', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      ) 
    },
    { 
      label: 'Order Volume', 
      value: (summary?.totalOrders || 0).toString(), 
      sub: 'Completed sales', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
      ) 
    },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-10">
      <section className="bg-surface/40 p-10 rounded-xl border border-border-subtle relative overflow-hidden backdrop-blur-sm">
        <div className="relative z-10">
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-orange-500" /> Executive Ledger
          </div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight mb-3">
            Welcome, <span className="text-orange-500">Admin</span>
          </h1>
          <p className="text-slate-500 font-medium italic text-sm">
            Real-time business performance overview for the Awards Centre.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-10 text-right">
          <div className="bg-brand-bg/50 p-6 rounded-lg border border-border-subtle backdrop-blur-md">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Today</div>
            <div className="text-sm font-bold text-foreground">{today}</div>
            <div className={`text-[10px] font-bold flex items-center justify-end gap-1.5 mt-1 ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} /> {isOnline ? 'Live Feed Active' : 'Feed Interrupted'}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface p-8 rounded-lg border border-border-subtle shadow-sm hover:shadow-md transition-shadow group relative"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-orange-500">
              {stat.icon}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-[10px] font-bold text-slate-400">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sales Performance Chart */}
        <div className="col-span-12 xl:col-span-8 bg-surface p-10 rounded-xl border border-border-subtle shadow-sm">
          <div className="flex justify-between items-end mb-10">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
              <div>
                <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Revenue Tracking</div>
                <h3 className="text-xl font-bold text-foreground">Sales Performance</h3>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">7-Day Period</div>
              <div className="text-xl font-bold text-foreground">{currency}{((summary?.chartData.reduce((acc, d) => acc + d.value, 0) || 0) / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          </div>
          <div className="h-[200px] flex items-end gap-8 px-4">
             {(summary?.chartData || []).map((day, i) => {
                const maxValue = Math.max(...(summary?.chartData.map(d => d.value) || [1]));
                const height = (day.value / maxValue) * 180 || 5;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                     <div className="relative w-full flex justify-center">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height }}
                          className={`w-full rounded-t-lg bg-orange-500/20 group-hover:bg-orange-500/40 transition-all cursor-pointer`} 
                        />
                        <div className="absolute -top-8 bg-foreground text-brand-bg text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {currency}{(day.value / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                     </div>
                     <div className="text-[10px] font-bold text-slate-300 uppercase">{day.name}</div>
                  </div>
                );
             })}
          </div>
        </div>

        {/* Inventory Watch */}
        <div className="col-span-12 xl:col-span-4 bg-surface p-10 rounded-xl border border-border-subtle shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <div>
                <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Stock Watch</div>
                <h3 className="text-xl font-bold text-foreground">Inventory Alerts</h3>
              </div>
            </div>
            <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${alerts.length > 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {alerts.length} Critical
            </span>
          </div>
          
          <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="bg-brand-bg p-6 rounded-lg border border-border-subtle flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-emerald-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Stock levels are optimal. No reorder actions required currently.
                </p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <div key={i} className="bg-brand-bg p-4 rounded-lg border border-border-subtle flex justify-between items-center group hover:border-rose-300/30 transition-colors">
                  <div>
                    <p className="text-[10px] font-black text-foreground uppercase truncate w-32">{alert.variant.product.name}</p>
                    <p className="text-[9px] font-bold text-slate-400">{alert.variant.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-500">{alert.quantity} Left</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Reorder @ {alert.reorderLevel}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
