'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch, apiUploadImage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface SiteContent { id: string; pageKey: string; contentType: string; value: string; updatedAt: string; }

type Form = {
  about_hero_eyebrow: string; about_title: string; about_hero_image: string;
  about_body: string; about_philosophy_eyebrow: string; about_philosophy_body: string;
  about_services_eyebrow: string; about_services_title: string; about_services_cta: string;
  about_process_eyebrow: string; about_process_title: string;
  about_process_1_title: string; about_process_1_body: string;
  about_process_2_title: string; about_process_2_body: string;
  about_process_3_title: string; about_process_3_body: string;
  about_process_4_title: string; about_process_4_body: string;
  about_cta_title: string; about_cta_primary: string; about_cta_secondary: string;
};

const EMPTY: Form = {
  about_hero_eyebrow: '', about_title: '', about_hero_image: '',
  about_body: '', about_philosophy_eyebrow: '', about_philosophy_body: '',
  about_services_eyebrow: '', about_services_title: '', about_services_cta: '',
  about_process_eyebrow: '', about_process_title: '',
  about_process_1_title: '', about_process_1_body: '',
  about_process_2_title: '', about_process_2_body: '',
  about_process_3_title: '', about_process_3_body: '',
  about_process_4_title: '', about_process_4_body: '',
  about_cta_title: '', about_cta_primary: '', about_cta_secondary: '',
};

function err(e: unknown) { return e instanceof Error ? e.message : 'Request failed.'; }
function isValidUrl(v: string) { try { new URL(v); return true; } catch { return false; } }

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

