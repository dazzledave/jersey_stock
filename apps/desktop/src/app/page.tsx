"use client";

import { useState } from 'react';
import InventoryDashboard from "@/components/InventoryDashboard";
import ProductForm from "@/components/ProductForm";
import SalesTerminal from "@/components/SalesTerminal";
import CustomerList from "@/components/CustomerList";
import SalesRecords from "@/components/SalesRecords";
import InventoryStock from "@/components/InventoryStock";
import Analytics from "@/components/Analytics";
import SystemSetup from "@/components/SystemSetup";

export default function Home() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const menuItems = [
    { name: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    )},
    { name: 'Sales Terminal', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
    )},
    { name: 'Sales Records', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
    )},
    { name: 'Customer List', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
    )},
    { name: 'Product List', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01M19 7h.01M19 11h.01M19 15h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>
    )},
    { name: 'Inventory Stock', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
    )},
    { name: 'Analytics', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
    )},
    { name: 'System Setup', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    )},
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcf8f1] font-['Segoe_UI_Variable_Text',_system-ui,_sans-serif]">
      {/* Sidebar - Collapsible */}
      <aside className={`bg-[#1a1f2b] text-white flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarExpanded ? 'w-[280px] p-6' : 'w-[80px] p-2'}`}>
        <div className={`flex items-center justify-between px-2 ${sidebarExpanded ? 'mb-8' : 'mb-4'}`}>
          {sidebarExpanded && (
            <div className="animate-in fade-in slide-in-from-left-2">
              <h2 className="text-xl font-bold tracking-tight">Awards Centre</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Inventory Management</p>
            </div>
          )}
          <button 
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={`p-2 hover:bg-slate-800 rounded-lg transition-colors ${!sidebarExpanded ? 'mx-auto' : ''}`}
          >
            <svg className="w-6 h-6 text-[#ffb443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('Product List')}
          className={`bg-[#ffb443] hover:bg-[#fca42d] text-[#1a1f2b] font-bold py-3 rounded-lg flex items-center transition-all group overflow-hidden ${sidebarExpanded ? 'px-4 justify-between mb-6' : 'w-12 h-12 justify-center mx-auto mb-4'}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">+</span>
            {sidebarExpanded && <span className="animate-in fade-in slide-in-from-left-2">Create new</span>}
          </div>
          {sidebarExpanded && <span className="opacity-50 group-hover:translate-x-1 transition-transform">›</span>}
        </button>
        
        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map((item) => (
            <button 
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full rounded-lg text-sm font-medium transition-all flex items-center group ${
                sidebarExpanded ? 'px-4 py-3 gap-3' : 'w-12 h-12 justify-center mx-auto'
              } ${
                activeTab === item.name 
                ? 'bg-[#2a3142] text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-[#2a3142]/50'
              }`}
              title={!sidebarExpanded ? item.name : ''}
            >
              <span className={`transition-colors ${activeTab === item.name ? 'text-[#ffb443]' : 'text-slate-500 group-hover:text-[#ffb443]'}`}>
                {item.icon}
              </span>
              {sidebarExpanded && <span className="animate-in fade-in slide-in-from-left-2 truncate">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className={`pt-4 border-t border-slate-800/50 mt-2 overflow-hidden`}>
          <div className={`flex items-center gap-3 px-2 ${!sidebarExpanded ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-[10px]">AC</div>
            {sidebarExpanded && (
              <div className="animate-in fade-in slide-in-from-left-2 truncate">
                <div className="text-sm font-bold">Admin User</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">System Admin</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header - Sticky */}
        <header className="h-20 flex items-center justify-between px-10 flex-shrink-0 bg-[#fcf8f1]/80 backdrop-blur-md sticky top-0 z-50">
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
              <div className="text-sm font-bold text-[#1a1f2b]">Admin User</div>
              <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Master Seller</div>
            </div>
            <button className="bg-[#1a1f2b] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all">
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar pb-24">
          <div className="max-w-[1400px] w-full mx-auto animate-in fade-in duration-500">
          {activeTab === 'Dashboard' && <InventoryDashboard />}
          {activeTab === 'Sales Terminal' && <SalesTerminal />}
          {activeTab === 'Sales Records' && <SalesRecords />}
          {activeTab === 'Customer List' && <CustomerList />}
          {activeTab === 'Product List' && <ProductForm />}
          {activeTab === 'Inventory Stock' && <InventoryStock />}
          {activeTab === 'Analytics' && <Analytics />}
          {activeTab === 'System Setup' && <SystemSetup />}
        </div>
        </div>
      </main>
    </div>
  );
}
