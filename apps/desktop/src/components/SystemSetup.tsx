"use client";

import React, { useState, useEffect } from 'react';

export default function SystemSetup() {
  const [settings, setSettings] = useState({
    shopName: 'Awards Centre',
    currency: 'GH₵',
    address: 'Accra, Ghana',
    darkMode: false,
    supabaseUrl: '',
    supabaseKey: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      applyTheme(parsed.darkMode);
    }
  }, []);

  const applyTheme = (isDark: boolean) => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleToggleDarkMode = () => {
    const newMode = !settings.darkMode;
    setSettings(prev => ({ ...prev, darkMode: newMode }));
    applyTheme(newMode);
    const saved = localStorage.getItem('ac_settings');
    const base = saved ? JSON.parse(saved) : settings;
    localStorage.setItem('ac_settings', JSON.stringify({ ...base, darkMode: newMode }));
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('ac_settings', JSON.stringify(settings));
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 800);
  };

  const handleSync = async () => {
    if (!settings.supabaseUrl || !settings.supabaseKey) {
      alert('Please provide Supabase URL and Key first.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('http://localhost:4000/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: settings.supabaseUrl,
          supabaseKey: settings.supabaseKey
        })
      });

      const data = await res.json();
      if (res.ok) {
        setLastSync(new Date().toLocaleString());
        alert('Cloud synchronization successful!');
      } else {
        alert('Sync failed: ' + data.error);
      }
    } catch (err) {
      alert('Network error during sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/products');
      const products = await response.json();
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        settings,
        products,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", `awards_centre_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      alert('Failed to generate backup. Is the server running?');
    }
  };

  const handleResetLogs = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all synchronization logs?')) return;
    
    setIsResetting(true);
    try {
      const res = await fetch('http://localhost:4000/api/sync/logs', {
        method: 'DELETE'
      });
      if (res.ok) {
        setLastSync(null);
        alert('Sync logs have been purged successfully.');
      }
    } catch (err) {
      alert('Failed to reset logs.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Configuration</div>
          <h2 className="text-3xl font-bold text-foreground">System Setup</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
         <div className="bg-surface p-10 rounded-xl border border-border-subtle space-y-8 shadow-sm">
            <div>
               <h3 className="text-xl font-bold text-foreground mb-1">Shop Profile</h3>
               <p className="text-xs text-slate-400 font-medium">Manage your public store information.</p>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Shop Name</label>
                  <input 
                    type="text" 
                    value={settings.shopName}
                    onChange={(e) => setSettings({...settings, shopName: e.target.value})}
                    className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none focus:border-orange-200 transition-all text-foreground" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Currency Symbol</label>
                  <div className="relative group">
                    <select 
                      value={settings.currency}
                      onChange={(e) => setSettings({...settings, currency: e.target.value})}
                      className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none cursor-pointer appearance-none text-foreground pr-10 focus:border-orange-200 transition-all"
                    >
                      <option value="GH₵">GH₵ (Ghanaian Cedi)</option>
                      <option value="$">$ (US Dollar)</option>
                      <option value="£">£ (British Pound)</option>
                      <option value="€">€ (Euro)</option>
                      <option value="₦">₦ (Nigerian Naira)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-orange-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Store Address</label>
                  <textarea 
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none h-24 resize-none focus:border-orange-200 transition-all text-foreground" 
                  />
               </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-foreground text-surface font-bold py-4 rounded-lg text-xs uppercase tracking-widest hover:bg-orange-500 transition-all disabled:opacity-50 shadow-lg"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
         </div>

         <div className="space-y-8">
            {/* Supabase Sync Card */}
            <div className="bg-surface p-10 rounded-xl border border-border-subtle space-y-8 shadow-sm">
               <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Cloud Sync (Supabase)</h3>
                  <p className="text-xs text-slate-400 font-medium">Connect your store to the cloud for remote access.</p>
               </div>
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Supabase URL</label>
                    <input 
                      type="text" 
                      placeholder="https://xyz.supabase.co"
                      value={settings.supabaseUrl}
                      onChange={(e) => setSettings({...settings, supabaseUrl: e.target.value})}
                      className="w-full bg-brand-bg p-3 rounded-lg border border-border-subtle text-xs font-bold outline-none focus:border-orange-200 transition-all text-foreground" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Service Role Key / Anon Key</label>
                    <input 
                      type="password" 
                      placeholder="eyJhbG..."
                      value={settings.supabaseKey}
                      onChange={(e) => setSettings({...settings, supabaseKey: e.target.value})}
                      className="w-full bg-brand-bg p-3 rounded-lg border border-border-subtle text-xs font-bold outline-none focus:border-orange-200 transition-all text-foreground" 
                    />
                  </div>
               </div>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`w-full font-bold py-4 rounded-lg text-xs uppercase tracking-widest transition-all shadow-xl ${isSyncing ? 'bg-orange-500/20 text-orange-500 cursor-wait' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                  >
                    {isSyncing ? 'Synchronizing...' : 'Sync to Cloud Now'}
                  </button>
                  {lastSync && (
                    <p className="text-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                      Last Sync: {lastSync}
                    </p>
                  )}
               </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="bg-surface p-10 rounded-xl border border-border-subtle space-y-6 shadow-sm">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">Visual Theme</h3>
                    <p className="text-xs text-slate-400 font-medium">Toggle between light and dark mode.</p>
                  </div>
                  <button 
                    onClick={handleToggleDarkMode}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings.darkMode ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${settings.darkMode ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
               </div>
            </div>

            <div className="bg-orange-500/5 p-10 rounded-xl border border-orange-500/20 space-y-4">
               <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400">Local Maintenance</h3>
               <p className="text-xs text-orange-600/80 dark:text-orange-400/80 leading-relaxed font-medium">
                  Manual JSON backups are still supported for offline safety.
               </p>
               <div className="flex gap-4 pt-2">
                  <button 
                    onClick={handleBackup}
                    className="px-6 py-2 bg-surface text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase rounded-lg border border-orange-500/20 hover:bg-brand-bg transition-colors shadow-sm"
                  >
                    Download JSON Backup
                  </button>
                  <button 
                    onClick={handleResetLogs}
                    disabled={isResetting}
                    className="px-6 py-2 bg-surface text-rose-500 text-[10px] font-black uppercase rounded-lg border border-rose-500/20 shadow-sm hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  >
                    {isResetting ? 'Resetting...' : 'Reset Logs'}
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
