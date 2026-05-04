"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function InventoryDashboard() {
  const stats = [
    { label: 'Total Cash-Ins', value: 'GH₵0.00', sub: 'Revenue across 0 orders', icon: '💵' },
    { label: 'Marginal Profit', value: 'GH₵0.00', sub: 'After today\'s expenses', icon: '📈', badge: 'Positive' },
    { label: 'Today\'s Expenses', value: 'GH₵0.00', sub: 'Stock, bills, salaries', icon: '🧾', out: true },
    { label: 'Orders Rung Up', value: '0', sub: 'Across POS & Invoices', icon: '🛒' },
  ];

  return (
    <div className="space-y-10">
      {/* Executive Ledger Header */}
      <section className="bg-white/40 p-10 rounded-xl border border-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-orange-500" /> Executive Ledger
          </div>
          <h1 className="text-5xl font-bold text-[#1a1f2b] tracking-tight mb-3">
            Good morning, <span className="text-orange-500">Admin</span>
          </h1>
          <p className="text-slate-500 font-medium italic text-sm">
            "A jersey well counted is a jersey well earned."
          </p>
        </div>
        <div className="absolute top-0 right-0 p-10 text-right">
          <div className="bg-[#fdf3e7] p-6 rounded-lg border border-[#f0ebe4]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Entry For</div>
            <div className="text-sm font-bold text-[#1a1f2b]">Monday, April 20, 2026</div>
            <div className="text-[10px] text-emerald-500 font-bold flex items-center justify-end gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live updates on every sale
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-lg border border-[#f0ebe4] shadow-sm hover:shadow-md transition-shadow group relative"
          >
            <div className="w-10 h-10 rounded-xl bg-[#fcf8f1] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {stat.icon}
            </div>
            <div className="flex justify-between items-start mb-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{stat.label}</div>
              {stat.badge && <span className="text-[8px] uppercase font-black px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-200">Positive</span>}
              {stat.out && <span className="text-[8px] uppercase font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">Out</span>}
            </div>
            <div className="text-2xl font-bold text-[#1a1f2b] mb-1">{stat.value}</div>
            <div className="text-[10px] font-bold text-slate-400">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sales Performance Chart Placeholder */}
        <div className="col-span-8 bg-white p-10 rounded-xl border border-[#f0ebe4]">
          <div className="flex justify-between items-end mb-10">
            <div>
              <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Revenue • 7-day Trace</div>
              <h3 className="text-xl font-bold text-[#1a1f2b]">Sales Performance</h3>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Week to Date</div>
              <div className="text-xl font-bold text-[#1a1f2b]">GH₵60.00</div>
            </div>
          </div>
          <div className="h-[200px] flex items-end gap-8 px-4">
             {['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'].map((day, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <div className={`w-full rounded-t-xl transition-all ${i === 6 ? 'bg-orange-500 h-[120px]' : 'bg-[#fdf3e7] h-[20px] hover:bg-orange-200'}`} />
                  <div className="text-[10px] font-bold text-slate-300 uppercase">{day}</div>
               </div>
             ))}
          </div>
        </div>

        {/* Inventory Watch */}
        <div className="col-span-4 bg-white p-10 rounded-xl border border-[#f0ebe4]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Pantry Watch</div>
              <h3 className="text-xl font-bold text-[#1a1f2b]">Inventory Alerts</h3>
            </div>
            <span className="text-[8px] font-black uppercase px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full border border-emerald-200">All Good</span>
          </div>
          <div className="bg-[#f8faf8] p-6 rounded-lg border border-emerald-50 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">✓</div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Every jersey and footwear category is stocked above its threshold. No urgent restocks required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
