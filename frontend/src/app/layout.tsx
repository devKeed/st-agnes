import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Providers } from './providers';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'St Agnes — Atelier of Craft & Occasion',
  description:
    'St Agnes is an atelier of bespoke design, precision alterations, and curated rental pieces for life\'s most memorable occasions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="relative min-h-full antialiased">
        <Providers>
          <SiteHeader />
          <main className="relative z-10">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
