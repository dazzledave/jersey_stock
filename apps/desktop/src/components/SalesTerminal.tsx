"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SalesTerminal() {
  const [cart, setCart] = useState<any[]>([]);
  const products = [
    { id: 1, name: 'Home Jersey 2024', brand: 'Nike', price: 150, image: '👕' },
    { id: 2, name: 'Away Jersey 2024', brand: 'Adidas', price: 140, image: '👕' },
    { id: 3, name: 'Training Kit', brand: 'Puma', price: 80, image: '🎽' },
    { id: 4, name: 'Goalkeeper Jersey', brand: 'Nike', price: 160, image: '🧤' },
    { id: 5, name: 'Tech Fleece', brand: 'Nike', price: 220, image: '🧥' },
    { id: 6, name: 'Speed Cleats', brand: 'Adidas', price: 300, image: '👟' },
  ];

  const addToCart = (product: any) => {
    setCart([...cart, product]);
  };

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="flex gap-10 h-[calc(100vh-160px)]">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Sales Terminal</div>
            <h2 className="text-3xl font-bold text-[#1a1f2b]">Ring up an order</h2>
            <p className="text-slate-400 text-sm font-medium">Tap a product to add it to the ticket.</p>
          </div>
          <div className="text-[10px] font-bold text-slate-400 bg-white px-4 py-2 rounded-lg border border-[#f0ebe4]">
            In catalog: <span className="text-[#1a1f2b]">{products.length}</span>
          </div>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Search jerseys, kits, footwear..."
            className="w-full bg-white p-5 pl-12 rounded-lg border border-[#f0ebe4] outline-none focus:border-orange-300 transition-all text-sm font-medium"
          />
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
        </div>

        <div className="grid grid-cols-3 gap-6 overflow-y-auto pr-2 pb-10">
          {products.map((p) => (
            <motion.div 
              key={p.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(p)}
              className="bg-white p-6 rounded-lg border border-[#f0ebe4] cursor-pointer group hover:border-orange-200 transition-all shadow-sm hover:shadow-md"
            >
              <div className="aspect-square bg-[#fcf8f1] rounded-lg flex items-center justify-center text-4xl mb-6 group-hover:scale-105 transition-transform">
                {p.image}
              </div>
              <div className="font-bold text-[#1a1f2b] text-sm mb-1">{p.name}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">{p.brand}</div>
              <div className="text-sm font-bold text-[#1a1f2b]">GH₵{p.price.toFixed(2)}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Order Ticket */}
      <div className="w-[450px] bg-white rounded-xl border border-[#f0ebe4] flex flex-col overflow-hidden shadow-2xl shadow-[#1a1f2b]/5">
        <div className="p-8 border-b border-[#fcf8f1]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Order Ticket</div>
              <h3 className="text-xl font-bold text-[#1a1f2b]">Current Sale</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-[#fcf8f1] px-3 py-1 rounded-full uppercase tracking-tighter">{cart.length} items</span>
          </div>
          
          <div className="h-[200px] overflow-y-auto space-y-4 pr-2">
            <AnimatePresence>
              {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#fcf8f1] flex items-center justify-center text-2xl">🛒</div>
                    <p className="text-xs font-bold uppercase tracking-widest">Ticket Empty</p>
                 </div>
              ) : (
                cart.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex justify-between items-center bg-[#fcf8f1]/50 p-3 rounded-lg border border-[#fcf8f1]"
                  >
                    <div className="text-sm font-bold">{item.name}</div>
                    <div className="text-sm font-bold text-[#1a1f2b]">GH₵{item.price.toFixed(2)}</div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-8 space-y-6 flex-1 bg-[#fcf8f1]/30">
          <div className="flex justify-between items-end">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total</div>
            <div className="text-4xl font-bold text-[#1a1f2b]">GH₵{total.toFixed(2)}</div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Customer</label>
            <input type="text" placeholder="Search or add a customer..." className="w-full bg-white p-4 rounded-lg border border-[#f0ebe4] text-sm font-medium outline-none" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Payment Method</label>
            <div className="grid grid-cols-2 gap-4">
               <button className="flex flex-col items-center justify-center p-4 bg-white border-2 border-orange-200 rounded-lg">
                  <span className="text-lg">💵</span>
                  <span className="text-xs font-bold mt-1">Cash</span>
               </button>
               <button className="flex flex-col items-center justify-center p-4 bg-white border border-[#f0ebe4] rounded-lg text-slate-400">
                  <span className="text-lg opacity-50">📱</span>
                  <span className="text-xs font-bold mt-1">MoMo</span>
               </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Amount Tendered</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₵</span>
               <input type="number" defaultValue="0.00" className="w-full bg-white p-5 pl-10 rounded-lg border border-[#f0ebe4] text-xl font-bold text-[#1a1f2b] outline-none" />
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-[#f0ebe4]">
          <button className="w-full bg-slate-200 text-slate-500 font-bold py-5 rounded-lg uppercase tracking-widest text-xs cursor-not-allowed">
            Complete Sale
          </button>
          <div className="flex justify-center gap-6 mt-4">
            <button className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors">Save Draft</button>
            <button className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors">Re-print</button>
          </div>
        </div>
      </div>
    </div>
  );
}
