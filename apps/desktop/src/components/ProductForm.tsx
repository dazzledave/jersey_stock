"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Variant {
  size: string;
  color: string;
  sku: string;
  barcode: string;
  quantity: number;
}

export default function ProductForm() {
  const [variants, setVariants] = useState<Variant[]>([]);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Catalog Management</div>
          <h2 className="text-3xl font-bold text-[#1a1f2b]">Add New Product</h2>
          <p className="text-slate-400 text-sm font-medium">Create a high-quality entry in your awards and apparel inventory.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#f0ebe4] p-10 shadow-sm space-y-12">
        {/* Basic Info Section */}
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <span className="w-2 h-2 bg-orange-200 rounded-sm" /> Basic Information
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1a1f2b] ml-1">Product Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Championship Gold Trophy" 
                    className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-medium outline-none focus:border-orange-300 transition-all placeholder:text-slate-300 text-[#1a1f2b]" 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[#1a1f2b] ml-1">Brand / Manufacturer</label>
                     <input 
                        type="text" 
                        placeholder="e.g. Nike" 
                        className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-medium outline-none focus:border-orange-300 transition-all placeholder:text-slate-300 text-[#1a1f2b]" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[#1a1f2b] ml-1">Base Retail Price</label>
                     <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">GH₵</span>
                        <input 
                           type="number" 
                           placeholder="0.00" 
                           className="w-full bg-[#fcf8f1] p-4 pl-12 rounded-lg border border-[#f0ebe4] text-sm font-bold outline-none focus:border-orange-300 transition-all text-[#1a1f2b]" 
                        />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <span className="w-2 h-2 bg-orange-200 rounded-sm" /> Classification
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1a1f2b] ml-1">Category</label>
                  <select className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-bold outline-none focus:border-orange-300 transition-all text-[#1a1f2b] appearance-none cursor-pointer">
                    <option>Select Category</option>
                    <option>Jerseys</option>
                    <option>Trophies</option>
                    <option>Medals</option>
                    <option>Footwear</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1a1f2b] ml-1">Detailed Description</label>
                  <textarea 
                    placeholder="Describe the product quality, material, and features..." 
                    className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-medium outline-none focus:border-orange-300 transition-all placeholder:text-slate-300 text-[#1a1f2b] h-[92px] resize-none" 
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Variant Matrix Section */}
        <div className="space-y-6 pt-10 border-t border-[#fcf8f1]">
          <div className="flex justify-between items-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <span className="w-2 h-2 bg-orange-200 rounded-sm" /> Variant Matrix
            </div>
            <button 
              type="button" 
              onClick={() => setVariants([...variants, { size: '', color: '', sku: '', barcode: '', quantity: 0 }])}
              className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-600 transition-colors bg-orange-50 px-4 py-2 rounded-full border border-orange-100"
            >
              + Add New Size/Color
            </button>
          </div>

          <div className="space-y-3">
             <AnimatePresence>
               {variants.length === 0 ? (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-center py-12 bg-[#fcf8f1]/50 rounded-xl border-2 border-dashed border-[#f0ebe4] flex flex-col items-center gap-3"
                 >
                    <span className="text-2xl opacity-20">🏷️</span>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No variants defined for this product</p>
                 </motion.div>
               ) : (
                 variants.map((v, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="grid grid-cols-5 gap-4 p-4 bg-[#fcf8f1] rounded-lg border border-[#f0ebe4] group hover:border-orange-200 transition-all"
                   >
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Size</label>
                        <input type="text" placeholder="e.g. L" className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-[#1a1f2b]" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Color</label>
                        <input type="text" placeholder="e.g. Gold" className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-[#1a1f2b]" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">SKU</label>
                        <input type="text" placeholder="AW-G-L" className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-mono text-orange-600" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Barcode</label>
                        <input type="text" placeholder="000000" className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-medium text-slate-400" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Initial Stock</label>
                        <input type="number" defaultValue="0" className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-[#1a1f2b]" />
                     </div>
                   </motion.div>
                 ))
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Submit Section */}
        <div className="pt-10 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ready to publish to catalog</p>
           </div>
           <button className="bg-[#1a1f2b] text-white font-bold px-12 py-5 rounded-lg uppercase tracking-[0.2em] text-xs hover:shadow-xl hover:shadow-[#1a1f2b]/20 transition-all active:scale-95">
              Publish Product
           </button>
        </div>
      </div>
    </div>
  );
}
