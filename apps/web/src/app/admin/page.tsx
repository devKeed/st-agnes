'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type Booking = {
  id: string;
  referenceCode: string;
  clientName: string;
  clientEmail: string;
  status: string;
  startAtUtc: string;
};

export default function AdminDashboardPage() {
  const [token, setToken] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('adminAccessToken') || '';
    setToken(stored);
  }, []);

  async function loadBookings() {
    if (!token) {
      setMessage('Login first at /admin/login');
      return;
    }

    const response = await fetch(`${API_BASE}/api/v1/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setMessage('Unable to load bookings');
      return;
    }
    const data = await response.json();
    setBookings(data);
  }

  async function createPolicyVersion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const response = await fetch(`${API_BASE}/api/v1/policies/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: formData.get('type'),
        contentMarkdown: formData.get('contentMarkdown'),
        activate: true,
      }),
    });

    if (!response.ok) {
      setMessage('Policy update failed');
      return;
    }

    setMessage('Policy version created and activated');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <button onClick={loadBookings} className="rounded bg-black px-4 py-2 text-sm text-white">
        Load Bookings
      </button>
      <p className="text-sm">{message}</p>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Bookings</h2>
        <div className="mt-2 space-y-2 text-sm">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded border p-2">
              <p>{booking.referenceCode}</p>
              <p>{booking.clientName} ({booking.clientEmail})</p>
              <p>{booking.status}</p>
              <p>{new Date(booking.startAtUtc).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Update Terms/Privacy</h2>
        <form onSubmit={createPolicyVersion} className="mt-2 space-y-2">
          <select name="type" className="w-full rounded border p-2 text-sm" defaultValue="TERMS">
            <option value="TERMS">Terms</option>
            <option value="PRIVACY">Privacy</option>
          </select>
          <textarea
            name="contentMarkdown"
            className="h-32 w-full rounded border p-2 text-sm"
            placeholder="New policy markdown content"
            required
          />
          <button className="rounded bg-black px-4 py-2 text-sm text-white">Publish New Version</button>
        </form>
      </section>
    </div>
  );
}
