'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';

function BookingManageForm() {
  const params = useSearchParams();
  const tokenFromUrl = params.get('token') ?? '';
  const referenceFromUrl = params.get('reference') ?? '';

  const [referenceCode, setReferenceCode] = useState(referenceFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [message, setMessage] = useState('');

  async function cancelBooking(e: FormEvent) {
    e.preventDefault();
    setMessage('Cancelling...');
    try {
      await apiPost(`/api/v1/bookings/${referenceCode}/cancel`, { token });
      setMessage('Booking cancelled.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cancellation failed');
    }
  }

  async function rescheduleBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('Rescheduling...');
    const formData = new FormData(e.currentTarget);

    try {
      await apiPost(`/api/v1/bookings/${referenceCode}/reschedule`, {
        token,
        newStartAt: formData.get('newStartAt'),
        newEndAt: formData.get('newEndAt'),
        timezone: 'Africa/Lagos',
      });
      setMessage('Booking rescheduled. Check email for updated management link.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reschedule failed');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Manage Booking</h1>
      <p className="text-sm text-neutral-600">
        Self-service links are single-use, valid until appointment start, and blocked within 24 hours.
      </p>

      <div className="grid gap-2 rounded border bg-white p-4">
        <input
          value={referenceCode}
          onChange={(e) => setReferenceCode(e.target.value)}
          placeholder="Booking reference"
          className="rounded border p-2 text-sm"
        />
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Management token"
          className="rounded border p-2 text-sm"
        />
      </div>

      <form onSubmit={cancelBooking} className="rounded border bg-white p-4">
        <button className="rounded bg-red-700 px-4 py-2 text-sm text-white">Cancel Booking</button>
      </form>

      <form onSubmit={rescheduleBooking} className="space-y-2 rounded border bg-white p-4">
        <input type="datetime-local" name="newStartAt" className="w-full rounded border p-2 text-sm" required />
        <input type="datetime-local" name="newEndAt" className="w-full rounded border p-2 text-sm" required />
        <button className="rounded bg-black px-4 py-2 text-sm text-white">Reschedule Booking</button>
      </form>

      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function BookingManagePage() {
  return (
    <Suspense fallback={<p className="text-sm">Loading booking management...</p>}>
      <BookingManageForm />
    </Suspense>
  );
}
