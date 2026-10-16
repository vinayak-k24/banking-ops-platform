import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Enterprise Banking Operations & Intelligence Platform',
  description: 'Banking operations, reliability, compliance and modernization intelligence dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="h-screen w-screen overflow-hidden flex items-center justify-center p-2 sm:p-4 text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
