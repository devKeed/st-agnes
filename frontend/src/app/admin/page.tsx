'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Clock, ShoppingBag } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatLagos } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from '@/components/admin/kpi-card';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface BookingSummary {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceType: 'CUSTOM_DESIGN' | 'ALTERATION' | 'RENTAL';
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}

interface RentalSummary {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
  isVisible: boolean;
}

const SERVICE_LABEL: Record<BookingSummary['serviceType'], string> = {
  CUSTOM_DESIGN: 'Custom Design',
  ALTERATION: 'Alteration',
  RENTAL: 'Rental',
};

const STATUS_STYLES: Record<BookingSummary['status'], string> = {
  PENDING: 'bg-amber-100 text-amber-900 border-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-900 border-red-200',
  COMPLETED: 'bg-slate-100 text-slate-900 border-slate-200',
  NO_SHOW: 'bg-orange-100 text-orange-900 border-orange-200',
};

export default function DashboardPage() {
  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'recent'],
    queryFn: () =>
      apiFetch<PaginatedResponse<BookingSummary>>('/bookings?limit=100&page=1'),
  });

  const rentalsQuery = useQuery({
    queryKey: ['rentals', 'admin'],
    queryFn: () =>
      apiFetch<PaginatedResponse<RentalSummary>>('/rentals/admin/list?limit=100&page=1'),
  });

  const bookings = bookingsQuery.data?.data ?? [];
  const totalBookings = bookingsQuery.data?.meta.total ?? 0;

  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const upcomingCount = bookings.filter(
    (b) =>
      b.status === 'CONFIRMED' &&
      new Date(b.startTime).getTime() >= now &&
      new Date(b.startTime).getTime() <= weekFromNow,
  ).length;

  const thisMonthCount = bookings.filter(
    (b) => new Date(b.startTime).getTime() >= startOfMonth.getTime(),
  ).length;

  const activeRentals =
    rentalsQuery.data?.data.filter((r) => r.status === 'AVAILABLE' && r.isVisible).length ?? 0;

  const upcoming = bookings
    .filter((b) => b.status === 'CONFIRMED' && new Date(b.startTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of bookings and rentals across St Agnes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total bookings"
          value={bookingsQuery.isLoading ? null : totalBookings}
          helper="All time"
          icon={CalendarDays}
          loading={bookingsQuery.isLoading}
        />
        <KpiCard
          label="Upcoming (7 days)"
          value={bookingsQuery.isLoading ? null : upcomingCount}
          helper="Confirmed only"
          icon={Clock}
          loading={bookingsQuery.isLoading}
        />
        <KpiCard
          label="This month"
          value={bookingsQuery.isLoading ? null : thisMonthCount}
          helper="Started this month"
          icon={CheckCircle2}
          loading={bookingsQuery.isLoading}
        />
        <KpiCard
          label="Active rentals"
          value={rentalsQuery.isLoading ? null : activeRentals}
          helper="Available & visible"
          icon={ShoppingBag}
          loading={rentalsQuery.isLoading}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Upcoming bookings</CardTitle>
          <Link
            href="/admin/bookings"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          {bookingsQuery.isLoading ? (
            <div className="space-y-3 px-6 pb-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : bookingsQuery.isError ? (
            <p className="px-6 pb-6 text-sm text-destructive">
              Couldn’t load bookings. Check that the backend is running.
            </p>
          ) : upcoming.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No upcoming confirmed bookings.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Client</th>
                    <th className="px-6 py-3 font-medium">Service</th>
                    <th className="px-6 py-3 font-medium">When</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {upcoming.map((b) => (
                    <tr key={b.id}>
                      <td className="px-6 py-3">
                        <div className="font-medium">{b.clientName}</div>
                        <div className="text-xs text-muted-foreground">{b.clientEmail}</div>
                      </td>
                      <td className="px-6 py-3">{SERVICE_LABEL[b.serviceType]}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        {formatLagos(b.startTime)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                        >
                          {b.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
