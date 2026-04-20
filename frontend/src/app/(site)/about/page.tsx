import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getContentMap } from '@/lib/public-api';
import { services } from '@/lib/public-data';

export const metadata: Metadata = {
  title: 'The Atelier | St Agnes',
  description: 'The philosophy, process, and people behind St Agnes.',
};

const process = [
  {
    title: 'Consultation',
    body: 'We begin with a private conversation — your occasion, your silhouette, the shape of what you imagine.',
  },
  {
    title: 'Sketch & Selection',
    body: 'Mood boards, hand sketches, and fabric swatches — the piece takes form before a single stitch is made.',
  },
  {
    title: 'Atelier',
    body: 'Our artisans construct, drape, and hand-finish. Two fittings refine proportion and fall.',
  },
  {
    title: 'Handover',
    body: 'Delivered with care — garment bag, care notes, and a direct line to the studio for alterations.',
  },
];

export default async function AboutPage() {
  const content = await getContentMap().catch(() => ({} as Record<string, string>));

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=2000&q=85"
          alt="Inside the St Agnes atelier"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] items-end px-5 pb-14 md:px-10 md:pb-20">
          <div className="max-w-3xl text-white rise-in">
            <p className="section-index !text-white/70 before:!bg-white/50">The Atelier</p>
            <h1 className="display-hero mt-5 text-white">
              {content.about_title ?? (
                <>Craftsmanship, <em className="italic">with intent.</em></>
              )}
            </h1>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="section-index">01 — Philosophy</p>
          </div>
          <div className="md:col-span-7">
            <p className="display-lg">
              {content.about_body ??
                'St Agnes is an atelier for those who value the slower, more considered way of making. We draw from modern silhouettes and traditional couture technique — always in service of the person who will wear the piece.'}
            </p>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
              Founded on the belief that clothing should hold meaning, we work closely with a
              small circle of clients each season. Every bespoke piece is designed to be worn —
              and remembered.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-surface/50">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
          <div className="mb-14">
            <p className="section-index">02 — Services</p>
            <h2 className="display-xl mt-5 max-w-2xl">Three disciplines, one standard.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {services.map((s, i) => (
              <article key={s.key} className="group flex flex-col justify-between border-t border-foreground pt-6">
                <div>
                  <p className="font-display text-sm italic text-muted-foreground">
                    № {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 font-display text-3xl leading-tight">{s.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                </div>
                <Link
                  href={s.key === 'RENTAL' ? '/rentals' : '/booking'}
                  className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-foreground link-underline"
                >
                  Begin <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
        <div className="mb-14">
          <p className="section-index">03 — Process</p>
          <h2 className="display-xl mt-5 max-w-2xl">From first thread to final fitting.</h2>
        </div>
        <ol className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {process.map((step, i) => (
            <li key={step.title} className="relative border-t border-foreground pt-6">
              <span className="font-display text-5xl italic text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-display text-2xl leading-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="bg-foreground">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-24 text-center text-primary-foreground md:px-10 md:py-28">
          <h2 className="display-xl mx-auto max-w-3xl text-primary-foreground">
            Ready to begin your piece?
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/booking" className="btn-light-premium">Schedule a consultation</Link>
            <Link href="/gallery" className="link-underline text-[11px] uppercase tracking-[0.3em] text-white">
              See our work
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
