"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerList() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const customers: any[] = [];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Customer CRM</div>
          <h2 className="text-3xl font-bold text-foreground">Patron Management</h2>
        </div>
        <button className="bg-foreground text-brand-bg text-xs font-bold px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all">
          <span className="text-lg">+</span> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Left List */}
        <div className="col-span-4 bg-surface rounded-xl border border-border-subtle overflow-hidden min-h-[400px] shadow-sm">
          <div className="p-6 border-b border-border-subtle/50">
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full bg-brand-bg p-3 rounded-lg border border-border-subtle text-xs font-medium outline-none text-foreground placeholder:text-slate-400"
            />
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-widest bg-brand-bg/50">
                <th className="p-6">Name</th>
                <th className="p-6">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/30">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-10 text-center text-slate-200 text-[10px] font-bold uppercase tracking-widest">
                    No customers on file
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => setSelectedCustomer(c)}
                    className={`cursor-pointer hover:bg-brand-bg/50 transition-all ${selectedCustomer?.id === c.id ? 'bg-brand-bg' : ''}`}
                  >
                    <td className="p-6 font-bold text-sm text-foreground">{c.name}</td>
                    <td className="p-6 text-xs text-slate-400 font-bold">{c.created}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Details */}
        <div className="col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-surface p-10 rounded-xl border border-border-subtle shadow-sm space-y-10"
              >
                {/* Content would go here */}
              </motion.div>
            ) : (
              <div className="h-[600px] bg-surface/20 border-2 border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center gap-4 text-slate-300 backdrop-blur-sm">
                <div className="text-4xl">👥</div>
                <p className="font-bold uppercase tracking-widest text-xs text-slate-400">Select a customer to view dossier</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
