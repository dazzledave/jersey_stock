"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SaleItem {
  id: string;
  quantity: number;
  price: number;
  variant: {
    sku: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
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
    const headers = ['Reference', 'Timestamp', 'Customer', 'Amount', 'Method', 'Items'];
    const rows = filteredRecords.map(r => [
      r.id,
      new Date(r.createdAt).toLocaleString(),
      r.customer?.name || 'Walk-in',
      r.totalAmount,
      r.paymentMethod,
      r.items.map(i => `${i.variant.product.name} (x${i.quantity})`).join('; ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Transaction Ledger</div>
          <h2 className="text-3xl font-bold text-foreground">Sales Records</h2>
          <p className="text-slate-400 text-sm font-medium">History of all cloud-synced and local transactions.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-surface px-4 py-2 rounded-lg border border-border-subtle text-xs font-bold text-foreground outline-none focus:border-orange-500/50" 
          />
          <button 
            onClick={exportCSV}
            className="bg-foreground text-brand-bg text-xs font-bold px-6 py-3 rounded-lg hover:bg-orange-500 hover:text-white transition-all shadow-lg"
          >
             Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm min-h-[400px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-bg/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="p-8 border-b border-border-subtle/50">Reference</th>
              <th className="p-8 border-b border-border-subtle/50">Timestamp</th>
              <th className="p-8 border-b border-border-subtle/50">Customer</th>
              <th className="p-8 border-b border-border-subtle/50">Amount</th>
              <th className="p-8 border-b border-border-subtle/50">Method</th>
              <th className="p-8 border-b border-border-subtle/50 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30">
            {isLoading ? (
               <tr>
                 <td colSpan={6} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse">
                   Loading sales database...
                 </td>
               </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">
                  {dateFilter ? 'No sales found for this date' : 'No sales recorded yet'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-brand-bg/30 transition-all group">
                  <td className="p-8">
                     <div className="font-mono text-[10px] font-bold text-orange-500 bg-orange-500/5 px-2 py-1 rounded inline-block">
                        #{r.id.slice(-6).toUpperCase()}
                     </div>
                  </td>
                  <td className="p-8 text-xs text-slate-400 font-bold">
                    {new Date(r.createdAt).toLocaleDateString()} <br/>
                    <span className="text-[10px] opacity-60 font-medium">{new Date(r.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-8 text-sm font-bold text-foreground">
                    {r.customer?.name || 'Walk-in Customer'}
                  </td>
                  <td className="p-8 font-black text-foreground">{currency}{r.totalAmount.toLocaleString()}</td>
                  <td className="p-8">
                     <span className="px-3 py-1 bg-brand-bg rounded text-[10px] font-black text-slate-500 border border-border-subtle uppercase tracking-tighter">
                        {r.paymentMethod}
                     </span>
                  </td>
                  <td className="p-8 text-right">
                     <button 
                       onClick={() => setSelectedSale(r)}
                       className="text-[10px] font-black uppercase text-slate-400 hover:text-orange-500 transition-colors"
                     >
                       View Receipt
                     </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl overflow-hidden"
           >
              <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-brand-bg/30">
                 <h3 className="font-black uppercase text-xs tracking-widest">Transaction Receipt</h3>
                 <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-foreground">✕</button>
              </div>
              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                 <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black text-foreground">Awards Centre</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Transaction Record</p>
                 </div>
                 
                 <div className="space-y-4 pt-4 border-t border-dashed border-border-subtle">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                       <span>Ref: {selectedSale.id}</span>
                       <span>{new Date(selectedSale.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="space-y-3">
                       {selectedSale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                             <div>
                                <p className="text-xs font-bold text-foreground">{item.variant.product.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold">{item.variant.sku} x {item.quantity}</p>
                             </div>
                             <p className="text-xs font-bold text-foreground">{currency}{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-dashed border-border-subtle space-y-2">
                    <div className="flex justify-between text-lg font-black text-foreground">
                       <span>TOTAL</span>
                       <span>{currency}{selectedSale.totalAmount.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 text-right uppercase italic">Paid via {selectedSale.paymentMethod}</p>
                 </div>
              </div>
              <div className="p-8 bg-brand-bg/30 flex gap-4">
                 <button 
                   onClick={() => window.print()}
                   className="flex-1 bg-foreground text-brand-bg font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-colors"
                 >
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
                 <p>CUSTOMER: {selectedSale.customer?.name || 'WALK-IN'}</p>
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
                       <p className="font-bold">{currency}{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                 ))}
              </div>
              <div className="border-b border-dashed border-black mb-2" />

              <div className="flex justify-between font-bold text-sm mb-4">
                 <span>TOTAL</span>
                 <span>{currency}{selectedSale.totalAmount.toLocaleString()}</span>
              </div>

              <div className="text-[9px] text-center space-y-1">
                 <p>Paid via {selectedSale.paymentMethod.toUpperCase()}</p>
                 <p className="mt-4 font-bold italic">Thank you for your business!</p>
                 <p>Visit us again at Awards Centre.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
