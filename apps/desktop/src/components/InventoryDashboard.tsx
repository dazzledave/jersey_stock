"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function InventoryDashboard() {
  const [currency, setCurrency] = useState('GH₵');

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
    }
  }, []);

  const stats = [
    { label: 'Total Cash-Ins', value: `${currency}0.00`, sub: 'Revenue across 0 orders', icon: '💵' },
    { label: 'Marginal Profit', value: `${currency}0.00`, sub: 'After expenses', icon: '📈' },
    { label: 'Today\'s Expenses', value: `${currency}0.00`, sub: 'Stock & bills', icon: '🧾' },
    { label: 'Orders Rung Up', value: '0', sub: 'System total', icon: '🛒' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-10">
      {/* Executive Ledger Header */}
      <section className="bg-white/40 p-10 rounded-xl border border-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-orange-500" /> Executive Ledger
          </div>
          <h1 className="text-5xl font-bold text-[#1a1f2b] tracking-tight mb-3">
            Welcome, <span className="text-orange-500">Admin</span>
          </h1>
          <p className="text-slate-500 font-medium italic text-sm">
            Ready to manage your Awards Centre catalog.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-10 text-right">
          <div className="bg-[#fdf3e7] p-6 rounded-lg border border-[#f0ebe4]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Today</div>
            <div className="text-sm font-bold text-[#1a1f2b]">{today}</div>
            <div className="text-[10px] text-emerald-500 font-bold flex items-center justify-end gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> System Active
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
              <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Revenue Tracking</div>
              <h3 className="text-xl font-bold text-[#1a1f2b]">Sales Performance</h3>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">7-Day Period</div>
              <div className="text-xl font-bold text-[#1a1f2b]">{currency}0.00</div>
            </div>
          </div>
          <div className="h-[200px] flex items-end gap-8 px-4">
             {['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'].map((day, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <div className={`w-full rounded-t-lg bg-[#fdf3e7] h-[10px] hover:bg-orange-200 transition-all`} />
                  <div className="text-[10px] font-bold text-slate-300 uppercase">{day}</div>
               </div>
             ))}
          </div>
        </div>

        {/* Inventory Watch */}
        <div className="col-span-4 bg-white p-10 rounded-xl border border-[#f0ebe4]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Stock Watch</div>
              <h3 className="text-xl font-bold text-[#1a1f2b]">Inventory Alerts</h3>
            </div>
            <span className="text-[8px] font-black uppercase px-3 py-1 bg-slate-100 text-slate-400 rounded-full border border-slate-200">Checking...</span>
          </div>
          <div className="bg-[#fcf8f1] p-6 rounded-lg border border-[#f0ebe4] flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs">?</div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Start adding products and recording sales to see stock alerts here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
