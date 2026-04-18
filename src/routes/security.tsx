/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Shield, Lock, EyeOff, Server, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function SecurityPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8 lg:p-24 space-y-24 selection:bg-[#F27D26] selection:text-black">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Shield className="w-6 h-6 text-[#F27D26]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#F27D26]">Security & Trust</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl lg:text-8xl font-bold tracking-tighter italic serif leading-none"
        >
          Zero-Knowledge. <br />
          <span className="opacity-30">Absolute Privacy.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl lg:text-2xl opacity-50 max-w-2xl leading-relaxed"
        >
          We don't just encrypt your data; we make it invisible. Our Zero-Knowledge Proxy ensures that even the AI never sees your real identity.
        </motion.p>
      </section>

      {/* Technical Diagram Section */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight italic serif">The Invisible Bridge.</h2>
            <p className="opacity-50 leading-relaxed">
              When you talk to our AI, your data is masked on your device before it ever leaves the browser. We replace your name, account numbers, and bank details with generic tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-white/5 border border-white/10 rounded-sm space-y-4">
              <Lock className="w-5 h-5 text-[#F27D26]" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Local Masking</h3>
              <p className="text-[11px] opacity-40 leading-relaxed uppercase tracking-tighter">
                PII (Personally Identifiable Information) is replaced with secure, generic tokens before processing.
              </p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-sm space-y-4">
              <EyeOff className="w-5 h-5 text-[#F27D26]" />
              <h3 className="text-xs font-bold uppercase tracking-widest">AI Isolation</h3>
              <p className="text-[11px] opacity-40 leading-relaxed uppercase tracking-tighter">
                The Gemini API only receives the masked data, ensuring your real identity is never stored in AI models.
              </p>
            </div>
          </div>
        </div>

        {/* SVG Diagram */}
        <div className="relative p-12 bg-white/5 border border-white/10 rounded-sm overflow-hidden group">
          <svg viewBox="0 0 400 300" className="w-full h-auto">
            <motion.rect 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              x="20" y="100" width="80" height="100" rx="4" fill="none" stroke="#F27D26" strokeWidth="2" 
            />
            <text x="60" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className="uppercase tracking-widest">Your Device</text>
            
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              d="M100 150 H180" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" 
            />
            <circle cx="140" cy="150" r="15" fill="#F27D26" />
            <text x="140" y="154" textAnchor="middle" fill="black" fontSize="8" fontWeight="bold">MASK</text>

            <motion.rect 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              x="180" y="100" width="80" height="100" rx="4" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.2" 
            />
            <text x="220" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className="uppercase tracking-widest opacity-40">Proxy</text>

            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              d="M260 150 H300" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" 
            />

            <motion.rect 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              x="300" y="100" width="80" height="100" rx="4" fill="none" stroke="#F27D26" strokeWidth="2" 
            />
            <text x="340" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className="uppercase tracking-widest">Gemini AI</text>
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Why Trust Us Pillar */}
      <section className="max-w-4xl mx-auto text-center space-y-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-full">
          <ShieldCheck className="w-4 h-4 text-[#F27D26]" />
          <span className="text-[10px] font-bold text-[#F27D26] uppercase tracking-widest">Verified Infrastructure</span>
        </div>
        <h2 className="text-4xl font-bold tracking-tight italic serif">Why Trust Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest">No Data Selling</h4>
            <p className="text-[11px] opacity-40 leading-relaxed">We never sell your data. Our business model is based on helping you save interest, not selling your habits.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest">Open Source Math</h4>
            <p className="text-[11px] opacity-40 leading-relaxed">Our financial formulas are transparent and verified against standard banking ROI models.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest">Bank-Grade SSL</h4>
            <p className="text-[11px] opacity-40 leading-relaxed">All connections are secured with 256-bit encryption, the same standard used by global banks.</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-4xl mx-auto pt-24 border-t border-white/10 text-center">
        <button 
          onClick={() => window.location.href = '/'}
          className="group inline-flex items-center gap-4 text-2xl font-bold italic serif hover:text-[#F27D26] transition-colors"
        >
          Ready to kill your interest? <ArrowRight className="group-hover:translate-x-2 transition-transform" />
        </button>
      </section>
    </div>
  );
}
