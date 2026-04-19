'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

  async function cancelBooking() {
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
            <span className="font-medium">Status:</span> {booking.status}
          </p>
          <p className="text-sm">
            <span className="font-medium">Service:</span> {booking.serviceType}
          </p>
          <p className="text-sm">
            <span className="font-medium">Start:</span> {new Date(booking.startTime).toLocaleString()}
          </p>
          <p className="text-sm">
            <span className="font-medium">End:</span> {new Date(booking.endTime).toLocaleString()}
          </p>

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
    </div>
  );
}
