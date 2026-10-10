import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#cc785c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'NeuroCanvas — Visual Neural Network Playground',
  description: 'Interactive visual neural network builder and simulator. Learn neural networks from first principles with real numbers, step-by-step backpropagation, guided lessons, and free play canvas.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
    shortcut: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NeuroCanvas',
  },
  openGraph: {
    title: 'NeuroCanvas — Visual Neural Network Playground',
    description: 'Interactive visual neural network builder and simulator. Learn neural networks from first principles with real numbers, step-by-step backpropagation, guided lessons, and free play canvas.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuroCanvas — Visual Neural Network Playground',
    description: 'Interactive visual neural network builder and simulator. Learn neural networks from first principles with real numbers, step-by-step backpropagation, guided lessons, and free play canvas.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased font-sans bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
