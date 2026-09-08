import React from 'react';
import Link from 'next/link';
import { getFullDb } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import SizeGuideModal from '@/components/SizeGuideModal';
import { 
  ArrowRight, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  Star, 
  Palette, 
  Camera, 
  Send 
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const db = await getFullDb();
  const { websiteContent, products } = db;

  const activeProducts = products.filter(
    (p) => !p.status || p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK'
  );

  const newArrivals = activeProducts.filter((p) => p.isNewArrival).slice(0, 6);
  const bestSellers = activeProducts.filter((p) => p.isBestSeller).slice(0, 6);
  const trending = activeProducts.slice(0, 6);

  const trustIndicators = [
    { icon: Truck, label: 'Free Shipping', desc: 'On orders over ₹3,000 across India' },
    { icon: ShieldCheck, label: 'Secure Payments', desc: 'UPI, Cards & Encrypted COD' },
    { icon: RotateCcw, label: 'Easy Returns', desc: '30-day hassle-free exchanges' },
    { icon: CheckCircle2, label: 'Quality Checked', desc: '100% Aryan Shah Inspected' },
  ];

  const whyFeatures = [
    { title: 'Premium Comfort', desc: 'Engineered soles that absorb impact and offer active energy return with every step.' },
    { title: 'Modern Design', desc: 'Futuristic silhouettes crafted with minimalist glassmorphism aesthetics and bold accents.' },
    { title: 'Quality Materials', desc: 'Full-grain leather, high-tensile recycled flyknit grids, and durable gum outsoles.' },
    { title: 'Easy Returns', desc: 'Doorstep pickup and instant exchange guarantees within 30 days of delivery.' },
  ];

  const customerReviews = [
    { name: 'Rohan Sharma', rating: 5, comment: 'The online store was so easy to order from! Received my Genesis sneakers in 3 days. Super comfortable.', product: 'THE REAL Genesis' },
    { name: 'Priya Patel', rating: 5, comment: 'Incredible cushioning and design. Quality feels way above big commercial brands.', product: 'Puma Smashic Comfort Casual' },
    { name: 'Ananya Verma', rating: 5, comment: 'Fit is perfect according to the size guide. 10/10 recommendation for daily style!', product: 'THE REAL Genesis' },
  ];

  const socialGrid = [
    '/images/shoes/genesis_blue.png',
    '/images/shoes/genesis_silver.png',
    '/images/shoes/genesis_black.png',
    '/images/brand/logo.jpg',
  ];

  return (
    <div className="relative w-full overflow-hidden">
      <QuickViewModal />
      <SizeGuideModal />

      {/* BACKGROUND GLOWS */}
      <div className="glow-blue top-[10%] left-[-100px]" />
      <div className="glow-silver top-[40%] right-[-100px]" />
      <div className="glow-blue bottom-[10%] left-[20%]" />

      {/* 1. HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-royal-blue/30 bg-royal-blue/10 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-royal-blue">
              <Sparkles className="h-3.5 w-3.5" />
              PREMIUM FOOTWEAR COLLECTION
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-none">
              THE REAL
            </h1>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-slate-200">
              Premium Sneakers. Real Style.
            </h2>
            
            <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed max-w-lg">
              "Discover premium sneakers designed for comfort, performance and everyday style."
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 rounded-full bg-royal-blue hover:bg-royal-blue-hover px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-royal-blue/20 hover:scale-105"
              >
                SHOP NOW
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all hover:scale-105"
              >
                BROWSE ALL SNEAKERS
              </Link>
            </div>
          </div>

          <div className="w-full z-10 flex items-center justify-center">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-royal-blue/10 max-w-lg w-full aspect-[1.8/1] flex items-center justify-center group">
              <div className="absolute -inset-2 bg-royal-blue/10 opacity-40 blur-xl rounded-full" />
              <img
                src="/images/brand/logo.jpg"
                alt="THE REAL - Aryan Shah"
                className="w-full h-full object-contain rounded-2xl z-10 group-hover:scale-[1.02] transition-transform duration-700 bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST INDICATORS BAR */}
      <section className="border-y border-white/10 bg-slate-950/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustIndicators.map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="rounded-xl bg-royal-blue/10 border border-royal-blue/20 p-2.5 text-royal-blue flex-shrink-0">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{item.label}</h4>
                    <p className="text-[11px] text-slate-400 font-light">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">FRESH DROPS</span>
            <h2 className="text-3xl font-black tracking-tight text-white mt-1 uppercase">NEW ARRIVALS</h2>
          </div>
          <Link href="/shop?filter=new" className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase transition-colors">
            View All Arrivals <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. BEST SELLERS */}
      <section className="border-t border-white/10 bg-slate-950/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">TOP RATED</span>
              <h2 className="text-3xl font-black tracking-tight text-white mt-1 uppercase">BEST SELLERS</h2>
            </div>
            <Link href="/shop?filter=best" className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase transition-colors">
              View All Best Sellers <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. TRENDING NOW */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">HOT THIS WEEK</span>
            <h2 className="text-3xl font-black tracking-tight text-white mt-1 uppercase">TRENDING NOW</h2>
          </div>
          <Link href="/shop?filter=trending" className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase transition-colors">
            Explore Trending <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. WHY THE REAL? */}
      <section className="border-y border-white/10 bg-gradient-to-b from-slate-950 to-premium-black py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">ENGINEERED EXCELLENCE</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mt-1">WHY THE REAL?</h2>
            <p className="text-xs text-slate-400 font-light mt-2">
              Combining luxury footwear craftsmanship with responsive cushioning and modern style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyFeatures.map((feat) => (
              <div key={feat.title} className="glass-card rounded-2xl p-6 border border-white/10 space-y-3 hover:border-royal-blue/30 transition-all">
                <div className="h-2 w-10 bg-royal-blue rounded-full" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">{feat.title}</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FEATURED COLLECTION SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 md:p-12 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-left z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-royal-blue/30 bg-royal-blue/10 px-3.5 py-1.5 text-xs font-bold text-royal-blue uppercase">
              <Sparkles className="h-4 w-4" /> SIGNATURE SHOWCASE
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
              THE REAL SNEAKER COLLECTION
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              Discover high-performance luxury footwear crafted with precision materials, ergonomic support, and bold aesthetic silhouettes.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-royal-blue hover:bg-royal-blue-hover px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-royal-blue/20 hover:scale-105"
              >
                EXPLORE COLLECTION <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative w-full lg:w-1/2 aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
            <img
              src="/images/shoes/genesis_blue.png"
              alt="THE REAL SNEAKER COLLECTION"
              className="h-full w-full object-contain p-6 hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS */}
      <section className="border-t border-white/10 bg-slate-950/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">VERIFIED FEEDBACK</span>
            <h2 className="text-3xl font-black text-white uppercase mt-1">WHAT OUR CUSTOMERS SAY</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {customerReviews.map((rev) => (
              <div key={rev.name} className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 font-light italic leading-relaxed">"{rev.comment}"</p>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[11px]">
                  <span className="font-bold text-white">{rev.name}</span>
                  <span className="text-slate-500 font-semibold">{rev.product}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. #STEPINTOYOURREALITY INSTAGRAM SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <a
            href="https://www.instagram.com/therealaryanshah_shoes"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-royal-blue hover:underline"
          >
            <Camera className="h-4 w-4" /> FOLLOW US ON INSTAGRAM
          </a>
          <h2 className="text-3xl font-black text-white uppercase mt-1">#STEPINTOYOURREALITY</h2>
          <p className="text-xs text-slate-400 font-light mt-1">
            Tag{' '}
            <a
              href="https://www.instagram.com/therealaryanshah_shoes"
              target="_blank"
              rel="noreferrer"
              className="text-royal-blue font-semibold hover:underline"
            >
              @therealaryanshah_shoes
            </a>{' '}
            to be featured on our official gallery.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {socialGrid.map((img, idx) => (
            <a
              key={idx}
              href="https://www.instagram.com/therealaryanshah_shoes"
              target="_blank"
              rel="noreferrer"
              className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group block"
            >
              <img src={img} alt="#STEPINTOYOURREALITY" className="h-full w-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-royal-blue/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
