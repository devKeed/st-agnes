'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X, CalendarDays } from 'lucide-react';

const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'Atelier' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/rentals', label: 'Rentals' },
];

const secondaryLinks = [
  { href: '/booking', label: 'Booking' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-border/60 bg-background/90 backdrop-blur-xl'
            : 'border-b border-transparent bg-background/60 backdrop-blur'
        }`}
      >
        <div className="mx-auto grid h-16 w-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 md:h-20 md:px-10">
          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-foreground"
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="absolute h-px w-4 -translate-y-[3px] bg-current transition-transform duration-300 group-hover:w-5" />
                <span className="absolute h-px w-3 translate-y-[3px] bg-current transition-transform duration-300 group-hover:w-5" />
              </span>
              <span className="hidden md:inline">Menu</span>
            </button>
            <nav className="hidden items-center gap-7 lg:flex">
              {primaryLinks.map((link) => {
                const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`link-underline text-[11px] uppercase tracking-[0.28em] transition-colors ${
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link href="/" className="flex flex-col items-center leading-none">
            <span className="font-display text-2xl tracking-[0.18em] text-foreground md:text-[28px]">
              ST AGNES
            </span>
            <span className="mt-0.5 hidden text-[9px] uppercase tracking-[0.42em] text-muted-foreground md:block">
              Atelier
            </span>
          </Link>

          <div className="flex items-center justify-end gap-5">
            <Link
              href="/booking"
              className="link-underline hidden text-[11px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground md:inline-flex"
            >
              Book consultation
            </Link>
            <Link
              href="/booking"
              aria-label="Book consultation"
              className="inline-flex h-9 w-9 items-center justify-center border border-foreground/70 text-foreground transition-colors hover:bg-foreground hover:text-primary-foreground md:hidden"
            >
              <CalendarDays className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-500 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-full max-w-md flex-col bg-background transition-transform duration-500 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-border/60 px-6 md:h-20 md:px-10">
            <span className="font-display text-xl tracking-[0.18em]">ST AGNES</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-6 py-10 md:px-10">
            <ul className="space-y-5">
              {primaryLinks.map((link, i) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-baseline gap-4"
                  >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-4xl font-light leading-none transition-colors group-hover:text-accent md:text-5xl">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 space-y-6 border-t border-border/60 pt-8">
              <ul className="space-y-3">
                {secondaryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/booking"
                className="btn-premium w-full"
              >
                Book a consultation
              </Link>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Lagos — By appointment
              </p>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}
