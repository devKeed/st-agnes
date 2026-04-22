'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Home, FileText, Image, ShoppingBag, Calendar, Layers, Layout } from 'lucide-react';

interface SiteContent {
  id: string;
  pageKey: string;
  contentType: string;
  value: string;
  updatedAt: string;
}

const SECTIONS = [
  {
    slug: 'home',
    label: 'Home Page',
    description: 'Hero banner, intro, philosophy, stats, journal stories, and CTA section.',
    icon: Home,
    keys: ['hero_title', 'home_hero_eyebrow', 'home_intro_title', 'home_philosophy_title', 'home_cta_title'],
  },
  {
    slug: 'about',
    label: 'About Page',
    description: 'Philosophy, process steps, services section, and the bottom CTA.',
    icon: FileText,
    keys: ['about_title', 'about_body', 'about_philosophy_body', 'about_process_title', 'about_cta_title'],
  },
  {
    slug: 'gallery',
    label: 'Gallery Page',
    description: 'Gallery page heading, intro text, and tab labels.',
    icon: Image,
    keys: ['gallery_title', 'gallery_eyebrow', 'gallery_intro'],
  },
  {
    slug: 'rentals',
    label: 'Rentals Page',
    description: 'Rentals heading, intro, empty state, and CTA copy.',
    icon: ShoppingBag,
    keys: ['rentals_title', 'rentals_eyebrow', 'rentals_intro', 'rentals_cta_title'],
  },
  {
    slug: 'booking',
    label: 'Booking Page',
    description: 'Booking page heading and introductory text.',
    icon: Calendar,
    keys: ['booking_title', 'booking_eyebrow', 'booking_intro'],
  },
  {
    slug: 'services',
    label: 'Services',
    description: 'Service titles and descriptions shared across Home and About pages.',
    icon: Layers,
    keys: ['service_custom_design_title', 'service_alteration_title', 'service_rental_title'],
  },
  {
    slug: 'footer',
    label: 'Footer & Contact',
    description: 'Newsletter copy, studio info, social links, and contact details.',
    icon: Layout,
    keys: ['footer_studio_email', 'footer_studio_city', 'footer_newsletter_title', 'contact_email'],
  },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminContentPage() {
  const contentQuery = useQuery({
    queryKey: ['content', 'admin'],
    queryFn: () => apiFetch<SiteContent[]>('/content'),
  });

  const rows = contentQuery.data ?? [];

  function getLastUpdated(keys: string[]): string {
    const matches = rows.filter((r) => keys.includes(r.pageKey));
    if (!matches.length) return 'Not yet edited';
    const latest = matches.reduce((a, b) =>
      new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
    );
    return formatDate(latest.updatedAt);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Website Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a page below to edit its text and copy. Changes go live immediately after saving.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const lastUpdated = getLastUpdated(section.keys);

          return (
            <div
              key={section.slug}
              className="flex flex-col rounded-xl border bg-card p-6 transition-colors hover:border-foreground/20"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold leading-snug">{section.label}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t pt-4">
                {contentQuery.isLoading ? (
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-xs text-muted-foreground">Last edited: {lastUpdated}</p>
                )}
                <Link
                  href={`/admin/content/${section.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-80"
                >
                  Edit →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
