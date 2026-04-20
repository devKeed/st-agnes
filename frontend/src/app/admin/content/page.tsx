'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ContentType = 'TEXT' | 'RICHTEXT' | 'IMAGE' | 'VIDEO';

interface SiteContent {
  id: string;
  pageKey: string;
  contentType: ContentType;
  value: string;
  updatedAt: string;
}

interface KeyMeta {
  section: string;
  label: string;
  help: string;
}

const CONTENT_TYPES: ContentType[] = ['TEXT', 'RICHTEXT', 'IMAGE', 'VIDEO'];

const SECTION_LABELS: Record<string, string> = {
  home: 'Home page',
  hero: 'Home hero',
  about: 'About page',
  gallery: 'Gallery page',
  rentals: 'Rentals page',
  booking: 'Booking page',
  service: 'Services',
  footer: 'Footer',
  contact: 'Contact',
};

const KEY_DETAILS: Record<string, KeyMeta> = {
  hero_title: {
    section: 'Home hero',
    label: 'Hero title',
    help: 'Main big heading on the homepage hero section.',
  },
  hero_subtitle: {
    section: 'Home hero',
    label: 'Hero subtitle',
    help: 'Text under the homepage hero title.',
  },
  about_title: {
    section: 'About page',
    label: 'About page title',
    help: 'Large heading at the top of the About page.',
  },
  about_body: {
    section: 'About page',
    label: 'About main body',
    help: 'Main intro text on the About page. Use RICHTEXT if you need formatting.',
  },
  contact_email: {
    section: 'Contact',
    label: 'Contact email',
    help: 'Public support/studio email. Also used in booking emails.',
  },
  contact_phone: {
    section: 'Contact',
    label: 'Contact phone',
    help: 'Public phone number. Also used in booking emails.',
  },
  instagram_handle: {
    section: 'Contact',
    label: 'Instagram handle',
    help: 'Brand social handle text (for example @stagnes).',
  },
  footer_studio_email: {
    section: 'Footer',
    label: 'Footer studio email',
    help: 'Email shown in footer studio/contact area.',
  },
  footer_studio_city: {
    section: 'Footer',
    label: 'Footer city',
    help: 'City text shown in footer studio area.',
  },
  footer_social_instagram: {
    section: 'Footer',
    label: 'Instagram URL',
    help: 'Full Instagram profile URL for footer icon.',
  },
  footer_social_youtube: {
    section: 'Footer',
    label: 'YouTube URL',
    help: 'Full YouTube channel URL for footer icon.',
  },
  footer_social_tiktok: {
    section: 'Footer',
    label: 'TikTok URL',
    help: 'Full TikTok profile URL for footer icon.',
  },
};

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferSection(key: string): string {
  const [prefix] = key.split('_');
  return SECTION_LABELS[prefix] ?? 'Other';
}

function getKeyMeta(key: string): KeyMeta {
  if (KEY_DETAILS[key]) return KEY_DETAILS[key];
  return {
    section: inferSection(key),
    label: humanizeKey(key),
    help: 'Custom content key used by the website.',
  };
}

