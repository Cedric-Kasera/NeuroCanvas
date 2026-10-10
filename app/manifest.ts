import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'NeuroCanvas — Visual Neural Network Playground',
    short_name: 'NeuroCanvas',
    description: 'Learn neural networks from first principles with real numbers and step-by-step backpropagation.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf9f5',
    theme_color: '#cc785c',
    icons: [
      {
        src: '/icon.svg',
        sizes: '131x40',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
