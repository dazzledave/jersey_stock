"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

interface Variant {
  size: string;
  color: string;
  sku: string;
  barcode: string;
  quantity: number;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductForm() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  // ... existing states ...
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    basePrice: '',
    imageUrl: '',
    categoryId: ''
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-clear status message after 5 seconds
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage.text]);

  if (!isAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Restricted Access</h2>
          <p className="text-slate-400 font-medium">Only administrators can add or manage catalog products.</p>
        </div>
      </div>
    );
  }

  const fetchCategories = () => {
    fetch('/api/products/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, categoryId: data[0].id }));
      })
      .catch(err => console.error('Failed to fetch categories:', err));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName) return;
    try {
      const res = await fetch('/api/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setFormData(prev => ({ ...prev, categoryId: newCat.id }));
        setIsAddingCategory(false);
        setNewCategoryName('');
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      setStatusMessage({ text: 'FAILED: Could not create category. Check your connection.', type: 'error' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setStatusMessage({ text: 'IMAGE TOO LARGE: 1.5MB limit reached. Please resize and try again.', type: 'error' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handlePublish = async () => {
    if (!formData.name || !formData.basePrice || !formData.categoryId) {
      setStatusMessage({ text: 'MISSING FIELDS: Please provide a name, price, and category before publishing.', type: 'error' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ text: 'Publishing to catalog...', type: 'info' });

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // FIX: Ensure price is rounded to exactly 2 decimal places to prevent 'ghost subtractions'
          basePrice: Math.round(parseFloat(formData.basePrice) * 100) / 100,
          variants: variants.map(v => {
            const namePrefix = formData.name.substring(0, 3).toUpperCase();
            const brandPrefix = formData.brand.substring(0, 2).toUpperCase() || 'NA';
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            
            // Auto-generate SKU if empty
            const finalSku = v.sku.trim() || `AC-${brandPrefix}-${namePrefix}-${v.size.substring(0,1).toUpperCase() || 'X'}-${v.color.substring(0,1).toUpperCase() || 'X'}-${randomSuffix}`;
            
            return { 
              ...v, 
              sku: finalSku,
              quantity: parseInt(v.quantity.toString() || '0') 
            };
          })
        })
      });

      if (response.ok) {
        setStatusMessage({ text: 'SUCCESS: Product has been added to the master catalog.', type: 'success' });
        setFormData({ name: '', brand: '', basePrice: '', imageUrl: '', categoryId: categories[0]?.id || '' });
        setVariants([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const error = await response.json();
        setStatusMessage({ text: `PUBLISH FAILED: ${error.error}`, type: 'error' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setStatusMessage({ text: 'CONNECTION ERROR: Could not reach the server. Please check your connection.', type: 'error' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 bg-brand-bg/50 pb-20">
      {/* Universal Status Banner */}
      <AnimatePresence>
        {statusMessage.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`sticky top-0 z-50 p-4 shadow-2xl flex items-center justify-between gap-4 border-b ${
              statusMessage.type === 'error' ? 'bg-rose-600 border-rose-500' : 
              statusMessage.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-orange-600 border-orange-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                {statusMessage.type === 'error' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                )}
              </div>
              <p className="text-sm font-black text-white uppercase tracking-wider">{statusMessage.text}</p>
            </div>
            <button 
              onClick={() => setStatusMessage({ text: '', type: '' })}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end px-1">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Product Manager
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Add New Product</h2>
          <p className="text-slate-400 text-sm font-medium">Create a high-quality entry in your awards and apparel inventory.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border-subtle p-10 shadow-sm space-y-12">
        <div className="grid grid-cols-12 gap-12">
          {/* Image Upload Area */}
          <div className="col-span-4 space-y-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
               Product Image
            </div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-brand-bg rounded-xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 transition-all overflow-hidden relative group"
            >
              {formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                    Change Image
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center text-slate-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click to upload photo</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden" 
            />
          </div>

          {/* Details Section */}
          <div className="col-span-8 space-y-10">
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Basic Information
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground ml-1 uppercase tracking-tight">Product Name</label>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Championship Gold Trophy" 
                          className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-medium outline-none focus:border-orange-300 transition-all placeholder:text-slate-400 text-foreground" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground ml-1 uppercase tracking-tight">Brand / Manufacturer</label>
                        <input 
                          type="text" 
                          name="brand"
                          value={formData.brand}
                          onChange={handleInputChange}
                          placeholder="e.g. Nike" 
                          className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-medium outline-none focus:border-orange-300 transition-all placeholder:text-slate-400 text-foreground" 
                        />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01M19 7h.01M19 11h.01M19 15h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>
                    Classification & Pricing
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                          <label className="text-xs font-bold text-foreground uppercase tracking-tight">Category</label>
                          <button 
                            type="button"
                            onClick={() => setIsAddingCategory(!isAddingCategory)}
                            className="text-[9px] font-black uppercase text-orange-500 hover:underline"
                          >
                            {isAddingCategory ? 'Cancel' : '+ New Category'}
                          </button>
                        </div>
                        {isAddingCategory ? (
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="New Category Name"
                              className="flex-1 bg-brand-bg p-4 rounded-lg border border-orange-300 text-sm font-bold outline-none text-foreground"
                              autoFocus
                            />
                            <button 
                              type="button"
                              onClick={handleCreateCategory}
                              className="bg-orange-500 text-white px-4 rounded-lg text-xs font-bold"
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                        <div className="relative group">
                          <select 
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleInputChange}
                            className="w-full bg-brand-bg p-4 rounded-lg border border-border-subtle text-sm font-bold outline-none focus:border-orange-300 transition-all text-foreground appearance-none cursor-pointer pr-10"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-orange-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                          </div>
                        </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground ml-1 uppercase tracking-tight">Base Retail Price</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">GH₵</span>
                          <input 
                              type="number" 
                              name="basePrice"
                              value={formData.basePrice}
                              onChange={handleInputChange}
                              placeholder="0.00" 
                              className="w-full bg-brand-bg p-4 pl-12 rounded-lg border border-border-subtle text-sm font-bold outline-none focus:border-orange-300 transition-all text-foreground" 
                          />
                        </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Variant Matrix Section */}
        <div className="space-y-6 pt-10 border-t border-border-subtle">
          <div className="flex justify-between items-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
               Variant Matrix
            </div>
            <button 
              type="button" 
              onClick={() => setVariants([...variants, { size: '', color: '', sku: '', barcode: '', quantity: 0 }])}
              className="text-[10px] font-black uppercase text-orange-500 hover:bg-orange-500 hover:text-white transition-all bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20"
            >
              + Add Size/Color
            </button>
          </div>

          <div className="space-y-3">
             <AnimatePresence>
               {variants.length === 0 ? (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-center py-16 bg-brand-bg/50 rounded-xl border-2 border-dashed border-border-subtle flex flex-col items-center gap-4"
                 >
                    <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-slate-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01M19 7h.01M19 11h.01M19 15h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No variants defined for this product</p>
                 </motion.div>
               ) : (
                 variants.map((v, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="grid grid-cols-5 gap-4 p-5 bg-brand-bg rounded-xl border border-border-subtle group hover:border-orange-200 transition-all shadow-sm"
                   >
                     <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Size</label>
                        <input 
                          type="text" 
                          placeholder="e.g. XL" 
                          value={v.size}
                          onChange={(e) => updateVariant(i, 'size', e.target.value)}
                          className="w-full bg-surface px-4 py-3 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-foreground" 
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Color</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Navy" 
                          value={v.color}
                          onChange={(e) => updateVariant(i, 'color', e.target.value)}
                          className="w-full bg-surface px-4 py-3 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-foreground" 
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">SKU</label>
                        <input 
                          type="text" 
                          placeholder="AUTO-GEN" 
                          value={v.sku}
                          onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                          className="w-full bg-surface px-4 py-3 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-mono text-orange-500" 
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Barcode</label>
                        <input 
                          type="text" 
                          placeholder="OPTIONAL" 
                          value={v.barcode}
                          onChange={(e) => updateVariant(i, 'barcode', e.target.value)}
                          className="w-full bg-surface px-4 py-3 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-medium text-slate-400" 
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Qty</label>
                        <input 
                          type="number" 
                          value={v.quantity}
                          onChange={(e) => updateVariant(i, 'quantity', parseInt(e.target.value))}
                          className="w-full bg-surface px-4 py-3 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-foreground" 
                        />
                     </div>
                   </motion.div>
                 ))
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Submit Section */}
        <div className="pt-10 flex justify-between items-center border-t border-border-subtle">
           <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${statusMessage.type === 'error' ? 'bg-rose-500' : statusMessage.type === 'success' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
              <p className={`text-[9px] font-black uppercase tracking-widest ${statusMessage.type === 'error' ? 'text-rose-500' : statusMessage.type === 'success' ? 'text-emerald-500' : 'text-slate-400'}`}>
                {statusMessage.text || 'Ready for catalog publishing'}
              </p>
           </div>
           <button 
             onClick={handlePublish}
             disabled={isSubmitting}
             className="bg-foreground text-brand-bg font-black px-12 py-5 rounded-xl uppercase tracking-[0.2em] text-xs hover:shadow-2xl hover:bg-orange-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              {isSubmitting ? 'Publishing...' : 'Publish Product'}
           </button>
        </div>
      </div>
    </div>
  );
}
