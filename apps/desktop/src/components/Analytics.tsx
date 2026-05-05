"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TrendItem {
  name: string;
  value: number;
}

interface CategoryItem {
  name: string;
  value: number;
  quantity: number;
}

interface DetailedData {
  trendData: TrendItem[];
  categoryData: CategoryItem[];
}

export default function Analytics() {
  const [data, setData] = useState<DetailedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('GH₵');

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
    }
    fetchDetailed();
  }, []);

  const fetchDetailed = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/analytics/detailed');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAnnualRevenue = data?.trendData.reduce((acc, item) => acc + item.value, 0) || 0;

  return (
    <div className="space-y-10 bg-brand-bg/50 h-full p-10 custom-scrollbar overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Business Intelligence
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight uppercase">Store Analytics</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchDetailed} className="bg-surface border border-border-subtle text-foreground text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-brand-bg transition-all shadow-sm flex items-center gap-2">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
             Refresh Feed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
         {/* Monthly Trend Chart */}
         <div className="col-span-8 bg-surface p-10 rounded-xl border border-border-subtle shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em]">Revenue Trend</div>
                  <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">12-Month Performance</h3>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Period Revenue</p>
                 <p className="text-2xl font-black text-foreground">{currency}{totalAnnualRevenue.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="h-[300px] flex items-end gap-3 px-4 relative">
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                  {[1,2,3,4,5].map(i => <div key={i} className="border-t border-slate-400 w-full" />)}
               </div>
               
               {isLoading ? (
                 <div className="w-full h-full flex items-center justify-center text-slate-300 font-black uppercase tracking-[0.3em] animate-pulse">Analyzing Trends...</div>
               ) : (data?.trendData || []).map((item, i) => {
                 const maxValue = Math.max(...(data?.trendData.map(d => d.value) || [1]));
                 const height = maxValue > 0 ? (item.value / maxValue) * 280 : 2;
                 
                 return (
                   <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                      <div className="relative w-full flex justify-center items-end h-full">
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: Math.max(height, 4) }}
                           className={`w-full rounded-t-md transition-all cursor-pointer ${item.value === maxValue ? 'bg-orange-500' : 'bg-orange-500/20 group-hover:bg-orange-500/40'}`} 
                         />
                         {item.value > 0 && (
                            <div className="absolute -top-10 bg-foreground text-brand-bg text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20">
                              {currency}{item.value.toLocaleString()}
                            </div>
                         )}
                      </div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.name}</div>
                   </div>
                 );
               })}
            </div>
         </div>

         {/* Category Breakdown */}
         <div className="col-span-4 space-y-8">
            <div className="bg-surface p-10 rounded-xl border border-border-subtle shadow-sm flex flex-col h-full min-h-[400px]">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center text-orange-500">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em]">Inventory Insights</div>
                    <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">Category Sales</h3>
                  </div>
               </div>

               <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center opacity-20">Analyzing Inventory...</div>
                  ) : !data || data.categoryData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4 opacity-40">
                       <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                       <p className="text-[10px] font-black uppercase tracking-widest">No Sales Data for Categories</p>
                    </div>
                  ) : (
                    data.categoryData.map((cat, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-foreground uppercase tracking-tight">{cat.name}</span>
                            <span className="text-[10px] font-black text-orange-500">{currency}{cat.value.toLocaleString()}</span>
                         </div>
                         <div className="h-1.5 w-full bg-brand-bg rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(cat.value / (data.categoryData.reduce((s, c) => s + c.value, 0) || 1)) * 100}%` }}
                              className="h-full bg-orange-500 rounded-full"
                            />
                         </div>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{cat.quantity} units sold</p>
                      </div>
                    ))
                  )}
               </div>
            </div>

            <div className="bg-foreground p-10 rounded-xl text-brand-bg shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                 <svg className="w-40 h-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
               </div>
               <div className="text-[10px] uppercase font-bold text-orange-400 tracking-[0.2em] mb-4">Executive Outlook</div>
               <p className="text-sm opacity-90 leading-relaxed font-medium relative z-10">
                  {totalAnnualRevenue > 0 
                    ? `Your store has generated ${currency}${totalAnnualRevenue.toLocaleString()} in the last 12 months. Focus on expanding the top performing categories to maximize seasonal growth.`
                    : "No transactional data detected in the cloud ledger. Record a sale to begin generating executive performance insights and trend forecasts."}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
