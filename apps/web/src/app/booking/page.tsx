'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

type Rental = {
  id: string;
  name: string;
};

type ActivePolicies = {
  terms: { id: string; contentMarkdown: string } | null;
  privacy: { id: string; contentMarkdown: string } | null;
};

type AvailabilityResponse = {
  slots: Array<{ startAt: string; endAt: string; available: boolean }>;
};

export default function BookingPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [policies, setPolicies] = useState<ActivePolicies>({ terms: null, privacy: null });
  const [slots, setSlots] = useState<AvailabilityResponse['slots']>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ startAt: string; endAt: string } | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const [rentalData, policyData] = await Promise.all([
        apiGet<Rental[]>('/api/v1/rentals'),
        apiGet<ActivePolicies>('/api/v1/policies/active'),
      ]);
      setRentals(rentalData);
      setPolicies(policyData);
    })();
  }, []);

  const canFetchAvailability = selectedItems.length > 0;

  async function loadAvailability() {
    if (!canFetchAvailability) return;
    const now = new Date();
    const dateFrom = now.toISOString();
    const dateTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const query = new URLSearchParams({
      dateFrom,
      dateTo,
      timezone: 'Africa/Lagos',
    });
    selectedItems.forEach((id) => query.append('rentalItemIds', id));

    const data = await apiGet<AvailabilityResponse>(`/api/v1/availability?${query.toString()}`);
    setSlots(data.slots.filter((slot) => slot.available).slice(0, 20));
  }

  const slotOptions = useMemo(() => slots.map((slot) => ({ label: new Date(slot.startAt).toLocaleString(), ...slot })), [slots]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('Submitting...');

    const formData = new FormData(e.currentTarget);
    if (!selectedSlot) {
      setMessage('Select a time slot first.');
      return;
    }

    try {
      const payload = {
        serviceType: formData.get('serviceType'),
        clientName: formData.get('clientName'),
        clientEmail: formData.get('clientEmail'),
        clientPhone: formData.get('clientPhone'),
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        timezone: 'Africa/Lagos',
        rentalItemIds: selectedItems,
        notes: formData.get('notes'),
        specialRequests: formData.get('specialRequests'),
        acceptTerms: formData.get('acceptTerms') === 'on',
        acceptPrivacy: formData.get('acceptPrivacy') === 'on',
      };

      const response = await apiPost<{ booking: { referenceCode: string } }>('/api/v1/bookings', payload);
      setMessage(`Booking created. Reference: ${response.booking.referenceCode}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Booking failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Book Appointment</h1>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">1) Select Rental Items (max 5)</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {rentals.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={(e) => {
                  setSelectedItems((prev) => {
                    if (e.target.checked) {
                      if (prev.length >= 5) return prev;
                      return [...prev, item.id];
                    }
                    return prev.filter((id) => id !== item.id);
                  });
                }}
              />
              {item.name}
            </label>
          ))}
        </div>
        <button onClick={loadAvailability} className="mt-3 rounded bg-black px-3 py-2 text-xs text-white">
          Check Availability
        </button>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">2) Select Time Slot</h2>
        <div className="mt-2 grid gap-2">
          {slotOptions.map((slot) => (
            <button
              key={slot.startAt}
              type="button"
              onClick={() => setSelectedSlot({ startAt: slot.startAt, endAt: slot.endAt })}
              className={`rounded border px-3 py-2 text-left text-sm ${selectedSlot?.startAt === slot.startAt ? 'border-black' : 'border-neutral-300'}`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={submit} className="space-y-3 rounded border bg-white p-4">
        <h2 className="font-semibold">3) Client Details</h2>
        <input name="clientName" placeholder="Full name" required className="w-full rounded border p-2 text-sm" />
        <input name="clientEmail" type="email" placeholder="Email" required className="w-full rounded border p-2 text-sm" />
        <input name="clientPhone" placeholder="Phone" required className="w-full rounded border p-2 text-sm" />
        <select name="serviceType" className="w-full rounded border p-2 text-sm" defaultValue="RENTAL_FITTING">
          <option value="CUSTOM_DESIGN">Custom Design</option>
          <option value="ALTERATION">Alterations</option>
          <option value="RENTAL_FITTING">Rental Fitting</option>
        </select>
        <textarea name="notes" placeholder="Notes" className="w-full rounded border p-2 text-sm" />
        <textarea name="specialRequests" placeholder="Special requests" className="w-full rounded border p-2 text-sm" />

        <label className="flex items-start gap-2 text-xs">
          <input type="checkbox" name="acceptTerms" required />
          <span>I accept Terms (current version required).</span>
        </label>
        <label className="flex items-start gap-2 text-xs">
          <input type="checkbox" name="acceptPrivacy" required />
          <span>I accept Privacy Policy (current version required).</span>
        </label>

        <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">
          Submit Booking
        </button>
      </form>

      <p className="text-sm text-neutral-700">{message}</p>

      <section className="rounded border bg-white p-4 text-xs text-neutral-700">
        <h3 className="font-semibold">Active Policy Snapshot</h3>
        <p className="mt-2">Terms version loaded: {policies.terms ? 'Yes' : 'No'}</p>
        <p>Privacy version loaded: {policies.privacy ? 'Yes' : 'No'}</p>
      </section>
    </div>
  );
}
