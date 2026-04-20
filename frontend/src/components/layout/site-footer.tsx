import Link from 'next/link';
import { Instagram, Youtube, Music2 } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border/60 bg-surface/60">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="space-y-6 md:col-span-5">
            <div>
              <p className="eyebrow">Correspondence</p>
              <h3 className="display-lg mt-3">
                Letters from the atelier.
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Occasional dispatches — new collections, studio stories, and first access to
              private fittings. No noise, only the things worth keeping.
            </p>
            <form className="group relative flex items-center border-b border-foreground/40 focus-within:border-foreground">
              <input
                type="email"
                required
                placeholder="Your email address"
                className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <button
                type="submit"
                className="text-[10px] uppercase tracking-[0.32em] text-foreground transition-colors hover:text-accent"
              >
                Subscribe →
              </button>
            </form>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow mb-5">Explore</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">Home</Link></li>
              <li><Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">The Atelier</Link></li>
              <li><Link href="/gallery" className="text-muted-foreground transition-colors hover:text-foreground">Gallery</Link></li>
              <li><Link href="/rentals" className="text-muted-foreground transition-colors hover:text-foreground">Rentals</Link></li>
              <li><Link href="/booking" className="text-muted-foreground transition-colors hover:text-foreground">Booking</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow mb-5">Particulars</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground transition-colors hover:text-foreground">Terms</Link></li>
              <li><Link href="/booking" className="text-muted-foreground transition-colors hover:text-foreground">Consultation</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="eyebrow mb-5">Studio</p>
            <address className="space-y-2 not-italic text-sm text-muted-foreground">
              <p>By appointment only</p>
              <p>Lagos, Nigeria</p>
              <a
                href="mailto:studio@stagnes.com"
                className="link-underline mt-2 inline-block text-foreground"
              >
                studio@stagnes.com
              </a>
            </address>

            <div className="mt-6 flex items-center gap-2">
              {[
                { href: '#', label: 'Instagram', icon: Instagram },
                { href: '#', label: 'YouTube', icon: Youtube },
                { href: '#', label: 'TikTok', icon: Music2 },
              ].map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/30 text-foreground transition-all duration-300 hover:border-foreground hover:bg-foreground hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border/60 pt-6 text-[11px] uppercase tracking-[0.28em] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} St Agnes Atelier</p>
          <p className="font-display text-base normal-case tracking-[0.2em]">Made with care</p>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="transition-colors hover:text-foreground">Admin</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
