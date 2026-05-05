"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    basePrice: '',
    description: '',
    categoryId: ''
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetch('http://localhost:4000/api/products/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, categoryId: data[0].id }));
      })
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handlePublish = async () => {
    if (!formData.name || !formData.basePrice || !formData.categoryId) {
      setStatusMessage({ text: 'Please fill in name, price and category.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ text: 'Publishing to catalog...', type: 'info' });

    try {
      const response = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(formData.basePrice),
          variants: variants.map(v => ({ ...v, quantity: parseInt(v.quantity.toString() || '0') }))
        })
      });

      if (response.ok) {
        setStatusMessage({ text: 'Product published successfully!', type: 'success' });
        setFormData({ name: '', brand: '', basePrice: '', description: '', categoryId: categories[0]?.id || '' });
        setVariants([]);
      } else {
        const error = await response.json();
        setStatusMessage({ text: `Failed: ${error.error}`, type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Connection error. Is the server running?', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mb-1">Catalog Management</div>
          <h2 className="text-3xl font-bold text-[#1a1f2b]">Add New Product</h2>
          <p className="text-slate-400 text-sm font-medium">Create a high-quality entry in your awards and apparel inventory.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#f0ebe4] p-10 shadow-sm space-y-12">
        {/* Basic Info Section */}
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <span className="w-2 h-2 bg-orange-200 rounded-sm" /> Basic Information
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1a1f2b] ml-1">Product Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Championship Gold Trophy" 
                    className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-medium outline-none focus:border-orange-300 transition-all placeholder:text-slate-300 text-[#1a1f2b]" 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[#1a1f2b] ml-1">Brand / Manufacturer</label>
                     <input 
                        type="text" 
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        placeholder="e.g. Nike" 
                        className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-medium outline-none focus:border-orange-300 transition-all placeholder:text-slate-300 text-[#1a1f2b]" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[#1a1f2b] ml-1">Base Retail Price</label>
                     <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">GH₵</span>
                        <input 
                           type="number" 
                           name="basePrice"
                           value={formData.basePrice}
                           onChange={handleInputChange}
                           placeholder="0.00" 
                           className="w-full bg-[#fcf8f1] p-4 pl-12 rounded-lg border border-[#f0ebe4] text-sm font-bold outline-none focus:border-orange-300 transition-all text-[#1a1f2b]" 
                        />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <span className="w-2 h-2 bg-orange-200 rounded-sm" /> Classification
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1a1f2b] ml-1">Category</label>
                  <select 
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-bold outline-none focus:border-orange-300 transition-all text-[#1a1f2b] appearance-none cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1a1f2b] ml-1">Detailed Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the product quality, material, and features..." 
                    className="w-full bg-[#fcf8f1] p-4 rounded-lg border border-[#f0ebe4] text-sm font-medium outline-none focus:border-orange-300 transition-all placeholder:text-slate-300 text-[#1a1f2b] h-[92px] resize-none" 
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Variant Matrix Section */}
        <div className="space-y-6 pt-10 border-t border-[#fcf8f1]">
          <div className="flex justify-between items-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <span className="w-2 h-2 bg-orange-200 rounded-sm" /> Variant Matrix
            </div>
            <button 
              type="button" 
              onClick={() => setVariants([...variants, { size: '', color: '', sku: '', barcode: '', quantity: 0 }])}
              className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-600 transition-colors bg-orange-50 px-4 py-2 rounded-full border border-orange-100"
            >
              + Add New Size/Color
            </button>
          </div>

          <div className="space-y-3">
             <AnimatePresence>
               {variants.length === 0 ? (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-center py-12 bg-[#fcf8f1]/50 rounded-xl border-2 border-dashed border-[#f0ebe4] flex flex-col items-center gap-3"
                 >
                    <span className="text-2xl opacity-20">🏷️</span>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No variants defined for this product</p>
                 </motion.div>
               ) : (
                 variants.map((v, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="grid grid-cols-5 gap-4 p-4 bg-[#fcf8f1] rounded-lg border border-[#f0ebe4] group hover:border-orange-200 transition-all"
                   >
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Size</label>
                        <input 
                          type="text" 
                          placeholder="e.g. L" 
                          value={v.size}
                          onChange={(e) => updateVariant(i, 'size', e.target.value)}
                          className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-[#1a1f2b]" 
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Color</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Gold" 
                          value={v.color}
                          onChange={(e) => updateVariant(i, 'color', e.target.value)}
                          className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-[#1a1f2b]" 
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">SKU</label>
                        <input 
                          type="text" 
                          placeholder="AW-G-L" 
                          value={v.sku}
                          onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                          className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-mono text-orange-600" 
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Barcode</label>
                        <input 
                          type="text" 
                          placeholder="000000" 
                          value={v.barcode}
                          onChange={(e) => updateVariant(i, 'barcode', e.target.value)}
                          className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-medium text-slate-400" 
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Initial Stock</label>
                        <input 
                          type="number" 
                          value={v.quantity}
                          onChange={(e) => updateVariant(i, 'quantity', parseInt(e.target.value))}
                          className="w-full bg-white px-3 py-2 rounded-lg border border-transparent focus:border-orange-200 outline-none text-sm font-bold text-[#1a1f2b]" 
                        />
                     </div>
                   </motion.div>
                 ))
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Submit Section */}
        <div className="pt-10 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${statusMessage.type === 'error' ? 'bg-rose-500' : statusMessage.type === 'success' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
              <p className={`text-[10px] font-bold uppercase tracking-widest ${statusMessage.type === 'error' ? 'text-rose-500' : statusMessage.type === 'success' ? 'text-emerald-500' : 'text-slate-400'}`}>
                {statusMessage.text || 'Ready to publish to catalog'}
              </p>
           </div>
           <button 
             onClick={handlePublish}
             disabled={isSubmitting}
             className="bg-[#1a1f2b] text-white font-bold px-12 py-5 rounded-lg uppercase tracking-[0.2em] text-xs hover:shadow-xl hover:shadow-[#1a1f2b]/20 transition-all active:scale-95 disabled:opacity-50"
           >
              {isSubmitting ? 'Publishing...' : 'Publish Product'}
           </button>
        </div>
      </div>
    </div>
  );
}
