'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type RentalStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface RentalProduct {
  id: string;
  name: string;
  description: string | null;
  sizes: string[];
  pricePerDay: string;
  depositAmount: string;
  imageUrls: string[];
  imagePublicIds: string[];
  status: RentalStatus;
  isVisible: boolean;
  sortOrder: number;
}

const STATUSES: RentalStatus[] = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED'];

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

export default function AdminRentalsPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState('');
  const [pricePerDay, setPricePerDay] = useState('0');
  const [depositAmount, setDepositAmount] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');

  const rentalsQuery = useQuery({
    queryKey: ['rentals', 'admin'],
    queryFn: () =>
      apiFetch<PaginatedResponse<RentalProduct>>('/rentals/admin/list?limit=100&page=1&includeHidden=true'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<RentalProduct>('/rentals', {
        method: 'POST',
        body: {
          name,
          description: description.trim() || undefined,
          sizes: sizes
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
          pricePerDay: Number(pricePerDay),
          depositAmount: Number(depositAmount),
          imageUrls: [imageUrl.trim()],
          imagePublicIds: [imagePublicId.trim()],
          status: 'AVAILABLE',
          isVisible: true,
          sortOrder: 0,
        },
      }),
    onSuccess: () => {
      setFeedback('Rental created.');
      setName('');
      setDescription('');
      setSizes('');
      setPricePerDay('0');
      setDepositAmount('0');
      setImageUrl('');
      setImagePublicId('');
      void queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<RentalProduct> }) =>
      apiFetch<RentalProduct>(`/rentals/${id}`, {
        method: 'PUT',
        body,
      }),
    onSuccess: () => {
      setFeedback('Rental updated.');
      void queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const retireMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<RentalProduct>(`/rentals/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      setFeedback('Rental retired.');
      void queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    if (!name.trim() || !sizes.trim() || !imageUrl.trim() || !imagePublicId.trim()) {
      setFeedback('Name, sizes, image URL, and image public ID are required.');
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Rentals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage rental catalogue availability, visibility, and pricing.
        </p>
      </div>

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{feedback}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create rental</CardTitle>
          <CardDescription>Upload first, then paste CDN URLs and public IDs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              placeholder="Sizes (e.g. S,M,L)"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price per day"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value)}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Deposit amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <Input
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Input
              placeholder="Image public ID"
              value={imagePublicId}
              onChange={(e) => setImagePublicId(e.target.value)}
            />
            <div className="md:col-span-2">
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create rental'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue</CardTitle>
          <CardDescription>
            {rentalsQuery.isLoading ? 'Loading…' : `${rentalsQuery.data?.meta.total ?? 0} item(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rentalsQuery.isError ? (
            <p className="px-6 pb-6 text-sm text-destructive">{errorMessage(rentalsQuery.error)}</p>
          ) : rentalsQuery.isLoading ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Loading rentals…</p>
          ) : (rentalsQuery.data?.data.length ?? 0) === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No rentals yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Item</th>
                    <th className="px-6 py-3 font-medium">Pricing</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rentalsQuery.data?.data.map((rental) => {
                    const isBusy =
                      updateMutation.isPending ||
                      (retireMutation.isPending && retireMutation.variables === rental.id);

                    return (
                      <tr key={rental.id}>
                        <td className="px-6 py-3 align-top">
                          <div className="font-medium">{rental.name}</div>
                          <div className="text-xs text-muted-foreground">Sizes: {rental.sizes.join(', ')}</div>
                          <div className="text-xs text-muted-foreground">
                            {rental.isVisible ? 'Visible' : 'Hidden'} · Sort {rental.sortOrder}
                          </div>
                        </td>
                        <td className="px-6 py-3 align-top">
                          ₦{Number(rental.pricePerDay).toLocaleString()} / day
                          <div className="text-xs text-muted-foreground">
                            Deposit: ₦{Number(rental.depositAmount).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-3 align-top">
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-xs"
                            value={rental.status}
                            onChange={(e) =>
                              updateMutation.mutate({
                                id: rental.id,
                                body: { status: e.target.value as RentalStatus },
                              })
                            }
                            disabled={isBusy}
                          >
                            {STATUSES.map((item) => (
                              <option key={item} value={item}>
                                {item.toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                updateMutation.mutate({
                                  id: rental.id,
                                  body: { isVisible: !rental.isVisible },
                                })
                              }
                            >
                              {rental.isVisible ? 'Hide' : 'Show'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy || rental.status === 'RETIRED'}
                              onClick={() => retireMutation.mutate(rental.id)}
                            >
                              Retire
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
