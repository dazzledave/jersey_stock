"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InventoryDashboard from "@/components/InventoryDashboard";
import ProductForm from "@/components/ProductForm";
import SalesTerminal from "@/components/SalesTerminal";
import CustomerList from "@/components/CustomerList";
import SalesRecords from "@/components/SalesRecords";
import InventoryStock from "@/components/InventoryStock";
import Analytics from "@/components/Analytics";
import SystemSetup from "@/components/SystemSetup";
import Login from "@/components/Login";
import SetupWizard from "@/components/SetupWizard";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const [activeTab, setActiveTab] = useState('Product Manager');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const { isAuthenticated, user, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (isAuthenticated && isAdmin !== undefined) {
      setActiveTab(isAdmin ? 'Product Manager' : 'Inventory Stock');
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/auth/setup-status');
      const data = await response.json();
      setSetupRequired(!data.initialized);
    } catch (error) {
      console.error('Failed to check setup status:', error);
      setSetupRequired(false); // Fallback to login
    }
  };

  useEffect(() => {
    // THE PAGE SCOUT: Automatically focus the first input on the new page
    const timer = setTimeout(() => {
      const firstInput = document.querySelector('input:not([type="hidden"]), textarea, select') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 300); // Wait for page transition to finish

    return () => clearTimeout(timer);
  }, [activeTab, isAuthenticated]);

  if (setupRequired === null) {
    return (
      <div className="h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (setupRequired) {
    return <SetupWizard onComplete={() => setSetupRequired(false)} />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const menuItems = [
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
      name: 'System Setup', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg font-['Segoe_UI_Variable_Text',_system-ui,_sans-serif]">
      {/* Sidebar - Collapsible with Framer Motion for smoothness */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarExpanded ? 280 : 80,
          padding: sidebarExpanded ? '24px' : '12px'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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

        <nav className={`flex-1 space-y-1 pr-2 ${sidebarExpanded ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}>
          {menuItems
            .filter(item => {
              const adminOnly = ['Product Manager', 'System Setup'];
              if (!isAdmin && adminOnly.includes(item.name)) return false;
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
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{user?.role === 'ADMIN' ? 'System Admin' : 'Staff Member'}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header - Sticky */}
        <header className="h-20 flex items-center justify-between px-10 flex-shrink-0 bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 border-b border-border-subtle/50">
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500">Online</span>
            </div>
            <span>🔔</span>
            <span>❓</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-foreground">{user?.username}</div>
              <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{user?.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}</div>
            </div>
            <button
              onClick={logout}
              className="bg-foreground text-brand-bg text-xs font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-24">
          <div className="max-w-[1400px] w-full mx-auto animate-in fade-in duration-500">
            {activeTab === 'Product Manager' && user?.role === 'ADMIN' && <ProductForm />}
            {activeTab === 'Inventory Stock' && <InventoryStock />}
            {activeTab === 'System Setup' && user?.role === 'ADMIN' && <SystemSetup />}

            {/* Fallback for unauthorized access */}
            {(['Product Manager', 'System Setup'].includes(activeTab) && user?.role !== 'ADMIN') && (
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
          </div>
        </div>
      </main>
    </div>
  );
}
