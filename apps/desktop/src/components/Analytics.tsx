"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricGroup {
  revenue: number;
  profit: number;
  margin: number;
  transactions: number;
  avgBasket: number;
}

interface TrendItem {
  name: string;
  value: number;
  profit: number;
}

interface CategoryItem {
  name: string;
  value: number;
  quantity: number;
}

interface PaymentItem {
  method: string;
  value: number;
  count: number;
}

interface ProductItem {
  name: string;
  quantity: number;
  revenue: number;
  stock: number;
}

interface LossPrevention {
  refundCount: number;
  refundAmount: number;
  totalDiscounts: number;
  discountPercent: number;
}

interface DetailedData {
  currentMonth: MetricGroup;
  previousMonth: MetricGroup;
  trendData: TrendItem[];
  categoryData: CategoryItem[];
  paymentBreakdown: PaymentItem[];
  hourlySales: { hour: number; value: number }[];
  dailySales: { day: string; value: number }[];
  topProducts: ProductItem[];
  slowMovers: ProductItem[];
  lossPrevention: LossPrevention;
}

export default function Analytics() {
  const [data, setData] = useState<DetailedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('GH₵');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [viewMode, setViewMode] = useState<'month' | 'trend'>('month');

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
      if (parsed.exchangeRate) setExchangeRate(parsed.exchangeRate);
    }
    fetchDetailed();
  }, []);

  const fetchDetailed = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics/detailed');
      const json = await res.json();
      setData(json);
      
      // Auto-switch to trend view if there is more than 1 month with actual sales
      const activeMonthsCount = json.trendData?.filter((d: any) => d.value > 0).length || 0;
      if (activeMonthsCount > 1) {
        setViewMode('trend');
      } else {
        setViewMode('month');
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const renderTrendIndicator = (percent: number) => {
    const isUp = percent >= 0;
    return (
      <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
        isUp ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
      }`}>
        {isUp ? '▲' : '▼'} {Math.abs(percent).toFixed(1)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Assembling Store Insights...</p>
      </div>
    );
  }

  const cur = currency;
  const rate = currency === 'GH₵' ? 1 : (exchangeRate || 1);

  const cMonth = data?.currentMonth || { revenue: 0, profit: 0, margin: 0, transactions: 0, avgBasket: 0 };
  const pMonth = data?.previousMonth || { revenue: 0, profit: 0, margin: 0, transactions: 0, avgBasket: 0 };

  const revChange = getPercentageChange(cMonth.revenue, pMonth.revenue);
  const profitChange = getPercentageChange(cMonth.profit, pMonth.profit);
  const transChange = getPercentageChange(cMonth.transactions, pMonth.transactions);
  const avgBasketChange = getPercentageChange(cMonth.avgBasket, pMonth.avgBasket);

  return (
    <div className="space-y-8 bg-brand-bg/50 min-h-full pb-12">
      {/* Upper header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Business Intelligence
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Executive Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface border border-border-subtle p-1 rounded-lg flex gap-1 shadow-sm">
            <button 
              onClick={() => setViewMode('month')} 
              className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'month' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button 
              onClick={() => setViewMode('trend')} 
              className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'trend' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              12-Month Trend
            </button>
          </div>
          <button onClick={fetchDetailed} className="bg-surface border border-border-subtle text-foreground text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-brand-bg transition-all shadow-sm flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
             Refresh
          </button>
        </div>
      </div>

      {/* Row of Tight Premium Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Gross Profit Card */}
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Gross Profit</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V5"/></svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">{cur}{(cMonth.profit / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <div className="flex items-center gap-2 mt-2">
              {renderTrendIndicator(profitChange)}
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">vs last month</span>
            </div>
          </div>
        </div>

        {/* Profit Margin Card */}
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Margin %</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">{cMonth.margin.toFixed(1)}%</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[9px] font-bold ${cMonth.margin >= pMonth.margin ? 'text-emerald-500' : 'text-rose-500'}`}>
                {cMonth.margin >= pMonth.margin ? '▲' : '▼'} {Math.abs(cMonth.margin - pMonth.margin).toFixed(1)}%
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">point shift</span>
            </div>
          </div>
        </div>

        {/* Revenue Card (Secondary) */}
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Gross Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">{cur}{(cMonth.revenue / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <div className="flex items-center gap-2 mt-2">
              {renderTrendIndicator(revChange)}
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">vs last month</span>
            </div>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Transactions</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">{cMonth.transactions} Sales</h3>
            <div className="flex items-center gap-2 mt-2">
              {renderTrendIndicator(transChange)}
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">vs last month</span>
            </div>
          </div>
        </div>

        {/* Avg Basket Value */}
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Avg Basket</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">{cur}{(cMonth.avgBasket / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <div className="flex items-center gap-2 mt-2">
              {renderTrendIndicator(avgBasketChange)}
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Key Metric Comparisons */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 bg-surface p-8 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {viewMode === 'month' ? (
              <motion.div 
                key="month-detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Active Month Analysis</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Comparing performance metrics relative to the preceding calendar cycle</p>
                </div>
                
                <div className="grid grid-cols-3 gap-6 pt-4">
                  {/* Revenue PoP */}
                  <div className="p-4 bg-brand-bg/40 border border-border-subtle/55 rounded-xl text-center space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Revenue Status</p>
                    <p className="text-xs text-slate-500 font-bold uppercase">This: <span className="text-foreground font-black">{cur}{(cMonth.revenue / rate).toFixed(0)}</span></p>
                    <p className="text-xs text-slate-500 font-bold uppercase">Last: <span className="text-foreground font-black">{cur}{(pMonth.revenue / rate).toFixed(0)}</span></p>
                    <div className="flex justify-center pt-2">
                      {renderTrendIndicator(revChange)}
                    </div>
                  </div>
                  
                  {/* Profit PoP */}
                  <div className="p-4 bg-brand-bg/40 border border-border-subtle/55 rounded-xl text-center space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gross Profit Status</p>
                    <p className="text-xs text-slate-500 font-bold uppercase">This: <span className="text-emerald-500 font-black">{cur}{(cMonth.profit / rate).toFixed(0)}</span></p>
                    <p className="text-xs text-slate-500 font-bold uppercase">Last: <span className="text-slate-300 font-black">{cur}{(pMonth.profit / rate).toFixed(0)}</span></p>
                    <div className="flex justify-center pt-2">
                      {renderTrendIndicator(profitChange)}
                    </div>
                  </div>

                  {/* Volume PoP */}
                  <div className="p-4 bg-brand-bg/40 border border-border-subtle/55 rounded-xl text-center space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Transaction Volume</p>
                    <p className="text-xs text-slate-500 font-bold uppercase">This: <span className="text-foreground font-black">{cMonth.transactions} orders</span></p>
                    <p className="text-xs text-slate-500 font-bold uppercase">Last: <span className="text-foreground font-black">{pMonth.transactions} orders</span></p>
                    <div className="flex justify-center pt-2">
                      {renderTrendIndicator(transChange)}
                    </div>
                  </div>
                </div>

                <div className="bg-brand-bg/25 border border-border-subtle p-5 rounded-xl">
                  <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3">Operating Summary</h4>
                  <p className="text-xs font-medium leading-relaxed text-slate-400">
                    Your store operates at an average profit margin of <strong className="text-white">{cMonth.margin.toFixed(1)}%</strong> this month. 
                    {cMonth.profit >= pMonth.profit 
                      ? " Gross profits are currently trending in positive territory compared to last month. Keep monitoring top performing product items."
                      : " Operational margins and net revenues show a contraction relative to the previous month. Standard pricing controls or sales push might be required."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="trend-detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">12-Month Performance Trend</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Visualizing gross revenue & gross profit distribution</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total 12M Revenue</span>
                    <span className="text-lg font-black text-foreground">{cur}{((data?.trendData.reduce((s, d) => s + d.value, 0) || 0) / rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="h-[240px] flex items-end gap-3 px-4 relative pt-10">
                  <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-5">
                    {[1,2,3,4].map(i => <div key={i} className="border-t border-slate-400 w-full" />)}
                  </div>
                  
                  {(data?.trendData || []).map((item, i) => {
                    const maxValue = Math.max(...(data?.trendData.map(d => d.value) || [1]));
                    const barHeight = maxValue > 0 ? (item.value / maxValue) * 180 : 4;
                    const profitHeight = maxValue > 0 ? (Math.max(item.profit, 0) / maxValue) * 180 : 0;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="relative w-full flex justify-center items-end h-full">
                          {/* Total Revenue Bar */}
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: Math.max(barHeight, 4) }}
                            className="w-full bg-slate-800 rounded-t-sm relative flex justify-center items-end cursor-pointer group-hover:bg-slate-700/80 transition-colors"
                          >
                            {/* Nested Profit Bar */}
                            {profitHeight > 0 && (
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: profitHeight }}
                                className="w-full bg-orange-500 rounded-t-sm hover:bg-orange-600 transition-colors"
                              />
                            )}
                          </motion.div>
                          
                          {item.value > 0 && (
                            <div className="absolute -top-12 bg-slate-900 border border-border-subtle text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 flex flex-col text-left">
                              <span>REV: {cur}{(item.value / rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              <span className="text-orange-500">PROFIT: {cur}{(item.profit / rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{item.name}</div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-slate-400 border-t border-border-subtle/50 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-slate-800 border border-slate-700 rounded-sm"></div>
                    <span>Gross Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></div>
                    <span className="text-orange-500">Gross Profit (Take Home)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category breakdown (Sleek side progress list) */}
        <div className="col-span-4 bg-surface p-8 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.15em]">Inventory Volumes</div>
              <h3 className="text-base font-black text-foreground uppercase tracking-tight">Category Shares</h3>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
            {!data || data.categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-6 opacity-30">
                <p className="text-[9px] font-black uppercase tracking-widest">No Category Data</p>
              </div>
            ) : (
              data.categoryData.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest">
                    <span className="text-foreground">{cat.name}</span>
                    <span className="text-orange-500">{cur}{(cat.value / rate).toFixed(0)}</span>
                  </div>
                  <div className="h-1 w-full bg-brand-bg rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.value / (data.categoryData.reduce((s, c) => s + c.value, 0) || 1)) * 100}%` }}
                      className="h-full bg-orange-500 rounded-full"
                    />
                  </div>
                  <p className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest">{cat.quantity} units sold</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reconciliation: Payment Methods, Best Sellers, Dead Movers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Payment Reconciliation */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-sm space-y-5">
          <h4 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border-subtle/50 pb-3">Payment Reconciliation</h4>
          <div className="space-y-4">
            {(data?.paymentBreakdown || []).map((pay, i) => {
              const totalVal = data?.paymentBreakdown.reduce((acc, p) => acc + p.value, 0) || 1;
              const percent = (pay.value / totalVal) * 100;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-300">{pay.method} ({pay.count} sales)</span>
                    <span className="text-foreground">{cur}{(pay.value / rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="h-1.5 w-full bg-brand-bg rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full ${
                        pay.method === 'CASH' ? 'bg-orange-500' : pay.method === 'MOMO' ? 'bg-indigo-500' : pay.method === 'CARD' ? 'bg-purple-500' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Product Movers */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-sm space-y-4">
          <h4 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border-subtle/50 pb-3 text-emerald-500">Top Selling Products</h4>
          <div className="space-y-3">
            {(!data || data.topProducts.length === 0) ? (
              <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest py-6">No sales recorded</p>
            ) : data.topProducts.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-brand-bg/30 p-2.5 rounded-lg border border-border-subtle/40">
                <div className="space-y-0.5 truncate max-w-[70%]">
                  <p className="text-[10px] font-black text-foreground uppercase truncate tracking-tight">{p.name}</p>
                  <p className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest">{p.quantity} items purchased</p>
                </div>
                <span className="text-[10px] font-black text-emerald-500">{cur}{(p.revenue / rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dead/Slow Movers */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-sm space-y-4">
          <h4 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border-subtle/50 pb-3 text-rose-500">Slow & Dead Movers</h4>
          <div className="space-y-3">
            {(!data || data.slowMovers.length === 0) ? (
              <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest py-6">No inventory tracked</p>
            ) : data.slowMovers.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-brand-bg/30 p-2.5 rounded-lg border border-border-subtle/40">
                <div className="space-y-0.5 truncate max-w-[75%]">
                  <p className="text-[10px] font-black text-foreground uppercase truncate tracking-tight">{p.name}</p>
                  <p className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest">Total Sales: {p.quantity} | Stock: {p.stock} units</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${p.quantity === 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                  {p.quantity === 0 ? 'Dead' : 'Slow'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly / Daily Peaks & Loss Prevention metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hourly Peak Periods */}
        <div className="col-span-1 md:col-span-2 bg-surface p-6 rounded-xl border border-border-subtle shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border-subtle/50 pb-3">
            <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Hourly Peak Demands</h4>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Staff Scheduling Insight</span>
          </div>
          
          <div className="h-[120px] flex items-end gap-1 px-2 pt-4 relative">
            {(!data || data.hourlySales.length === 0) ? (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">No active chart data</div>
            ) : data.hourlySales.map((h, i) => {
              const maxVal = Math.max(...data.hourlySales.map(item => item.value)) || 1;
              const hHeight = (h.value / maxVal) * 80;
              const isPeak = h.value === maxVal && maxVal > 0;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end" title={`${h.hour}:00 - ${cur}${h.value.toFixed(0)}`}>
                  <div className="w-full flex justify-center items-end h-full relative">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: Math.max(hHeight, 2) }}
                      className={`w-full rounded-t-sm transition-all cursor-pointer ${isPeak ? 'bg-orange-500' : 'bg-slate-700 group-hover:bg-slate-600'}`}
                    />
                  </div>
                  <span className="text-[7px] text-slate-500 font-bold scale-90">{h.hour}h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loss Prevention Loop */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-sm space-y-4">
          <h4 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border-subtle/50 pb-3">Loss & Discount Metrics</h4>
          <div className="space-y-4 pt-1">
            {/* Refunds Card */}
            <div className="flex justify-between items-center bg-brand-bg/40 p-3 rounded-xl border border-border-subtle/30">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Refunds / Voids</p>
                <p className="text-sm font-black text-rose-500 mt-1">{data?.lossPrevention.refundCount} actions</p>
              </div>
              <span className="text-xs font-black text-rose-400">{cur}{( (data?.lossPrevention.refundAmount || 0) / rate).toFixed(0)}</span>
            </div>

            {/* Discounts Percent */}
            <div className="flex justify-between items-center bg-brand-bg/40 p-3 rounded-xl border border-border-subtle/30">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Discounts Applied</p>
                <p className="text-sm font-black text-orange-500 mt-1">{data?.lossPrevention.discountPercent.toFixed(1)}% of potential</p>
              </div>
              <span className="text-xs font-black text-orange-400">{cur}{( (data?.lossPrevention.totalDiscounts || 0) / rate).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
