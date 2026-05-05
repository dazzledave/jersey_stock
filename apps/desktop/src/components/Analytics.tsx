"use client";

import React from 'react';

export default function Analytics() {
  return (
    <div className="space-y-10 bg-brand-bg/50 h-full p-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Business Intelligence
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Store Analytics</h2>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface border border-border-subtle text-foreground text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-brand-bg transition-all shadow-sm">
             Last 30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
         <div className="col-span-8 bg-surface p-10 rounded-xl border border-border-subtle shadow-sm">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em]">Revenue Trend</div>
                <h3 className="text-xl font-bold text-foreground">Monthly Performance</h3>
              </div>
            </div>
            
            <div className="h-[300px] flex items-end gap-4 px-4 relative">
               {/* Grid lines */}
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                  {[1,2,3,4].map(i => <div key={i} className="border-t border-slate-300 w-full" />)}
               </div>
               {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((v, i) => (
                 <div key={i} className="flex-1 bg-brand-bg/50 rounded-t-lg hover:bg-orange-500 transition-all cursor-pointer relative group h-[5px]">
                 </div>
               ))}
            </div>
            <div className="flex justify-between mt-6 px-4">
               {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                 <span key={m} className="text-[10px] font-bold text-slate-300 uppercase">{m}</span>
               ))}
            </div>
         </div>

         <div className="col-span-4 space-y-8">
            <div className="bg-surface p-10 rounded-xl border border-border-subtle shadow-sm">
               <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-4">Category Breakdown</div>
               <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-brand-bg mx-auto flex items-center justify-center text-slate-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Transaction Data</p>
               </div>
            </div>

            <div className="bg-foreground p-10 rounded-xl text-brand-bg shadow-2xl relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10">
                 <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
               </div>
               <div className="text-[10px] uppercase font-bold text-orange-400 tracking-[0.2em] mb-4">Executive Summary</div>
               <p className="text-sm opacity-80 leading-relaxed font-medium relative z-10">
                  Welcome to your new business intelligence suite. Once you record your first sales, automated performance insights and profit tracking will appear here in real-time.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
