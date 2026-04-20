import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getPublicGallery } from '@/lib/public-api';
import { galleryItems } from '@/lib/public-data';

export const metadata: Metadata = {
  title: 'Gallery | St Agnes',
  description: 'Browse Collection and Muse gallery categories.',
};

export default async function GalleryPage() {
  const items = await getPublicGallery().catch(() => galleryItems);

  return (
    <div>
      {/* HEADER */}
      <section className="mx-auto w-full max-w-[1440px] px-5 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="section-index">Index — Gallery</p>
            <h1 className="display-hero mt-5">
              A quiet archive of <em className="italic">collection</em> & <em className="italic">muse</em>.
            </h1>
          </div>
          <div className="md:col-span-5">
            <p className="text-base leading-relaxed text-muted-foreground">
              A living record of the atelier's work — seasonal collections alongside the muses
              who wear them. Browse by chapter below.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/gallery/collection" className="btn-ghost-premium h-11 px-6">
                Collection
              </Link>
              <Link href="/gallery/muse" className="btn-ghost-premium h-11 px-6">
                Muse
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <article key={item.id} className="group hover-grow">
              <Link href={`/gallery/${item.category.toLowerCase()}`}>
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  <span className="absolute left-4 top-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-foreground">
                    {item.category}
                  </span>
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-sm italic text-muted-foreground">
                      № {String(i + 1).padStart(2, '0')}
                    </p>
                    <h2 className="mt-1 font-display text-2xl leading-tight">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground" />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
