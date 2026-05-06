"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  costPrice: number;
  imageUrl: string;
  categoryId: string;
  category: { id: string, name: string };
  variants: Variant[];
}

export default function InventoryStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('GH₵');
  const [editingPrice, setEditingPrice] = useState<{ id: string, price: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ac_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) setCurrency(parsed.currency);
    }
    fetchProducts();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/products/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
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

  const handleFullUpdate = async () => {
    if (!editingProduct) return;
    try {
      const res = await fetch(`http://localhost:4000/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProduct.name,
          brand: editingProduct.brand,
          basePrice: editingProduct.basePrice,
          costPrice: editingProduct.costPrice,
          imageUrl: editingProduct.imageUrl,
          categoryId: editingProduct.categoryId
        })
      });
      if (res.ok) {
        await fetchProducts(); // Refresh list
        setEditingProduct(null);
      }
    } catch (err) {
      alert('Failed to update product details.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${productName}"?`)) return;

    try {
      const res = await fetch(`http://localhost:4000/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.brand?.toLowerCase().includes(search.toLowerCase()) ||
                         p.category?.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Stock Control</div>
          <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-slate-400 text-sm font-medium">Track and adjust stock levels and pricing for your catalog.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-surface px-6 py-3 rounded-xl border border-border-subtle text-xs font-bold outline-none focus:border-orange-300 transition-all text-foreground appearance-none pr-10 min-w-[160px] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-orange-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>
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
          </div>
        </div>
      </div>

      <section className="bg-orange-500/10 p-10 rounded-xl border border-orange-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-8">
           <div className="text-7xl font-bold text-foreground">{products.reduce((acc, p) => acc + p.variants.length, 0)}</div>
           <div className="pt-2">
              <div className="text-2xl font-bold text-foreground">Active SKUs</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Catalog Monitor</div>
           </div>
        </div>
      </section>

      <div className="space-y-6">
         {isLoading ? (
           <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest animate-pulse">Loading Inventory...</div>
         ) : filteredProducts.length === 0 ? (
           <div className="text-center py-20 bg-surface rounded-xl border border-dashed border-border-subtle text-slate-300 font-bold uppercase tracking-widest">
             No products found matching your search.
           </div>
         ) : (
           filteredProducts.map((product) => (
             <div key={product.id} className="bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-sm hover:shadow-md transition-all group">
               <div className="bg-brand-bg/30 p-6 border-b border-border-subtle flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-lg bg-surface border border-border-subtle overflow-hidden flex-shrink-0">
                       {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20">🖼️</div>}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                      <div className="flex gap-4 mt-1">
                        <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">{product.brand}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{product.category?.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 bg-surface p-2 px-4 rounded-xl border border-border-subtle">
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Retail Price:</div>
                      <div className="text-lg font-black text-foreground">{currency}{product.basePrice.toFixed(2)}</div>
                      <button 
                        onClick={() => setEditingProduct(product)}
                        className="p-2 rounded-lg bg-brand-bg text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                        title="Edit Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
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
                        <th className="px-8 py-4 text-right">Adjust Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/20">
                      {product.variants.map((v) => (
                        <tr key={v.id} className="hover:bg-brand-bg/10 transition-colors">
                          <td className="px-8 py-4 font-bold text-sm text-foreground">{v.size} / {v.color}</td>
                          <td className="px-8 py-4 text-xs font-mono text-slate-400">{v.sku}</td>
                          <td className="px-8 py-4 font-bold text-foreground">{v.inventory?.quantity || 0}</td>
                          <td className="px-8 py-4">
                             <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full border ${v.inventory?.quantity <= v.inventory?.reorderLevel ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                {v.inventory?.quantity <= v.inventory?.reorderLevel ? 'Low Stock' : 'Optimal'}
                             </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button onClick={() => updateStock(v.id, (v.inventory?.quantity || 0) - 1)} className="w-8 h-8 rounded bg-brand-bg text-slate-500 flex items-center justify-center font-bold border border-border-subtle">-</button>
                                <span className="w-8 text-center text-xs font-bold text-foreground">{v.inventory?.quantity || 0}</span>
                                <button onClick={() => updateStock(v.id, (v.inventory?.quantity || 0) + 1)} className="w-8 h-8 rounded bg-foreground text-brand-bg flex items-center justify-center font-bold border border-border-subtle">+</button>
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

      {/* Full Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-surface w-full max-w-2xl rounded-2xl border border-border-subtle shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-brand-bg/30">
                   <h3 className="text-sm font-black uppercase tracking-widest">Edit Product Entry</h3>
                   <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-foreground">✕</button>
                </div>
                <div className="p-10 grid grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto">
                   <div className="space-y-6">
                      <div className="aspect-square bg-brand-bg rounded-xl border-2 border-dashed border-border-subtle overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                         {editingProduct.imageUrl ? <img src={editingProduct.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20">📸</div>}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest transition-opacity">Change Image</div>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                   </div>
                   
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase">Product Name</label>
                         <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-brand-bg p-3 rounded-lg border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase">Brand</label>
                         <input type="text" value={editingProduct.brand} onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})} className="w-full bg-brand-bg p-3 rounded-lg border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase">Category</label>
                         <div className="relative group">
                            <select 
                              value={editingProduct.categoryId} 
                              onChange={(e) => setEditingProduct({...editingProduct, categoryId: e.target.value})} 
                              className="w-full bg-brand-bg p-3 rounded-lg border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500 appearance-none pr-10 transition-all"
                            >
                               {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-orange-500 transition-colors">
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                            </div>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Retail Price</label>
                            <input type="number" value={editingProduct.basePrice} onChange={(e) => setEditingProduct({...editingProduct, basePrice: parseFloat(e.target.value)})} className="w-full bg-brand-bg p-3 rounded-lg border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Cost Price</label>
                            <input type="number" value={editingProduct.costPrice} onChange={(e) => setEditingProduct({...editingProduct, costPrice: parseFloat(e.target.value)})} className="w-full bg-brand-bg p-3 rounded-lg border border-border-subtle text-sm font-bold text-foreground outline-none focus:border-orange-500" />
                         </div>
                      </div>
                   </div>
                </div>
                <div className="p-8 bg-brand-bg/30 flex gap-4">
                   <button onClick={() => setEditingProduct(null)} className="flex-1 bg-surface text-slate-400 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest border border-border-subtle">Cancel</button>
                   <button onClick={handleFullUpdate} className="flex-1 bg-foreground text-brand-bg font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-colors shadow-lg">Save Changes</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
