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
type Form = {
  service_custom_design_title: string; service_custom_design_description: string;
  service_alteration_title: string; service_alteration_description: string;
  service_rental_title: string; service_rental_description: string;
};
const EMPTY: Form = {
  service_custom_design_title: '', service_custom_design_description: '',
  service_alteration_title: '', service_alteration_description: '',
  service_rental_title: '', service_rental_description: '',
};
function err(e: unknown) { return e instanceof Error ? e.message : 'Request failed.'; }

const SERVICES = [
  { key: 'custom_design' as const, label: 'Custom Design', placeholder: { title: 'Custom Design', desc: 'Bespoke pieces crafted to your event, silhouette, and personality.' } },
  { key: 'alteration' as const, label: 'Alteration', placeholder: { title: 'Alteration', desc: 'Precision tailoring and fit correction for existing outfits.' } },
  { key: 'rental' as const, label: 'Rental', placeholder: { title: 'Rental', desc: 'Curated luxury rentals for weddings, red carpets, and special events.' } },
];

export default function ServicesContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState<Form>(EMPTY);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contentQuery = useQuery({ queryKey: ['content', 'admin'], queryFn: () => apiFetch<SiteContent[]>('/content') });

  useEffect(() => {
    if (!contentQuery.data) return;
    const v = (key: string) => contentQuery.data.find((r) => r.pageKey === key)?.value ?? '';
    const next: Form = {
      service_custom_design_title: v('service_custom_design_title'), service_custom_design_description: v('service_custom_design_description'),
      service_alteration_title: v('service_alteration_title'), service_alteration_description: v('service_alteration_description'),
      service_rental_title: v('service_rental_title'), service_rental_description: v('service_rental_description'),
    };
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [contentQuery.data]);

  const isDirty = initialRef.current !== JSON.stringify(form);
  useUnsavedChanges(isDirty);
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: () => Promise.all(
      (Object.entries(form) as [keyof Form, string][]).map(([key, value]) =>
        apiFetch(`/content/${encodeURIComponent(key)}`, { method: 'PUT', body: { value, contentType: key.endsWith('_description') ? 'RICHTEXT' : 'TEXT' } })
      )
    ),
    onSuccess: () => {
      initialRef.current = JSON.stringify(form);
      void queryClient.invalidateQueries({ queryKey: ['content'] });
      setFeedback({ type: 'success', text: 'Services content saved.' });
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
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Services</h1>
            {isDirty && <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Service names and descriptions shown on the Home and About pages.</p>
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

      {contentQuery.isLoading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-4">
          {SERVICES.map(({ key, label, placeholder }, index) => (
            <div key={key} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-muted-foreground">0{index + 1}</span>
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</h2>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service name</Label>
                <Input value={form[`service_${key}_title` as keyof Form]} onChange={set(`service_${key}_title` as keyof Form)} placeholder={placeholder.title} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</Label>
                <textarea rows={2} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form[`service_${key}_description` as keyof Form]} onChange={set(`service_${key}_description` as keyof Form)} placeholder={placeholder.desc} />
              </div>
            </div>
          ))}
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
