import Link from 'next/link';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/rentals', label: 'Rentals' },
  { href: '/booking', label: 'Booking' },
  { href: '/terms', label: 'Terms' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="group relative text-sm font-semibold tracking-[0.28em] uppercase">
          St Agnes
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-foreground/70 transition-all duration-300 group-hover:w-full" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button
          asChild
          size="sm"
          className="hidden bg-foreground px-4 shadow-[0_10px_20px_-12px_rgba(0,0,0,0.75)] md:inline-flex"
        >
          <Link href="/booking">Book now</Link>
        </Button>

        <Button asChild size="sm" className="bg-foreground px-3 md:hidden">
          <Link href="/booking">Book</Link>
        </Button>
      </div>
    </header>
  );
}
