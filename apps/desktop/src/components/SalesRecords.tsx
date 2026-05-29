"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

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
  subtotal?: number;
  discountAmount?: number;
  discountType?: string;
  isRefunded?: boolean;
  refundReason?: string;
}

export default function SalesRecords() {
  const [records, setRecords] = useState<Sale[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Sale[]>([]);
  const [currency, setCurrency] = useState('GH₵');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [shopName, setShopName] = useState('Awards Centre');
  const [address, setAddress] = useState('Accra, Ghana');

  const { user, isSupervisor } = useAuth();
  const role = user?.role || 'STAFF';
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
      if (parsed.exchangeRate) setExchangeRate(parsed.exchangeRate);
      if (parsed.shopName) setShopName(parsed.shopName);
      if (parsed.address) setAddress(parsed.address);
    }
    fetchSales();
  }, []);

  useEffect(() => {
    let list = records;
    if (role === 'STAFF' && user?.username) {
      list = list.filter(r => r.soldBy === user.username);
    }
    if (dateFilter) {
      list = list.filter(r =>
        new Date(r.createdAt).toISOString().split('T')[0] === dateFilter
      );
    }
    setFilteredRecords(list);
  }, [dateFilter, records, role, user]);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      const data = await response.json();
      setRecords(data);
      setFilteredRecords(data);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedSale || !refundReason) return;
    setIsRefunding(true);
    setRefundError('');
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundedBy: user?.username || 'System',
          reason: refundReason
        })
      });

      if (response.ok) {
        await fetchSales();
        setShowRefundForm(false);
        setRefundReason('');
        setSelectedSale(null);
        setRefundError('');
      } else {
        const error = await response.json();
        setRefundError(error.error || 'Refund failed');
      }
    } catch (err) {
      setRefundError('Network error occurred.');
    } finally {
      setIsRefunding(false);
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm min-h-[400px]">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-brand-bg/50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <th className="px-6 py-5 border-b border-border-subtle/50">Reference</th>
                <th className="px-6 py-5 border-b border-border-subtle/50">Timestamp</th>
                <th className="px-6 py-5 border-b border-border-subtle/50">Staff</th>
                <th className="px-6 py-5 border-b border-border-subtle/50">Type</th>
                <th className="px-6 py-5 border-b border-border-subtle/50">Amount</th>
                <th className="px-6 py-5 border-b border-border-subtle/50">Method</th>
                <th className="px-6 py-5 border-b border-border-subtle/50 text-right">Action</th>
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
                    <td className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-tight">#{r.id.substring(0, 8)}</td>
                    <td className="px-6 py-5 text-[10px] font-bold text-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-5 text-[10px] font-black text-orange-500 uppercase tracking-widest">{r.soldBy || 'System'}</td>
                    <td className="px-6 py-5 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.debtorName ? 'bg-orange-500/10 text-orange-500' : r.paymentMethod === 'free' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {r.debtorName ? 'Credit' : r.paymentMethod === 'free' ? 'Free' : 'Standard'}
                      </span>
                      {r.isRefunded && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[8px] font-black uppercase tracking-widest">
                          Refunded
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-[10px] font-black text-foreground">{currency}{(r.totalAmount / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {r.debtorName ? 'Credit' : r.paymentMethod === 'free' ? 'Free' : r.paymentMethod}
                    </td>
                    <td className="px-6 py-5 text-right">
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
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl overflow-hidden relative"
            >
              {/* Custom full-screen Overlay inside the modal for Refunds */}
              {showRefundForm && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center p-8 z-[60] space-y-6">
                  <div className="flex items-center gap-3 text-rose-500 mb-2">
                    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <h4 className="text-lg font-black text-rose-500 uppercase tracking-widest">Void Transaction</h4>
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                    Are you sure you want to refund this sale? This action is permanent, and inventory quantities will be automatically restored to stock.
                  </p>
                  
                  {refundError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                      ⚠ {refundError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Reason for Refund / Void</label>
                    <input 
                      type="text"
                      placeholder="e.g. Customer returned items, incorrect size..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full bg-surface p-4 rounded-xl border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-rose-500 placeholder:text-slate-600 shadow-inner"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => {
                        setShowRefundForm(false);
                        setRefundReason('');
                        setRefundError('');
                      }}
                      className="flex-1 bg-transparent hover:bg-white/5 border border-border-subtle text-slate-300 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRefund}
                      disabled={!refundReason || isRefunding}
                      className="flex-1 bg-rose-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-700 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-lg shadow-rose-900/20"
                    >
                      {isRefunding ? 'Refunding...' : 'Confirm Refund'}
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-brand-bg/30">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <h3 className="font-black uppercase text-xs tracking-widest">Sales Receipt</h3>
                </div>
                <button onClick={() => setSelectedSale(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-brand-bg transition-colors">✕</button>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-black text-foreground uppercase tracking-tight">{shopName}</h4>
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
                        <p className="text-xs font-black text-foreground">{currency}{((item.price * item.quantity) / (exchangeRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSale.discountAmount && selectedSale.discountAmount > 0 && (
                  <div className="space-y-1 py-2 border-t border-dashed border-border-subtle text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-foreground">
                        {currency}{(selectedSale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount</span>
                      <span>
                        -{selectedSale.discountType === 'percentage' ? `${selectedSale.discountAmount}%` : `${currency}${(selectedSale.discountAmount / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-dashed border-border-subtle space-y-3">
                  <div className="flex justify-between items-center text-xl font-black text-foreground">
                    <span>TOTAL</span>
                    <span>{currency}{(selectedSale.totalAmount / (currency === 'GH₵' ? 1 : (exchangeRate || 1))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${selectedSale.debtorName ? 'bg-orange-500 text-white' : selectedSale.paymentMethod === 'free' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      {selectedSale.debtorName ? 'Credit Sale' : selectedSale.paymentMethod === 'free' ? 'Free Items' : 'Standard Sale'}
                    </span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Method: {selectedSale.paymentMethod}</p>
                  </div>
                  
                  {selectedSale.isRefunded && (
                    <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-wider text-center mt-3">
                      ⚠ Transaction Refunded / Voided
                      {selectedSale.refundReason && <p className="text-[9px] font-normal text-rose-400 normal-case mt-1">Reason: {selectedSale.refundReason}</p>}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-brand-bg/30 flex gap-4 border-t border-border-subtle relative">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-800 text-white border border-border-subtle font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print Receipt
                </button>

                {(role === 'ADMIN' || isSupervisor) && !selectedSale.isRefunded && (
                  <button
                    onClick={() => setShowRefundForm(true)}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    Refund Sale
                  </button>
                )}
              </div>
            </motion.div>

            {/* HIDDEN THERMAL PRINT VIEW */}
            <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-0 print:m-0" id="thermal-receipt">
              <style dangerouslySetInnerHTML={{
                __html: `
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
                <h2 className="text-xl font-bold uppercase">{shopName}</h2>
                <p className="text-[10px]">{address}</p>
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
                    <p className="font-bold">{currency}{((item.price * item.quantity) / (exchangeRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
              <div className="border-b border-dashed border-black mb-2" />

              <div className="flex justify-between font-bold text-sm mb-4">
                <span>TOTAL</span>
                <span>{currency}{(selectedSale.totalAmount / (exchangeRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="text-[9px] text-center space-y-1">
                <p>Paid via {selectedSale.paymentMethod.toUpperCase()}</p>
                <p className="mt-4 font-bold italic">Thank you for your purchase!</p>
                <p>Visit us again at Awards Centre.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
