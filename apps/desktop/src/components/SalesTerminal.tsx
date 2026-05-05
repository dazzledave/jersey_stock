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
  
  const [variantSelector, setVariantSelector] = useState<Product | null>(null);

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

  const handleProductClick = (product: Product) => {
    if (product.variants.length > 1) {
      setVariantSelector(product);
    } else {
      addToCart(product, product.variants[0]);
    }
  };

  const addToCart = (product: Product, variant: Variant) => {
    setCart([...cart, { 
      id: product.id, 
      variantId: variant.id, 
      name: product.name, 
      price: product.basePrice,
      size: variant.size,
      color: variant.color
    }]);
    setVariantSelector(null);
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
    <div className="flex gap-6 h-[calc(100vh-140px)] relative">
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
                onClick={() => handleProductClick(p)}
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

      {/* Right Sidebar - Order Ticket - Fixed Layout */}
      <div className="w-[400px] bg-surface rounded-xl border border-border-subtle flex flex-col overflow-hidden shadow-2xl shadow-brand-navy/5 h-full">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground">Current Sale</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-brand-bg px-3 py-1 rounded-full uppercase tracking-widest">{cart.length} items</span>
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          <AnimatePresence>
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-50">
                  <div className="text-4xl">🛒</div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Ticket Empty</p>
                </div>
            ) : (
              cart.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="flex justify-between items-center bg-brand-bg/30 p-4 rounded-xl border border-border-subtle group relative"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="text-xs font-bold truncate text-foreground">{item.name}</div>
                    <div className="text-[9px] font-black uppercase text-slate-400 mt-0.5">{item.size} / {item.color}</div>
                  </div>
                  <div className="text-sm font-bold text-foreground whitespace-nowrap">{currency}{item.price.toFixed(2)}</div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFromCart(i); }}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-90"
                  >
                    ×
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer Section - Fixed Height to prevent scrolling */}
        <div className="border-t border-border-subtle bg-brand-bg/5 p-6 space-y-6 shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Amount</div>
            <div className="text-3xl font-bold text-foreground">{currency}{total.toFixed(2)}</div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest ml-1">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setPaymentMethod('Cash')}
                 className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border transition-all ${paymentMethod === 'Cash' ? 'bg-foreground border-foreground text-brand-bg shadow-lg' : 'bg-surface border-border-subtle text-slate-400 hover:border-orange-200'}`}
               >
                  <span className="text-lg">💵</span>
                  <span className="text-xs font-bold">Cash</span>
               </button>
               <button 
                 onClick={() => setPaymentMethod('MoMo')}
                 className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border transition-all ${paymentMethod === 'MoMo' ? 'bg-[#ffb443] border-[#ffb443] text-[#1a1f2b] shadow-lg' : 'bg-surface border-border-subtle text-slate-400 hover:border-orange-200'}`}
               >
                  <span className="text-lg">📱</span>
                  <span className="text-xs font-bold">MoMo</span>
               </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full font-bold py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] transition-all ${cart.length > 0 && !isProcessing ? 'bg-foreground text-brand-bg hover:bg-emerald-600 shadow-xl active:scale-95' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'}`}
            >
              {isProcessing ? 'Processing...' : cart.length > 0 ? 'Complete Sale' : 'Select Items'}
            </button>
            <button 
              onClick={() => setCart([])}
              className="w-full text-[9px] font-bold text-slate-400 uppercase hover:text-rose-500 transition-colors tracking-widest"
            >
              Clear Current Order
            </button>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      <AnimatePresence>
        {variantSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-subtle flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">{variantSelector.name}</h3>
                  <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest mt-1">Select Variation</p>
                </div>
                <button onClick={() => setVariantSelector(null)} className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-slate-400 hover:text-foreground">×</button>
              </div>
              <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {variantSelector.variants.map((v) => (
                  <button 
                    key={v.id}
                    onClick={() => addToCart(variantSelector, v)}
                    className="w-full flex justify-between items-center p-4 bg-brand-bg rounded-xl border border-border-subtle hover:border-orange-300 hover:bg-orange-500/5 transition-all group"
                  >
                    <div className="text-left">
                      <div className="text-sm font-bold text-foreground">Size: {v.size}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Color: {v.color}</div>
                    </div>
                    <div className="text-sm font-black text-foreground group-hover:text-orange-500 transition-colors">
                      {currency}{variantSelector.basePrice.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-6 bg-brand-bg/30 text-center">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select a size to add to cart</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
