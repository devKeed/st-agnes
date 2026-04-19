import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getContentMap, getPublicGallery } from '@/lib/public-api';
import { galleryItems, services } from '@/lib/public-data';

export default async function Home() {
  const [content, gallery] = await Promise.all([
    getContentMap().catch(() => ({} as Record<string, string>)),
    getPublicGallery().catch(() => galleryItems),
  ]);

  const featured = gallery.slice(0, 3);
  const collection = gallery.slice(0, 4);
  const stories = gallery.slice(0, 4);
  const pressLogos = [
    'Vogue',
    'Harper’s Bazaar',
    'The Guardian',
    'Marie Claire',
    'Elle',
    'Allure',
  ];

  return (
    <div className="space-y-16 pb-8 md:space-y-24 md:pb-12">
      <section className="fade-up relative overflow-hidden rounded-3xl border border-border/70">
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80"
          alt="St Agnes featured editorial"
          className="h-[70vh] min-h-[520px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/15" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-white/70">St Agnes Atelier</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
            {content.hero_title ?? 'Elegance in every detail.'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
            {content.hero_subtitle ??
              'Discover custom design, alterations, and curated rental pieces for life’s most memorable moments.'}
          </p>
        </div>
      </section>

      <section className="fade-up-delay space-y-3 text-center">
        <h2 className="text-2xl font-medium uppercase tracking-[0.06em] md:text-3xl">
          Fall in love with St Agnes
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          Signature craftsmanship, modern silhouettes, and an editorial approach to occasionwear.
        </p>
        <div className="pt-2">
          <Button asChild className="px-8">
            <Link href="/gallery">Discover now</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-medium uppercase tracking-[0.06em] md:text-3xl">
            Playground 24&apos; Collection
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collection.map((item) => (
            <article key={item.id} className="group space-y-3 text-center">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-white/90">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-sm font-medium">{item.title}</h3>
            </article>
          ))}
        </div>
        <div className="flex justify-center">
          <Button asChild className="px-9 uppercase tracking-wide">
            <Link href="/rentals">Shop now</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 border-y border-border/60 py-8 text-center sm:grid-cols-3 md:grid-cols-6">
        {pressLogos.map((logo) => (
          <p key={logo} className="text-sm font-medium text-muted-foreground/80">
            {logo}
          </p>
        ))}
      </section>

      <section className="premium-shell mx-auto max-w-3xl p-6 text-center md:p-8">
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-foreground/90">
          Book a guided session to define your vision and begin your custom design process.
        </p>
        <Button asChild className="mt-5 px-8 uppercase tracking-wide">
          <Link href="/booking">Schedule a consultation</Link>
        </Button>
      </section>

      <section className="space-y-5">
        <h2 className="text-center text-2xl font-semibold md:text-3xl">St Agnes Stories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stories.map((item) => (
            <article key={item.id} className="group relative overflow-hidden rounded-2xl border border-border/70">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white">
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/75">{item.category}</p>
                <h3 className="line-clamp-2 text-xl font-semibold leading-tight">{item.title}</h3>
                <p className="line-clamp-2 text-sm text-white/85">{item.description}</p>
                <Link href="/gallery" className="inline-block text-xs underline underline-offset-4">
                  Read more
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold md:text-3xl">Services</h2>
          <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Learn more
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.key}
              className="premium-card overflow-hidden"
            >
              <div className="space-y-3 p-5">
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Service</p>
                <p className="font-medium text-foreground">{service.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold md:text-3xl">Featured Gallery</h2>
          <Link href="/gallery" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((item) => (
            <article key={item.id} className="premium-card group overflow-hidden">
              <div className="overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-1 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{item.category}</p>
                <h3 className="font-medium text-foreground">{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
