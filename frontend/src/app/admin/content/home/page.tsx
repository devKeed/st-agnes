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
  // Hero Banner
  home_hero_eyebrow: string; hero_title: string; hero_subtitle: string;
  home_hero_cta_primary: string; home_hero_cta_secondary: string; home_hero_image: string;
  // Intro
  home_intro_eyebrow: string; home_intro_title: string; home_intro_body: string; home_intro_cta: string;
  // Signature Edit
  home_signature_eyebrow: string; home_signature_title: string; home_signature_body: string; home_signature_cta: string;
  // Philosophy & Stats
  home_philosophy_eyebrow: string; home_philosophy_title: string; home_philosophy_body: string; home_philosophy_image: string;
  home_stat_1_number: string; home_stat_1_label: string;
  home_stat_2_number: string; home_stat_2_label: string;
  home_stat_3_number: string; home_stat_3_label: string;
  // Services section labels
  home_services_eyebrow: string; home_services_title: string;
  // Press logos
  home_press_logos: string;
  // Journal
  home_journal_eyebrow: string; home_journal_title: string; home_journal_cta: string;
  home_story_1_tag: string; home_story_1_date: string; home_story_1_title: string; home_story_1_excerpt: string; home_story_1_image: string;
  home_story_2_tag: string; home_story_2_date: string; home_story_2_title: string; home_story_2_excerpt: string; home_story_2_image: string;
  home_story_3_tag: string; home_story_3_date: string; home_story_3_title: string; home_story_3_excerpt: string; home_story_3_image: string;
  // CTA
  home_cta_eyebrow: string; home_cta_title: string; home_cta_body: string; home_cta_button: string; home_cta_image: string;
};

