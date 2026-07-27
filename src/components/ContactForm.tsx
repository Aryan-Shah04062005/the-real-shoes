'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate submission delay
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-premium-dark/50 p-6 md:p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="rounded-full bg-green-500/10 border border-green-500/30 p-4 text-green-400">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Enquiry Received</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm">
              Thank you for contacting THE REAL. Aryan Shah or one of our support representatives will respond shortly.
            </p>
          </div>
          <button
            onClick={() => setStatus('idle')}
            className="rounded-full bg-white/5 border border-white/10 px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aryan Shah"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-royal-blue focus:outline-none focus:ring-1 focus:ring-royal-blue transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 99999 99999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-royal-blue focus:outline-none focus:ring-1 focus:ring-royal-blue transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. aryan@thereal.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-royal-blue focus:outline-none focus:ring-1 focus:ring-royal-blue transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
              Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sizing Inquiry / Bulk Order"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-royal-blue focus:outline-none focus:ring-1 focus:ring-royal-blue transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
              Message
            </label>
            <textarea
              required
              rows={4}
              placeholder="How can we step into your reality today?"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-royal-blue focus:outline-none focus:ring-1 focus:ring-royal-blue transition-all resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
            {/* WhatsApp Integration */}
            <a
              href="https://wa.me/919876543210?text=Hello%20THE%20REAL%20Support,%20I%20have%20an%20enquiry..."
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              WHATSAPP SUPPORT
            </a>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50"
            >
              {status === 'submitting' ? 'SENDING...' : 'SEND ENQUIRY'}
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
