import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getContentMap, getPublicGallery } from '@/lib/public-api';
import { galleryItems, services } from '@/lib/public-data';

export default async function Home() {
  const [content, gallery] = await Promise.all([
    getContentMap().catch(() => ({} as Record<string, string>)),
    getPublicGallery().catch(() => galleryItems),
  ]);

  const featured = gallery.slice(0, 3);

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="grid gap-8 rounded-2xl border bg-gradient-to-br from-background to-muted/40 p-6 md:grid-cols-2 md:p-10">
        <div className="space-y-4">
          <p className="text-xs tracking-[0.28em] uppercase text-muted-foreground">St Agnes Atelier</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            {content.home_hero_title ?? 'Elegance in every detail.'}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base">
            {content.home_hero_subtitle ??
              'Discover custom design, alterations, and curated rental pieces for life’s most memorable moments.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/booking">Book consultation</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/gallery">Explore gallery</Link>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80"
            alt="St Agnes featured look"
            className="h-full min-h-72 w-full object-cover"
          />
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold md:text-3xl">Services</h2>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
            Learn more
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <Card key={service.key}>
              <CardContent className="space-y-2 p-5">
                <p className="font-medium">{service.title}</p>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold md:text-3xl">Featured Gallery</h2>
          <Link href="/gallery" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border">
              <img src={item.imageUrl} alt={item.title} className="h-64 w-full object-cover" />
              <div className="space-y-1 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.category}
                </p>
                <h3 className="font-medium">{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-foreground p-6 text-primary-foreground md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">Ready to create your next look?</h2>
            <p className="mt-2 text-sm text-primary-foreground/80 md:text-base">
              Reserve your slot and we’ll guide you from inspiration to final fit.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/booking">Start booking</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
