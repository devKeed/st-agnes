'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createBooking,
  getActiveTerms,
  getMonthAvailability,
  getPublicRentals,
  type AvailabilityDay,
  type CreateBookingPayload,
  type RentalRow,
} from '@/lib/public-api';
import { services } from '@/lib/public-data';

const STEP_LABELS = ['Service', 'Date & Time', 'Details', 'Review'] as const;
type ServiceKey = 'CUSTOM_DESIGN' | 'ALTERATION' | 'RENTAL';

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(value: string, delta: number) {
  const [year, month] = value.split('-').map(Number);
  const moved = new Date(year, month - 1 + delta, 1);
  return `${moved.getFullYear()}-${String(moved.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface CalendarCell {
  date: string;
  dayNumber: number;
  isAvailable: boolean;
  isToday: boolean;
}

function buildCalendarCells(monthValue: string, availableDates: Set<string>) {
  const [year, month] = monthValue.split('-').map(Number);
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = firstDayOfMonth.getDay();
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells: Array<CalendarCell | null> = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      date,
      dayNumber: day,
      isAvailable: availableDates.has(date),
      isToday: date === todayString,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

interface BookingWizardProps {
  rentals: RentalRow[];
  initialService?: ServiceKey;
  initialRentalId?: string;
  initialRentalSize?: string;
}

export function BookingWizard({
  rentals,
  initialService,
  initialRentalId,
  initialRentalSize,
}: BookingWizardProps) {
  const router = useRouter();
  const minStep = initialService === 'RENTAL' && initialRentalId ? 1 : 0;
  const [step, setStep] = useState(minStep);
  const [service, setService] = useState<ServiceKey>(initialService ?? services[0].key);
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedRentals, setSelectedRentals] = useState<string[]>(
    initialRentalId ? [initialRentalId] : [],
  );
  const [selectedRentalSizes, setSelectedRentalSizes] = useState<Record<string, string>>(() =>
    initialRentalId && initialRentalSize ? { [initialRentalId]: initialRentalSize } : {},
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rentalsWithAvailability, setRentalsWithAvailability] = useState<RentalRow[]>(rentals);

  // Re-fetch rentals with availability counts whenever the user picks a time slot
  useEffect(() => {
    if (service !== 'RENTAL' || !time) {
      setRentalsWithAvailability(rentals);
      return;
    }
    let active = true;
    async function fetchAvailability() {
      try {
        const result = await getPublicRentals(time);
        if (active) setRentalsWithAvailability(result.data);
      } catch {
        // keep showing base list on error
      }
    }
    void fetchAvailability();
    return () => {
      active = false;
    };
  }, [service, time, rentals]);

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      setAvailabilityLoading(true);
      setAvailabilityError(null);

      try {
        const result = await getMonthAvailability(month, service);
        if (!active) return;

        const days = result.available_slots ?? [];
        setAvailabilityDays(days);

        const hasSelectedDate = days.some((d) => d.date === date);
        if (!hasSelectedDate) {
          const firstDay = days[0]?.date ?? '';
          setDate(firstDay);
          setTime('');
        }
      } catch (e) {
        if (!active) return;
        setAvailabilityDays([]);
        setDate('');
        setTime('');
        setAvailabilityError(e instanceof Error ? e.message : 'Could not load availability.');
      } finally {
        if (active) setAvailabilityLoading(false);
      }
    }

    void loadAvailability();

    return () => {
      active = false;
    };
  }, [month, service]);

  const selectedDay = useMemo(
    () => availabilityDays.find((day) => day.date === date),
    [availabilityDays, date],
  );

  const availableDates = useMemo(
    () => new Set(availabilityDays.map((day) => day.date)),
    [availabilityDays],
  );

  const calendarCells = useMemo(
    () => buildCalendarCells(month, availableDates),
    [month, availableDates],
  );

  useEffect(() => {
    const validSlots = selectedDay?.slots ?? [];
    const exists = validSlots.some((slot) => slot.start === time);
    if (!exists) setTime('');
  }, [selectedDay, time]);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(service);
    if (step === 1) {
      if (!date || !time) return false;
      if (service === 'RENTAL') {
        if (selectedRentals.length === 0) return false;
        return selectedRentals.every((id) => {
          const rental = rentalsWithAvailability.find((item) => item.id === id);
          if (!rental || rental.sizes.length === 0) return true;
          return Boolean(selectedRentalSizes[id]);
        });
      }
      return true;
    }
    if (step === 2) return Boolean(name && email);
    if (step === 3) return termsAccepted;
    return false;
  }, [step, service, date, time, selectedRentals, selectedRentalSizes, rentalsWithAvailability, name, email, termsAccepted]);

  function getDefaultSize(id: string) {
    const rental = rentalsWithAvailability.find((item) => item.id === id);
    return rental?.sizes[0] ?? '';
  }

  function addRental(id: string) {
    if (selectedRentals.includes(id)) return;
    const defaultSize = getDefaultSize(id);
    setSelectedRentals((prev) => [...prev, id]);
    if (defaultSize) {
      setSelectedRentalSizes((prev) => ({ ...prev, [id]: defaultSize }));
    }
  }

  function removeRental(id: string) {
    setSelectedRentals((prev) => prev.filter((x) => x !== id));
    setSelectedRentalSizes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function selectRentalSize(id: string, size: string) {
    setSelectedRentalSizes((prev) => ({ ...prev, [id]: size }));
  }

  async function submitBooking() {
    setError(null);
    setSubmitting(true);

    try {
      const terms = await getActiveTerms();

      const payload: CreateBookingPayload = {
        clientName: name,
        clientEmail: email,
        clientPhone: phone || undefined,
        serviceType: service,
        startTime: time,
        notes: notes || undefined,
        specialRequests: notes || undefined,
        termsAccepted,
        termsVersionId: terms.id,
        rentalItems:
          service === 'RENTAL'
            ? selectedRentals.map((rentalProductId) => ({
                rentalProductId,
                selectedSize: selectedRentalSizes[rentalProductId] || undefined,
              }))
            : undefined,
      };

      const response = await createBooking(payload);
      router.push(
        `/booking/confirm?manageToken=${encodeURIComponent(response.manageToken)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="fade-up overflow-hidden border border-border/80 bg-gradient-to-b from-white to-stone-50/80 shadow-[0_24px_70px_-40px_rgba(26,26,26,0.45)] backdrop-blur">
      <CardHeader>
        <div className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300/70 bg-white px-3 py-1 text-xs text-stone-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Bespoke studio booking
          </div>
          <CardTitle className="text-2xl">Book your St Agnes experience</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
          </CardDescription>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          {STEP_LABELS.map((item, index) => (
            <div
              key={item}
              className={`rounded-xl border px-3 py-2 text-xs transition-all ${
                index === step
                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                  : index < step
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-stone-200 bg-white text-stone-500'
              }`}
            >
              {index < step ? '✓ ' : ''}
              {item}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {services.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setService(item.key as ServiceKey)}
                className={`group rounded-2xl border p-4 text-left transition-all ${
                  service === item.key
                    ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                    : 'border-stone-200 bg-white/90 hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-md'
                }`}
              >
                <p className="font-medium">{item.title}</p>
                <p className={`mt-1 text-sm ${service === item.key ? 'text-stone-200' : 'text-muted-foreground'}`}>
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-white/90 p-4 shadow-sm backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonth((prev) => shiftMonth(prev, -1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:border-stone-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <p className="text-sm font-medium text-stone-800">{formatMonthLabel(month)}</p>
                <button
                  type="button"
                  onClick={() => setMonth((prev) => shiftMonth(prev, 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:border-stone-400"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wide text-stone-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                  <div key={weekday} className="py-1">
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {availabilityLoading ? (
                  <div className="col-span-7 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Loading slots...
                  </div>
                ) : (
                  calendarCells.map((cell, index) =>
                    !cell ? (
                      <div key={`empty-${index}`} className="h-11 rounded-lg bg-stone-50/70" />
                    ) : (
                      <button
                        key={cell.date}
                        type="button"
                        onClick={() => setDate(cell.date)}
                        disabled={!cell.isAvailable}
                        className={`h-11 rounded-lg border text-sm transition-colors ${
                          date === cell.date
                            ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                            : cell.isAvailable
                              ? 'border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
                              : 'cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300'
                        }`}
                      >
                        <span className={`${cell.isToday && cell.isAvailable ? 'font-semibold underline' : ''}`}>
                          {cell.dayNumber}
                        </span>
                      </button>
                    ),
                  )
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-stone-900" /> Selected
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-stone-300" /> Unavailable
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available times</Label>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/80 bg-white/90 p-3 md:grid-cols-5">
                {!date ? (
                  <p className="col-span-full text-sm text-muted-foreground">Choose a date first.</p>
                ) : (selectedDay?.slots.length ?? 0) === 0 ? (
                  <p className="col-span-full text-sm text-muted-foreground">No available times for this day.</p>
                ) : (
                  selectedDay?.slots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setTime(slot.start)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        time === slot.start
                          ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {formatTimeLabel(slot.start)}
                    </button>
                  ))
                )}
              </div>
            </div>

            {availabilityError ? <p className="text-sm text-red-600">{availabilityError}</p> : null}

            {date && time ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Selected slot: <span className="font-medium">{formatDateLabel(date)} at {formatTimeLabel(time)}</span>
              </div>
            ) : null}

            {service === 'RENTAL' && (
              <div className="md:col-span-2">
                <Label className="mb-2 block">Select rental items</Label>
                <p className="mb-3 text-xs text-muted-foreground">
                  Add or remove pieces as needed.
                </p>

                {selectedRentals.length > 0 ? (
                  <div className="mb-3 rounded-xl border border-border/70 bg-stone-50/70 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-stone-600">Selected pieces</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRentals.map((id) => {
                        const rental = rentalsWithAvailability.find((item) => item.id === id);
                        const label = rental?.name ?? id;
                        const size = selectedRentalSizes[id];

                        return (
                          <div
                            key={id}
                            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs"
                          >
                            <span className="font-medium">{label}</span>
                            {size ? <span className="text-muted-foreground">({size})</span> : null}
                            <button
                              type="button"
                              onClick={() => removeRental(id)}
                              className="text-[11px] text-stone-600 hover:text-stone-900"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2 md:grid-cols-2">
                  {rentalsWithAvailability.map((item) => {
                    const isFullyBooked = item.availableCount !== undefined && item.availableCount === 0;
                    const isSelected = selectedRentals.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 text-left text-sm transition-all ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : isFullyBooked
                              ? 'border-stone-100 bg-stone-50 opacity-60'
                              : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <p className={`mt-1 text-xs ${isSelected ? 'text-stone-200' : 'text-muted-foreground'}`}>
                              ₦{Number(item.pricePerDay).toLocaleString()} / day
                            </p>
                            {item.availableCount !== undefined && item.quantity !== undefined && !isSelected ? (
                              <p className={`mt-0.5 text-[10px] ${isFullyBooked ? 'text-red-500' : 'text-emerald-600'}`}>
                                {isFullyBooked
                                  ? 'Fully booked for this slot'
                                  : `${item.availableCount} of ${item.quantity} available`}
                              </p>
                            ) : null}
                          </div>

                          {isSelected ? (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-white/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-stone-200">
                                Selected
                              </span>
                              <button
                                type="button"
                                onClick={() => removeRental(item.id)}
                                className="rounded-md border border-stone-400 px-2 py-1 text-[11px] text-stone-200 hover:border-stone-200"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => !isFullyBooked && addRental(item.id)}
                              disabled={isFullyBooked}
                              className={`rounded-md border px-2 py-1 text-[11px] ${
                                isFullyBooked
                                  ? 'cursor-not-allowed border-stone-200 text-stone-400'
                                  : 'border-stone-300 text-stone-700 hover:border-stone-500'
                              }`}
                            >
                              {isFullyBooked ? 'Unavailable' : 'Add piece'}
                            </button>
                          )}
                        </div>

                        {isSelected && item.sizes.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-300">Select size</p>
                            <select
                              value={selectedRentalSizes[item.id] ?? ''}
                              onChange={(e) => selectRentalSize(item.id, e.target.value)}
                              className="h-9 w-full rounded-md border border-stone-300 bg-white px-2 text-xs text-stone-900"
                            >
                              {item.sizes.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 rounded-2xl border border-border/80 bg-white/90 p-4 md:grid-cols-2">
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
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any style direction, fit notes, or requests"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 rounded-2xl border border-border/80 bg-white/90 p-5 text-sm shadow-sm">
            <p className="flex items-center gap-2 text-stone-800">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Service:</span> {service}
            </p>
            <p className="flex items-center gap-2 text-stone-800">
              <CalendarClock className="h-4 w-4" />
              <span className="font-medium">Date/Time:</span>{' '}
              {date ? formatDateLabel(date) : '—'} {time ? formatTimeLabel(time) : '—'}
            </p>
            <p className="flex items-center gap-2 text-stone-800">
              <UserRound className="h-4 w-4" />
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
                {selectedRentals.length > 0
                  ? selectedRentals
                      .map((id) => {
                        const rental = rentals.find((item) => item.id === id);
                        const size = selectedRentalSizes[id];
                        const label = rental?.name ?? id;
                        return size ? `${label} (${size})` : label;
                      })
                      .join(', ')
                  : 'None selected'}
              </p>
            )}
            <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
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
            onClick={() => setStep((s) => Math.max(minStep, s - 1))}
            disabled={step === minStep}
          >
            Back
          </Button>

          {step < STEP_LABELS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
              disabled={!canContinue}
              className="shadow-[0_12px_28px_-18px_rgba(0,0,0,0.8)]"
            >
              Continue
            </Button>
          ) : (
            <Button onClick={submitBooking} disabled={!canContinue || submitting} className="shadow-[0_12px_28px_-18px_rgba(0,0,0,0.8)]">
              {submitting ? 'Submitting...' : 'Confirm booking'}
            </Button>
          )}
        </div>

        {step === STEP_LABELS.length - 1 && !error ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Your booking includes a secure manage link for rescheduling and cancellation.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
