import type { Metadata } from 'next';
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold md:text-4xl">{typedCategory}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-xl border">
            <img src={item.imageUrl} alt={item.title} className="h-64 w-full object-cover" />
            <div className="space-y-1 p-4">
              <h2 className="font-medium">{item.title}</h2>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
