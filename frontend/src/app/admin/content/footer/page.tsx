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
  // Newsletter
  footer_newsletter_eyebrow: string; footer_newsletter_title: string; footer_newsletter_body: string;
  // Studio info
  footer_studio_eyebrow: string; footer_studio_hours: string; footer_studio_city: string; footer_studio_email: string;
  // Social
  footer_social_instagram: string; footer_social_youtube: string; footer_social_tiktok: string;
  // Copyright
  footer_copyright_name: string; footer_tagline: string;
  // Contact (also used in emails)
  contact_email: string; contact_phone: string; instagram_handle: string;
};

const EMPTY: Form = {
  footer_newsletter_eyebrow: '', footer_newsletter_title: '', footer_newsletter_body: '',
  footer_studio_eyebrow: '', footer_studio_hours: '', footer_studio_city: '', footer_studio_email: '',
  footer_social_instagram: '', footer_social_youtube: '', footer_social_tiktok: '',
  footer_copyright_name: '', footer_tagline: '',
  contact_email: '', contact_phone: '', instagram_handle: '',
};

function err(e: unknown) { return e instanceof Error ? e.message : 'Request failed.'; }

const CT = (key: string): string => key.endsWith('_body') ? 'RICHTEXT' : 'TEXT';

export default function FooterContentPage() {
  const queryClient = useQueryClient();
  const initialRef = useRef('');
  const [form, setForm] = useState<Form>(EMPTY);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contentQuery = useQuery({ queryKey: ['content', 'admin'], queryFn: () => apiFetch<SiteContent[]>('/content') });

  useEffect(() => {
    if (!contentQuery.data) return;
    const v = (key: string) => contentQuery.data.find((r) => r.pageKey === key)?.value ?? '';
    const next: Form = {
      footer_newsletter_eyebrow: v('footer_newsletter_eyebrow'), footer_newsletter_title: v('footer_newsletter_title'), footer_newsletter_body: v('footer_newsletter_body'),
      footer_studio_eyebrow: v('footer_studio_eyebrow'), footer_studio_hours: v('footer_studio_hours'), footer_studio_city: v('footer_studio_city'), footer_studio_email: v('footer_studio_email'),
      footer_social_instagram: v('footer_social_instagram'), footer_social_youtube: v('footer_social_youtube'), footer_social_tiktok: v('footer_social_tiktok'),
      footer_copyright_name: v('footer_copyright_name'), footer_tagline: v('footer_tagline'),
      contact_email: v('contact_email'), contact_phone: v('contact_phone'), instagram_handle: v('instagram_handle'),
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
        apiFetch(`/content/${encodeURIComponent(key)}`, { method: 'PUT', body: { value, contentType: CT(key) } })
      )
    ),
    onSuccess: () => {
      initialRef.current = JSON.stringify(form);
      void queryClient.invalidateQueries({ queryKey: ['content'] });
      setFeedback({ type: 'success', text: 'Footer & contact content saved.' });
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
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Footer & Contact</h1>
            {isDirty && <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Newsletter copy, studio info, social links, and contact details used across the site.</p>
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
        <div className="space-y-4">{[1,2,3,4].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Contact Details</h2>
            <p className="text-xs text-muted-foreground">Used in booking confirmation emails and the contact area of the site.</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Studio email</Label>
              <Input type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="hello@stagnes.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone number</Label>
              <Input type="tel" value={form.contact_phone} onChange={set('contact_phone')} placeholder="+234 800 000 0000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Instagram handle</Label>
              <Input value={form.instagram_handle} onChange={set('instagram_handle')} placeholder="@stagnes" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Studio Info (Footer)</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Studio section label</Label>
              <Input value={form.footer_studio_eyebrow} onChange={set('footer_studio_eyebrow')} placeholder="Studio" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hours / availability</Label>
                <Input value={form.footer_studio_hours} onChange={set('footer_studio_hours')} placeholder="By appointment only" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">City</Label>
                <Input value={form.footer_studio_city} onChange={set('footer_studio_city')} placeholder="Lagos, Nigeria" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Footer email address</Label>
              <Input type="email" value={form.footer_studio_email} onChange={set('footer_studio_email')} placeholder="studio@stagnes.com" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Social Links</h2>
            <p className="text-xs text-muted-foreground">Paste the full profile URL for each platform. Leave blank to hide the icon in the footer.</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Instagram URL</Label>
              <Input type="url" value={form.footer_social_instagram} onChange={set('footer_social_instagram')} placeholder="https://instagram.com/stagnes" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">YouTube URL</Label>
              <Input type="url" value={form.footer_social_youtube} onChange={set('footer_social_youtube')} placeholder="https://youtube.com/@stagnes" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">TikTok URL</Label>
              <Input type="url" value={form.footer_social_tiktok} onChange={set('footer_social_tiktok')} placeholder="https://tiktok.com/@stagnes" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Newsletter Block</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Section label</Label>
              <Input value={form.footer_newsletter_eyebrow} onChange={set('footer_newsletter_eyebrow')} placeholder="Correspondence" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Heading</Label>
              <Input value={form.footer_newsletter_title} onChange={set('footer_newsletter_title')} placeholder="Letters from the atelier." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Body text</Label>
              <textarea rows={3} className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.footer_newsletter_body} onChange={set('footer_newsletter_body')} placeholder="Occasional dispatches — new collections, studio stories…" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Copyright & Tagline</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand name (copyright)</Label>
                <Input value={form.footer_copyright_name} onChange={set('footer_copyright_name')} placeholder="St Agnes Atelier" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Footer tagline</Label>
                <Input value={form.footer_tagline} onChange={set('footer_tagline')} placeholder="Made with care" />
              </div>
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
