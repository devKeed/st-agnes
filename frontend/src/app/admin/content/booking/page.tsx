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
type Form = { booking_eyebrow: string; booking_title: string; booking_intro: string; };
const EMPTY: Form = { booking_eyebrow: '', booking_title: '', booking_intro: '' };
function err(e: unknown) { return e instanceof Error ? e.message : 'Request failed.'; }

export default function BookingContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState<Form>(EMPTY);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contentQuery = useQuery({ queryKey: ['content', 'admin'], queryFn: () => apiFetch<SiteContent[]>('/content') });

  useEffect(() => {
    if (!contentQuery.data) return;
    const v = (key: string) => contentQuery.data.find((r) => r.pageKey === key)?.value ?? '';
    const next: Form = { booking_eyebrow: v('booking_eyebrow'), booking_title: v('booking_title'), booking_intro: v('booking_intro') };
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [contentQuery.data]);

  const isDirty = initialRef.current !== JSON.stringify(form);
  useUnsavedChanges(isDirty);
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: () => Promise.all([
      apiFetch('/content/booking_eyebrow', { method: 'PUT', body: { value: form.booking_eyebrow, contentType: 'TEXT' } }),
      apiFetch('/content/booking_title', { method: 'PUT', body: { value: form.booking_title, contentType: 'TEXT' } }),
      apiFetch('/content/booking_intro', { method: 'PUT', body: { value: form.booking_intro, contentType: 'RICHTEXT' } }),
    ]),
    onSuccess: () => {
      initialRef.current = JSON.stringify(form);
      void queryClient.invalidateQueries({ queryKey: ['content'] });
      setFeedback({ type: 'success', text: 'Booking page content saved.' });
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
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Booking Page</h1>
            {isDirty && <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Heading and introductory text shown on the booking page.</p>
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

      {contentQuery.isLoading ? <div className="h-48 animate-pulse rounded-xl bg-muted" /> : (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Page Header</h2>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Eyebrow label</Label>
            <Input value={form.booking_eyebrow} onChange={set('booking_eyebrow')} placeholder="Concierge — Booking" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Page heading</Label>
            <Input value={form.booking_title} onChange={set('booking_title')} placeholder="A private appointment." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Intro text</Label>
            <textarea rows={3} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.booking_intro} onChange={set('booking_intro')} placeholder="Choose your service, pick from real-time open slots…" />
            <p className="text-xs text-muted-foreground">Shown above the booking form to set expectations for the process.</p>
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
