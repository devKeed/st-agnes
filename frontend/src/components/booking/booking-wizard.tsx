'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
  const [returnDate, setReturnDate] = useState('');
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
  const [rentalOptions, setRentalOptions] = useState<RentalRow[]>(rentals);
  const [rentalAvailabilityLoading, setRentalAvailabilityLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleServiceSelect(nextService: ServiceKey) {
    if (nextService === 'RENTAL') {
      router.push('/rentals');
      return;
    }
    setService(nextService);
  }

  // Appointment availability — only for non-rental services
  useEffect(() => {
    if (service === 'RENTAL') return;

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

  const rentalDays = useMemo(() => {
    if (!date || !returnDate) return 0;
    const start = new Date(date);
    const end = new Date(returnDate);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }, [date, returnDate]);

  useEffect(() => {
    if (service !== 'RENTAL') return;

    let active = true;

    async function loadRentalAvailability() {
      if (!date || !returnDate || rentalDays < 1) {
        setRentalOptions(rentals);
        return;
      }

      setRentalAvailabilityLoading(true);
      try {
        const startTime = new Date(`${date}T00:00:00+01:00`).toISOString();
        const endTime = new Date(`${returnDate}T23:59:59+01:00`).toISOString();
        const result = await getPublicRentals(startTime, endTime);
        if (!active) return;
        setRentalOptions(result.data);
      } catch {
        if (!active) return;
        setRentalOptions(rentals);
      } finally {
        if (active) setRentalAvailabilityLoading(false);
      }
    }

    void loadRentalAvailability();

    return () => {
      active = false;
    };
  }, [service, date, returnDate, rentalDays, rentals]);

  const rentalById = useMemo(() => {
    const map = new Map<string, RentalRow>();
    for (const item of rentals) map.set(item.id, item);
    for (const item of rentalOptions) map.set(item.id, item);
    return map;
  }, [rentals, rentalOptions]);

  const unavailableSelectedRentalIds = useMemo(
    () =>
      selectedRentals.filter((id) => {
        const rental = rentalById.get(id);
        return !rental || rental.availableCount === 0;
      }),
    [selectedRentals, rentalById],
  );

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(service);
    if (step === 1) {
      if (service === 'RENTAL') {
        if (!date || !returnDate || rentalDays < 1) return false;
        if (selectedRentals.length === 0) return false;
        if (unavailableSelectedRentalIds.length > 0) return false;
        return selectedRentals.every((id) => {
          const rental = rentalById.get(id);
          if (!rental || rental.sizes.length === 0) return true;
          return Boolean(selectedRentalSizes[id]);
        });
      }
      if (!date || !time) return false;
      return true;
    }
    if (step === 2) return Boolean(name && email);
    if (step === 3) {
      if (service === 'RENTAL' && unavailableSelectedRentalIds.length > 0) return false;
      return termsAccepted;
    }
    return false;
  }, [step, service, date, returnDate, rentalDays, time, selectedRentals, unavailableSelectedRentalIds.length, selectedRentalSizes, rentalById, name, email, termsAccepted]);

  const { rentalDailyRate, rentalTotalCost, rentalDepositTotal } = useMemo(() => {
    let daily = 0;
    let deposit = 0;
    for (const id of selectedRentals) {
      const r = rentalById.get(id);
      if (!r) continue;
      daily += Number(r.pricePerDay) || 0;
      deposit += Number(r.depositAmount) || 0;
    }
    return {
      rentalDailyRate: daily,
      rentalTotalCost: daily * (rentalDays || 1),
      rentalDepositTotal: deposit,
    };
  }, [selectedRentals, rentalById, rentalDays]);

  const serviceTitle = useMemo(
    () => services.find((s) => s.key === service)?.title ?? service,
    [service],
  );

  function getDefaultSize(id: string) {
    const rental = rentalById.get(id);
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
      if (service === 'RENTAL' && unavailableSelectedRentalIds.length > 0) {
        throw new Error('One or more selected pieces are no longer available for the chosen rental period.');
      }

      const terms = await getActiveTerms();

      const payload: CreateBookingPayload = {
        clientName: name,
        clientEmail: email,
        clientPhone: phone || undefined,
        serviceType: service,
        // Rentals use start-of-pickup-day (WAT +01:00); appointments use the chosen ISO slot.
        startTime: service === 'RENTAL'
          ? new Date(`${date}T00:00:00+01:00`).toISOString()
          : time,
        rentalEndDate: service === 'RENTAL' ? returnDate : undefined,
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
                onClick={() => handleServiceSelect(item.key as ServiceKey)}
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
          <div className="grid gap-5 md:grid-cols-12">
            {/* LEFT COLUMN */}
            <div className="space-y-4 md:col-span-7">
              {service === 'RENTAL' ? (
                /* ── Rental: date range pickers ── */
                <div className="rounded-2xl border border-border/80 bg-white/90 p-5 shadow-sm">
                  <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Rental period
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700" htmlFor="pickup-date">
                        Pickup date
                      </label>
                      <input
                        id="pickup-date"
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setDate(e.target.value);
                          if (returnDate && returnDate <= e.target.value) setReturnDate('');
                        }}
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700" htmlFor="return-date">
                        Return date
                      </label>
                      <input
                        id="return-date"
                        type="date"
                        value={returnDate}
                        min={date
                          ? new Date(new Date(date).getTime() + 86_400_000).toISOString().split('T')[0]
                          : new Date().toISOString().split('T')[0]}
                        onChange={(e) => setReturnDate(e.target.value)}
                        disabled={!date}
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  {rentalDays > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {rentalDays} {rentalDays === 1 ? 'day' : 'days'} · pickup{' '}
                      <span className="font-medium text-stone-800">{formatDateLabel(date)}</span>
                      {' '}→ return{' '}
                      <span className="font-medium text-stone-800">{formatDateLabel(returnDate)}</span>
                    </p>
                  )}
                </div>
              ) : (
                /* ── Appointments: calendar + time slots ── */
                <>
                  <div className="rounded-2xl border border-border/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setMonth((prev) => shiftMonth(prev, -1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-700 transition-colors hover:border-stone-400"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Prev
                      </button>
                      <p className="text-sm font-medium text-stone-800">{formatMonthLabel(month)}</p>
                      <button
                        type="button"
                        onClick={() => setMonth((prev) => shiftMonth(prev, 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-700 transition-colors hover:border-stone-400"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-stone-500">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                        <div key={weekday} className="py-1">{weekday}</div>
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
                            <div key={`empty-${index}`} className="h-9 rounded-md bg-stone-50/70" />
                          ) : (
                            <button
                              key={cell.date}
                              type="button"
                              onClick={() => setDate(cell.date)}
                              disabled={!cell.isAvailable}
                              className={`h-9 rounded-md border text-sm transition-colors ${
                                date === cell.date
                                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                                  : cell.isAvailable
                                    ? 'border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
                                    : 'cursor-not-allowed border-transparent bg-stone-50 text-stone-300'
                              }`}
                            >
                              <span className={cell.isToday && cell.isAvailable ? 'font-semibold underline' : ''}>
                                {cell.dayNumber}
                              </span>
                            </button>
                          ),
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-white/90 p-4 shadow-sm">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {date ? `Times on ${formatDateLabel(date)}` : 'Times'}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6">
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
                            className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
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
                </>
              )}
            </div>

            {/* RIGHT COLUMN: sticky booking summary */}
            <div className="md:col-span-5">
              <div className="rounded-2xl border border-border/80 bg-white/95 p-5 shadow-sm md:sticky md:top-24">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Your selection</p>

                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground">Service</span>
                    <span className="text-right font-medium">{serviceTitle}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-muted-foreground">When</span>
                    <span className="text-right font-medium">
                      {service === 'RENTAL' ? (
                        date && returnDate && rentalDays > 0 ? (
                          <span className="space-y-0.5">
                            <span className="block">{formatDateLabel(date)} → {formatDateLabel(returnDate)}</span>
                            <span className="block text-[11px] font-normal text-muted-foreground">{rentalDays} {rentalDays === 1 ? 'day' : 'days'}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400">Pick pickup &amp; return date</span>
                        )
                      ) : date && time ? (
                        <>
                          {formatDateLabel(date)}
                          <span className="text-muted-foreground"> · </span>
                          {formatTimeLabel(time)}
                        </>
                      ) : (
                        <span className="text-stone-400">Pick a date &amp; time</span>
                      )}
                    </span>
                  </div>

                  {service === 'RENTAL' && (
                    selectedRentals.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-stone-200 p-5 text-center">
                        <p className="text-xs text-muted-foreground">No piece selected yet.</p>
                        <a
                          href="/rentals"
                          className="mt-2 inline-block text-xs font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900"
                        >
                          Browse our collection →
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3 border-t border-border/60 pt-3">
                        {rentalAvailabilityLoading ? (
                          <p className="text-[11px] text-muted-foreground">Checking live stock for your dates…</p>
                        ) : null}
                        {unavailableSelectedRentalIds.length > 0 ? (
                          <p className="text-[11px] text-red-600">
                            One or more selected pieces are no longer available in this period. Remove unavailable items to continue.
                          </p>
                        ) : null}
                        <div className="space-y-3">
                          {selectedRentals.map((id) => {
                            const r = rentalById.get(id);
                            if (!r) return null;
                            const thumb = r.imageUrls?.[0];
                            const isUnavailable = r.availableCount !== undefined && r.availableCount === 0;
                            return (
                              <div key={id} className={`flex items-start gap-2.5 ${isUnavailable ? 'opacity-60' : ''}`}>
                                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                                  {thumb ? (
                                    <img src={thumb} alt={r.name} className="h-full w-full object-cover" />
                                  ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium leading-snug">{r.name}</p>
                                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    ₦{Number(r.pricePerDay).toLocaleString()}/day
                                  </p>
                                  {isUnavailable ? (
                                    <p className="mt-0.5 text-[11px] text-red-500">Unavailable at this time</p>
                                  ) : null}
                                  {r.sizes.length > 0 ? (
                                    <select
                                      value={selectedRentalSizes[id] ?? ''}
                                      onChange={(e) => selectRentalSize(id, e.target.value)}
                                      className="mt-1.5 h-6 rounded border border-stone-300 bg-white px-1.5 text-[11px] text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                                      aria-label="Size"
                                    >
                                      {r.sizes.map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                      ))}
                                    </select>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRental(id)}
                                  className="mt-0.5 shrink-0 rounded p-0.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                  aria-label={`Remove ${r.name}`}
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <a
                          href="/rentals"
                          className="block text-center text-[11px] text-stone-500 underline underline-offset-2 hover:text-stone-800"
                        >
                          + Add another piece
                        </a>

                        <div className="space-y-1.5 border-t border-border/60 pt-3">
                          {rentalDays > 1 && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>₦{rentalDailyRate.toLocaleString()} × {rentalDays} days</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{rentalDays > 0 ? 'Rental total' : 'Daily rate'}</span>
                            <span className="font-semibold">₦{(rentalDays > 0 ? rentalTotalCost : rentalDailyRate).toLocaleString()}</span>
                          </div>
                          {rentalDepositTotal > 0 ? (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Refundable deposit</span>
                              <span>₦{rentalDepositTotal.toLocaleString()}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
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
          <div className="space-y-3">
            {/* Booking summary card */}
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-white/95 shadow-sm">

              {/* Service + date block */}
              <div className="grid divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Service</p>
                  <p className="mt-1 font-medium text-stone-900">{serviceTitle}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {service === 'RENTAL' ? 'Rental period' : 'Appointment'}
                  </p>
                  <p className="mt-1 font-medium text-stone-900">
                    {service === 'RENTAL'
                      ? date && returnDate
                        ? `${formatDateLabel(date)} → ${formatDateLabel(returnDate)}`
                        : '—'
                      : date && time
                        ? `${formatDateLabel(date)} · ${formatTimeLabel(time)}`
                        : '—'}
                  </p>
                  {service === 'RENTAL' && rentalDays > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{rentalDays} {rentalDays === 1 ? 'day' : 'days'}</p>
                  )}
                </div>
              </div>

              {/* Rental items */}
              {service === 'RENTAL' && selectedRentals.length > 0 && (
                <div className="border-t border-border/60">
                  <p className="px-5 pt-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Pieces</p>
                  {unavailableSelectedRentalIds.length > 0 && (
                    <p className="px-5 pt-2 text-xs text-red-600">
                      Some selected pieces are no longer available for this period. Please go back and update your selection.
                    </p>
                  )}
                  <ul className="divide-y divide-border/50 px-5 pb-1 pt-2">
                    {selectedRentals.map((id) => {
                      const r = rentalById.get(id);
                      if (!r) return null;
                      const thumb = r.imageUrls?.[0];
                      const size = selectedRentalSizes[id];
                      const isUnavailable = r.availableCount !== undefined && r.availableCount === 0;
                      return (
                        <li key={id} className="flex items-center gap-3 py-2.5">
                          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                            {thumb ? <img src={thumb} alt={r.name} className="h-full w-full object-cover" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-stone-900">{r.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {size ? `Size ${size} · ` : ''}₦{Number(r.pricePerDay).toLocaleString()}/day
                            </p>
                            {isUnavailable ? (
                              <p className="text-[11px] text-red-600">Unavailable for this period</p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {/* Price breakdown */}
                  <div className="space-y-1.5 border-t border-border/60 px-5 py-3">
                    {rentalDays > 1 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₦{rentalDailyRate.toLocaleString()} × {rentalDays} days</span>
                        <span>₦{rentalTotalCost.toLocaleString()}</span>
                      </div>
                    )}
                    {rentalDepositTotal > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Refundable deposit</span>
                        <span>₦{rentalDepositTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold text-stone-900">
                      <span>Estimated total</span>
                      <span>₦{(rentalTotalCost + rentalDepositTotal).toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Rental fee and deposit are collected at studio pickup.
                    </p>
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="border-t border-border/60 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Contact</p>
                <p className="mt-1 font-medium text-stone-900">{name || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {email || '—'}
                  {phone ? ` · ${phone}` : ''}
                </p>
                {notes && (
                  <p className="mt-1.5 text-xs text-muted-foreground italic">"{notes}"</p>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 transition-colors hover:border-stone-400">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-stone-900"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                I accept the{' '}
                <a href="/terms" target="_blank" className="underline underline-offset-2 hover:text-stone-900">
                  terms and conditions
                </a>
                {' '}and understand the studio cancellation policy.
              </span>
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
