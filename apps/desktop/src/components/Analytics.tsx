"use client";

import React from 'react';

export default function Analytics() {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Performance Metrics</div>
          <h2 className="text-3xl font-bold text-[#1a1f2b]">Store Analytics</h2>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#f0ebe4] text-[#1a1f2b] text-xs font-bold px-6 py-3 rounded-lg hover:bg-[#fcf8f1] transition-all">
             Last 30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
         <div className="col-span-8 bg-white p-10 rounded-xl border border-[#f0ebe4]">
            <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Revenue Trend</div>
            <h3 className="text-xl font-bold text-[#1a1f2b] mb-10">Monthly Performance</h3>
            <div className="h-[300px] flex items-end gap-4 px-4 relative">
               {/* Grid lines */}
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  {[1,2,3,4].map(i => <div key={i} className="border-t border-slate-300 w-full" />)}
               </div>
               {[60, 40, 90, 120, 80, 150, 200, 180, 250, 300, 280, 350].map((v, i) => (
                 <div key={i} className="flex-1 bg-[#fdf3e7] rounded-t-lg hover:bg-orange-400 transition-all cursor-pointer relative group" style={{ height: `${(v/400)*100}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1f2b] text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                       GH₵{v}
                    </div>
                 </div>
               ))}
            </div>
            <div className="flex justify-between mt-6 px-4">
               {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                 <span key={m} className="text-[10px] font-bold text-slate-300 uppercase">{m}</span>
               ))}
            </div>
         </div>

         <div className="col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-xl border border-[#f0ebe4]">
               <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-4">Top Categories</div>
               <div className="space-y-6">
                  {[
                    { label: 'Home Jerseys', value: 45, color: 'bg-orange-400' },
                    { label: 'Away Jerseys', value: 30, color: 'bg-blue-400' },
                    { label: 'Training Gear', value: 15, color: 'bg-emerald-400' },
                    { label: 'Footwear', value: 10, color: 'bg-slate-400' },
                  ].map((c, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-xs font-bold">
                          <span>{c.label}</span>
                          <span className="text-slate-400">{c.value}%</span>
                       </div>
                       <div className="h-2 bg-[#fcf8f1] rounded-full overflow-hidden">
                          <div className={`h-full ${c.color}`} style={{ width: `${c.value}%` }} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-[#1a1f2b] p-8 rounded-xl text-white">
               <div className="text-[10px] uppercase font-bold text-orange-400 tracking-[0.2em] mb-4">Executive Summary</div>
               <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Revenue is up <span className="text-emerald-400 font-bold">12.5%</span> compared to last month. 
                  Home Jersey sales are peaking due to the upcoming season.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
