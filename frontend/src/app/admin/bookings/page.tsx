'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { formatLagos } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

type ServiceType = 'CUSTOM_DESIGN' | 'ALTERATION' | 'RENTAL';
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

interface RentalProductLite {
  id: string;
  name: string;
}

interface BookingItem {
  id: string;
  selectedSize: string | null;
  rentalProduct: RentalProductLite;
}

interface BookingSummary {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceType: ServiceType;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  bookingItems: BookingItem[];
}

const SERVICE_LABEL: Record<ServiceType, string> = {
  CUSTOM_DESIGN: 'Custom Design',
  ALTERATION: 'Alteration',
  RENTAL: 'Rental',
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-900 border-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-900 border-red-200',
  COMPLETED: 'bg-slate-100 text-slate-900 border-slate-200',
  NO_SHOW: 'bg-orange-100 text-orange-900 border-orange-200',
};

const STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
const SERVICES: Array<ServiceType | 'ALL'> = ['ALL', 'CUSTOM_DESIGN', 'ALTERATION', 'RENTAL'];

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [serviceType, setServiceType] = useState<ServiceType | 'ALL'>('ALL');
  const [statusDraft, setStatusDraft] = useState<Record<string, BookingStatus>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'admin', search, status, serviceType],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'ALL') params.set('status', status);
      if (serviceType !== 'ALL') params.set('serviceType', serviceType);
      return apiFetch<PaginatedResponse<BookingSummary>>(`/bookings?${params.toString()}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: BookingStatus }) =>
      apiFetch<BookingSummary>(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      }),
    onSuccess: (_, vars) => {
      setFeedback('Booking status updated.');
      setStatusDraft((current) => {
        const next = { ...current };
        delete next[vars.id];
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const bookings = bookingsQuery.data?.data ?? [];

  const rows = useMemo(
    () =>
      bookings.map((booking) => ({
        booking,
        selectedStatus: statusDraft[booking.id] ?? booking.status,
      })),
    [bookings, statusDraft],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View appointments and update booking states.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search by client name/email, service, or status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Search name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType | 'ALL')}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {SERVICES.map((item) => (
                <option key={item} value={item}>
                  {item === 'ALL' ? 'All services' : SERVICE_LABEL[item]}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus | 'ALL')}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="ALL">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{feedback}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All bookings</CardTitle>
          <CardDescription>
            {bookingsQuery.isLoading
              ? 'Loading…'
              : `${bookingsQuery.data?.meta.total ?? 0} result(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {bookingsQuery.isError ? (
            <p className="px-6 pb-6 text-sm text-destructive">{errorMessage(bookingsQuery.error)}</p>
          ) : bookingsQuery.isLoading ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Loading bookings…</p>
          ) : rows.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Client</th>
                    <th className="px-6 py-3 font-medium">Service</th>
                    <th className="px-6 py-3 font-medium">When</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map(({ booking, selectedStatus }) => {
                    const isSaving =
                      updateStatusMutation.isPending &&
                      updateStatusMutation.variables?.id === booking.id;
                    const changed = selectedStatus !== booking.status;

                    return (
                      <tr key={booking.id}>
                        <td className="px-6 py-3 align-top">
                          <div className="font-medium">{booking.clientName}</div>
                          <div className="text-xs text-muted-foreground">{booking.clientEmail}</div>
                          {booking.bookingItems.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {booking.bookingItems
                                .map((item) =>
                                  item.selectedSize
                                    ? `${item.rentalProduct.name} (${item.selectedSize})`
                                    : item.rentalProduct.name,
                                )
                                .join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3">{SERVICE_LABEL[booking.serviceType]}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{formatLagos(booking.startTime)}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[booking.status]}`}
                          >
                            {booking.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex min-w-48 items-center gap-2">
                            <select
                              value={selectedStatus}
                              onChange={(e) =>
                                setStatusDraft((current) => ({
                                  ...current,
                                  [booking.id]: e.target.value as BookingStatus,
                                }))
                              }
                              className="h-9 rounded-md border bg-background px-2 text-xs"
                            >
                              {STATUSES.map((item) => (
                                <option key={item} value={item}>
                                  {item.toLowerCase()}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              disabled={!changed || isSaving}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: booking.id,
                                  nextStatus: selectedStatus,
                                })
                              }
                            >
                              {isSaving ? 'Saving…' : 'Save'}
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
