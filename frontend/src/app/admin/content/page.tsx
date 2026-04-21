'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { FileText, Home, Mail, Layout } from 'lucide-react';

interface SiteContent {
  id: string;
  pageKey: string;
  contentType: string;
  value: string;
  updatedAt: string;
}

const SECTIONS = [
  {
    slug: 'hero',
    label: 'Home Hero',
    description: 'The main heading and subtext shown in the homepage banner.',
    icon: Home,
    keys: ['hero_title', 'hero_subtitle'],
  },
  {
    slug: 'about',
    label: 'About Page',
    description: 'The title and body text on the About page.',
    icon: FileText,
    keys: ['about_title', 'about_body'],
  },
  {
    slug: 'contact',
    label: 'Contact Details',
    description: 'Studio email, phone number, and Instagram handle.',
    icon: Mail,
    keys: ['contact_email', 'contact_phone', 'instagram_handle'],
  },
  {
    slug: 'footer',
    label: 'Footer',
    description: 'Studio info and social media links shown in the footer.',
    icon: Layout,
    keys: ['footer_studio_email', 'footer_studio_city', 'footer_social_instagram', 'footer_social_youtube', 'footer_social_tiktok'],
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
    if (!matches.length) return '—';
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
          Choose a section below to edit the text and links that appear on the website.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="mt-auto flex items-center justify-between pt-4 border-t">
                {contentQuery.isLoading ? (
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {lastUpdated}
                  </p>
                )}
                <Link
                  href={`/admin/content/${section.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-80"
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
