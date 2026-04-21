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

export default function HeroContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState({ hero_title: '', hero_subtitle: '' });
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
      hero_title: getValue('hero_title'),
      hero_subtitle: getValue('hero_subtitle'),
    };
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [contentQuery.data]);

  const isDirty = initialRef.current !== JSON.stringify(form);
  useUnsavedChanges(isDirty);

  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all([
        apiFetch(`/content/hero_title`, { method: 'PUT', body: { value: form.hero_title, contentType: 'TEXT' } }),
        apiFetch(`/content/hero_subtitle`, { method: 'PUT', body: { value: form.hero_subtitle, contentType: 'TEXT' } }),
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
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Home Hero</h1>
            {isDirty && (
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            The main heading and subtext shown in the homepage banner.
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
          {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
        </div>
      )}

      {/* Form */}
      {!contentQuery.isLoading && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Text Content</h2>

          <div className="space-y-1.5">
            <Label htmlFor="hero_title" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Homepage heading
            </Label>
            <Input
              id="hero_title"
              value={form.hero_title}
              onChange={(e) => setForm((p) => ({ ...p, hero_title: e.target.value }))}
              placeholder="e.g. Welcome to St Agnes"
            />
            <p className="text-xs text-muted-foreground">The large heading displayed in the banner at the top of the homepage.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hero_subtitle" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Homepage subtext
            </Label>
            <Input
              id="hero_subtitle"
              value={form.hero_subtitle}
              onChange={(e) => setForm((p) => ({ ...p, hero_subtitle: e.target.value }))}
              placeholder="e.g. A creative studio in Lagos"
            />
            <p className="text-xs text-muted-foreground">Smaller text shown directly below the main heading.</p>
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
