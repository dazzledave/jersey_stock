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
  category: { name: string };
  variants: Variant[];
}

export default function InventoryStock() {
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
        fetchProducts(); // Refresh
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Stock Control</div>
          <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-slate-400 text-sm font-medium">Track and adjust stock levels for your jersey catalog.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface px-10 py-3 rounded-lg border border-border-subtle text-xs font-bold outline-none focus:border-orange-300 transition-all text-foreground"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
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
           <div className="text-center py-20 bg-surface rounded-xl border border-dashed border-border-subtle text-slate-300 font-bold uppercase tracking-widest">
             No products found in catalog
           </div>
         ) : (
           filteredProducts.map((product) => (
             <div key={product.id} className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm hover:shadow-md transition-shadow">
               <div className="bg-brand-bg/50 p-6 border-b border-border-subtle flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                    <div className="flex gap-4 mt-1">
                      <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">{product.brand}</span>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{product.category.name}</span>
                    </div>
                  </div>
               </div>
               
               <div className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[8px] uppercase font-black text-slate-400 tracking-[0.2em] border-b border-border-subtle/30">
                        <th className="px-8 py-4">Variant (Size/Color)</th>
                        <th className="px-8 py-4">SKU</th>
                        <th className="px-8 py-4">In Stock</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Quick Adjust</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/20">
                      {product.variants.map((v) => (
                        <tr key={v.id} className="hover:bg-brand-bg/20 transition-colors">
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
                                  className="w-8 h-8 rounded-lg bg-brand-bg text-slate-500 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold border border-border-subtle"
                                >-</button>
                                <span className="w-12 text-center text-sm font-bold text-foreground">{v.inventory?.quantity || 0}</span>
                                <button 
                                  onClick={() => updateStock(v.id, (v.inventory?.quantity || 0) + 1)}
                                  className="w-8 h-8 rounded-lg bg-foreground text-brand-bg flex items-center justify-center hover:bg-orange-500 transition-all font-bold border border-border-subtle"
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
