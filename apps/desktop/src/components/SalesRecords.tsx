"use client";

import React, { useState, useEffect } from 'react';

export default function SalesRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [currency, setCurrency] = useState('GH₵');

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
    }
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Transaction Ledger</div>
          <h2 className="text-3xl font-bold text-foreground">Sales Records</h2>
        </div>
        <div className="flex gap-3">
          <input type="date" className="bg-surface px-4 py-2 rounded-lg border border-border-subtle text-xs font-bold text-foreground" />
          <button className="bg-foreground text-brand-bg text-xs font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-all">
             Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-bg/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="p-8 border-b border-border-subtle/50">Reference</th>
              <th className="p-8 border-b border-border-subtle/50">Timestamp</th>
              <th className="p-8 border-b border-border-subtle/50">Customer</th>
              <th className="p-8 border-b border-border-subtle/50">Amount</th>
              <th className="p-8 border-b border-border-subtle/50">Method</th>
              <th className="p-8 border-b border-border-subtle/50">Status</th>
              <th className="p-8 border-b border-border-subtle/50 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">
                  No sales recorded yet
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-brand-bg/30 transition-all">
                  <td className="p-8 font-bold text-sm text-foreground">{r.id}</td>
                  <td className="p-8 text-xs text-slate-400 font-bold">{r.date}</td>
                  <td className="p-8 text-sm font-medium text-foreground">{r.customer}</td>
                  <td className="p-8 font-bold text-foreground">{currency}{r.amount.toFixed(2)}</td>
                  <td className="p-8">
                     <span className="px-3 py-1 bg-brand-bg rounded-lg text-[10px] font-black text-slate-500 border border-border-subtle uppercase">{r.method}</span>
                  </td>
                  <td className="p-8">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                       r.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                     }`}>
                       {r.status}
                     </span>
                  </td>
                  <td className="p-8 text-right">
                     <button className="text-[10px] font-bold text-foreground hover:underline">View Receipt</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
