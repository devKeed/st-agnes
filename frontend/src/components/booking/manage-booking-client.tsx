'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatLagos, getBookingCodeFromToken } from '@/lib/utils';
import {
  cancelBookingByToken,
  getBookingByToken,
  rescheduleBookingByToken,
} from '@/lib/public-api';

interface ManageBookingClientProps {
  token: string;
}

export function ManageBookingClient({ token }: ManageBookingClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<{
    id: string;
    status: string;
    startTime: string;
    endTime: string;
    serviceType: string;
  } | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const bookingCode = useMemo(() => getBookingCodeFromToken(token), [token]);

  async function loadBooking() {
    setError(null);
    setLoading(true);
    try {
      const res = await getBookingByToken(token);
      setBooking(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load booking.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function cancelBooking() {
    const shouldCancel = window.confirm(
      'Are you sure you want to cancel this booking? This action cannot be undone.',
    );
    if (!shouldCancel) return;

    setError(null);
    setLoading(true);
    try {
      await cancelBookingByToken(token);
      await loadBooking();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel booking.');
      setLoading(false);
    }
  }

  async function rescheduleBooking() {
    if (!newDate || !newTime) {
      setError('Select a new date and time first.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const startTime = new Date(`${newDate}T${newTime}:00+01:00`).toISOString();
      await rescheduleBookingByToken(token, startTime);
      await loadBooking();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reschedule booking.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={loadBooking} disabled={loading}>
          {loading ? 'Please wait...' : 'Load booking details'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {booking ? (
        <div className="space-y-3 rounded-xl border p-5">
          <p className="text-sm">
            <span className="font-medium">Booking code:</span>{' '}
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs tracking-wider text-foreground">{bookingCode}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium">Status:</span> {booking.status}
          </p>
          <p className="text-sm">
            <span className="font-medium">Service:</span> {booking.serviceType}
          </p>
          <p className="text-sm">
            <span className="font-medium">{booking.serviceType === 'RENTAL' ? 'Pickup:' : 'Start:'}</span>{' '}
            {formatLagos(booking.startTime)}
          </p>
          <p className="text-sm">
            <span className="font-medium">{booking.serviceType === 'RENTAL' ? 'Return:' : 'End:'}</span>{' '}
            {formatLagos(booking.endTime)}
          </p>

          {booking.serviceType === 'RENTAL' ? (
            <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-muted-foreground">
              No online payment. Rental fee and refundable deposit are collected at studio pickup.
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={rescheduleBooking} disabled={loading}>
              Reschedule
            </Button>
            <Button variant="destructive" onClick={cancelBooking} disabled={loading || booking.status === 'CANCELLED'}>
              Cancel booking
            </Button>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-muted-foreground">
        Looking for a different booking?{' '}
        <Link href="/booking/recover" className="underline underline-offset-2 hover:text-foreground">
          Find my booking
        </Link>
      </p>
    </div>
  );
}
