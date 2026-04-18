'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rentalItems, services } from '@/lib/public-data';

const STEP_LABELS = ['Service', 'Date & Time', 'Details', 'Review'] as const;

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<string>(services[0].key);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRentals, setSelectedRentals] = useState<string[]>([]);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(service);
    if (step === 1) return Boolean(date && time);
    if (step === 2) return Boolean(name && email);
    return true;
  }, [step, service, date, time, name, email]);

  function toggleRental(id: string) {
    setSelectedRentals((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
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
                  {rentalItems.map((item) => (
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
            {service === 'RENTAL' && (
              <p>
                <span className="font-medium">Rental items:</span>{' '}
                {selectedRentals.length > 0 ? selectedRentals.join(', ') : 'None selected'}
              </p>
            )}
            <p className="pt-2 text-muted-foreground">
              This is a UI flow scaffold. Next step is wiring submission to the backend booking endpoint.
            </p>
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
            <Button asChild>
              <a href="/booking/confirm">Confirm booking</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
