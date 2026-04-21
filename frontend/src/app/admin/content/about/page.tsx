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

export default function AboutContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState({ about_title: '', about_body: '' });
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
      about_title: getValue('about_title'),
      about_body: getValue('about_body'),
    };
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [contentQuery.data]);

  const isDirty = initialRef.current !== JSON.stringify(form);
  useUnsavedChanges(isDirty);

  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all([
        apiFetch(`/content/about_title`, { method: 'PUT', body: { value: form.about_title, contentType: 'TEXT' } }),
        apiFetch(`/content/about_body`, { method: 'PUT', body: { value: form.about_body, contentType: 'RICHTEXT' } }),
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
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">About Page</h1>
            {isDirty && (
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            The title and body text shown on the About page.
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
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Page Content</h2>

          <div className="space-y-1.5">
            <Label htmlFor="about_title" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Page title
            </Label>
            <Input
              id="about_title"
              value={form.about_title}
              onChange={(e) => setForm((p) => ({ ...p, about_title: e.target.value }))}
              placeholder="e.g. About St Agnes"
            />
            <p className="text-xs text-muted-foreground">The large heading at the top of the About page.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="about_body" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Main body text
            </Label>
            <textarea
              id="about_body"
              rows={8}
              className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.about_body}
              onChange={(e) => setForm((p) => ({ ...p, about_body: e.target.value }))}
              placeholder="Write the main intro text for the About page…"
            />
            <p className="text-xs text-muted-foreground">Tip: Separate paragraphs with a blank line.</p>
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
