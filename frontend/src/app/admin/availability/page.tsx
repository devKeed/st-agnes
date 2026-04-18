'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ServiceType = 'CUSTOM_DESIGN' | 'ALTERATION' | 'RENTAL';

interface BusinessHours {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface AvailabilityDay {
  date: string;
  slots: Array<{ start: string; end: string }>;
}

interface AvailabilityResponse {
  month: string;
  timezone: string;
  available_slots: AvailabilityDay[];
  blocked_dates: string[];
}

interface BlockedDateEntry {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
  blockedById: string | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SERVICES: ServiceType[] = ['CUSTOM_DESIGN', 'ALTERATION', 'RENTAL'];

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminAvailabilityPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const [month, setMonth] = useState(currentMonthValue());
  const [service, setService] = useState<ServiceType>('CUSTOM_DESIGN');

  const [blockDate, setBlockDate] = useState('');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const hoursQuery = useQuery({
    queryKey: ['availability', 'business-hours'],
    queryFn: () => apiFetch<BusinessHours[]>('/availability/business-hours'),
  });

  const [hoursDraft, setHoursDraft] = useState<BusinessHours[]>([]);

  useEffect(() => {
    if (!hoursQuery.data) return;
    setHoursDraft([...hoursQuery.data].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  }, [hoursQuery.data]);

  const monthAvailabilityQuery = useQuery({
    queryKey: ['availability', 'month', month, service],
    queryFn: () =>
      apiFetch<AvailabilityResponse>(
        `/availability?month=${encodeURIComponent(month)}&service=${encodeURIComponent(service)}`,
      ),
  });

  const blockedEntriesQuery = useQuery({
    queryKey: ['availability', 'blocked', month],
    queryFn: () =>
      apiFetch<BlockedDateEntry[]>(`/availability/blocked?month=${encodeURIComponent(month)}`),
  });

  const saveHoursMutation = useMutation({
    mutationFn: () =>
      apiFetch<BusinessHours[]>('/availability/business-hours', {
        method: 'PUT',
        body: {
          hours: hoursDraft.map((row) => ({
            dayOfWeek: row.dayOfWeek,
            openTime: row.openTime,
            closeTime: row.closeTime,
            isClosed: row.isClosed,
          })),
        },
      }),
    onSuccess: () => {
      setFeedback('Business hours updated.');
      void queryClient.invalidateQueries({ queryKey: ['availability', 'business-hours'] });
      void queryClient.invalidateQueries({ queryKey: ['availability', 'month'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const blockMutation = useMutation({
    mutationFn: () =>
      apiFetch('/availability/block', {
        method: 'POST',
        body: {
          date: blockDate,
          startTime: blockStart || undefined,
          endTime: blockEnd || undefined,
          reason: blockReason || undefined,
        },
      }),
    onSuccess: () => {
      setFeedback('Date/time blocked.');
      setBlockDate('');
      setBlockStart('');
      setBlockEnd('');
      setBlockReason('');
      void queryClient.invalidateQueries({ queryKey: ['availability', 'month'] });
      void queryClient.invalidateQueries({ queryKey: ['availability', 'blocked'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/availability/block/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      setFeedback('Blocked entry removed.');
      void queryClient.invalidateQueries({ queryKey: ['availability', 'month'] });
      void queryClient.invalidateQueries({ queryKey: ['availability', 'blocked'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const totalSlots = useMemo(
    () => (monthAvailabilityQuery.data?.available_slots ?? []).reduce((sum, day) => sum + day.slots.length, 0),
    [monthAvailabilityQuery.data?.available_slots],
  );

  function submitBlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    if (!blockDate) {
      setFeedback('Block date is required.');
      return;
    }
    if ((blockStart && !blockEnd) || (!blockStart && blockEnd)) {
      setFeedback('Start and end time must both be set for a partial-day block.');
      return;
    }
    blockMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure business hours and block dates/time windows.
        </p>
      </div>

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{feedback}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business hours</CardTitle>
          <CardDescription>Times are in Lagos local time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hoursQuery.isError ? (
            <p className="text-sm text-destructive">{errorMessage(hoursQuery.error)}</p>
          ) : hoursQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading business hours…</p>
          ) : (
            <>
              <div className="space-y-2">
                {hoursDraft.map((row, index) => (
                  <div key={row.dayOfWeek} className="grid gap-2 rounded-md border p-3 md:grid-cols-[140px_1fr_1fr_120px]">
                    <div className="text-sm font-medium">{DAYS[row.dayOfWeek]}</div>
                    <Input
                      type="time"
                      value={row.openTime}
                      onChange={(e) =>
                        setHoursDraft((current) => {
                          const next = [...current];
                          next[index] = { ...next[index], openTime: e.target.value };
                          return next;
                        })
                      }
                      disabled={row.isClosed}
                    />
                    <Input
                      type="time"
                      value={row.closeTime}
                      onChange={(e) =>
                        setHoursDraft((current) => {
                          const next = [...current];
                          next[index] = { ...next[index], closeTime: e.target.value };
                          return next;
                        })
                      }
                      disabled={row.isClosed}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={row.isClosed}
                        onChange={(e) =>
                          setHoursDraft((current) => {
                            const next = [...current];
                            next[index] = { ...next[index], isClosed: e.target.checked };
                            return next;
                          })
                        }
                      />
                      Closed
                    </label>
                  </div>
                ))}
              </div>
              <Button onClick={() => saveHoursMutation.mutate()} disabled={saveHoursMutation.isPending}>
                {saveHoursMutation.isPending ? 'Saving…' : 'Save business hours'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Block date/time</CardTitle>
          <CardDescription>
            Leave time fields empty to block the full day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submitBlock}>
            <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
            <Input placeholder="Reason (optional)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
            <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
            <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
            <div className="md:col-span-2">
              <Button type="submit" disabled={blockMutation.isPending}>
                {blockMutation.isPending ? 'Blocking…' : 'Block'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Month overview</CardTitle>
          <CardDescription>Quick snapshot of generated availability from API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <select
              value={service}
              onChange={(e) => setService(e.target.value as ServiceType)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {SERVICES.map((item) => (
                <option key={item} value={item}>
                  {item.replace('_', ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {monthAvailabilityQuery.isError ? (
            <p className="text-sm text-destructive">{errorMessage(monthAvailabilityQuery.error)}</p>
          ) : monthAvailabilityQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading month availability…</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {monthAvailabilityQuery.data?.available_slots.length ?? 0} open day(s), {totalSlots} total slot(s),{' '}
                {monthAvailabilityQuery.data?.blocked_dates.length ?? 0} blocked full day(s).
              </p>
              <div className="space-y-2">
                {(monthAvailabilityQuery.data?.blocked_dates ?? []).slice(0, 10).map((date) => (
                  <div key={date} className="rounded-md border px-3 py-2 text-sm">
                    {date}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked entries</CardTitle>
          <CardDescription>
            Full-day and partial-day blocks for the selected month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedEntriesQuery.isError ? (
            <p className="text-sm text-destructive">{errorMessage(blockedEntriesQuery.error)}</p>
          ) : blockedEntriesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading blocked entries…</p>
          ) : (blockedEntriesQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked entries for this month.</p>
          ) : (
            <div className="space-y-2">
              {blockedEntriesQuery.data?.map((entry) => {
                const isRemoving =
                  unblockMutation.isPending && unblockMutation.variables === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{entry.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.startTime && entry.endTime
                          ? `${entry.startTime}–${entry.endTime}`
                          : 'Full day'}
                        {entry.reason ? ` · ${entry.reason}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRemoving}
                      onClick={() => unblockMutation.mutate(entry.id)}
                    >
                      {isRemoving ? 'Removing…' : 'Unblock'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
