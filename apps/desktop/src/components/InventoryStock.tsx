"use client";

import React from 'react';

export default function InventoryStock() {
  const stock = [
    { id: 1, name: 'Sugar Bread', code: 'BRD-SGR-01', made: 10, target: 20, status: 'Short 10 → tomorrow' },
    { id: 2, name: 'Tea Bread', code: 'BRD-TEA-01', made: 40, target: 80, status: 'Short 40 → tomorrow' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Stock Control</div>
          <h2 className="text-3xl font-bold text-[#1a1f2b]">Inventory Management</h2>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#1a1f2b] text-white text-xs font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
             Scan Barcode
          </button>
        </div>
      </div>

      {/* Production Run Card Replication */}
      <section className="bg-emerald-50/50 p-10 rounded-[40px] border border-emerald-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Production Run
          </div>
          <div className="flex items-start gap-8">
             <div className="text-7xl font-bold text-[#1a1f2b]">19</div>
             <div className="pt-2">
                <div className="text-2xl font-bold text-[#1a1f2b]">Sunday</div>
                <div className="text-sm font-bold text-slate-400">April 2026</div>
             </div>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-6 max-w-md">
            All actuals recorded. Any shortage carries forward to tomorrow's plan.
          </p>
        </div>
        <div className="absolute top-10 right-10 flex flex-col items-end gap-4">
           <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-200">Day Closed</span>
           <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan for</span>
              <span className="text-sm font-bold text-[#1a1f2b]">04/19/2026 📅</span>
           </div>
        </div>
      </section>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-6">
         {[
           { label: 'Jersey Types', value: '05', sub: 'active in catalog' },
           { label: 'Carry-over', value: '0', sub: 'no debt to clear' },
           { label: 'Total Target', value: '300', sub: 'units across all lanes' },
           { label: 'Progress', value: '83%', sub: '248 / 300 units', progress: 83 },
         ].map((s, i) => (
           <div key={i} className="bg-white p-8 rounded-[32px] border border-[#f0ebe4] relative overflow-hidden">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">{s.label}</div>
              <div className="text-3xl font-bold text-[#1a1f2b] mb-1">{s.value}</div>
              <div className="text-[10px] font-bold text-slate-400">{s.sub}</div>
              {s.progress && (
                <div className="absolute right-8 top-8 w-12 h-12 rounded-full border-4 border-[#fcf8f1] flex items-center justify-center text-[10px] font-black text-orange-500">
                   {s.progress}%
                </div>
              )}
           </div>
         ))}
      </div>

      {/* Production Lanes */}
      <div className="space-y-4">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#1a1f2b]">Production Lanes</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">🏷️ 5 lanes</span>
         </div>
         {stock.map((s, i) => (
           <div key={i} className="bg-white p-8 rounded-[32px] border border-[#f0ebe4] flex justify-between items-center hover:border-emerald-200 transition-all group">
              <div className="flex items-center gap-8">
                 <div className="text-2xl font-bold text-slate-200">0{i+1}</div>
                 <div>
                    <div className="text-lg font-bold text-[#1a1f2b] group-hover:text-emerald-600 transition-colors">{s.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.code}</div>
                 </div>
              </div>
              <div className="flex items-center gap-16">
                 <div className="text-center">
                    <div className="text-[8px] uppercase font-bold text-slate-400 mb-1">Made</div>
                    <div className="text-xl font-bold text-[#1a1f2b]">{s.made}</div>
                 </div>
                 <div className="text-center">
                    <div className="text-[8px] uppercase font-bold text-slate-400 mb-1">Target</div>
                    <div className="text-xl font-bold text-slate-400">{s.target}</div>
                 </div>
                 <div className="bg-orange-50 px-4 py-2 rounded-full border border-orange-100 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-orange-600">↺ {s.status}</span>
                 </div>
                 <div className="text-right">
                    <div className="text-[8px] uppercase font-bold text-slate-400 mb-1">Actual</div>
                    <div className="px-6 py-2 bg-[#fcf8f1] rounded-xl border border-[#f0ebe4] font-bold text-[#1a1f2b]">
                       {s.made} <span className="text-[10px] text-slate-400 uppercase ml-1">Units</span>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
