"use client";

import React, { useState, useEffect } from 'react';

export default function SystemSetup() {
  const [settings, setSettings] = useState({
    shopName: 'Awards Centre',
    currency: 'GH₵',
    address: 'Accra, Ghana',
    darkMode: false,
    exchangeRate: 1,
    supabaseUrl: '',
    supabaseKey: ''
  });
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Staff Management State
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'STAFF' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      applyTheme(parsed.darkMode);
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const res = await fetch('http://localhost:4000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setNewUser({ username: '', password: '', role: 'STAFF' });
        fetchUsers();
        alert('Staff member added successfully!');
      } else {
        const data = await res.json();
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Failed to connect to server.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

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
    const finalSettings = {
      ...settings,
      exchangeRate: settings.currency === 'GH₵' ? 1 : settings.exchangeRate
    };
    setSettings(finalSettings);
    localStorage.setItem('ac_settings', JSON.stringify(finalSettings));
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
      // 1. Save credentials to server first
      await fetch('http://localhost:4000/api/sync/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: settings.supabaseUrl,
          supabaseKey: settings.supabaseKey
        })
      });

      // 2. Trigger a full manual sync test
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
        alert('Credentials saved and Cloud synchronization successful!');
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
          <h2 className="text-3xl font-bold text-foreground tracking-tight">System Setup</h2>
        </div>
        <div className="flex bg-brand-bg/50 p-1 rounded-xl border border-border-subtle shadow-sm">
           <button 
             onClick={() => setActiveSubTab('profile')}
             className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'profile' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-foreground'}`}
           >
             Shop Profile
           </button>
           <button 
             onClick={() => setActiveSubTab('staff')}
             className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'staff' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-foreground'}`}
           >
             Staff Management
           </button>
        </div>
      </div>

      {activeSubTab === 'profile' ? (
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
               <div className="grid grid-cols-2 gap-6">
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
                 {settings.currency !== 'GH₵' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Exchange Rate (vs GHS)</label>
                        <input 
                          type="number" 
                          value={settings.exchangeRate || 1}
                          onChange={(e) => setSettings({...settings, exchangeRate: parseFloat(e.target.value) || 1})}
                          placeholder="e.g. 15.0"
                          className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none focus:border-orange-200 transition-all text-foreground" 
                        />
                        <p className="text-[9px] text-slate-400 mt-1">Example: If 1 USD = 15 GHS, enter 15</p>
                    </div>
                 )}
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
      ) : (
        <div className="grid grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="col-span-4 bg-surface p-10 rounded-xl border border-border-subtle space-y-8 shadow-sm h-fit">
              <div>
                 <h3 className="text-xl font-bold text-foreground mb-1">Add New Staff</h3>
                 <p className="text-xs text-slate-400 font-medium tracking-tight">Create a new secure access account.</p>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Username</label>
                    <input 
                      type="text" 
                      value={newUser.username}
                      onChange={(e) => setNewUser(prev => ({...prev, username: e.target.value}))}
                      required
                      className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none focus:border-orange-200 transition-all text-foreground" 
                      placeholder="e.g. kojo_sales"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Initial Password</label>
                    <input 
                      type="password" 
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                      required
                      className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none focus:border-orange-200 transition-all text-foreground" 
                      placeholder="••••••••"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Assigned Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({...prev, role: e.target.value}))}
                      className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none focus:border-orange-200 transition-all text-foreground appearance-none"
                    >
                       <option value="STAFF">Sales Staff</option>
                       <option value="ADMIN">System Admin</option>
                    </select>
                 </div>
                 <button 
                   disabled={isCreatingUser}
                   className="w-full bg-orange-500 text-white font-black py-4 rounded-lg text-[10px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                 >
                    {isCreatingUser ? 'Creating...' : 'Register Staff Member'}
                 </button>
              </form>
           </div>

           <div className="col-span-8 bg-surface p-10 rounded-xl border border-border-subtle shadow-sm overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">Active Team</h3>
                    <p className="text-xs text-slate-400 font-medium">Manage existing employee credentials.</p>
                 </div>
                 <span className="px-4 py-1.5 bg-brand-bg rounded-full text-[9px] font-black text-slate-500 border border-border-subtle uppercase">
                    {users.length} Total Users
                 </span>
              </div>

              <div className="space-y-3">
                 {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-6 bg-brand-bg/50 rounded-xl border border-border-subtle hover:border-orange-200 transition-all group">
                       <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${u.role === 'ADMIN' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                             {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-foreground uppercase tracking-tight">{u.username}</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{u.role} • Member since {new Date(u.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => handleDeleteUser(u.id)}
                         className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
