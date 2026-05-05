"use client";

import React from 'react';

export default function SalesRecords() {
  const records: any[] = [];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Transaction Ledger</div>
          <h2 className="text-3xl font-bold text-[#1a1f2b]">Sales Records</h2>
        </div>
        <div className="flex gap-3">
          <input type="date" className="bg-white px-4 py-2 rounded-lg border border-[#f0ebe4] text-xs font-bold" />
          <button className="bg-[#1a1f2b] text-white text-xs font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-all">
             Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#f0ebe4] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#fcf8f1]/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="p-8">Reference</th>
              <th className="p-8">Timestamp</th>
              <th className="p-8">Customer</th>
              <th className="p-8">Amount</th>
              <th className="p-8">Method</th>
              <th className="p-8">Status</th>
              <th className="p-8 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#fcf8f1]">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">
                  No sales recorded yet
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-[#fcf8f1]/30 transition-all">
                  <td className="p-8 font-bold text-sm text-[#1a1f2b]">{r.id}</td>
                  <td className="p-8 text-xs text-slate-400 font-bold">{r.date}</td>
                  <td className="p-8 text-sm font-medium">{r.customer}</td>
                  <td className="p-8 font-bold text-[#1a1f2b]">GH₵{r.amount.toFixed(2)}</td>
                  <td className="p-8">
                     <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 border border-slate-200 uppercase">{r.method}</span>
                  </td>
                  <td className="p-8">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                       r.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                     }`}>
                       {r.status}
                     </span>
                  </td>
                  <td className="p-8 text-right">
                     <button className="text-[10px] font-bold text-[#1a1f2b] hover:underline">View Receipt</button>
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