const EMPTY_FORM: Form = {
  home_hero_eyebrow: '', hero_title: '', hero_subtitle: '',
  home_hero_cta_primary: '', home_hero_cta_secondary: '', home_hero_image: '',
  home_intro_eyebrow: '', home_intro_title: '', home_intro_body: '', home_intro_cta: '',
  home_signature_eyebrow: '', home_signature_title: '', home_signature_body: '', home_signature_cta: '',
  home_philosophy_eyebrow: '', home_philosophy_title: '', home_philosophy_body: '', home_philosophy_image: '',
  home_stat_1_number: '', home_stat_1_label: '', home_stat_2_number: '', home_stat_2_label: '', home_stat_3_number: '', home_stat_3_label: '',
  home_services_eyebrow: '', home_services_title: '',
  home_press_logos: '',
  home_journal_eyebrow: '', home_journal_title: '', home_journal_cta: '',
  home_story_1_tag: '', home_story_1_date: '', home_story_1_title: '', home_story_1_excerpt: '', home_story_1_image: '',
  home_story_2_tag: '', home_story_2_date: '', home_story_2_title: '', home_story_2_excerpt: '', home_story_2_image: '',
  home_story_3_tag: '', home_story_3_date: '', home_story_3_title: '', home_story_3_excerpt: '', home_story_3_image: '',
  home_cta_eyebrow: '', home_cta_title: '', home_cta_body: '', home_cta_button: '', home_cta_image: '',
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

export default function HomeContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingField, setUploadingField] = useState<keyof Form | null>(null);

  const contentQuery = useQuery({
    queryKey: ['content', 'admin'],
    queryFn: () => apiFetch<SiteContent[]>('/content'),
  });

  useEffect(() => {
    if (!contentQuery.data) return;
    const v = (key: string) => contentQuery.data.find((r) => r.pageKey === key)?.value ?? '';
    const next: Form = {
      home_hero_eyebrow: v('home_hero_eyebrow'), hero_title: v('hero_title'), hero_subtitle: v('hero_subtitle'),
      home_hero_cta_primary: v('home_hero_cta_primary'), home_hero_cta_secondary: v('home_hero_cta_secondary'), home_hero_image: v('home_hero_image'),
      home_intro_eyebrow: v('home_intro_eyebrow'), home_intro_title: v('home_intro_title'), home_intro_body: v('home_intro_body'), home_intro_cta: v('home_intro_cta'),
      home_signature_eyebrow: v('home_signature_eyebrow'), home_signature_title: v('home_signature_title'), home_signature_body: v('home_signature_body'), home_signature_cta: v('home_signature_cta'),
      home_philosophy_eyebrow: v('home_philosophy_eyebrow'), home_philosophy_title: v('home_philosophy_title'), home_philosophy_body: v('home_philosophy_body'), home_philosophy_image: v('home_philosophy_image'),
      home_stat_1_number: v('home_stat_1_number'), home_stat_1_label: v('home_stat_1_label'),
      home_stat_2_number: v('home_stat_2_number'), home_stat_2_label: v('home_stat_2_label'),
      home_stat_3_number: v('home_stat_3_number'), home_stat_3_label: v('home_stat_3_label'),
      home_services_eyebrow: v('home_services_eyebrow'), home_services_title: v('home_services_title'),
      home_press_logos: v('home_press_logos'),
      home_journal_eyebrow: v('home_journal_eyebrow'), home_journal_title: v('home_journal_title'), home_journal_cta: v('home_journal_cta'),
      home_story_1_tag: v('home_story_1_tag'), home_story_1_date: v('home_story_1_date'), home_story_1_title: v('home_story_1_title'), home_story_1_excerpt: v('home_story_1_excerpt'), home_story_1_image: v('home_story_1_image'),
      home_story_2_tag: v('home_story_2_tag'), home_story_2_date: v('home_story_2_date'), home_story_2_title: v('home_story_2_title'), home_story_2_excerpt: v('home_story_2_excerpt'), home_story_2_image: v('home_story_2_image'),
      home_story_3_tag: v('home_story_3_tag'), home_story_3_date: v('home_story_3_date'), home_story_3_title: v('home_story_3_title'), home_story_3_excerpt: v('home_story_3_excerpt'), home_story_3_image: v('home_story_3_image'),
      home_cta_eyebrow: v('home_cta_eyebrow'), home_cta_title: v('home_cta_title'), home_cta_body: v('home_cta_body'), home_cta_button: v('home_cta_button'), home_cta_image: v('home_cta_image'),
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
            body: { value, contentType: key.endsWith('_image') ? 'IMAGE' : key.endsWith('_body') || key.endsWith('_excerpt') ? 'RICHTEXT' : 'TEXT' },
          }),
        ),
      ),
    onSuccess: () => {
      initialRef.current = JSON.stringify(form);
      void queryClient.invalidateQueries({ queryKey: ['content'] });
      setFeedback({ type: 'success', text: 'Home page content saved.' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error) => setFeedback({ type: 'error', text: errorMessage(error) }),
  });

  const handleSave = () => saveMutation.mutate();

  async function onUploadImage(fieldKey: keyof Form, file: File | null) {
    if (!file) return;
    setFeedback(null);
    setUploadingField(fieldKey);
    try {
      const uploaded = await apiUploadImage(file, 'st-agnes/content');
      setForm((p) => ({ ...p, [fieldKey]: uploaded.url }));
      setFeedback({ type: 'success', text: 'Image uploaded successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', text: errorMessage(error) });
    } finally {
      setUploadingField(null);
    }
  }

  const ImageInput = ({ fieldKey }: { fieldKey: keyof Form }) => (
    <div className="space-y-2">
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => void onUploadImage(fieldKey, e.target.files?.[0] ?? null)}
        disabled={uploadingField === fieldKey}
      />
      <p className="text-xs text-muted-foreground">
        Upload image from device (auto-fills URL) or paste a URL manually.
      </p>
      <Input type="url" value={form[fieldKey]} onChange={set(fieldKey)} placeholder="https://…" />
      {form[fieldKey] && isValidUrl(form[fieldKey]) && (
        <div className="overflow-hidden rounded-md border bg-muted" style={{ height: 100 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form[fieldKey]} alt="Preview" className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        ← Content
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Home Page</h1>
            {isDirty && <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">All text and images shown on the homepage.</p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
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
        <div className="space-y-4">{[1,2,3,4,5].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-6">

          <SectionCard title="Hero Banner">
            <FieldRow label="Eyebrow text" hint="Small label above the main heading (e.g. season name).">
              <Input value={form.home_hero_eyebrow} onChange={set('home_hero_eyebrow')} placeholder="Spring / Summer 2026 Edit" />
            </FieldRow>
            <FieldRow label="Main heading" hint="The large hero title. Keep it short and impactful.">
              <Input value={form.hero_title} onChange={set('hero_title')} placeholder="Elegance, unhurried." />
            </FieldRow>
            <FieldRow label="Subtitle" hint="One or two sentences below the heading.">
              <textarea rows={3} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.hero_subtitle} onChange={set('hero_subtitle')} placeholder="An atelier of bespoke design…" />
            </FieldRow>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="Primary CTA button">
                <Input value={form.home_hero_cta_primary} onChange={set('home_hero_cta_primary')} placeholder="Explore the edit" />
              </FieldRow>
              <FieldRow label="Secondary CTA button">
                <Input value={form.home_hero_cta_secondary} onChange={set('home_hero_cta_secondary')} placeholder="Book a fitting" />
              </FieldRow>
            </div>
            <FieldRow label="Hero background image URL">
              <ImageInput fieldKey="home_hero_image" />
            </FieldRow>
          </SectionCard>

          <SectionCard title="Intro Section (01 — The House)">
            <FieldRow label="Section label"><Input value={form.home_intro_eyebrow} onChange={set('home_intro_eyebrow')} placeholder="01 — The House" /></FieldRow>
            <FieldRow label="Heading"><Input value={form.home_intro_title} onChange={set('home_intro_title')} placeholder="A house built on considered craft…" /></FieldRow>
            <FieldRow label="Body text">
              <textarea rows={4} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.home_intro_body} onChange={set('home_intro_body')} placeholder="St Agnes is an atelier for those who…" />
            </FieldRow>
            <FieldRow label="Link text"><Input value={form.home_intro_cta} onChange={set('home_intro_cta')} placeholder="Discover the house" /></FieldRow>
          </SectionCard>

          <SectionCard title="Signature Edit Section (02)">
            <FieldRow label="Section label"><Input value={form.home_signature_eyebrow} onChange={set('home_signature_eyebrow')} placeholder="02 — Signature Edit" /></FieldRow>
            <FieldRow label="Collection title"><Input value={form.home_signature_title} onChange={set('home_signature_title')} placeholder="Playground '24 Collection" /></FieldRow>
            <FieldRow label="Collection description"><Input value={form.home_signature_body} onChange={set('home_signature_body')} placeholder="Seven sculpted pieces…" /></FieldRow>
            <FieldRow label="CTA button text"><Input value={form.home_signature_cta} onChange={set('home_signature_cta')} placeholder="Shop the archive" /></FieldRow>
          </SectionCard>

          <SectionCard title="Philosophy Section (03)">
            <FieldRow label="Section label"><Input value={form.home_philosophy_eyebrow} onChange={set('home_philosophy_eyebrow')} placeholder="03 — Philosophy" /></FieldRow>
            <FieldRow label="Heading"><Input value={form.home_philosophy_title} onChange={set('home_philosophy_title')} placeholder="Every piece begins as a conversation." /></FieldRow>
            <FieldRow label="Body text">
              <textarea rows={4} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.home_philosophy_body} onChange={set('home_philosophy_body')} placeholder="We believe the most memorable garments…" />
            </FieldRow>
            <FieldRow label="Section image URL">
              <ImageInput fieldKey="home_philosophy_image" />
            </FieldRow>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Stats</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {([1, 2, 3] as const).map((n) => (
                  <div key={n} className="space-y-2 rounded-lg border p-3">
                    <Input value={form[`home_stat_${n}_number` as keyof Form]} onChange={set(`home_stat_${n}_number` as keyof Form)} placeholder="12+" />
                    <Input value={form[`home_stat_${n}_label` as keyof Form]} onChange={set(`home_stat_${n}_label` as keyof Form)} placeholder="Years of craft" />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Services Section (04)">
            <FieldRow label="Section label"><Input value={form.home_services_eyebrow} onChange={set('home_services_eyebrow')} placeholder="04 — Services" /></FieldRow>
            <FieldRow label="Section heading"><Input value={form.home_services_title} onChange={set('home_services_title')} placeholder="Three ways to work with the house." /></FieldRow>
            <p className="text-xs text-muted-foreground">To edit service titles and descriptions, go to <Link href="/admin/content/services" className="underline hover:text-foreground">Services</Link>.</p>
          </SectionCard>

          <SectionCard title="Press Logos Marquee">
            <FieldRow label="Publication names" hint="Comma-separated list. These scroll across the marquee strip.">
              <Input value={form.home_press_logos} onChange={set('home_press_logos')} placeholder="Vogue, Harper's Bazaar, Elle, Allure…" />
            </FieldRow>
          </SectionCard>

          <SectionCard title="Journal Section (05)">
            <FieldRow label="Section label"><Input value={form.home_journal_eyebrow} onChange={set('home_journal_eyebrow')} placeholder="05 — Journal" /></FieldRow>
            <FieldRow label="Section heading"><Input value={form.home_journal_title} onChange={set('home_journal_title')} placeholder="St Agnes Stories" /></FieldRow>
            <FieldRow label="View all link text"><Input value={form.home_journal_cta} onChange={set('home_journal_cta')} placeholder="View all entries" /></FieldRow>
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="space-y-3 rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Story {n}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldRow label="Tag"><Input value={form[`home_story_${n}_tag` as keyof Form]} onChange={set(`home_story_${n}_tag` as keyof Form)} placeholder="Campaign" /></FieldRow>
                  <FieldRow label="Date"><Input value={form[`home_story_${n}_date` as keyof Form]} onChange={set(`home_story_${n}_date` as keyof Form)} placeholder="March 2026" /></FieldRow>
                </div>
                <FieldRow label="Title"><Input value={form[`home_story_${n}_title` as keyof Form]} onChange={set(`home_story_${n}_title` as keyof Form)} placeholder="Story title" /></FieldRow>
                <FieldRow label="Excerpt">
                  <textarea rows={2} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form[`home_story_${n}_excerpt` as keyof Form]} onChange={set(`home_story_${n}_excerpt` as keyof Form)} placeholder="Short description…" />
                </FieldRow>
                <FieldRow label="Image URL">
                  <ImageInput fieldKey={`home_story_${n}_image` as keyof Form} />
                </FieldRow>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Bottom CTA Section (06)">
            <FieldRow label="Section label"><Input value={form.home_cta_eyebrow} onChange={set('home_cta_eyebrow')} placeholder="06 — By Appointment" /></FieldRow>
            <FieldRow label="Heading"><Input value={form.home_cta_title} onChange={set('home_cta_title')} placeholder="Step inside the atelier…" /></FieldRow>
            <FieldRow label="Body text">
              <textarea rows={3} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.home_cta_body} onChange={set('home_cta_body')} placeholder="Book a private consultation…" />
            </FieldRow>
            <FieldRow label="CTA button text"><Input value={form.home_cta_button} onChange={set('home_cta_button')} placeholder="Schedule a consultation" /></FieldRow>
            <FieldRow label="Background image URL">
              <ImageInput fieldKey="home_cta_image" />
            </FieldRow>
          </SectionCard>

        </div>
      )}

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
