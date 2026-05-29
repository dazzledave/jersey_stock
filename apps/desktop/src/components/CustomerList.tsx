"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const method = selectedCustomer && isAdding === false ? 'PUT' : 'POST';
    const url = method === 'PUT' 
      ? `/api/customers/${selectedCustomer.id}` 
      : '/api/customers';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAdding(false);
        setFormData({ name: '', phone: '', email: '', address: '' });
        fetchCustomers();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save customer.');
      }
    } catch (err) {
      setError('Failed to save customer.');
    }
  };

  const deleteCustomer = (id: string) => {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    setDeleteError('');
    setDeleteConfirm({ id, name: c.name });
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!deleteConfirm) return;
    setDeleteError('');
    try {
      const res = await fetch(`/api/customers/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers();
        setSelectedCustomer(null);
        setDeleteConfirm(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || 'Failed to delete customer.');
      }
    } catch (err) {
      setDeleteError('Failed to delete.');
    }
  };

  const filtered = Array.isArray(customers) 
    ? customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone?.includes(search)
      )
    : [];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Customer Manager</div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Patron Management</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Manage your relationships and track customer loyalty.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setSelectedCustomer(null); setFormData({ name: '', phone: '', email: '', address: '' }); }}
          className="bg-orange-500 text-white text-[10px] uppercase font-black tracking-widest px-8 py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-all flex items-center gap-3"
        >
          <span className="text-xl">+</span> Add New Patron
        </button>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-4 bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-sm flex flex-col h-[700px]">
          <div className="p-6 border-b border-border-subtle/50 bg-brand-bg/30">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search name or phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-brand-bg p-4 pl-12 rounded-xl border border-border-subtle text-xs font-bold outline-none text-foreground placeholder:text-slate-500 focus:border-orange-500 transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {isLoading ? (
               <div className="p-20 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading Patrons...</div>
             ) : filtered.length === 0 ? (
               <div className="p-20 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest opacity-50">No patrons found</div>
             ) : (
               <div className="divide-y divide-border-subtle/20">
                 {filtered.map((c) => (
                   <div 
                     key={c.id} 
                     onClick={() => { setSelectedCustomer(c); setFormData(c); setIsAdding(false); }}
                     className={`p-6 cursor-pointer hover:bg-orange-500/5 transition-all group flex items-center justify-between ${selectedCustomer?.id === c.id ? 'bg-orange-500/10 border-l-4 border-orange-500' : ''}`}
                   >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-bg border border-border-subtle flex items-center justify-center font-black text-slate-400 text-[10px] uppercase">
                           {c.name.substring(0, 2)}
                        </div>
                        <div>
                           <p className="font-bold text-sm text-foreground">{c.name}</p>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{c.phone || 'No Phone'}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-orange-500 uppercase">{c._count?.sales || 0} Sales</p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        <div className="col-span-8">
           <AnimatePresence mode="wait">
              {isAdding || (selectedCustomer && isAdding === false) ? (
                 <motion.div 
                   key={selectedCustomer?.id || 'adding'}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col h-[700px]"
                 >
                    <div className="p-8 border-b border-border-subtle bg-brand-bg/30 flex justify-between items-center">
                       <div>
                          <h3 className="text-xl font-bold text-foreground">{isAdding ? 'New Patron Profile' : 'Patron Dossier'}</h3>
                          <p className="text-xs text-slate-400 font-medium">{isAdding ? 'Enter customer details to start tracking sales.' : 'Viewing comprehensive history and contact info.'}</p>
                       </div>
                       {!isAdding && (
                         <div className="flex gap-2">
                            <button onClick={() => deleteCustomer(selectedCustomer.id)} className="p-3 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                         </div>
                       )}
                    </div>

                    <div className="p-10 flex-1 overflow-y-auto">
                       <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
                          {error && (
                             <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs font-bold text-rose-500 col-span-2">
                                {error}
                             </div>
                          )}
                          <div className="space-y-6 col-span-2">
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                                   <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-brand-bg p-4 rounded-xl border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500 transition-all" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                   <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-brand-bg p-4 rounded-xl border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500 transition-all" />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-brand-bg p-4 rounded-xl border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500 transition-all" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Address</label>
                                <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-brand-bg p-4 rounded-xl border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500 transition-all h-24 resize-none" />
                             </div>
                          </div>
                          
                          <div className="col-span-2 pt-10 border-t border-border-subtle/30 flex justify-end gap-4">
                             <button type="button" onClick={() => { setIsAdding(false); setSelectedCustomer(null); }} className="px-8 py-4 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Discard Changes</button>
                             <button type="submit" className="bg-foreground text-brand-bg px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-orange-500 transition-all">Save Profile</button>
                          </div>
                       </form>
                    </div>
                 </motion.div>
              ) : (
                 <motion.div 
                   key="fallback"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="h-[700px] bg-surface/20 border-2 border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-300 backdrop-blur-sm"
                 >
                    <div className="w-20 h-20 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-4xl shadow-sm">👥</div>
                    <div className="text-center">
                       <p className="font-black uppercase tracking-widest text-[10px] text-slate-500">Patron Directory</p>
                       <p className="text-xs font-medium text-slate-400 mt-1">Select a customer to view their complete dossier.</p>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-6"
          >
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 20, opacity: 0 }}
               className="bg-[#1a1f2b] w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
             >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-rose-500/10">
                   <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                     Confirm Customer Deletion
                   </h3>
                   <button onClick={() => setDeleteConfirm(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-8 space-y-4">
                   {deleteError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs font-bold text-rose-500">
                         {deleteError}
                      </div>
                   )}
                   <p className="text-sm font-medium text-slate-300">
                     Are you sure you want to permanently delete customer <strong className="text-white">"{deleteConfirm.name}"</strong>?
                   </p>
                   <p className="text-xs font-bold text-rose-500/80 uppercase tracking-wider bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                     ⚠️ This will permanently remove their records from the local system and cloud ledger. This action cannot be undone!
                   </p>
                </div>
                <div className="p-6 bg-slate-900/30 flex gap-3 border-t border-slate-800/50">
                   <button 
                     onClick={() => setDeleteConfirm(null)} 
                     className="flex-1 bg-slate-800 text-slate-400 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest border border-slate-800 hover:bg-slate-700 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleConfirmDeleteCustomer} 
                     className="flex-1 bg-rose-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20"
                   >
                     Confirm Delete
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
