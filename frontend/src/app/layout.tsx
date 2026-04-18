import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'St Agnes',
  description:
    'St Agnes — fashion portfolio, rentals, and appointment booking experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 pt-8 md:px-6 md:pt-10">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
