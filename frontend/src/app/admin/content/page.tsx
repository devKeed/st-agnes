'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ContentType = 'TEXT' | 'RICHTEXT' | 'IMAGE' | 'VIDEO';

interface SiteContent {
  id: string;
  pageKey: string;
  contentType: ContentType;
  value: string;
  updatedAt: string;
}

const CONTENT_TYPES: ContentType[] = ['TEXT', 'RICHTEXT', 'IMAGE', 'VIDEO'];

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

export default function AdminContentPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState<ContentType>('TEXT');
  const [newValue, setNewValue] = useState('');

  const contentQuery = useQuery({
    queryKey: ['content', 'admin'],
    queryFn: () => apiFetch<SiteContent[]>('/content'),
  });

  const rows = contentQuery.data ?? [];
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});
  const [typeDrafts, setTypeDrafts] = useState<Record<string, ContentType>>({});

  useEffect(() => {
    if (!rows.length) return;
    setValueDrafts(
      rows.reduce<Record<string, string>>((acc, row) => {
        acc[row.pageKey] = row.value;
        return acc;
      }, {}),
    );
    setTypeDrafts(
      rows.reduce<Record<string, ContentType>>((acc, row) => {
        acc[row.pageKey] = row.contentType;
        return acc;
      }, {}),
    );
  }, [rows]);

  const upsertMutation = useMutation({
    mutationFn: ({ key, value, contentType }: { key: string; value: string; contentType: ContentType }) =>
      apiFetch<SiteContent>(`/content/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: { value, contentType },
      }),
    onSuccess: () => {
      setFeedback('Content saved.');
      void queryClient.invalidateQueries({ queryKey: ['content'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.pageKey.localeCompare(b.pageKey)), [rows]);

  function createOrUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    if (!newKey.trim() || !newValue.trim()) {
      setFeedback('Key and value are required.');
      return;
    }

    upsertMutation.mutate({
      key: newKey.trim(),
      value: newValue,
      contentType: newType,
    });

    setNewKey('');
    setNewValue('');
    setNewType('TEXT');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage keyed site copy and media references used across the website.
        </p>
      </div>

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{feedback}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create or upsert key</CardTitle>
          <CardDescription>Use a stable key (e.g. homepage_hero_title).</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={createOrUpdate}>
            <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="pageKey" />
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={newType}
              onChange={(e) => setNewType(e.target.value as ContentType)}
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving…' : 'Save key'}
            </Button>
            <div className="md:col-span-3">
              <textarea
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing content</CardTitle>
          <CardDescription>
            {contentQuery.isLoading ? 'Loading…' : `${sortedRows.length} key(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contentQuery.isError ? (
            <p className="text-sm text-destructive">{errorMessage(contentQuery.error)}</p>
          ) : contentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading content…</p>
          ) : sortedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No content keys found.</p>
          ) : (
            sortedRows.map((row) => {
              const draftValue = valueDrafts[row.pageKey] ?? row.value;
              const draftType = typeDrafts[row.pageKey] ?? row.contentType;
              const changed = draftValue !== row.value || draftType !== row.contentType;

              return (
                <div key={row.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{row.pageKey}</p>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-xs"
                        value={draftType}
                        onChange={(e) =>
                          setTypeDrafts((current) => ({
                            ...current,
                            [row.pageKey]: e.target.value as ContentType,
                          }))
                        }
                      >
                        {CONTENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={!changed || upsertMutation.isPending}
                        onClick={() =>
                          upsertMutation.mutate({
                            key: row.pageKey,
                            value: draftValue,
                            contentType: draftType,
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={draftValue}
                    onChange={(e) =>
                      setValueDrafts((current) => ({
                        ...current,
                        [row.pageKey]: e.target.value,
                      }))
                    }
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
