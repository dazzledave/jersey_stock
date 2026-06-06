"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InventoryDashboard from "@/components/InventoryDashboard";
import ProductForm from "@/components/ProductForm";
import SalesTerminal from "@/components/SalesTerminal";
import SalesRecords from "@/components/SalesRecords";
import InventoryStock from "@/components/InventoryStock";
import Analytics from "@/components/Analytics";
import SystemSetup from "@/components/SystemSetup";
import Login from "@/components/Login";
import SetupWizard from "@/components/SetupWizard";
import AuditLogs from "@/components/AuditLogs";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [setupStatus, setSetupStatus] = useState<'checking' | 'initialized' | 'setup_required' | 'offline_first_use'>('checking');
  const [isVerifyingConnection, setIsVerifyingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [globalAlert, setGlobalAlert] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, user, logout, isAdmin, isSupervisor, isOnline } = useAuth();
  const [isSyncRefreshing, setIsSyncRefreshing] = useState(false);

  const handleSyncRefresh = async () => {
    setIsSyncRefreshing(true);
    try {
      const response = await fetch('/api/sync');
      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`);
    } finally {
      setIsSyncRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (message: any) => {
        setGlobalAlert(String(message));
      };
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin !== undefined) {
      setActiveTab(isAdmin ? 'Dashboard' : 'Inventory Stock');
    }
  }, [isAuthenticated, isAdmin]);

  // REMOVED: window.focus() was stealing focus from inputs in Electron

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async (isRetry = false) => {
    if (isRetry) {
      setIsVerifyingConnection(true);
      setConnectionError(null);
    }
    try {
      const response = await fetch('/api/auth/setup-status');
      const data = await response.json();
      
      if (data.status === 'initialized') {
        setSetupStatus('initialized');
      } else if (data.status === 'offline_first_use') {
        setSetupStatus('offline_first_use');
        if (data.error) {
          setConnectionError(data.error);
        }
      } else if (data.status === 'setup_required') {
        setSetupStatus('setup_required');
      } else {
        // Fallback for safety
        setSetupStatus('initialized');
      }
    } catch (error: any) {
      console.error('Failed to check setup status:', error);
      setSetupStatus('offline_first_use');
      setConnectionError(error.message || 'Unable to connect to local API');
    } finally {
      if (isRetry) {
        setIsVerifyingConnection(false);
      }
    }
  };

  if (setupStatus === 'checking') {
    return (
      <div className="h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (setupStatus === 'offline_first_use') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-['Segoe_UI_Variable_Text',_system-ui,_sans-serif]">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-rose-500/5 blur-[150px] rounded-full animate-pulse delay-700" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg p-1 relative z-10"
        >
          <div className="bg-[#1e293b]/50 backdrop-blur-3xl p-12 rounded-[40px] border border-white/10 shadow-2xl space-y-8 text-center">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-6 border border-rose-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
              </svg>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">
                Internet Required
              </h1>
              <p className="text-sm font-bold text-orange-500 uppercase tracking-widest">
                First-Time Initialization
              </p>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                An active internet connection is required during your first use of Awards Centre POS. This is necessary to sync your configuration, staff profiles, and security keys from the cloud database.
              </p>
            </div>

            {connectionError && (
              <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl text-xs font-bold text-rose-400 leading-relaxed break-words max-w-sm mx-auto">
                <span className="text-rose-500 uppercase tracking-wider block mb-1">Status Error:</span>
                {connectionError}
              </div>
            )}

            <div className="pt-4">
              <button 
                onClick={() => checkSetupStatus(true)}
                disabled={isVerifyingConnection}
                className="w-full bg-[#ffb443] hover:bg-[#fca42d] disabled:opacity-50 text-[#1a1f2b] font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isVerifyingConnection ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1a1f2b]/30 border-t-[#1a1f2b] rounded-full animate-spin" />
                    <span>Verifying Connection...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Connection & Sync</span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (setupStatus === 'setup_required') {
    return <SetupWizard onComplete={() => setSetupStatus('initialized')} />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const menuItems = [
    {
      name: 'Dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"/></svg>
      )
    },
    {
      name: 'Sales Terminal', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
      )
    },
    {
      name: 'Sales Records', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
      )
    },
    {
      name: 'Product Manager', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01M19 7h.01M19 11h.01M19 15h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>
      )
    },
    {
      name: 'Inventory Stock', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
      )
    },
    {
      name: 'Analytics', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      )
    },
    {
      name: 'Audit Log', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
      )
    },
    {
      name: 'System Setup', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg font-['Segoe_UI_Variable_Text',_system-ui,_sans-serif]">
      {/* Sidebar - Collapsible with CSS transitions (avoids Framer Motion transform compositing layers) */}
      <aside
        style={{
          width: sidebarExpanded ? 280 : 80,
          padding: sidebarExpanded ? '24px' : '12px',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="bg-[#1a1f2b] text-white flex flex-col h-screen flex-shrink-0 overflow-hidden"
      >
        <div className={`flex items-center justify-between px-2 ${sidebarExpanded ? 'mb-8' : 'mb-4'}`}>
          <AnimatePresence mode="wait">
            {sidebarExpanded && (
              <motion.div
                key="title"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <h2 className="text-[10px] font-black tracking-[0.2em] text-[#ffb443] uppercase opacity-80">Awards Centre</h2>
                <h3 className="text-base font-bold text-white mt-0.5 leading-tight">Management System</h3>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={`p-2 hover:bg-slate-800 rounded-lg transition-colors ${!sidebarExpanded ? 'mx-auto' : ''}`}
          >
            <svg className="w-6 h-6 text-[#ffb443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('Product Manager')}
            className={`bg-[#ffb443] hover:bg-[#fca42d] text-[#1a1f2b] font-bold py-3 rounded-lg flex items-center transition-all group overflow-hidden ${sidebarExpanded ? 'px-4 justify-between mb-6' : 'w-12 h-12 justify-center mx-auto mb-4'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">+</span>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    Create new
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {sidebarExpanded && <span className="opacity-50 group-hover:translate-x-1 transition-transform">›</span>}
          </button>
        )}

        <nav className="flex-1 space-y-1 pr-1 overflow-y-auto custom-scrollbar">
          {menuItems
            .filter(item => {
              if (user?.role === 'STAFF') {
                return ['Dashboard', 'Sales Terminal', 'Sales Records', 'Inventory Stock'].includes(item.name);
              }
              if (user?.role === 'SUPERVISOR') {
                return ['Dashboard', 'Sales Terminal', 'Sales Records', 'Inventory Stock', 'Analytics', 'Audit Log'].includes(item.name);
              }
              return true;
            })
            .map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full rounded-lg text-sm font-medium transition-all flex items-center group ${sidebarExpanded ? 'px-4 py-3 gap-3' : 'w-12 h-12 justify-center mx-auto'
                  } ${activeTab === item.name
                    ? 'bg-[#2a3142] text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-[#2a3142]/50'
                  }`}
                title={!sidebarExpanded ? item.name : ''}
              >
                <span className={`transition-colors ${activeTab === item.name ? 'text-[#ffb443]' : 'text-slate-500 group-hover:text-[#ffb443]'}`}>
                  {item.icon}
                </span>
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
        </nav>

        <div className={`pt-4 border-t border-slate-800/50 mt-2 overflow-hidden`}>
          <div className={`flex items-center gap-3 px-2 ${!sidebarExpanded ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-[10px]">AC</div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  <div className="text-sm font-bold">{user?.username}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    {user?.role === 'ADMIN' ? 'System Admin' : user?.role === 'SUPERVISOR' ? 'Supervisor' : 'Staff Member'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Top Header */}
        <header 
          style={{ WebkitAppRegion: 'drag' } as any}
          className="h-20 flex items-center justify-between px-10 flex-shrink-0 bg-brand-bg/80 backdrop-blur-md border-b border-border-subtle/50"
        >
          <div 
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={isOnline ? 'text-emerald-500' : 'text-rose-500'}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
            {isOnline && (
              <button
                onClick={handleSyncRefresh}
                disabled={isSyncRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a3142] hover:bg-[#ffb443] hover:text-[#1a1f2b] disabled:opacity-50 text-white rounded-lg transition-all border border-slate-700/50 cursor-pointer"
                title="Sync latest data from cloud"
              >
                <svg
                  className={`w-3.5 h-3.5 ${isSyncRefreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                <span>{isSyncRefreshing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>
          <div 
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="flex items-center gap-4"
          >
            <div className="text-right">
              <div className="text-sm font-bold text-foreground">{user?.username}</div>
              <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">
                {user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'SUPERVISOR' ? 'Supervisor' : 'Staff Member'}
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-foreground text-brand-bg text-xs font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${activeTab === 'Sales Terminal' ? 'p-0' : 'p-10 pb-24'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ willChange: 'opacity' }}
              onAnimationComplete={() => {
                // NUCLEAR CLEANUP: After animation settles, purge any ghost nodes
                // and force-reset pointer events on the content area
                document.querySelectorAll('[data-framer-exit]').forEach(el => el.remove());
              }}
              className={activeTab === 'Sales Terminal' ? 'max-w-none w-full h-full' : 'max-w-[1400px] w-full mx-auto'}
            >
              {activeTab === 'Dashboard' && <InventoryDashboard />}
              {activeTab === 'Sales Terminal' && <SalesTerminal />}
              {activeTab === 'Sales Records' && <SalesRecords />}

              {activeTab === 'Product Manager' && user?.role === 'ADMIN' && <ProductForm />}
              {activeTab === 'Inventory Stock' && <InventoryStock />}
              {activeTab === 'Analytics' && ['ADMIN', 'SUPERVISOR'].includes(user?.role || '') && <Analytics />}
              {activeTab === 'System Setup' && user?.role === 'ADMIN' && <SystemSetup />}
              {activeTab === 'Audit Log' && ['ADMIN', 'SUPERVISOR'].includes(user?.role || '') && <AuditLogs />}

              {/* Fallback for unauthorized access */}
              {((activeTab === 'Product Manager' || activeTab === 'System Setup') && user?.role !== 'ADMIN') && (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-xl">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">Access Restricted</h2>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2 text-sm">This module requires Administrator privileges. Please contact your manager if you believe this is an error.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('Inventory Stock')}
                    className="px-8 py-3 bg-foreground text-brand-bg rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Return to Stock
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Beautiful Custom Alert Modal */}
      <AnimatePresence>
        {globalAlert && (
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
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                   <h3 className="text-xs font-black uppercase tracking-widest text-[#ffb443] flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     System Notification
                   </h3>
                   <button onClick={() => setGlobalAlert(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-8">
                   <p className="text-sm font-medium text-slate-300 leading-relaxed">
                     {globalAlert}
                   </p>
                </div>
                <div className="p-6 bg-slate-900/30 flex justify-end border-t border-slate-800/50">
                   <button 
                     onClick={() => setGlobalAlert(null)} 
                     className="px-8 py-3 bg-[#ffb443] hover:bg-[#fca42d] text-[#1a1f2b] font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors shadow-lg cursor-pointer"
                   >
                     Acknowledge
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
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
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                   <h3 className="text-xs font-black uppercase tracking-widest text-[#ffb443] flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                     Confirm Sign Out
                   </h3>
                   <button onClick={() => setShowLogoutConfirm(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-8 text-center space-y-3">
                   <div className="w-16 h-16 bg-[#ffb443]/10 text-[#ffb443] rounded-full flex items-center justify-center mx-auto mb-2">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                   </div>
                   <h4 className="text-base font-bold text-white leading-tight">Ready to end your session?</h4>
                   <p className="text-xs font-medium text-slate-400 max-w-xs mx-auto">
                     Make sure all pending cart items are processed or cleared before signing out of the POS system.
                   </p>
                </div>
                <div className="p-6 bg-slate-900/30 flex gap-3 border-t border-slate-800/50">
                   <button 
                     onClick={() => setShowLogoutConfirm(false)} 
                     className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={() => {
                       setShowLogoutConfirm(false);
                       logout();
                     }} 
                     className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors shadow-lg cursor-pointer"
                   >
                     Log Out
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
