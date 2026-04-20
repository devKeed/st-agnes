import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { getContentMap } from '@/lib/public-api';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getContentMap().catch(() => ({} as Record<string, string>));

  return (
    <>
      <SiteHeader />
      <main className="relative z-10">{children}</main>
      <SiteFooter content={content} />
    </>
  );
}
