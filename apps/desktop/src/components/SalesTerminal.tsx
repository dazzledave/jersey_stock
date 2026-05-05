"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Variant {
  id: string;
  size: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  basePrice: number;
  imageUrl?: string;
  variants: Variant[];
}

export default function SalesTerminal() {
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState('GH₵');

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    // For now, use the first variant ID for inventory tracking
    const variantId = product.variants?.[0]?.id;
    setCart([...cart, { 
      id: product.id, 
      variantId, 
      name: product.name, 
      price: product.basePrice,
      size: product.variants?.[0]?.size,
      color: product.variants?.[0]?.color
    }]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:4000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: total,
          paymentMethod,
          items: cart.map(item => ({ variantId: item.variantId }))
        })
      });

      if (response.ok) {
        setCart([]);
        alert('Sale completed successfully!');
      } else {
        alert('Failed to complete sale.');
      }
    } catch (err) {
      alert('Network error. Is the server running?');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[9px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Sales Terminal</div>
            <h2 className="text-2xl font-bold text-foreground">Ring up an order</h2>
          </div>
          <div className="text-[9px] font-bold text-slate-400 bg-surface px-3 py-1.5 rounded-lg border border-border-subtle">
            Available: <span className="text-foreground">{products.length}</span>
          </div>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Search jerseys, kits, footwear..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface p-3.5 pl-10 rounded-lg border border-border-subtle outline-none focus:border-orange-300 transition-all text-xs font-medium text-foreground"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs">🔍</span>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 overflow-y-auto pr-1 pb-10 custom-scrollbar">
          {isLoading ? (
            <div className="col-span-full text-center py-10 text-slate-300 font-bold uppercase tracking-widest animate-pulse text-[10px]">Loading Catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-surface rounded-lg border border-dashed border-border-subtle text-slate-300 font-bold uppercase tracking-widest text-[10px]">
              No products found in system
            </div>
          ) : (
            filteredProducts.map((p) => (
              <motion.div 
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(p)}
                className="bg-surface p-4 rounded-xl border border-border-subtle cursor-pointer group hover:border-orange-200 transition-all shadow-sm hover:shadow-md flex flex-col"
              >
                <div className="aspect-square bg-brand-bg rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">👕</span>
                  )}
                </div>
                <div className="font-bold text-foreground text-xs mb-0.5 line-clamp-2 leading-tight h-8">{p.name}</div>
                <div className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-2">{p.brand}</div>
                <div className="mt-auto pt-2 border-t border-border-subtle flex justify-between items-center">
                  <div className="text-xs font-black text-foreground">{currency}{p.basePrice.toFixed(2)}</div>
                  <div className="w-5 h-5 rounded-full bg-brand-bg flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">+</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar - Order Ticket - Compact Design */}
      <div className="w-[360px] bg-surface rounded-xl border border-border-subtle flex flex-col overflow-hidden shadow-2xl shadow-brand-navy/5">
        <div className="p-5 border-b border-border-subtle bg-surface">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-foreground">Current Sale</h3>
            <span className="text-[9px] font-bold text-slate-400 bg-brand-bg px-2 py-0.5 rounded-full uppercase">{cart.length} items</span>
          </div>
          
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <AnimatePresence>
              {cart.length === 0 ? (
                 <div className="py-6 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <div className="text-xl">🛒</div>
                    <p className="text-[9px] font-bold uppercase tracking-widest">Ticket Empty</p>
                 </div>
              ) : (
                cart.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex justify-between items-center bg-brand-bg/30 p-2.5 rounded-lg border border-border-subtle group relative"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="text-[11px] font-bold truncate text-foreground">{item.name}</div>
                      <div className="text-[8px] font-black uppercase text-slate-400">{item.size} / {item.color}</div>
                    </div>
                    <div className="text-xs font-bold text-foreground whitespace-nowrap">{currency}{item.price.toFixed(2)}</div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromCart(i); }}
                      className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5 overflow-y-auto custom-scrollbar bg-brand-bg/10">
          <div className="flex justify-between items-end">
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Total Amount</div>
            <div className="text-3xl font-bold text-foreground">{currency}{total.toFixed(2)}</div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest ml-1">Payment</label>
            <div className="grid grid-cols-2 gap-2">
               <button 
                 onClick={() => setPaymentMethod('Cash')}
                 className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${paymentMethod === 'Cash' ? 'bg-foreground border-foreground text-brand-bg shadow-md' : 'bg-surface border-border-subtle text-slate-400'}`}
               >
                  <span className="text-sm">💵</span>
                  <span className="text-[11px] font-bold">Cash</span>
               </button>
               <button 
                 onClick={() => setPaymentMethod('MoMo')}
                 className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${paymentMethod === 'MoMo' ? 'bg-[#ffb443] border-[#ffb443] text-[#1a1f2b] shadow-md' : 'bg-surface border-border-subtle text-slate-400'}`}
               >
                  <span className="text-sm">📱</span>
                  <span className="text-[11px] font-bold">MoMo</span>
               </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest ml-1">Customer</label>
            <input type="text" placeholder="Search..." className="w-full bg-surface p-3 rounded-lg border border-border-subtle text-xs font-medium outline-none focus:border-orange-300 transition-all text-foreground" />
          </div>
        </div>

        <div className="p-5 bg-surface border-t border-border-subtle">
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full font-bold py-3.5 rounded-lg uppercase tracking-widest text-[10px] transition-all ${cart.length > 0 && !isProcessing ? 'bg-foreground text-brand-bg hover:bg-emerald-600 shadow-lg active:scale-95' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 cursor-not-allowed'}`}
          >
            {isProcessing ? 'Processing...' : cart.length > 0 ? 'Complete Sale' : 'Select Items'}
          </button>
          <div className="flex justify-center gap-4 mt-3">
            <button 
              onClick={() => setCart([])}
              className="text-[9px] font-bold text-slate-400 uppercase hover:text-rose-500 transition-colors"
            >
              Clear Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
