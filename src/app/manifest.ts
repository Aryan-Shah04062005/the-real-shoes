import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'THE REAL SHOES | Step Into Your Reality',
    short_name: 'THE REAL',
    description: 'Official store for THE REAL Shoes by Aryan Shah. Premium sneakers designed for comfort, performance, and everyday style.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#0a58ca',
    orientation: 'portrait',
    icons: [
      {
        src: '/images/brand/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable'
      },
      {
        src: '/images/brand/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable'
      }
    ]
  };
}
