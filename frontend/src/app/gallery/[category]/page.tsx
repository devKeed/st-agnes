import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { galleryItems, type GalleryCategory } from '@/lib/public-data';

interface Props {
  params: { category: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const category = params.category.toLowerCase();
  const title = category === 'collection' ? 'Collection' : category === 'muse' ? 'Muse' : 'Gallery';

  return {
    title: `${title} | St Agnes`,
    description: `Browse ${title} looks from St Agnes gallery.`,
  };
}

export default function GalleryCategoryPage({ params }: Props) {
  const category = params.category.toUpperCase();
  if (category !== 'COLLECTION' && category !== 'MUSE') {
    notFound();
  }

  const typedCategory = category as GalleryCategory;
  const items = galleryItems.filter((item) => item.category === typedCategory);

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
