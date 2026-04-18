'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type GalleryCategory = 'COLLECTION' | 'MUSE';

interface GalleryItem {
  id: string;
  category: GalleryCategory;
  title: string;
  description: string | null;
  imageUrl: string;
  imagePublicId: string | null;
  sortOrder: number;
  isVisible: boolean;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

export default function AdminGalleryPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const [category, setCategory] = useState<GalleryCategory>('COLLECTION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');

  const galleryQuery = useQuery({
    queryKey: ['gallery', 'admin'],
    queryFn: () => apiFetch<GalleryItem[]>('/gallery/admin/list?includeHidden=true'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<GalleryItem>('/gallery', {
        method: 'POST',
        body: {
          category,
          title,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim(),
          imagePublicId: imagePublicId.trim() || undefined,
          isVisible: true,
          sortOrder: 0,
        },
      }),
    onSuccess: () => {
      setFeedback('Gallery item created.');
      setTitle('');
      setDescription('');
      setImageUrl('');
      setImagePublicId('');
      void queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<GalleryItem> }) =>
      apiFetch<GalleryItem>(`/gallery/${id}`, {
        method: 'PUT',
        body,
      }),
    onSuccess: () => {
      setFeedback('Gallery item updated.');
      void queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/gallery/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      setFeedback('Gallery item deleted.');
      void queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    if (!title.trim() || !imageUrl.trim()) {
      setFeedback('Title and image URL are required.');
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Gallery</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curate collection and muse images shown on the website.
        </p>
      </div>

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{feedback}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add item</CardTitle>
          <CardDescription>Add a gallery image and optional Cloudinary public ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GalleryCategory)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="COLLECTION">Collection</option>
              <option value="MUSE">Muse</option>
            </select>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Input
              placeholder="Image public ID (optional)"
              value={imagePublicId}
              onChange={(e) => setImagePublicId(e.target.value)}
            />
            <div className="md:col-span-2">
              <textarea
                rows={3}
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create item'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {galleryQuery.isLoading ? 'Loading…' : `${galleryQuery.data?.length ?? 0} item(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {galleryQuery.isError ? (
            <p className="px-6 pb-6 text-sm text-destructive">{errorMessage(galleryQuery.error)}</p>
          ) : galleryQuery.isLoading ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Loading gallery…</p>
          ) : (galleryQuery.data?.length ?? 0) === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No gallery items yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Visibility</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {galleryQuery.data?.map((item) => {
                    const deleting = deleteMutation.isPending && deleteMutation.variables === item.id;

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-3 align-top">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">Sort {item.sortOrder}</div>
                        </td>
                        <td className="px-6 py-3 align-top">{item.category.toLowerCase()}</td>
                        <td className="px-6 py-3 align-top">{item.isVisible ? 'Visible' : 'Hidden'}</td>
                        <td className="px-6 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateMutation.mutate({
                                  id: item.id,
                                  body: { isVisible: !item.isVisible },
                                })
                              }
                            >
                              {item.isVisible ? 'Hide' : 'Show'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={deleting}
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              {deleting ? 'Deleting…' : 'Delete'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