export default function AboutContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState<Form>(EMPTY);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);

  const contentQuery = useQuery({ queryKey: ['content', 'admin'], queryFn: () => apiFetch<SiteContent[]>('/content') });

  useEffect(() => {
    if (!contentQuery.data) return;
    const v = (key: string) => contentQuery.data.find((r) => r.pageKey === key)?.value ?? '';
    const next: Form = {
      about_hero_eyebrow: v('about_hero_eyebrow'), about_title: v('about_title'), about_hero_image: v('about_hero_image'),
      about_body: v('about_body'), about_philosophy_eyebrow: v('about_philosophy_eyebrow'), about_philosophy_body: v('about_philosophy_body'),
      about_services_eyebrow: v('about_services_eyebrow'), about_services_title: v('about_services_title'), about_services_cta: v('about_services_cta'),
      about_process_eyebrow: v('about_process_eyebrow'), about_process_title: v('about_process_title'),
      about_process_1_title: v('about_process_1_title'), about_process_1_body: v('about_process_1_body'),
      about_process_2_title: v('about_process_2_title'), about_process_2_body: v('about_process_2_body'),
      about_process_3_title: v('about_process_3_title'), about_process_3_body: v('about_process_3_body'),
      about_process_4_title: v('about_process_4_title'), about_process_4_body: v('about_process_4_body'),
      about_cta_title: v('about_cta_title'), about_cta_primary: v('about_cta_primary'), about_cta_secondary: v('about_cta_secondary'),
    };
    setForm(next);
    initialRef.current = JSON.stringify(next);
  }, [contentQuery.data]);

  const isDirty = initialRef.current !== JSON.stringify(form);
  useUnsavedChanges(isDirty);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        (Object.entries(form) as [keyof Form, string][]).map(([key, value]) =>
          apiFetch(`/content/${encodeURIComponent(key)}`, {
            method: 'PUT',
            body: { value, contentType: key.endsWith('_image') ? 'IMAGE' : key.endsWith('_body') ? 'RICHTEXT' : 'TEXT' },
          }),
        ),
      ),
    onSuccess: () => {
      initialRef.current = JSON.stringify(form);
      void queryClient.invalidateQueries({ queryKey: ['content'] });
      setFeedback({ type: 'success', text: 'About page content saved.' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error) => setFeedback({ type: 'error', text: err(error) }),
  });

  async function onUploadHeroImage(file: File | null) {
    if (!file) return;
    setFeedback(null);
    setIsUploadingHeroImage(true);
    try {
      const uploaded = await apiUploadImage(file, 'st-agnes/content');
      setForm((p) => ({ ...p, about_hero_image: uploaded.url }));
      setFeedback({ type: 'success', text: 'Image uploaded successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', text: err(error) });
    } finally {
      setIsUploadingHeroImage(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">← Content</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">About Page</h1>
            {isDirty && <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Philosophy, process steps, services section, and CTA.</p>
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
        <div className="space-y-4">{[1,2,3,4].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-6">
          <Card title="Page Hero">
            <FieldRow label="Eyebrow label"><Input value={form.about_hero_eyebrow} onChange={set('about_hero_eyebrow')} placeholder="The Atelier" /></FieldRow>
            <FieldRow label="Main heading" hint="The large title in the hero banner.">
              <Input value={form.about_title} onChange={set('about_title')} placeholder="Craftsmanship, with intent." />
            </FieldRow>
            <FieldRow label="Hero background image URL">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void onUploadHeroImage(e.target.files?.[0] ?? null)}
                  disabled={isUploadingHeroImage}
                />
                <p className="text-xs text-muted-foreground">
                  Upload image from device (auto-fills URL) or paste a URL manually.
                </p>
                <Input type="url" value={form.about_hero_image} onChange={set('about_hero_image')} placeholder="https://…" />
                {form.about_hero_image && isValidUrl(form.about_hero_image) && (
                  <div className="overflow-hidden rounded-md border bg-muted" style={{ height: 100 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.about_hero_image} alt="Preview" className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </FieldRow>
          </Card>

          <Card title="Philosophy Section (01)">
            <FieldRow label="Section label"><Input value={form.about_philosophy_eyebrow} onChange={set('about_philosophy_eyebrow')} placeholder="01 — Philosophy" /></FieldRow>
            <FieldRow label="Large intro text" hint="This is the prominent quote displayed in the intro section.">
              <textarea rows={4} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.about_body} onChange={set('about_body')} placeholder="St Agnes is an atelier for those who value…" />
            </FieldRow>
            <FieldRow label="Secondary body text">
              <textarea rows={3} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.about_philosophy_body} onChange={set('about_philosophy_body')} placeholder="Founded on the belief that clothing should hold meaning…" />
            </FieldRow>
          </Card>

          <Card title="Services Section (02)">
            <FieldRow label="Section label"><Input value={form.about_services_eyebrow} onChange={set('about_services_eyebrow')} placeholder="02 — Services" /></FieldRow>
            <FieldRow label="Section heading"><Input value={form.about_services_title} onChange={set('about_services_title')} placeholder="Three disciplines, one standard." /></FieldRow>
            <FieldRow label="Service CTA button text" hint="Button shown on each service card.">
              <Input value={form.about_services_cta} onChange={set('about_services_cta')} placeholder="Begin" />
            </FieldRow>
            <p className="text-xs text-muted-foreground">To edit service titles and descriptions, go to <Link href="/admin/content/services" className="underline hover:text-foreground">Services</Link>.</p>
          </Card>

          <Card title="Process Section (03)">
            <FieldRow label="Section label"><Input value={form.about_process_eyebrow} onChange={set('about_process_eyebrow')} placeholder="03 — Process" /></FieldRow>
            <FieldRow label="Section heading"><Input value={form.about_process_title} onChange={set('about_process_title')} placeholder="From first thread to final fitting." /></FieldRow>
            {([1, 2, 3, 4] as const).map((n) => (
              <div key={n} className="space-y-3 rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Step {n}</p>
                <FieldRow label="Step title">
                  <Input value={form[`about_process_${n}_title` as keyof Form]} onChange={set(`about_process_${n}_title` as keyof Form)}
                    placeholder={['Consultation', 'Sketch & Selection', 'Atelier', 'Handover'][n - 1]} />
                </FieldRow>
                <FieldRow label="Step description">
                  <textarea rows={2} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form[`about_process_${n}_body` as keyof Form]} onChange={set(`about_process_${n}_body` as keyof Form)} placeholder="Describe this step…" />
                </FieldRow>
              </div>
            ))}
          </Card>

          <Card title="Bottom CTA">
            <FieldRow label="Heading"><Input value={form.about_cta_title} onChange={set('about_cta_title')} placeholder="Ready to begin your piece?" /></FieldRow>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="Primary button"><Input value={form.about_cta_primary} onChange={set('about_cta_primary')} placeholder="Schedule a consultation" /></FieldRow>
              <FieldRow label="Secondary link"><Input value={form.about_cta_secondary} onChange={set('about_cta_secondary')} placeholder="See our work" /></FieldRow>
            </div>
          </Card>
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
