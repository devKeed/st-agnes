'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface SiteContent { id: string; pageKey: string; contentType: string; value: string; updatedAt: string; }
type Form = { rentals_eyebrow: string; rentals_title: string; rentals_intro: string; rentals_cta_title: string; rentals_cta_button: string; rentals_empty: string; };
const EMPTY: Form = { rentals_eyebrow: '', rentals_title: '', rentals_intro: '', rentals_cta_title: '', rentals_cta_button: '', rentals_empty: '' };
function err(e: unknown) { return e instanceof Error ? e.message : 'Request failed.'; }

const CT = (key: string) => ['rentals_intro'].includes(key) ? 'RICHTEXT' : 'TEXT';

export default function RentalsContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState<Form>(EMPTY);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contentQuery = useQuery({ queryKey: ['content', 'admin'], queryFn: () => apiFetch<SiteContent[]>('/content') });

  useEffect(() => {
    if (!contentQuery.data) return;
    const v = (key: string) => contentQuery.data.find((r) => r.pageKey === key)?.value ?? '';
    const next: Form = { rentals_eyebrow: v('rentals_eyebrow'), rentals_title: v('rentals_title'), rentals_intro: v('rentals_intro'), rentals_cta_title: v('rentals_cta_title'), rentals_cta_button: v('rentals_cta_button'), rentals_empty: v('rentals_empty') };
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [contentQuery.data]);

  const isDirty = initialRef.current !== JSON.stringify(form);
  useUnsavedChanges(isDirty);
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: () => Promise.all(
      (Object.entries(form) as [keyof Form, string][]).map(([key, value]) =>
        apiFetch(`/content/${encodeURIComponent(key)}`, { method: 'PUT', body: { value, contentType: CT(key) } })
      )
    ),
    onSuccess: () => {
      initialRef.current = JSON.stringify(form);
      void queryClient.invalidateQueries({ queryKey: ['content'] });
      setFeedback({ type: 'success', text: 'Rentals page content saved.' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error) => setFeedback({ type: 'error', text: err(error) }),
  });

  return (
    <div className="space-y-8">
      <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">← Content</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Rentals Page</h1>
            {isDirty && <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Heading, intro text, CTA, and empty state message.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
          <div className="flex items-center justify-between gap-4">
            <span>{feedback.text}</span>
            {feedback.type === 'error' && <button onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100">Dismiss</button>}
          </div>
        </div>
      )}

      {contentQuery.isLoading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Page Header</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Eyebrow label</Label>
              <Input value={form.rentals_eyebrow} onChange={set('rentals_eyebrow')} placeholder="Index — Rentals" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Page heading</Label>
              <Input value={form.rentals_title} onChange={set('rentals_title')} placeholder="The rental archive." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Intro text</Label>
              <textarea rows={3} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.rentals_intro} onChange={set('rentals_intro')} placeholder="A rotating selection of signature pieces…" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Bottom CTA</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">CTA heading</Label>
              <Input value={form.rentals_cta_title} onChange={set('rentals_cta_title')} placeholder="Looking for something specific? We can source it." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">CTA button text</Label>
              <Input value={form.rentals_cta_button} onChange={set('rentals_cta_button')} placeholder="Begin a consultation" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Empty State</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message shown when no rentals exist</Label>
              <Input value={form.rentals_empty} onChange={set('rentals_empty')} placeholder="The archive is being refreshed. Please check back shortly." />
            </div>
          </div>
        </div>
      )}

      {!contentQuery.isLoading && (
        <div className="flex justify-end pb-10">
          <Button onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