function contentTypeHelp(type: ContentType): string {
  if (type === 'TEXT') return 'Plain text, ideal for titles, labels, short copy.';
  if (type === 'RICHTEXT') return 'Formatted content (HTML), ideal for long paragraphs.';
  if (type === 'IMAGE') return 'Image URL. Paste a full link to an image.';
  return 'Video URL. Paste a full link to a video.';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

export default function AdminContentPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState<ContentType>('TEXT');
  const [newValue, setNewValue] = useState('');

  const contentQuery = useQuery({
    queryKey: ['content', 'admin'],
    queryFn: () => apiFetch<SiteContent[]>('/content'),
  });

  const rows = contentQuery.data ?? [];
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});
  const [typeDrafts, setTypeDrafts] = useState<Record<string, ContentType>>({});

  useEffect(() => {
    if (!rows.length) return;
    setValueDrafts(
      rows.reduce<Record<string, string>>((acc, row) => {
        acc[row.pageKey] = row.value;
        return acc;
      }, {}),
    );
    setTypeDrafts(
      rows.reduce<Record<string, ContentType>>((acc, row) => {
        acc[row.pageKey] = row.contentType;
        return acc;
      }, {}),
    );
  }, [rows]);

  const upsertMutation = useMutation({
    mutationFn: ({ key, value, contentType }: { key: string; value: string; contentType: ContentType }) =>
      apiFetch<SiteContent>(`/content/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: { value, contentType },
      }),
    onSuccess: () => {
      setFeedback('Content saved.');
      void queryClient.invalidateQueries({ queryKey: ['content'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.pageKey.localeCompare(b.pageKey)), [rows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedRows;

    return sortedRows.filter((row) => {
      const meta = getKeyMeta(row.pageKey);
      return (
        row.pageKey.toLowerCase().includes(query) ||
        meta.label.toLowerCase().includes(query) ||
        meta.section.toLowerCase().includes(query) ||
        meta.help.toLowerCase().includes(query)
      );
    });
  }, [search, sortedRows]);

  function createOrUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    if (!newKey.trim() || !newValue.trim()) {
      setFeedback('Key and value are required.');
      return;
    }

    upsertMutation.mutate({
      key: newKey.trim(),
      value: newValue,
      contentType: newType,
    });

    setNewKey('');
    setNewValue('');
    setNewType('TEXT');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit website text and media links in plain language. Each item below shows where it appears.
        </p>
      </div>

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{feedback}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How this works</CardTitle>
          <CardDescription>Quick guide for non-technical content edits.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>• <span className="font-medium text-foreground">Name</span> tells you where this content appears.</p>
          <p>• <span className="font-medium text-foreground">Key</span> is the system ID. Avoid renaming keys unless a developer asked for it.</p>
          <p>• <span className="font-medium text-foreground">Type</span> controls how the value is treated (text, rich text, image URL, video URL).</p>
          <p>• Use search to quickly find content for a page (for example: home, about, footer).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create new content item</CardTitle>
          <CardDescription>Add a brand-new key only when the website expects it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="grid gap-3 md:grid-cols-3" onSubmit={createOrUpdate}>
            <div className="space-y-1">
              <Label htmlFor="new-content-key">System key</Label>
              <Input
                id="new-content-key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="example: home_hero_title"
              />
            </div>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={newType}
              onChange={(e) => setNewType(e.target.value as ContentType)}
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving…' : 'Save key'}
            </Button>
            <div className="md:col-span-3">
              <Label htmlFor="new-content-value">Value</Label>
              <textarea
                id="new-content-value"
                rows={3}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Enter the text or URL to display on the site"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
          </form>
          <p className="text-xs text-muted-foreground">Selected type: {contentTypeHelp(newType)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing content</CardTitle>
          <CardDescription>
            {contentQuery.isLoading
              ? 'Loading…'
              : `${filteredRows.length} of ${sortedRows.length} item(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="content-search">Search content</Label>
            <Input
              id="content-search"
              placeholder="Search by page, name, key, or help text (e.g. about, footer, booking)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {contentQuery.isError ? (
            <p className="text-sm text-destructive">{errorMessage(contentQuery.error)}</p>
          ) : contentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading content…</p>
          ) : filteredRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching content found.</p>
          ) : (
            filteredRows.map((row) => {
              const draftValue = valueDrafts[row.pageKey] ?? row.value;
              const draftType = typeDrafts[row.pageKey] ?? row.contentType;
              const changed = draftValue !== row.value || draftType !== row.contentType;
              const meta = getKeyMeta(row.pageKey);

              return (
                <div key={row.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{meta.section}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-xs"
                        value={draftType}
                        onChange={(e) =>
                          setTypeDrafts((current) => ({
                            ...current,
                            [row.pageKey]: e.target.value as ContentType,
                          }))
                        }
                      >
                        {CONTENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={!changed || upsertMutation.isPending}
                        onClick={() =>
                          upsertMutation.mutate({
                            key: row.pageKey,
                            value: draftValue,
                            contentType: draftType,
                          })
                        }
                      >
                        {changed ? 'Save changes' : 'Saved'}
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Where this appears:</span> {meta.help}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Key:</span>{' '}
                      <span className="font-mono">{row.pageKey}</span>
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Last updated:</span> {formatDate(row.updatedAt)}
                    </p>
                  </div>

                  <textarea
                    rows={4}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder={
                      draftType === 'TEXT'
                        ? 'Enter plain text'
                        : draftType === 'RICHTEXT'
                          ? 'Enter formatted HTML text'
                          : draftType === 'IMAGE'
                            ? 'Paste full image URL'
                            : 'Paste full video URL'
                    }
                    value={draftValue}
                    onChange={(e) =>
                      setValueDrafts((current) => ({
                        ...current,
                        [row.pageKey]: e.target.value,
                      }))
                    }
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
