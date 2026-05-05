"use client";

import React, { useState, useEffect } from 'react';

export default function SystemSetup() {
  const [settings, setSettings] = useState({
    shopName: 'Awards Centre',
    currency: 'GH₵',
    address: 'Accra, Ghana',
    darkMode: false
  });
  const [isSaving, setIsSaving] = useState(false);

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
    // Auto-save theme preference
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
                  <select 
                    value={settings.currency}
                    onChange={(e) => setSettings({...settings, currency: e.target.value})}
                    className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none cursor-pointer appearance-none text-foreground"
                  >
                    <option value="GH₵">GH₵ (Ghanian Cedi)</option>
                    <option value="$">$ (US Dollar)</option>
                    <option value="£">£ (British Pound)</option>
                    <option value="€">€ (Euro)</option>
                    <option value="₦">₦ (Nigerian Naira)</option>
                  </select>
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
              className="w-full bg-foreground text-surface font-bold py-4 rounded-lg text-xs uppercase tracking-widest hover:bg-orange-500 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
         </div>

         <div className="space-y-8">
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

            <div className="bg-surface p-10 rounded-xl border border-border-subtle space-y-6 shadow-sm">
               <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Database Status</h3>
                  <p className="text-xs text-slate-400 font-medium">Connectivity and sync info.</p>
               </div>
               <div className="flex items-center justify-between p-6 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</div>
                     <div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">PostgreSQL Online</div>
                        <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Connection Stable</div>
                     </div>
                  </div>
                  <button className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/30">Refresh</button>
               </div>
            </div>

            <div className="bg-orange-500/10 p-10 rounded-xl border border-orange-500/20 space-y-4">
               <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400">Advanced Maintenance</h3>
               <p className="text-xs text-orange-600/80 dark:text-orange-400/80 leading-relaxed font-medium">
                  Perform system backups or clear transaction logs. Note: these actions are permanent.
               </p>
               <div className="flex gap-4 pt-2">
                  <button 
                    onClick={handleBackup}
                    className="px-6 py-2 bg-surface text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase rounded-lg border border-orange-500/20 hover:bg-brand-bg transition-colors shadow-sm"
                  >
                    Backup Data
                  </button>
                  <button className="px-6 py-2 bg-surface text-rose-500 text-[10px] font-black uppercase rounded-lg border border-rose-500/20 shadow-sm">Reset Logs</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
