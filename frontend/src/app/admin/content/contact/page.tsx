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

export default function ContactContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState({ contact_email: '', contact_phone: '', instagram_handle: '' });
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
      contact_email: getValue('contact_email'),
      contact_phone: getValue('contact_phone'),
      instagram_handle: getValue('instagram_handle'),
    };
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [contentQuery.data]);

  const isDirty = initialRef.current !== JSON.stringify(form);
  useUnsavedChanges(isDirty);

  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all([
        apiFetch(`/content/contact_email`, { method: 'PUT', body: { value: form.contact_email, contentType: 'TEXT' } }),
        apiFetch(`/content/contact_phone`, { method: 'PUT', body: { value: form.contact_phone, contentType: 'TEXT' } }),
        apiFetch(`/content/instagram_handle`, { method: 'PUT', body: { value: form.instagram_handle, contentType: 'TEXT' } }),
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
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Contact Details</h1>
            {isDirty && (
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Studio email, phone number, and Instagram handle shown across the site.
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
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
        </div>
      )}

      {/* Form */}
      {!contentQuery.isLoading && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Contact Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="contact_email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email address
            </Label>
            <Input
              id="contact_email"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
              placeholder="hello@stagnes.co"
            />
            <p className="text-xs text-muted-foreground">Shown on the contact page and used in booking confirmation emails.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact_phone" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Phone number
            </Label>
            <Input
              id="contact_phone"
              type="tel"
              value={form.contact_phone}
              onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))}
              placeholder="+234 800 000 0000"
            />
            <p className="text-xs text-muted-foreground">Shown on the contact page.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instagram_handle" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Instagram handle
            </Label>
            <Input
              id="instagram_handle"
              value={form.instagram_handle}
              onChange={(e) => setForm((p) => ({ ...p, instagram_handle: e.target.value }))}
              placeholder="@stagnes"
            />
            <p className="text-xs text-muted-foreground">Your brand&apos;s Instagram handle (e.g. @stagnes).</p>
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
