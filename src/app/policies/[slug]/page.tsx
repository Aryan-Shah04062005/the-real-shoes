import React from 'react';
import { getWebsiteContent } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

export const revalidate = 0; // Fresh DB state for policy adjustments

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PolicyPage({ params }: PageProps) {
  const { slug } = await params;
  const websiteContent = await getWebsiteContent();

  // Map slugs to policy items
  const policiesMap: Record<string, { title: string; content: string }> = {
    shipping: {
      title: 'Shipping Policy',
      content: websiteContent.policies.shipping
    },
    returns: {
      title: 'Return & Refund Policy',
      content: websiteContent.policies.returns
    },
    privacy: {
      title: 'Privacy & Data Protection',
      content: websiteContent.policies.privacy
    },
    terms: {
      title: 'Terms & Conditions of Service',
      content: websiteContent.policies.terms
    }
  };

  const activePolicy = policiesMap[slug.toLowerCase()];

  if (!activePolicy) {
    notFound();
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="glow-blue top-[10%] left-[-150px]" />
      <div className="glow-silver bottom-[20%] right-[-150px]" />

      <div className="space-y-8 z-10 relative text-left">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Storefront
        </Link>

        {/* Content Container */}
        <div className="glass-panel rounded-2xl border border-white/10 p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <FileText className="h-6 w-6 text-royal-blue" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
              {activePolicy.title}
            </h1>
          </div>

          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed whitespace-pre-line">
            {activePolicy.content}
          </p>

          <hr className="border-white/5" />

          {/* Verification seal */}
          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-light pt-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span>Official Store Policy of THE REAL &bull; Owned by Aryan Shah &bull; Last Updated July 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
