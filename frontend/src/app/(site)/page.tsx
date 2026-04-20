import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getContentMap, getPublicGallery } from '@/lib/public-api';
import { galleryItems, services } from '@/lib/public-data';

const defaultStories = [
  {
    tag: 'Campaign',
    date: 'March 2026',
    title: 'Into the Garden — SS26',
    excerpt:
      'Our spring campaign, shot between Lagos and Lisbon, explores memory, heritage, and the quiet drama of a season in bloom.',
    image:
      'https://images.unsplash.com/photo-1508163356062-d2beca5e1aed?auto=format&fit=crop&w=1600&q=80',
  },
  {
    tag: 'Journal',
    date: 'February 2026',
    title: 'On the Quiet Power of Detail',
    excerpt:
      'A meditation on hand-finishing, drape, and the parts of a garment that should never be rushed.',
    image:
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Clients',
    date: 'January 2026',
    title: 'Dressing the Day of a Lifetime',
    excerpt: 'Five brides, five silhouettes — and the six-month journey behind each gown.',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  },
];

const defaultPressLogos = [
  'Vogue',
  "Harper's Bazaar",
  'The Guardian',
  'Marie Claire',
  'Elle',
  'Allure',
  'BellaNaija',
  'Yahoo',
];

export default async function Home() {
  const [content, gallery] = await Promise.all([
    getContentMap().catch(() => ({} as Record<string, string>)),
    getPublicGallery().catch(() => galleryItems),
  ]);

  const t = (key: string, fallback: string) => content[key] ?? fallback;

  const collection = gallery.slice(0, 4);

  const pressLogos = content.home_press_logos
    ? content.home_press_logos.split(',').map((s) => s.trim()).filter(Boolean)
    : defaultPressLogos;

  const stories = [1, 2, 3].map((i, idx) => ({
    tag: t(`home_story_${i}_tag`, defaultStories[idx].tag),
    date: t(`home_story_${i}_date`, defaultStories[idx].date),
    title: t(`home_story_${i}_title`, defaultStories[idx].title),
    excerpt: t(`home_story_${i}_excerpt`, defaultStories[idx].excerpt),
    image: t(`home_story_${i}_image`, defaultStories[idx].image),
  }));

  const heroImage = t(
    'home_hero_image',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=85',
  );
  const philosophyImage = t(
    'home_philosophy_image',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85',
  );
  const ctaImage = t(
    'home_cta_image',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=2000&q=85',
  );

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[calc(100vh-5rem)] min-h-[640px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt="St Agnes — signature editorial"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/10 to-foreground/70" />

        <div className="relative z-10 flex h-full items-end">
          <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 md:px-10 md:pb-20">
            <div className="max-w-3xl text-primary-foreground rise-in">
              <p className="section-index !text-white/80 before:!bg-white/50">
                {t('home_hero_eyebrow', 'Spring / Summer 2026 Edit')}
              </p>
              <h1 className="display-hero mt-5 text-white">
                {content.hero_title ?? (
                  <>
                    Elegance,<br />
                    <em className="italic text-white/90">unhurried.</em>
                  </>
                )}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85">
                {t(
                  'hero_subtitle',
                  "An atelier of bespoke design, precision alterations, and curated rentals — crafted for life's most considered moments.",
                )}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/gallery" className="btn-light-premium">
                  {t('home_hero_cta_primary', 'Explore the edit')}
                </Link>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white link-underline"
                >
                  {t('home_hero_cta_secondary', 'Book a fitting')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden flex-col items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-white/70 md:flex">
          <span>Scroll</span>
          <span className="block h-10 w-px bg-white/50" />
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="section-index">{t('home_intro_eyebrow', '01 — The House')}</p>
          </div>
          <div className="md:col-span-7">
            <h2 className="display-xl">
              {t(
                'home_intro_title',
                'A house built on considered craft — where every seam, silhouette, and stitch is an act of devotion.',
              )}
            </h2>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t(
                'home_intro_body',
                'St Agnes is an atelier for those who prefer the quiet over the crowd. We design bespoke pieces for your most considered moments, tailor what you already love, and offer a curated rental archive for the occasions that call for something singular.',
              )}
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-foreground link-underline"
            >
              {t('home_intro_cta', 'Discover the house')}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SIGNATURE EDIT */}
      <section className="bg-surface/50">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
          <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <p className="section-index">{t('home_signature_eyebrow', '02 — Signature Edit')}</p>
              <h2 className="display-xl max-w-xl">
                {t('home_signature_title', 'Playground ’24 Collection')}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t(
                'home_signature_body',
                'Seven sculpted pieces that capture our house code — soft structure, hand-finished detail, and a celebration of line.',
              )}
            </p>
          </div>

          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {collection.map((item, i) => (
              <article key={item.id} className="group hover-grow">
                <Link href="/gallery" className="block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    <span className="absolute left-4 top-4 font-display text-sm italic text-white mix-blend-difference">
                      № {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl leading-tight">{item.title}</h3>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Link href="/rentals" className="btn-ghost-premium">
              {t('home_signature_cta', 'Shop the archive')}
            </Link>
          </div>
        </div>
      </section>

      {/* PRESS MARQUEE */}
      <section className="border-y border-border/60 bg-background py-10 overflow-hidden">
        <div className="flex w-max marquee-track">
          {[...pressLogos, ...pressLogos].map((logo, i) => (
            <div key={i} className="flex items-center gap-16 px-8">
              <span className="whitespace-nowrap font-display text-2xl italic text-muted-foreground/70 md:text-3xl">
                {logo}
              </span>
              <span className="h-1 w-1 rounded-full bg-accent/60" />
            </div>
          ))}
        </div>
      </section>

      {/* CRAFT FEATURE */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-12 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={philosophyImage}
                alt="Hand detailing in the atelier"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <p className="section-index">{t('home_philosophy_eyebrow', '03 — Philosophy')}</p>
            <h2 className="display-xl mt-5">
              {t('home_philosophy_title', 'Every piece begins as a conversation.')}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              {t(
                'home_philosophy_body',
                'We believe the most memorable garments are born of intent — from the first sketch to the final hand-finishing. Our process invites you into the atelier: to sit with fabric, to see the silhouette take form, to own something that is unmistakably yours.',
              )}
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
              {[
                {
                  n: t('home_stat_1_number', '12+'),
                  l: t('home_stat_1_label', 'Years of craft'),
                },
                {
                  n: t('home_stat_2_number', '400'),
                  l: t('home_stat_2_label', 'Gowns delivered'),
                },
                {
                  n: t('home_stat_3_number', '1:1'),
                  l: t('home_stat_3_label', 'Client ratio'),
                },
              ].map((stat) => (
                <div key={stat.l}>
                  <dt className="font-display text-4xl text-foreground">{stat.n}</dt>
                  <dd className="mt-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    {stat.l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-foreground text-primary-foreground">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="section-index !text-white/60 before:!bg-white/40">
                {t('home_services_eyebrow', '04 — Services')}
              </p>
              <h2 className="display-xl mt-5 text-primary-foreground">
                {t('home_services_title', 'Three ways to work with the house.')}
              </h2>
            </div>
            <div className="md:col-span-8">
              <ul>
                {services.map((s, i) => (
                  <li
                    key={s.key}
                    className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-6 border-b border-white/15 py-7 first:border-t last:border-b-0 md:py-9"
                  >
                    <span className="font-display text-sm italic text-white/50">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="font-display text-3xl leading-tight md:text-4xl">
                        {t(`service_${s.key.toLowerCase()}_title`, s.title)}
                      </h3>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/70">
                        {t(`service_${s.key.toLowerCase()}_description`, s.description)}
                      </p>
                    </div>
                    <Link
                      href={s.key === 'RENTAL' ? '/rentals' : '/booking'}
                      aria-label={`Learn more about ${s.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:text-foreground"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STORIES */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="section-index">{t('home_journal_eyebrow', '05 — Journal')}</p>
            <h2 className="display-xl max-w-xl">
              {t('home_journal_title', 'St Agnes Stories')}
            </h2>
          </div>
          <Link
            href="/gallery"
            className="text-[11px] uppercase tracking-[0.3em] text-foreground transition-colors hover:text-accent"
          >
            {t('home_journal_cta', 'View all entries')}
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-12">
          <article className="group md:col-span-7 hover-grow">
            <Link href="/gallery">
              <div className="relative aspect-[16/11] overflow-hidden bg-muted">
                <img src={stories[0].image} alt={stories[0].title} className="h-full w-full object-cover" />
                <span className="absolute left-5 top-5 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-foreground">
                  {stories[0].tag}
                </span>
              </div>
              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                  {stories[0].date}
                </p>
                <h3 className="display-lg mt-3">{stories[0].title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {stories[0].excerpt}
                </p>
              </div>
            </Link>
          </article>

          <div className="space-y-10 md:col-span-5">
            {stories.slice(1).map((story) => (
              <article key={story.title} className="group hover-grow">
                <Link href="/gallery" className="grid grid-cols-[1fr_1.2fr] gap-5">
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <img src={story.image} alt={story.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                      {story.tag} · {story.date}
                    </p>
                    <h3 className="font-display text-2xl leading-tight mt-2">{story.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {story.excerpt}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONSULTATION CTA */}
      <section className="relative overflow-hidden">
        <img src={ctaImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/70" />
        <div className="relative mx-auto w-full max-w-[1440px] px-5 py-28 text-center text-primary-foreground md:px-10 md:py-36">
          <p className="section-index justify-center !text-white/70 before:!bg-white/50">
            {t('home_cta_eyebrow', '06 — By Appointment')}
          </p>
          <h2 className="display-xl mx-auto mt-6 max-w-3xl text-white">
            {content.home_cta_title ?? (
              <>
                Step inside the atelier. <em className="italic">Let's begin your piece.</em>
              </>
            )}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80">
            {t(
              'home_cta_body',
              'Book a private consultation to define your vision — from fabric and silhouette to the occasion it will be worn for.',
            )}
          </p>
          <div className="mt-10">
            <Link href="/booking" className="btn-light-premium">
              {t('home_cta_button', 'Schedule a consultation')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
