import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://the-real-shoes.vercel.app"),
  title: "The Real Shoes | Premium 3D Sneakers by Aryan Shah",
  description: "Official store for The Real Shoes. Step Into Your Reality with the ultimate 3D shoe shopping platform founded and owned by Aryan Shah.",
  keywords: [
    "The Real Shoes",
    "the real shoes",
    "The Real Shoes website",
    "The Real Shoes store",
    "The Real Shoes 3D",
    "the-real-shoes",
    "THE REAL",
    "Aryan Shah",
    "3D Sneakers",
    "Premium Footwear"
  ],
  openGraph: {
    title: "The Real Shoes | Premium 3D Sneakers by Aryan Shah",
    description: "Official store for The Real Shoes. Step Into Your Reality with the ultimate 3D shoe shopping platform founded and owned by Aryan Shah.",
    url: "https://the-real-shoes.vercel.app",
    siteName: "The Real Shoes",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://the-real-shoes.vercel.app/#website",
      "url": "https://the-real-shoes.vercel.app",
      "name": "The Real Shoes",
      "alternateName": ["the real shoes", "The Real Shoes Store", "The Real Shoes Website", "the-real-shoes"],
      "description": "Step Into Your Reality. Premium 3D Sneakers Store founded by Aryan Shah."
    },
    {
      "@type": "Organization",
      "@id": "https://the-real-shoes.vercel.app/#organization",
      "name": "The Real Shoes",
      "url": "https://the-real-shoes.vercel.app",
      "founder": {
        "@type": "Person",
        "name": "Aryan Shah"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-premium-black text-premium-light font-sans selection:bg-royal-blue selection:text-white">
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <main className="flex-grow flex flex-col relative z-10">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
