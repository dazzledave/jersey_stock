"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  brand: string;
  basePrice: number;
}

export default function SalesTerminal() {
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart([...cart, { ...product, price: product.basePrice }]);
  };

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

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
            Available: <span className="text-[#1a1f2b]">{products.length}</span>
          </div>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Search jerseys, kits, footwear..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white p-5 pl-12 rounded-lg border border-[#f0ebe4] outline-none focus:border-orange-300 transition-all text-sm font-medium"
          />
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
        </div>

        <div className="grid grid-cols-3 gap-6 overflow-y-auto pr-2 pb-10 custom-scrollbar">
          {isLoading ? (
            <div className="col-span-3 text-center py-20 text-slate-300 font-bold uppercase tracking-widest animate-pulse">Loading Catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-3 text-center py-20 bg-white rounded-lg border border-dashed border-[#f0ebe4] text-slate-300 font-bold uppercase tracking-widest">
              No products found in system
            </div>
          ) : (
            filteredProducts.map((p) => (
              <motion.div 
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(p)}
                className="bg-white p-6 rounded-lg border border-[#f0ebe4] cursor-pointer group hover:border-orange-200 transition-all shadow-sm hover:shadow-md"
              >
                <div className="aspect-square bg-[#fcf8f1] rounded-lg flex items-center justify-center text-4xl mb-6 group-hover:scale-105 transition-transform">
                  👕
                </div>
                <div className="font-bold text-[#1a1f2b] text-sm mb-1 line-clamp-1">{p.name}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3 line-clamp-1">{p.brand}</div>
                <div className="text-sm font-bold text-[#1a1f2b]">GH₵{p.basePrice.toFixed(2)}</div>
              </motion.div>
            ))
          )}
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
          
          <div className="h-[200px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
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
                    <div className="text-sm font-bold truncate pr-4">{item.name}</div>
                    <div className="text-sm font-bold text-[#1a1f2b] whitespace-nowrap">GH₵{item.price.toFixed(2)}</div>
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
            <input type="text" placeholder="Search or add a customer..." className="w-full bg-white p-4 rounded-lg border border-[#f0ebe4] text-sm font-medium outline-none focus:border-orange-300 transition-all" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Payment Method</label>
            <div className="grid grid-cols-2 gap-4">
               <button className="flex flex-col items-center justify-center p-4 bg-white border-2 border-orange-200 rounded-lg shadow-sm">
                  <span className="text-lg">💵</span>
                  <span className="text-xs font-bold mt-1 text-[#1a1f2b]">Cash</span>
               </button>
               <button className="flex flex-col items-center justify-center p-4 bg-white border border-[#f0ebe4] rounded-lg text-slate-400 hover:bg-slate-50 transition-all">
                  <span className="text-lg">📱</span>
                  <span className="text-xs font-bold mt-1">MoMo</span>
               </button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-[#f0ebe4]">
          <button className={`w-full font-bold py-5 rounded-lg uppercase tracking-widest text-xs transition-all ${cart.length > 0 ? 'bg-[#1a1f2b] text-white hover:bg-emerald-600 shadow-xl shadow-[#1a1f2b]/10 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
            {cart.length > 0 ? 'Complete Sale' : 'Add Items to Ticket'}
          </button>
          <div className="flex justify-center gap-6 mt-4">
            <button className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors">Save Draft</button>
            <button className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors">Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}
