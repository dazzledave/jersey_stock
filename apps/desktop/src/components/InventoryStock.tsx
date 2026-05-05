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
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                ×
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
             <div className="text-4xl">📦</div>
             <p>No products found {search ? `matching "${search}"` : 'in catalog'}</p>
             {search && <button onClick={() => setSearch('')} className="text-orange-500 text-[10px] font-black uppercase">Clear Search</button>}
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
                  <div className="flex items-center gap-4">
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
                            className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center text-slate-300 hover:text-orange-500 hover:bg-orange-500/10 transition-all shadow-sm"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Delete Button */}
                    <button 
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm group-hover:scale-105 active:scale-95"
                      title="Delete Product"
                    >
                      <span className="text-lg">🗑️</span>
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
                                >-</button>
                                <span className="w-12 text-center text-sm font-bold text-foreground">{v.inventory?.quantity || 0}</span>
                                <button 
                                  onClick={() => updateStock(v.id, (v.inventory?.quantity || 0) + 1)}
                                  className="w-8 h-8 rounded-lg bg-foreground text-brand-bg flex items-center justify-center hover:bg-orange-500 transition-all font-bold border border-border-subtle shadow-sm"
                                >+</button>
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
