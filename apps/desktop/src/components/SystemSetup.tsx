"use client";

import React from 'react';

export default function SystemSetup() {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Configuration</div>
          <h2 className="text-3xl font-bold text-[#1a1f2b]">System Setup</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
         <div className="bg-white p-10 rounded-xl border border-[#f0ebe4] space-y-8">
            <div>
               <h3 className="text-xl font-bold text-[#1a1f2b] mb-1">Shop Profile</h3>
               <p className="text-xs text-slate-400 font-medium">Manage your public store information.</p>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Shop Name</label>
                  <input type="text" defaultValue="Awards Centre" className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-bold outline-none" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Currency Symbol</label>
                  <input type="text" defaultValue="GH₵" className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-bold outline-none" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Store Address</label>
                  <textarea defaultValue="Accra, Ghana" className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-bold outline-none h-24" />
               </div>
            </div>
            <button className="w-full bg-[#1a1f2b] text-white font-bold py-4 rounded-lg text-xs uppercase tracking-widest">Save Settings</button>
         </div>

         <div className="space-y-8">
            <div className="bg-white p-10 rounded-xl border border-[#f0ebe4] space-y-6">
               <div>
                  <h3 className="text-xl font-bold text-[#1a1f2b] mb-1">Database Status</h3>
                  <p className="text-xs text-slate-400 font-medium">Connectivity and sync info.</p>
               </div>
               <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</div>
                     <div>
                        <div className="text-sm font-bold text-emerald-700">PostgreSQL Online</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Connection Stable</div>
                     </div>
                  </div>
                  <button className="text-[10px] font-black uppercase text-emerald-700 border-b border-emerald-300">Refresh</button>
               </div>
            </div>

            <div className="bg-orange-50 p-10 rounded-xl border border-orange-100 space-y-4">
               <h3 className="text-lg font-bold text-orange-800">Advanced Maintenance</h3>
               <p className="text-xs text-orange-700 leading-relaxed font-medium">
                  Perform system backups or clear transaction logs. Note: these actions are permanent.
               </p>
               <div className="flex gap-4 pt-2">
                  <button className="px-6 py-2 bg-white text-orange-700 text-[10px] font-black uppercase rounded-lg border border-orange-200">Backup Data</button>
                  <button className="px-6 py-2 bg-white text-rose-500 text-[10px] font-black uppercase rounded-lg border border-rose-100">Reset Logs</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
