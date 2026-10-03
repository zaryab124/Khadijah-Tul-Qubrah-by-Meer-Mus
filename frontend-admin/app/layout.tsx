import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'KHADIJAH-TUL-QUBRAH BY Meer&Mus | Operations Hub',
  description: 'Enterprise Fashion Commerce, Quotation Engine & Production Floor Management',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#051712',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#071612] text-[#fcfbf7] antialiased selection:bg-[#C5A059] selection:text-[#051712]">
        <AuthProvider>
          {children}
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

