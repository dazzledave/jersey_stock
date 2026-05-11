"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SaleItem {
  id: string;
  quantity: number;
  price: number;
  variant: {
    sku: string;
    size: string;
    color: string;
    product: {
      name: string;
    };
  };
}

interface Sale {
  id: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: string;
  soldBy?: string;
  debtorName?: string;
  authorizer?: string;
  customer?: {
    name: string;
    phone: string;
  };
  items: SaleItem[];
}

export default function SalesRecords() {
  const [records, setRecords] = useState<Sale[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Sale[]>([]);
  const [currency, setCurrency] = useState('GH₵');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
      if (parsed.exchangeRate) setExchangeRate(parsed.exchangeRate);
    }
    fetchSales();
  }, []);

  useEffect(() => {
    if (dateFilter) {
      const filtered = records.filter(r => 
        new Date(r.createdAt).toISOString().split('T')[0] === dateFilter
      );
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(records);
    }
  }, [dateFilter, records]);

  const fetchSales = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/sales');
      const data = await response.json();
      setRecords(data);
      setFilteredRecords(data);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Reference', 'Timestamp', 'Staff', 'Type', 'Customer', 'Amount', 'Method', 'Debtor/Authorizer', 'Items'];
    
    // Helper to escape values for CSV
    const escape = (val: any) => {
      const stringVal = String(val === null || val === undefined ? '' : val);
      const escaped = stringVal.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const csvRows = [
      headers.map(escape).join(','),
      ...filteredRecords.map(r => [
        r.id,
        new Date(r.createdAt).toLocaleString().replace(',', ''),
        r.soldBy || 'System',
        r.debtorName ? 'Credit' : r.paymentMethod === 'free' ? 'Free' : 'Standard',
        r.customer?.name || 'Walk-in',
        r.totalAmount,
        r.paymentMethod,
        r.debtorName || r.authorizer || 'N/A',
        r.items.map(i => `${i.variant.product.name} (x${i.quantity})`).join('; ')
      ].map(escape).join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 bg-brand-bg/50 min-h-full">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Transaction Ledger
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Sales Records</h2>
        </div>
        <div className="flex gap-3">
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-surface px-4 py-2 rounded-lg border border-border-subtle text-xs font-bold text-foreground outline-none focus:border-orange-500/50 shadow-sm" 
          />
          <button 
            onClick={exportCSV}
            className="bg-foreground text-brand-bg text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-orange-500 hover:text-white transition-all shadow-lg flex items-center gap-2"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
             Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm min-h-[400px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-bg/50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <th className="p-8 border-b border-border-subtle/50">Reference</th>
              <th className="p-8 border-b border-border-subtle/50">Timestamp</th>
              <th className="p-8 border-b border-border-subtle/50">Staff</th>
              <th className="p-8 border-b border-border-subtle/50">Type</th>
              <th className="p-8 border-b border-border-subtle/50">Amount</th>
              <th className="p-8 border-b border-border-subtle/50">Method</th>
              <th className="p-8 border-b border-border-subtle/50 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30">
            {isLoading ? (
               <tr>
                 <td colSpan={7} className="p-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Transaction History...</td>
               </tr>
            ) : filteredRecords.length === 0 ? (
               <tr>
                 <td colSpan={7} className="p-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest opacity-40">No records found for this period.</td>
               </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-brand-bg/20 transition-colors group">
                  <td className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-tight">#{r.id.substring(0, 8)}</td>
                  <td className="p-8 text-[10px] font-bold text-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-8 text-[10px] font-black text-orange-500 uppercase tracking-widest">{r.soldBy || 'System'}</td>
                  <td className="p-8">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.debtorName ? 'bg-orange-500/10 text-orange-500' : r.paymentMethod === 'free' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {r.debtorName ? 'Credit' : r.paymentMethod === 'free' ? 'Free' : 'Standard'}
                     </span>
                  </td>
                  <td className="p-8 text-[10px] font-black text-foreground">{currency}{(r.totalAmount / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="p-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {r.debtorName ? 'Credit' : r.paymentMethod === 'free' ? 'Free' : r.paymentMethod}
                  </td>
                  <td className="p-8 text-right">
                      <button 
                        onClick={() => setSelectedSale(r)}
                        className="px-4 py-2 rounded-lg bg-brand-bg text-slate-400 hover:text-orange-500 border border-border-subtle hover:border-orange-200 transition-all text-[9px] font-black uppercase tracking-widest"
                      >
                         View
                      </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl overflow-hidden"
             >
                <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-brand-bg/30">
                   <div className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                     <h3 className="font-black uppercase text-xs tracking-widest">Sales Receipt</h3>
                   </div>
                   <button onClick={() => setSelectedSale(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-brand-bg transition-colors">✕</button>
                </div>
                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                   <div className="text-center space-y-2">
                      <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Awards Centre</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transaction Record</p>
                   </div>
                                  <div className="space-y-4 pt-4 border-t border-dashed border-border-subtle">
                       <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>#{selectedSale.id.slice(-8).toUpperCase()}</span>
                          <span>{new Date(selectedSale.createdAt).toLocaleString()}</span>
                       </div>
                       
                       {/* Accountability Section */}
                       <div className="bg-brand-bg/40 p-4 rounded-xl border border-border-subtle/30 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                             <span className="text-slate-400">Processed By</span>
                             <span className="text-orange-500">{selectedSale.soldBy || 'System'}</span>
                          </div>
                          {selectedSale.debtorName && (
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                               <span className="text-slate-400">Debtor</span>
                               <span className="text-foreground">{selectedSale.debtorName}</span>
                            </div>
                          )}
                          {selectedSale.authorizer && (
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                               <span className="text-slate-400">Authorizer</span>
                               <span className="text-emerald-500">{selectedSale.authorizer}</span>
                            </div>
                          )}
                       </div>

                       <div className="space-y-3">
                          {selectedSale.items.map((item, idx) => (
                             <div key={idx} className="flex justify-between items-center">
                                <div>
                                   <p className="text-xs font-black text-foreground uppercase tracking-tight">{item.variant.product.name}</p>
                                   <p className="text-[9px] text-slate-400 font-bold uppercase">{item.variant.size} • {item.variant.color} (x{item.quantity})</p>
                                </div>
                                <p className="text-xs font-black text-foreground">{currency}{((item.price * item.quantity) / (exchangeRate || 1)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-border-subtle space-y-2">
                       <div className="flex justify-between text-xl font-black text-foreground">
                          <span>TOTAL</span>
                          <span>{currency}{(selectedSale.totalAmount / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${selectedSale.debtorName ? 'bg-orange-500 text-white' : selectedSale.paymentMethod === 'free' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                             {selectedSale.debtorName ? 'Credit Sale' : selectedSale.paymentMethod === 'free' ? 'Free Items' : 'Standard Sale'}
                          </span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Method: {selectedSale.paymentMethod}</p>
                       </div>
                    </div>
                 </div>
                 <div className="p-6 bg-brand-bg/30 flex gap-4">
                    <button 
                      onClick={() => window.print()}
                      className="flex-1 bg-foreground text-brand-bg font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-2"
                    >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                       Print Receipt
                    </button>
                 </div>
              </motion.div>

              {/* HIDDEN THERMAL PRINT VIEW */}
              <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-0 print:m-0" id="thermal-receipt">
                 <style dangerouslySetInnerHTML={{ __html: `
                   @media print {
                     body * { visibility: hidden !important; }
                     #thermal-receipt, #thermal-receipt * { visibility: visible !important; }
                     #thermal-receipt { 
                       position: absolute !important; 
                       left: 0 !important; 
                       top: 0 !important; 
                       width: 80mm !important; 
                       padding: 5mm !important;
                       font-family: 'Courier New', Courier, monospace !important;
                       color: black !important;
                       background: white !important;
                       line-height: 1.2 !important;
                     }
                     @page { size: 80mm auto; margin: 0; }
                   }
                 `}} />
                 <div className="text-center space-y-1 mb-4 border-b border-black pb-4">
                    <h2 className="text-xl font-bold uppercase">Awards Centre</h2>
                    <p className="text-[10px]">Accra, Ghana</p>
                    <p className="text-[10px]">Official Sales Receipt</p>
                 </div>
                 
                 <div className="text-[10px] space-y-1 mb-4">
                    <div className="flex justify-between">
                       <span>REF: {selectedSale.id.slice(-8).toUpperCase()}</span>
                       <span>{new Date(selectedSale.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>STAFF: {(selectedSale.soldBy || 'SYSTEM').toUpperCase()}</span>
                       <span>TYPE: {(selectedSale.debtorName ? 'CREDIT' : selectedSale.paymentMethod === 'free' ? 'FREE' : 'STANDARD')}</span>
                    </div>
                    <p>CUSTOMER: {selectedSale.customer?.name || 'WALK-IN'}</p>
                    {selectedSale.debtorName && <p className="font-bold">DEBTOR: {selectedSale.debtorName.toUpperCase()}</p>}
                    {selectedSale.authorizer && <p className="font-bold">AUTH BY: {selectedSale.authorizer.toUpperCase()}</p>}
                 </div>

                <div className="border-b border-dashed border-black mb-2" />
                <div className="space-y-2 text-[10px] mb-4">
                   {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                         <div className="flex-1">
                            <p className="font-bold">{item.variant.product.name}</p>
                            <p className="opacity-70 text-[9px] uppercase">{item.variant.size} • {item.variant.color}</p>
                            <p className="opacity-70">Qty: {item.quantity}</p>
                         </div>
                         <p className="font-bold">{currency}{((item.price * item.quantity) / (exchangeRate || 1)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      </div>
                   ))}
                </div>
                <div className="border-b border-dashed border-black mb-2" />

                <div className="flex justify-between font-bold text-sm mb-4">
                   <span>TOTAL</span>
                   <span>{currency}{(selectedSale.totalAmount / (exchangeRate || 1)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>

                <div className="text-[9px] text-center space-y-1">
                   <p>Paid via {selectedSale.paymentMethod.toUpperCase()}</p>
                   <p className="mt-4 font-bold italic">Thank you for your business!</p>
                   <p>Visit us again at Awards Centre.</p>
                </div>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
