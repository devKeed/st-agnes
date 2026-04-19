import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { getContentMap } from '@/lib/public-api';
import { services } from '@/lib/public-data';

export const metadata: Metadata = {
  title: 'About | St Agnes',
  description: 'About St Agnes services, process, and creative direction.',
};

export default async function AboutPage() {
  const content = await getContentMap().catch(() => ({} as Record<string, string>));

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="premium-shell fade-up space-y-3 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">About St Agnes</p>
        <h1 className="premium-title">
          {content.about_title ?? 'Craftsmanship with modern elegance.'}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {content.about_body ??
            'St Agnes blends contemporary design language with refined tailoring. From bridal pieces and couture looks to practical alterations and rental styling, each experience is personal and detail-driven.'}
        </p>
      </section>

      <section className="fade-up-delay grid gap-4 md:grid-cols-3">
        {services.map((service) => (
          <Card key={service.key} className="premium-card">
            <CardContent className="space-y-2 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Service</p>
              <h2 className="font-medium text-foreground">{service.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="premium-shell fade-up rounded-2xl p-5 md:p-6">
        <h2 className="text-xl font-semibold">Our Process</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Consultation and style direction</li>
          <li>Fabric, silhouette, and fit planning</li>
          <li>Production, fitting, and finishing</li>
          <li>Delivery or rental handover support</li>
        </ol>
      </section>
    </div>
  );
}
