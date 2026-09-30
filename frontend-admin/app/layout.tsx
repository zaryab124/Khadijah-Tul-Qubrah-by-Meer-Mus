import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'KHADIJAH-TUL-QUBRAH BY Meer&Mus | Operations Hub',
  description: 'Enterprise Fashion Commerce, Quotation Engine & Production Floor Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#071612] text-[#fcfbf7] antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

