"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

interface AuditLog {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  details: string;
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let result = logs;
    
    if (search) {
      result = result.filter(l => 
        l.username?.toLowerCase().includes(search.toLowerCase()) ||
        l.details?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (actionFilter) {
      result = result.filter(l => l.action === actionFilter);
    }
    
    setFilteredLogs(result);
  }, [search, actionFilter, logs]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setFilteredLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurgeLogs = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?userId=${user?.id}&username=${user?.username}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Audit logs have been successfully purged.', 'success');
        fetchLogs();
      } else {
        showToast('Failed to purge audit logs.', 'error');
      }
    } catch (err) {
      showToast('Failed to clear logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('REFUND') || action.includes('VOID') || action.includes('DELETE') || action.includes('PURGE')) {
      return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
    }
    if (action.includes('SALE') || action.includes('CHECKOUT')) {
      return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    }
    if (action.includes('STOCK') || action.includes('INVENTORY') || action.includes('ADJUST')) {
      return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
    }
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    }
    return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  };

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-10 bg-brand-bg/50 min-h-full">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            System Accountability
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Audit & Activity Logs</h2>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowConfirmModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-all shadow-lg flex items-center gap-2"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
             Purge All Logs
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <input 
          type="text" 
          placeholder="Filter by staff or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-surface px-4 py-2.5 rounded-lg border border-border-subtle text-xs font-bold text-foreground outline-none focus:border-orange-500/50 shadow-sm" 
        />
        <select 
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-surface px-4 py-2.5 rounded-lg border border-border-subtle text-xs font-bold text-foreground outline-none focus:border-orange-500/50 shadow-sm appearance-none cursor-pointer pr-10 relative"
        >
          <option value="">All Actions</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm min-h-[400px]">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-brand-bg/50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <th className="px-6 py-5 border-b border-border-subtle/50">Timestamp</th>
                <th className="px-6 py-5 border-b border-border-subtle/50">Staff</th>
                <th className="px-6 py-5 border-b border-border-subtle/50">Action Type</th>
                <th className="px-6 py-5 border-b border-border-subtle/50">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/30">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Activity Feeds...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest opacity-40">No activity recorded for this period.</td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-brand-bg/20 transition-colors group">
                    <td className="px-6 py-5 text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-5 text-[10px] font-black text-orange-500 uppercase tracking-widest">{l.username || 'System'}</td>
                    <td className="px-6 py-5">
                       <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest ${getActionBadgeColor(l.action)}`}>
                          {l.action}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-medium text-slate-500 dark:text-slate-300 max-w-sm truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={l.details}>
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border-subtle w-full max-w-md rounded-xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-rose-500/10 text-rose-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Purge Audit Logs?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Are you sure you want to permanently clear all activity and audit logs? This action is destructive and cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="bg-transparent hover:bg-white/5 border border-border-subtle text-slate-300 hover:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurgeLogs}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-rose-900/20"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl max-w-sm ${
              toast.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400 backdrop-blur-md' 
                : 'bg-rose-950/80 border-rose-500/30 text-rose-400 backdrop-blur-md'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            )}
            <span className="text-xs font-bold tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
