import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-gradient-to-b from-transparent to-secondary/15">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Stay in the loop</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest updates on new products and upcoming collections.
            </p>
            <div className="flex gap-2">
              <Input placeholder="Enter your email" className="bg-white" />
              <Button type="button" className="px-5">
                Subscribe
              </Button>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Quick links</p>
            <div className="space-y-2">
              <Link href="/" className="block transition-colors hover:text-foreground">Home</Link>
              <Link href="/about" className="block transition-colors hover:text-foreground">About</Link>
              <Link href="/gallery" className="block transition-colors hover:text-foreground">Gallery</Link>
              <Link href="/rentals" className="block transition-colors hover:text-foreground">Rentals</Link>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Legal</p>
            <div className="space-y-2">
              <Link href="/privacy" className="block transition-colors hover:text-foreground">Privacy policy</Link>
              <Link href="/terms" className="block transition-colors hover:text-foreground">Terms of service</Link>
              <Link href="/booking" className="block transition-colors hover:text-foreground">Book consultation</Link>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Follow us</p>
            <div className="flex flex-wrap gap-2">
              <a href="#" className="rounded-full border border-border/80 bg-white px-3 py-1.5 transition-colors hover:bg-muted">Instagram</a>
              <a href="#" className="rounded-full border border-border/80 bg-white px-3 py-1.5 transition-colors hover:bg-muted">X</a>
              <a href="#" className="rounded-full border border-border/80 bg-white px-3 py-1.5 transition-colors hover:bg-muted">YouTube</a>
              <a href="#" className="rounded-full border border-border/80 bg-white px-3 py-1.5 transition-colors hover:bg-muted">TikTok</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} St Agnes Atelier. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="transition-colors hover:text-foreground">Admin</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
