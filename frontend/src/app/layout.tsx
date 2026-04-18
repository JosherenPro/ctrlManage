import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: {
    default: 'ctrlManage',
    template: '%s · ctrlManage',
  },
  description: 'Plateforme académique intelligente — présence, sessions et contrôle QR.',
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ctrlManage',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8b5cf6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-surface-0">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#13131f',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#f1f5f9',
              },
            }}
            richColors
          />
        </AuthProvider>
      </body>
    </html>
  );
}
