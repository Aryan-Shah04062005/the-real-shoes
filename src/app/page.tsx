import React from 'react';
import Link from 'next/link';
import { getFullDb } from '@/lib/db';
import ContactForm from '@/components/ContactForm';
import { ArrowRight, Star, Heart, TrendingUp, Sparkles, Shield, Compass, Mail, Phone, MapPin } from 'lucide-react';

export const revalidate = 0; // Disable static cache to reflect admin content updates instantly

export default async function HomePage() {
  const db = await getFullDb();
  const { websiteContent, products } = db;

  const newArrivals = products.filter((p) => p.isNewArrival);
  const bestSellers = products.filter((p) => p.isBestSeller);

  return (
    <div className="relative w-full overflow-hidden">
      {/* BACKGROUND GLOWS */}
      <div className="glow-blue top-[10%] left-[-100px]" />
      <div className="glow-silver top-[40%] right-[-100px]" />
      <div className="glow-blue bottom-[10%] left-[20%]" />

      {/* 1. HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Left Column (Copy content) */}
          <div className="space-y-6 text-left z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-royal-blue/30 bg-royal-blue/10 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-royal-blue">
              <Sparkles className="h-3.5 w-3.5" />
              SNEAKER TECH MEETS 3D ENGINE
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-none">
              {websiteContent.heroTitle}
            </h1>
            
            <p className="text-xl sm:text-2xl font-bold tracking-wide text-slate-300 italic">
              "{websiteContent.heroSubtitle}"
            </p>
            
            <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed max-w-lg">
              {websiteContent.heroTagline}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 rounded-full bg-royal-blue hover:bg-royal-blue-hover px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-royal-blue/20 hover:scale-105"
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#about"
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all hover:scale-105"
              >
                Explore Collection
              </Link>
            </div>
          </div>

          {/* Hero Right Column (Brand Presentation Logo) */}
          <div className="w-full z-10 flex items-center justify-center">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-royal-blue/10 max-w-lg w-full aspect-[1.8/1] flex items-center justify-center group">
              {/* Backglow relative to the blue branding */}
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

      {/* 2. FEATURES GRID (THE REAL TECH) */}
      <section className="relative border-y border-white/10 bg-premium-dark/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-4 space-y-3">
              <div className="rounded-full bg-royal-blue/10 border border-royal-blue/20 p-4 text-royal-blue">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">3D Customizer</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Inspect sneakers in a real-time, interactive 3D studio. Spin, zoom, and select colorways before ordering.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 space-y-3">
              <div className="rounded-full bg-royal-blue/10 border border-royal-blue/20 p-4 text-royal-blue">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">Adaptive Sole</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Bouncy 3D-engineered grids that cushion impact, absorb stress, and provide continuous bounce feedback.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 space-y-3">
              <div className="rounded-full bg-royal-blue/10 border border-royal-blue/20 p-4 text-royal-blue">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">Premium Materials</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Handcrafted from full-grain leather, high-tensile recycled flyknit grids, and durable traction gum.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 space-y-3">
              <div className="rounded-full bg-royal-blue/10 border border-royal-blue/20 p-4 text-royal-blue">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">Aryan Shah's Guarantee</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Every sneaker undergoes absolute quality testing, ensuring structural durability and responsive wear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE - NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-10 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">FRESHLY DROP</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mt-1">NEW ARRIVALS</h2>
            </div>
            <Link href="/shop?filter=new" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white uppercase transition-colors">
              View All Arrivals
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {newArrivals.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. SHOWCASE - BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="border-t border-white/5 py-20 bg-gradient-to-b from-transparent to-premium-dark/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-baseline justify-between mb-10 gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">POPULAR CHOICES</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-white mt-1">BEST SELLERS</h2>
              </div>
              <Link href="/shop?filter=best" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white uppercase transition-colors">
                View All Bestsellers
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {bestSellers.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. ABOUT US SECTION */}
      <section id="about" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual Panel */}
            <div className="relative h-[300px] sm:h-[400px] rounded-2xl border border-white/10 bg-slate-900 overflow-hidden flex flex-col justify-center items-center p-8 text-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0a58ca_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              <div className="z-10 max-w-md space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-royal-blue">Our Mission</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase">STEP INTO YOUR REALITY</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Bridging the physical boundaries of comfort and quality with a premium virtual presentation environment.
                </p>
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-300">Founded by Aryan Shah</span>
                </div>
              </div>
            </div>

            {/* Content Panel */}
            <div className="space-y-6 z-10 text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">ABOUT THE REAL</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
                THE REAL EXPERIENCE
              </h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                {websiteContent.aboutText}
              </p>
              <div className="pt-4 grid grid-cols-2 gap-6 border-t border-white/10">
                <div>
                  <span className="block text-2xl font-black text-white">2026</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Established</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-royal-blue">100%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aryan Shah Inspected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONTACT SECTION */}
      <section id="contact" className="border-t border-white/10 py-20 bg-gradient-to-b from-transparent to-premium-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact details */}
            <div className="space-y-6 text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">GET IN TOUCH</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                WE ARE HERE TO HELP
              </h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed max-w-md">
                Have questions about sizing, customization, or shipments? Drop us a message or chat with us. Aryan Shah and the support team are dedicated to getting back to you.
              </p>
              
              <div className="pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/15 p-3 text-royal-blue">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Us</span>
                    <a href={`mailto:${websiteContent.contactEmail}`} className="text-sm font-semibold text-white hover:text-royal-blue transition-colors">
                      {websiteContent.contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/15 p-3 text-royal-blue">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Call Us</span>
                    <a href={`tel:${websiteContent.contactPhone}`} className="text-sm font-semibold text-white hover:text-royal-blue transition-colors">
                      {websiteContent.contactPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/15 p-3 text-royal-blue">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">HQ Office</span>
                    <span className="text-xs font-light text-slate-300">
                      {websiteContent.contactAddress}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ProductCard Inner Component
function ProductCard({ product }: { product: any }) {
  const hasDiscount = product.discountPercentage > 0;
  
  return (
    <div className="glass-card flex flex-col justify-between rounded-2xl overflow-hidden p-4 relative group">
      {/* Badges container */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        {product.isNewArrival && (
          <span className="rounded bg-royal-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
            NEW ARRIVAL
          </span>
        )}
        {product.isBestSeller && (
          <span className="rounded bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
            BEST SELLER
          </span>
        )}
        {product.isSale && (
          <span className="rounded bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
            SALE {product.discountPercentage}%
          </span>
        )}
      </div>

      {/* Image Preview Area */}
      <div className="relative h-64 w-full rounded-xl bg-gradient-to-br from-slate-900 to-slate-950/80 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-white/15 transition-all">
        {/* Draw subtle color accents relative to the main colors */}
        <div
          className="absolute inset-0 opacity-10 transition-all group-hover:opacity-20"
          style={{ backgroundColor: product.availableColors[0].hex }}
        />
        <div
          className="h-24 w-24 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-all group-hover:scale-125"
          style={{ backgroundColor: product.availableColors[0].hex }}
        />
        {/* Interactive 3D Visualizer Indicator */}
        <div className="absolute bottom-3 right-3 text-[9px] font-semibold text-slate-500 tracking-wider flex items-center gap-1 z-20">
          <Compass className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} />
          3D MODEL READY
        </div>
        {product.mainImage?.startsWith('http') ? (
          <img
            src={product.mainImage}
            alt={product.name}
            className="z-10 h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="z-10 text-xs font-bold text-white uppercase text-center px-4 tracking-wide group-hover:scale-105 transition-transform duration-300">
            {product.name}
          </span>
        )}
      </div>

      {/* Details Area */}
      <div className="mt-4 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{product.brand}</span>
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-[11px] font-bold">{product.rating}</span>
            </div>
          </div>
          <h3 className="text-base font-bold text-white mt-1 group-hover:text-royal-blue transition-colors line-clamp-1">{product.name}</h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 font-light">{product.description}</p>
        </div>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">₹{product.price}</span>
            {hasDiscount && (
              <span className="text-xs text-slate-500 line-through">₹{product.originalPrice}</span>
            )}
          </div>

          <Link
            href={`/product/${product.id}`}
            className="rounded-xl bg-white/5 border border-white/10 group-hover:bg-royal-blue group-hover:border-royal-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 group-hover:text-white transition-all flex items-center gap-1 hover:scale-105"
          >
            Customize
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
