import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicGallery } from '@/lib/public-api';
import { galleryItems, type GalleryCategory } from '@/lib/public-data';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const category = resolved.category.toLowerCase();
  const title = category === 'collection' ? 'Collection' : category === 'muse' ? 'Muse' : 'Gallery';
  return {
    title: `${title} | St Agnes`,
    description: `Browse ${title} looks from St Agnes gallery.`,
  };
}

export default async function GalleryCategoryPage({ params }: Props) {
  const resolved = await params;
  const category = resolved.category.toUpperCase();
  if (category !== 'COLLECTION' && category !== 'MUSE') {
    notFound();
  }
  const typedCategory = category as GalleryCategory;
  const items = await getPublicGallery(typedCategory).catch(() =>
    galleryItems.filter((item) => item.category === typedCategory),
  );

  const other = typedCategory === 'COLLECTION' ? 'MUSE' : 'COLLECTION';

  return (
    <div>
      <section className="mx-auto w-full max-w-[1440px] px-5 pt-20 md:px-10 md:pt-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-index">Chapter — {typedCategory}</p>
            <h1 className="display-hero mt-5 capitalize">{typedCategory.toLowerCase()}</h1>
          </div>
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.3em]">
            <Link href="/gallery" className="text-muted-foreground hover:text-foreground link-underline">
              ← All entries
            </Link>
            <Link href={`/gallery/${other.toLowerCase()}`} className="text-foreground link-underline">
              {other}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <article key={item.id} className="group hover-grow">
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              </div>
              <div className="mt-5">
                <p className="font-display text-sm italic text-muted-foreground">
                  № {String(i + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-1 font-display text-2xl leading-tight">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
