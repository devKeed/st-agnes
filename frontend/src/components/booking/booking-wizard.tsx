'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createBooking,
  getActiveTerms,
  type CreateBookingPayload,
  type RentalRow,
} from '@/lib/public-api';
import { services } from '@/lib/public-data';

const STEP_LABELS = ['Service', 'Date & Time', 'Details', 'Review'] as const;
type ServiceKey = 'CUSTOM_DESIGN' | 'ALTERATION' | 'RENTAL';

interface BookingWizardProps {
  rentals: RentalRow[];
}

export function BookingWizard({ rentals }: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceKey>(services[0].key);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedRentals, setSelectedRentals] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(service);
    if (step === 1) {
      if (!date || !time) return false;
      if (service === 'RENTAL') return selectedRentals.length > 0;
      return true;
    }
    if (step === 2) return Boolean(name && email);
    if (step === 3) return termsAccepted;
    return false;
  }, [step, service, date, time, selectedRentals, name, email, termsAccepted]);

  function toggleRental(id: string) {
    setSelectedRentals((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submitBooking() {
    setError(null);
    setSubmitting(true);

    try {
      const terms = await getActiveTerms();
      const startTime = new Date(`${date}T${time}:00+01:00`).toISOString();

      const payload: CreateBookingPayload = {
        clientName: name,
        clientEmail: email,
        clientPhone: phone || undefined,
        serviceType: service,
        startTime,
        notes: notes || undefined,
        specialRequests: notes || undefined,
        termsAccepted,
        termsVersionId: terms.id,
        rentalItems:
          service === 'RENTAL'
            ? selectedRentals.map((rentalProductId) => ({ rentalProductId }))
            : undefined,
      };

      const response = await createBooking(payload);
      router.push(
        `/booking/confirm?manageToken=${encodeURIComponent(response.manageToken)}&manageUrl=${encodeURIComponent(response.manageUrl)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Wizard</CardTitle>
        <CardDescription>
          Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {services.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setService(item.key)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  service === item.key
                    ? 'border-foreground bg-foreground/5'
                    : 'hover:border-foreground/50'
                }`}
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Preferred date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Preferred time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>

            {service === 'RENTAL' && (
              <div className="md:col-span-2">
                <Label className="mb-2 block">Select rental items</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {rentals.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleRental(item.id)}
                      className={`rounded-md border p-3 text-left text-sm ${
                        selectedRentals.includes(item.id)
                          ? 'border-foreground bg-foreground/5'
                          : 'hover:border-foreground/50'
                      }`}
                    >
                      <span className="font-medium">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
            <p>
              <span className="font-medium">Service:</span> {service}
            </p>
            <p>
              <span className="font-medium">Date/Time:</span> {date || '—'} {time || '—'}
            </p>
            <p>
              <span className="font-medium">Client:</span> {name || '—'} ({email || '—'})
            </p>
            <p>
              <span className="font-medium">Phone:</span> {phone || '—'}
            </p>
            <p>
              <span className="font-medium">Notes:</span> {notes || '—'}
            </p>
            {service === 'RENTAL' && (
              <p>
                <span className="font-medium">Rental items:</span>{' '}
                {selectedRentals.length > 0 ? selectedRentals.join(', ') : 'None selected'}
              </p>
            )}
            <label className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span className="text-muted-foreground">I accept the current terms and conditions.</span>
            </label>
            {error ? <p className="pt-1 text-sm text-red-600">{error}</p> : null}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>

          {step < STEP_LABELS.length - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))} disabled={!canContinue}>
              Continue
            </Button>
          ) : (
            <Button onClick={submitBooking} disabled={!canContinue || submitting}>
              {submitting ? 'Submitting...' : 'Confirm booking'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
