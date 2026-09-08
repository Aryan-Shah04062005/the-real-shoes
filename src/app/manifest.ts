import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'THE REAL SHOES | Step Into Your Reality',
    short_name: 'THE REAL',
    description: 'Official store for THE REAL Shoes by Aryan Shah. Premium sneakers designed for comfort, performance, and everyday style.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#0a58ca',
    orientation: 'portrait',
    lang: 'en',
    dir: 'ltr',
    categories: ['shopping', 'lifestyle', 'fashion'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/images/icon-144.png',
        sizes: '144x144',
        type: 'image/png'
      },
      {
        src: '/images/icon-96.png',
        sizes: '96x96',
        type: 'image/png'
      }
    ]
  };
}
