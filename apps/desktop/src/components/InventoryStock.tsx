"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Inventory {
  quantity: number;
  reorderLevel: number;
}

interface Variant {
  id: string;
  size: string;
  color: string;
  sku: string;
  inventory: Inventory;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  basePrice: number;
  category: { name: string };
  variants: Variant[];
}

export default function InventoryStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('GH₵');
  const [editingPrice, setEditingPrice] = useState<{ id: string, price: string } | null>(null);

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
      console.error('Failed to fetch stock:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStock = async (variantId: string, newQuantity: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/inventory/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => ({
          ...p,
          variants: p.variants.map(v => v.id === variantId ? { ...v, inventory: { ...v.inventory, quantity: newQuantity } } : v)
        })));
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const handlePriceUpdate = async (productId: string) => {
    if (!editingPrice || editingPrice.id !== productId) return;
    
    const newPrice = parseFloat(editingPrice.price);
    if (isNaN(newPrice)) return;

    try {
      const res = await fetch(`http://localhost:4000/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePrice: newPrice })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, basePrice: newPrice } : p));
        setEditingPrice(null);
      }
    } catch (err) {
      console.error('Failed to update price:', err);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${productName}" and all its inventory records?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Connection error. Is the server running?');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Stock Control</div>
          <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-slate-400 text-sm font-medium">Track and adjust stock levels and pricing for your catalog.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search products, brands..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface px-10 py-3 rounded-xl border border-border-subtle text-xs font-bold outline-none focus:border-orange-300 transition-all text-foreground w-[300px]"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stock Overview Banner */}
      <section className="bg-orange-500/10 p-10 rounded-xl border border-orange-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Active Inventory Status
          </div>
          <div className="flex items-start gap-8">
             <div className="text-7xl font-bold text-foreground">{products.reduce((acc, p) => acc + p.variants.length, 0)}</div>
             <div className="pt-2">
                <div className="text-2xl font-bold text-foreground">Unique SKUs</div>
                <div className="text-sm font-bold text-slate-400">Monitoring Stock Health</div>
             </div>
          </div>
        </div>
        <div className="absolute top-10 right-10 flex flex-col items-end gap-4">
           <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">System Live</span>
        </div>
      </section>

      {/* Inventory List */}
      <div className="space-y-6">
         {isLoading ? (
           <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest animate-pulse">Loading Inventory...</div>
         ) : filteredProducts.length === 0 ? (
           <div className="text-center py-20 bg-surface rounded-xl border border-dashed border-border-subtle text-slate-300 font-bold uppercase tracking-widest flex flex-col items-center gap-4">
             <div className="text-4xl opacity-20">📦</div>
             <p className="text-sm">No products found {search ? `matching "${search}"` : 'in catalog'}</p>
             {search && <button onClick={() => setSearch('')} className="text-orange-500 text-[10px] font-black uppercase tracking-widest hover:underline">Clear Search Results</button>}
           </div>
         ) : (
           filteredProducts.map((product) => (
             <div key={product.id} className="bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-sm hover:shadow-md transition-all group">
               <div className="bg-brand-bg/30 p-6 border-b border-border-subtle flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                    <div className="flex gap-4 mt-1">
                      <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">{product.brand}</span>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{product.category?.name}</span>
                    </div>
                  </div>
                  
                  {/* Controls Section */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 bg-surface p-2 px-4 rounded-xl border border-border-subtle">
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Base Price:</div>
                      {editingPrice?.id === product.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{currency}</span>
                            <input 
                              type="number"
                              value={editingPrice.price}
                              onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handlePriceUpdate(product.id)}
                              className="bg-brand-bg border border-orange-200 rounded-lg px-6 py-1.5 text-sm font-bold text-foreground w-28 focus:outline-none"
                              autoFocus
                            />
                          </div>
                          <button onClick={() => handlePriceUpdate(product.id)} className="text-[10px] font-bold text-emerald-500 uppercase hover:underline">Save</button>
                          <button onClick={() => setEditingPrice(null)} className="text-[10px] font-bold text-slate-300 uppercase hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-black text-foreground">{currency}{product.basePrice.toFixed(2)}</div>
                          <button 
                            onClick={() => setEditingPrice({ id: product.id, price: product.basePrice.toString() })}
                            className="p-2 rounded-lg bg-brand-bg text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                            title="Edit Price"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group-hover:scale-105 active:scale-95"
                      title="Delete Product"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
               </div>
               
               <div className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[8px] uppercase font-black text-slate-400 tracking-[0.2em] border-b border-border-subtle/30 bg-brand-bg/10">
                        <th className="px-8 py-4">Variant (Size/Color)</th>
                        <th className="px-8 py-4">SKU</th>
                        <th className="px-8 py-4">In Stock</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Quick Stock Adjust</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/20">
                      {product.variants.map((v) => (
                        <tr key={v.id} className="hover:bg-brand-bg/10 transition-colors">
                          <td className="px-8 py-4 font-bold text-sm text-foreground">
                            {v.size} / {v.color}
                          </td>
                          <td className="px-8 py-4 text-xs font-mono text-slate-400">{v.sku}</td>
                          <td className="px-8 py-4 font-bold text-foreground">
                            {v.inventory?.quantity || 0}
                          </td>
                          <td className="px-8 py-4">
                            {v.inventory?.quantity <= v.inventory?.reorderLevel ? (
                              <span className="text-[8px] font-black uppercase px-2 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full">Low Stock</span>
                            ) : (
                              <span className="text-[8px] font-black uppercase px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">In Stock</span>
                            )}
                          </td>
                          <td className="px-8 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => updateStock(v.id, (v.inventory?.quantity || 0) - 1)}
                                  className="w-8 h-8 rounded-lg bg-brand-bg text-slate-500 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold border border-border-subtle shadow-sm"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>
                                </button>
                                <span className="w-12 text-center text-sm font-bold text-foreground">{v.inventory?.quantity || 0}</span>
                                <button 
                                  onClick={() => updateStock(v.id, (v.inventory?.quantity || 0) + 1)}
                                  className="w-8 h-8 rounded-lg bg-foreground text-brand-bg flex items-center justify-center hover:bg-orange-500 transition-all font-bold border border-border-subtle shadow-sm"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             </div>
           ))
         )}
      </div>
    </div>
  );
}
