'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface SiteContent {
  id: string;
  pageKey: string;
  contentType: string;
  value: string;
  updatedAt: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

export default function FooterContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState({
    footer_studio_email: '',
    footer_studio_city: '',
    footer_social_instagram: '',
    footer_social_youtube: '',
    footer_social_tiktok: '',
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contentQuery = useQuery({
    queryKey: ['content', 'admin'],
    queryFn: () => apiFetch<SiteContent[]>('/content'),
  });

  useEffect(() => {
    if (!contentQuery.data) return;
    const getValue = (key: string) =>
      contentQuery.data.find((r) => r.pageKey === key)?.value ?? '';
    const next = {
      footer_studio_email: getValue('footer_studio_email'),
      footer_studio_city: getValue('footer_studio_city'),
      footer_social_instagram: getValue('footer_social_instagram'),
      footer_social_youtube: getValue('footer_social_youtube'),
      footer_social_tiktok: getValue('footer_social_tiktok'),
    };
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [contentQuery.data]);

  const isDirty = initialRef.current !== JSON.stringify(form);
  useUnsavedChanges(isDirty);

  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all([
        apiFetch(`/content/footer_studio_email`, { method: 'PUT', body: { value: form.footer_studio_email, contentType: 'TEXT' } }),
        apiFetch(`/content/footer_studio_city`, { method: 'PUT', body: { value: form.footer_studio_city, contentType: 'TEXT' } }),
        apiFetch(`/content/footer_social_instagram`, { method: 'PUT', body: { value: form.footer_social_instagram, contentType: 'TEXT' } }),
        apiFetch(`/content/footer_social_youtube`, { method: 'PUT', body: { value: form.footer_social_youtube, contentType: 'TEXT' } }),
        apiFetch(`/content/footer_social_tiktok`, { method: 'PUT', body: { value: form.footer_social_tiktok, contentType: 'TEXT' } }),
      ]),
    onSuccess: () => {
      initialRef.current = JSON.stringify(form);
      void queryClient.invalidateQueries({ queryKey: ['content'] });
      setFeedback({ type: 'success', text: 'Changes saved.' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error) => setFeedback({ type: 'error', text: errorMessage(error) }),
  });

  const handleSave = () => saveMutation.mutate();

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        ← Content
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Footer</h1>
            {isDirty && (
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Studio info and social media links shown at the bottom of every page.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          feedback.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-destructive/30 bg-destructive/10 text-destructive'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <span>{feedback.text}</span>
            {feedback.type === 'error' && (
              <button onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100">Dismiss</button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {contentQuery.isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      )}

      {!contentQuery.isLoading && (
        <div className="space-y-6">
          {/* Studio Info */}
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Studio Info</h2>

            <div className="space-y-1.5">
              <Label htmlFor="footer_studio_email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Studio email
              </Label>
              <Input
                id="footer_studio_email"
                type="email"
                value={form.footer_studio_email}
                onChange={(e) => setForm((p) => ({ ...p, footer_studio_email: e.target.value }))}
                placeholder="studio@stagnes.co"
              />
              <p className="text-xs text-muted-foreground">Email address shown in the footer contact area.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="footer_studio_city" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                City
              </Label>
              <Input
                id="footer_studio_city"
                value={form.footer_studio_city}
                onChange={(e) => setForm((p) => ({ ...p, footer_studio_city: e.target.value }))}
                placeholder="Lagos, Nigeria"
              />
              <p className="text-xs text-muted-foreground">City shown in the footer studio area.</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Social Links</h2>

            <div className="space-y-1.5">
              <Label htmlFor="footer_social_instagram" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Instagram URL
              </Label>
              <Input
                id="footer_social_instagram"
                type="url"
                value={form.footer_social_instagram}
                onChange={(e) => setForm((p) => ({ ...p, footer_social_instagram: e.target.value }))}
                placeholder="https://instagram.com/stagnes"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="footer_social_youtube" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                YouTube URL
              </Label>
              <Input
                id="footer_social_youtube"
                type="url"
                value={form.footer_social_youtube}
                onChange={(e) => setForm((p) => ({ ...p, footer_social_youtube: e.target.value }))}
                placeholder="https://youtube.com/@stagnes"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="footer_social_tiktok" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                TikTok URL
              </Label>
              <Input
                id="footer_social_tiktok"
                type="url"
                value={form.footer_social_tiktok}
                onChange={(e) => setForm((p) => ({ ...p, footer_social_tiktok: e.target.value }))}
                placeholder="https://tiktok.com/@stagnes"
              />
            </div>

            <p className="text-xs text-muted-foreground">Paste the full profile URL for each social platform. Leave blank to hide the icon in the footer.</p>
          </div>
        </div>
      )}

      {/* Bottom save */}
      {!contentQuery.isLoading && (
        <div className="flex justify-end pb-10">
          <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
