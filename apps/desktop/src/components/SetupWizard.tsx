"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:4000/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Setup failed');

      setStep(3); // Success step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-['Segoe_UI_Variable_Text',_system-ui,_sans-serif]">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[150px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl p-1 relative z-10"
      >
        <div className="bg-[#1e293b]/50 backdrop-blur-3xl p-12 rounded-[40px] border border-white/10 shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                    Welcome to <span className="text-orange-500">Awards Centre</span> POS.
                  </h1>
                  <p className="text-lg text-slate-400 font-medium leading-relaxed">
                    Let's initialize your store management system. You'll start by creating the Master Administrator account—the primary key to your entire business ledger.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500 mb-4">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">Secure Storage</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">All passwords and sales records are encrypted and synced to your secure cloud.</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500 mb-4">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">Staff Control</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Once finished, you can add employees and track their individual performance.</p>
                   </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-white text-[#0f172a] font-black py-5 rounded-2xl text-sm uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  Start Setup
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Master Administrator</h2>
                  <p className="text-slate-400 font-medium">Create your credentials to manage the store.</p>
                </div>

                <form onSubmit={handleSetup} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Admin Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-base font-bold text-white placeholder:text-slate-700 outline-none focus:border-orange-500 focus:bg-white/10 transition-all"
                      placeholder="e.g. awards_admin"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-base font-bold text-white placeholder:text-slate-700 outline-none focus:border-orange-500 focus:bg-white/10 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-base font-bold text-white placeholder:text-slate-700 outline-none focus:border-orange-500 focus:bg-white/10 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-sm font-bold text-rose-500">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-8 py-5 rounded-2xl text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      disabled={isLoading}
                      type="submit"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : 'Complete Initialization'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 py-10"
              >
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white uppercase tracking-tight">System Initialized!</h2>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto">
                    The Master Admin account has been securely created. You are now ready to manage the Awards Centre.
                  </p>
                </div>
                <button 
                  onClick={onComplete}
                  className="bg-white text-[#0f172a] font-black px-12 py-5 rounded-2xl text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-2xl"
                >
                  Launch Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
