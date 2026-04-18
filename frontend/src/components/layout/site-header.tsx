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
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-sm font-semibold tracking-[0.24em] uppercase">
          St Agnes
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

        <Button asChild size="sm" className="hidden md:inline-flex">
          <Link href="/booking">Book now</Link>
        </Button>

        <Button asChild size="sm" className="md:hidden">
          <Link href="/booking">Book</Link>
        </Button>
      </div>
    </header>
  );
}
