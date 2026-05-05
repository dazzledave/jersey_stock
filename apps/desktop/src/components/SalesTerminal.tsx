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
  variants: Variant[];
}

export default function SalesTerminal() {
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessing, setIsProcessing] = useState(false);

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
    <div className="flex gap-10 h-[calc(100vh-160px)]">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col space-y-8 min-w-0">
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

        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6 overflow-y-auto pr-2 pb-10 custom-scrollbar">
          {isLoading ? (
            <div className="col-span-full text-center py-20 text-slate-300 font-bold uppercase tracking-widest animate-pulse">Loading Catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-lg border border-dashed border-[#f0ebe4] text-slate-300 font-bold uppercase tracking-widest">
              No products found in system
            </div>
          ) : (
            filteredProducts.map((p) => (
              <motion.div 
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(p)}
                className="bg-white p-5 rounded-xl border border-[#f0ebe4] cursor-pointer group hover:border-orange-200 transition-all shadow-sm hover:shadow-md flex flex-col"
              >
                <div className="aspect-square bg-[#fcf8f1] rounded-lg flex items-center justify-center text-4xl mb-4 group-hover:scale-105 transition-transform shrink-0">
                  👕
                </div>
                <div className="font-bold text-[#1a1f2b] text-sm mb-1 line-clamp-2 leading-tight h-10">{p.name}</div>
                <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3">{p.brand}</div>
                <div className="mt-auto pt-2 border-t border-[#fcf8f1] flex justify-between items-center">
                  <div className="text-sm font-black text-[#1a1f2b]">GH₵{p.basePrice.toFixed(2)}</div>
                  <div className="w-6 h-6 rounded-full bg-[#fcf8f1] flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-orange-500">+</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar - Order Ticket - Compact Design */}
      <div className="w-[400px] bg-white rounded-xl border border-[#f0ebe4] flex flex-col overflow-hidden shadow-2xl shadow-[#1a1f2b]/5">
        <div className="p-6 border-b border-[#fcf8f1] bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#1a1f2b]">Current Sale</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-[#fcf8f1] px-2 py-1 rounded-full uppercase">{cart.length} items</span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <AnimatePresence>
              {cart.length === 0 ? (
                 <div className="py-10 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <div className="text-2xl">🛒</div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Ticket Empty</p>
                 </div>
              ) : (
                cart.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex justify-between items-center bg-[#fcf8f1]/30 p-3 rounded-lg border border-[#fcf8f1] group relative"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="text-xs font-bold truncate text-[#1a1f2b]">{item.name}</div>
                      <div className="text-[8px] font-black uppercase text-slate-400">{item.size} / {item.color}</div>
                    </div>
                    <div className="text-sm font-bold text-[#1a1f2b] whitespace-nowrap">GH₵{item.price.toFixed(2)}</div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromCart(i); }}
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-[#fcf8f1]/20">
          <div className="flex justify-between items-end">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Amount</div>
            <div className="text-4xl font-bold text-[#1a1f2b]">GH₵{total.toFixed(2)}</div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setPaymentMethod('Cash')}
                 className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${paymentMethod === 'Cash' ? 'bg-[#1a1f2b] border-[#1a1f2b] text-white shadow-lg' : 'bg-white border-[#f0ebe4] text-slate-400'}`}
               >
                  <span>💵</span>
                  <span className="text-xs font-bold">Cash</span>
               </button>
               <button 
                 onClick={() => setPaymentMethod('MoMo')}
                 className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${paymentMethod === 'MoMo' ? 'bg-[#ffb443] border-[#ffb443] text-[#1a1f2b] shadow-lg' : 'bg-white border-[#f0ebe4] text-slate-400'}`}
               >
                  <span>📱</span>
                  <span className="text-xs font-bold">MoMo</span>
               </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Customer (Optional)</label>
            <input type="text" placeholder="Search customer..." className="w-full bg-white p-3 rounded-lg border border-[#f0ebe4] text-xs font-medium outline-none focus:border-orange-300 transition-all" />
          </div>
        </div>

        <div className="p-6 bg-white border-t border-[#f0ebe4]">
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full font-bold py-4 rounded-lg uppercase tracking-widest text-xs transition-all ${cart.length > 0 && !isProcessing ? 'bg-[#1a1f2b] text-white hover:bg-emerald-600 shadow-xl shadow-[#1a1f2b]/10 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
          >
            {isProcessing ? 'Processing...' : cart.length > 0 ? 'Complete Sale' : 'Select Products'}
          </button>
          <div className="flex justify-center gap-6 mt-4">
            <button 
              onClick={() => setCart([])}
              className="text-[10px] font-bold text-slate-400 uppercase hover:text-rose-500 transition-colors"
            >
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
