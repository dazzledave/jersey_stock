"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerList() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const customers = [
    { id: 1, name: 'Kristine', created: '4/19/2026', lifetimeValue: 0, orders: 0, initial: 'K', color: 'bg-orange-400' },
    { id: 2, name: 'Lydia', created: '4/19/2026', lifetimeValue: 0, orders: 0, initial: 'L', color: 'bg-blue-400' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Customer CRM</div>
          <h2 className="text-3xl font-bold text-[#1a1f2b]">Patron Management</h2>
        </div>
        <button className="bg-[#1a1f2b] text-white text-xs font-bold px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all">
          <span className="text-lg">+</span> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Left List */}
        <div className="col-span-4 bg-white rounded-xl border border-[#f0ebe4] overflow-hidden">
          <div className="p-6 border-b border-[#fcf8f1]">
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full bg-[#fcf8f1] p-3 rounded-lg border border-[#f0ebe4] text-xs font-medium outline-none"
            />
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-widest bg-[#fcf8f1]/50">
                <th className="p-6">Name</th>
                <th className="p-6">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#fcf8f1]">
              {customers.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCustomer(c)}
                  className={`cursor-pointer hover:bg-[#fcf8f1]/50 transition-all ${selectedCustomer?.id === c.id ? 'bg-[#fcf8f1]' : ''}`}
                >
                  <td className="p-6 font-bold text-sm">{c.name}</td>
                  <td className="p-6 text-xs text-slate-400 font-bold">{c.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Details - Replicating the Screenshot Card */}
        <div className="col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white p-10 rounded-xl border border-[#f0ebe4] shadow-sm space-y-10"
              >
                {/* Patron Dossier Card Header */}
                <div className="bg-gradient-to-br from-[#fff7ed] to-white p-10 rounded-xl border border-orange-100 flex justify-between items-center relative overflow-hidden">
                   <div className="flex items-center gap-8 relative z-10">
                      <div className={`w-24 h-24 rounded-full ${selectedCustomer.color} flex items-center justify-center text-4xl text-white font-bold shadow-2xl shadow-orange-200`}>
                        {selectedCustomer.initial}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1 flex items-center gap-2">
                           <span className="w-4 h-[1px] bg-orange-500" /> Patron Dossier <span className="text-slate-300">— Since {selectedCustomer.created}</span>
                        </div>
                        <h3 className="text-4xl font-bold text-[#1a1f2b]">{selectedCustomer.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium">No contact details on file</p>
                      </div>
                   </div>
                   <div className="text-right relative z-10">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Lifetime Value</div>
                      <div className="text-3xl font-bold text-[#1a1f2b]">GH₵{selectedCustomer.lifetimeValue.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">{selectedCustomer.orders} orders</div>
                   </div>
                   {/* Decorative background circle */}
                   <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50" />
                </div>

                {/* Sub Stats */}
                <div className="grid grid-cols-4 gap-8">
                   {[
                     { label: 'Avg Order', value: 'GH₵0.00' },
                     { label: 'Last Seen', value: '—' },
                     { label: 'Credit', value: 'GH₵0.00' },
                     { label: 'Orders', value: '0' },
                   ].map((s, i) => (
                     <div key={i} className="space-y-2">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{s.label}</div>
                        <div className="text-lg font-bold text-[#1a1f2b]">{s.value}</div>
                        <div className="w-8 h-[2px] bg-slate-100" />
                     </div>
                   ))}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4">
                   <div className="flex gap-3">
                      <button className="px-6 py-2.5 bg-[#1a1f2b] text-white rounded-lg text-xs font-bold">Overview</button>
                      <button className="px-6 py-2.5 bg-white text-slate-400 border border-[#f0ebe4] rounded-lg text-xs font-bold">Orders <span className="opacity-50 ml-1">0</span></button>
                      <button className="px-6 py-2.5 bg-white text-slate-400 border border-[#f0ebe4] rounded-lg text-xs font-bold">Payments</button>
                   </div>
                   <div className="flex gap-3">
                      <button className="px-6 py-2.5 bg-white text-slate-800 border border-[#f0ebe4] rounded-lg text-xs font-bold flex items-center gap-2">
                         <span>📄</span> Print Report
                      </button>
                      <button className="px-6 py-2.5 bg-[#1a1f2b] text-white rounded-lg text-xs font-bold">
                         + New Sale
                      </button>
                      <button className="px-6 py-2.5 bg-white text-orange-400 border border-orange-100 rounded-lg text-xs font-bold">
                         Deactivate
                      </button>
                   </div>
                </div>

                {/* Cadence Section - Replicating the Circles */}
                <div className="pt-8 border-t border-[#fcf8f1]">
                   <div className="flex justify-between items-end mb-10">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1 flex items-center gap-2">
                           <span className="w-2 h-2 bg-orange-200 rounded-sm flex items-center justify-center text-[6px] text-orange-600">01</span> Cadence
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Share of patron's peak period</p>
                      </div>
                   </div>

                   <div className="flex justify-between gap-4">
                      {['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'].map((t, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4">
                           <div className="w-20 h-20 rounded-full border-[6px] border-[#fcf8f1] flex flex-col items-center justify-center relative">
                              <div className="text-[10px] font-bold text-[#1a1f2b]">GH₵0.00</div>
                              <div className="text-[8px] font-black text-slate-300">0%</div>
                           </div>
                           <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t}</div>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] bg-white/40 border-2 border-dashed border-[#f0ebe4] rounded-xl flex flex-col items-center justify-center gap-4 text-slate-300">
                <div className="text-4xl">👥</div>
                <p className="font-bold uppercase tracking-widest text-xs">Select a customer to view dossier</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
