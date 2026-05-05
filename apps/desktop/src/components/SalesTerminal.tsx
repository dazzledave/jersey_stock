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

interface CartItem {
  id: string;
  variantId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

export default function SalesTerminal() {
  const [cart, setCart] = useState<CartItem[]>([]);
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
    } else if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
    } else {
      alert('This product has no variants and cannot be sold.');
    }
  };

  const addToCart = (product: Product, variant: Variant) => {
    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id);
      if (existing) {
        return prev.map(item => 
          item.variantId === variant.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { 
        id: product.id, 
        variantId: variant.id, 
        name: product.name, 
        price: product.basePrice,
        size: variant.size,
        color: variant.color,
        quantity: 1
      }];
    });
    setVariantSelector(null);
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

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
          items: cart.map(item => ({ 
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price
          }))
        })
      });

      if (response.ok) {
        setCart([]);
        alert('Sale completed successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to complete sale: ${error.error}`);
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
            className="w-full bg-surface p-3.5 pl-10 rounded-lg border border-border-subtle outline-none focus:border-orange-300 transition-all text-xs font-medium text-foreground shadow-sm"
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
                className="bg-surface p-4 rounded-xl border border-border-subtle cursor-pointer group hover:border-orange-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full"
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
                  <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[12px] shadow-sm">+</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Order Ticket */}
      <div className="w-[420px] bg-surface rounded-xl border border-border-subtle flex flex-col overflow-hidden shadow-2xl shadow-brand-navy/5 h-full">
        <div className="p-6 border-b border-border-subtle bg-brand-bg/10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Order Ticket</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Awards Centre POS</p>
            </div>
            <span className="text-[10px] font-black text-white bg-orange-500 px-3 py-1.5 rounded-full uppercase tracking-widest">{cart.reduce((acc, i) => acc + i.quantity, 0)} Items</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-50">
                  <div className="text-5xl">🛒</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Ticket Empty</p>
                </div>
            ) : (
              cart.map((item) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={item.variantId} 
                  className="flex flex-col bg-brand-bg/30 p-4 rounded-xl border border-border-subtle group relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="text-xs font-black truncate text-foreground uppercase">{item.name}</div>
                      <div className="text-[10px] font-bold text-orange-500 mt-0.5 tracking-wide">
                        {item.size} • {item.color}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-1 bg-surface rounded-lg border border-border-subtle p-1">
                      <button 
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-brand-bg hover:text-foreground transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>
                      </button>
                      <span className="w-8 text-center text-xs font-black text-foreground">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.variantId, 1)}
                        className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-brand-bg hover:text-foreground transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      </button>
                    </div>
                    <div className="text-sm font-black text-foreground">{currency}{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-border-subtle bg-brand-bg/5 p-6 space-y-6 shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Amount Due</div>
            <div className="text-3xl font-black text-foreground">{currency}{total.toLocaleString()}</div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] uppercase font-black text-slate-400 tracking-widest ml-1">Select Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setPaymentMethod('Cash')}
                 className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${paymentMethod === 'Cash' ? 'bg-foreground border-foreground text-brand-bg shadow-xl' : 'bg-surface border-border-subtle text-slate-400 hover:border-orange-200'}`}
               >
                  <span className="text-xl">💵</span>
                  <span className="text-xs font-black uppercase tracking-tight">Cash</span>
               </button>
               <button 
                 onClick={() => setPaymentMethod('MoMo')}
                 className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${paymentMethod === 'MoMo' ? 'bg-[#ffb443] border-[#ffb443] text-[#1a1f2b] shadow-xl' : 'bg-surface border-border-subtle text-slate-400 hover:border-orange-200'}`}
               >
                  <span className="text-xl">📱</span>
                  <span className="text-xs font-black uppercase tracking-tight">MoMo</span>
               </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full font-black py-5 rounded-xl uppercase tracking-[0.3em] text-[11px] shadow-2xl transition-all ${cart.length > 0 && !isProcessing ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
            >
              {isProcessing ? 'Finalizing...' : cart.length > 0 ? 'Proceed to Checkout' : 'Cart Empty'}
            </button>
            <button 
              onClick={() => setCart([])}
              className="w-full text-[9px] font-black text-slate-400 uppercase hover:text-rose-500 transition-colors tracking-widest"
            >
              Void Current Order
            </button>
          </div>
        </div>
      </div>

      {/* Variant Selector */}
      <AnimatePresence>
        {variantSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-brand-bg/20">
                <div>
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">{variantSelector.name}</h3>
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">Available Variations</p>
                </div>
                <button onClick={() => setVariantSelector(null)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-slate-400 hover:text-foreground shadow-sm border border-border-subtle">×</button>
              </div>
              <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {variantSelector.variants.map((v) => (
                  <button 
                    key={v.id}
                    onClick={() => addToCart(variantSelector, v)}
                    className="w-full flex justify-between items-center p-5 bg-brand-bg rounded-xl border border-border-subtle hover:border-orange-500 hover:bg-orange-500/5 transition-all group"
                  >
                    <div className="text-left">
                      <div className="text-sm font-black text-foreground">Size: {v.size}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Color: {v.color}</div>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="text-sm font-black text-orange-500">{currency}{variantSelector.basePrice.toLocaleString()}</div>
                       <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Add to cart</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-6 bg-brand-bg/30 text-center border-t border-border-subtle">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select a size to continue</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
