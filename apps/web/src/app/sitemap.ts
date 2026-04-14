import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL || 'https://st-agnes.vercel.app';

  return ['/', '/rentals', '/booking', '/terms', '/privacy'].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));
}
