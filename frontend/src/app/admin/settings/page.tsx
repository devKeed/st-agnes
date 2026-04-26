'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { ApiError, apiFetch } from '@/lib/api';
import { formatLagos } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
}

interface TermsVersion {
  id: string;
  versionLabel: string;
  content: string;
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface CalendarStatus {
  connected: boolean;
  calendarId: string | null;
  tokenExpiry: string | null;
  hasRefreshToken: boolean;
}

interface CalendarAuthUrlResponse {
  url: string;
}

interface CalendarUpdateIdResponse {
  success: boolean;
  calendarId: string;
  message: string;
}

interface CalendarDisconnectResponse {
  success: boolean;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [feedback, setFeedback] = useState<string | null>(null);

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState<AdminRole>('ADMIN');

  const [termsVersionLabel, setTermsVersionLabel] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [termsActivate, setTermsActivate] = useState(false);
  const [calendarIdInput, setCalendarIdInput] = useState('');

  const termsQuery = useQuery({
    queryKey: ['terms', 'admin'],
    queryFn: () => apiFetch<TermsVersion[]>('/terms'),
  });

  const adminsQuery = useQuery({
    queryKey: ['admins', 'list'],
    queryFn: () => apiFetch<AdminUserItem[]>('/auth/admins'),
    enabled: isSuperAdmin,
  });

  const calendarStatusQuery = useQuery({
    queryKey: ['calendar', 'status'],
    queryFn: () => apiFetch<CalendarStatus>('/calendar/status'),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (calendarStatusQuery.data?.calendarId) {
      setCalendarIdInput(calendarStatusQuery.data.calendarId);
      return;
    }
    if (calendarStatusQuery.data && !calendarStatusQuery.data.connected) {
      setCalendarIdInput('primary');
    }
  }, [calendarStatusQuery.data]);

  const createAdminMutation = useMutation({
    mutationFn: () =>
      apiFetch<AdminUserItem>('/auth/admins', {
        method: 'POST',
        body: {
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: adminRole,
        },
      }),
    onSuccess: () => {
      setFeedback('Admin created.');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setAdminRole('ADMIN');
      void queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<AdminUserItem>(`/auth/admins/${id}/toggle-status`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      setFeedback('Admin status updated.');
      void queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const createTermsMutation = useMutation({
    mutationFn: () =>
      apiFetch<TermsVersion>('/terms', {
        method: 'POST',
        body: {
          versionLabel: termsVersionLabel,
          content: termsContent,
          activate: termsActivate,
        },
      }),
    onSuccess: () => {
      setFeedback('Terms version created.');
      setTermsVersionLabel('');
      setTermsContent('');
      setTermsActivate(false);
      void queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const activateTermsMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<TermsVersion>(`/terms/${id}/activate`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      setFeedback('Terms version activated.');
      void queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const connectCalendarMutation = useMutation({
    mutationFn: () => apiFetch<CalendarAuthUrlResponse>('/calendar/auth-url'),
    onSuccess: (data) => {
      setFeedback('Opening Google consent screen…');
      window.open(data.url, '_blank', 'noopener,noreferrer');

      // Poll status every 2s for up to 60s so the page auto-updates after OAuth completes
      const started = Date.now();
      const interval = setInterval(() => {
        if (Date.now() - started > 60_000) {
          clearInterval(interval);
          setFeedback('Check status manually if the connection did not update.');
          return;
        }
        apiFetch<CalendarStatus>('/calendar/status')
          .then((status) => {
            if (status.connected) {
              clearInterval(interval);
              void queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] });
              setFeedback('Google Calendar connected successfully.');
            }
          })
          .catch(() => {/* ignore polling errors */});
      }, 2000);
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const updateCalendarIdMutation = useMutation({
    mutationFn: () =>
      apiFetch<CalendarUpdateIdResponse>('/calendar/calendar-id', {
        method: 'PATCH',
        body: { calendarId: calendarIdInput },
      }),
    onSuccess: (res) => {
      setFeedback(res.message);
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  const disconnectCalendarMutation = useMutation({
    mutationFn: () =>
      apiFetch<CalendarDisconnectResponse>('/calendar/disconnect', {
        method: 'POST',
      }),
    onSuccess: () => {
      setFeedback('Google Calendar disconnected.');
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (error) => setFeedback(errorMessage(error)),
  });

  function onCreateAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setFeedback('Name, email, and password are required.');
      return;
    }
    createAdminMutation.mutate();
  }

  function onCreateTerms(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    if (!termsVersionLabel.trim() || termsContent.trim().length < 20) {
      setFeedback('Version label is required and terms content must be at least 20 characters.');
      return;
    }
    createTermsMutation.mutate();
  }

  function onUpdateCalendarId(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    if (!calendarIdInput.trim()) {
      setFeedback('Calendar ID is required.');
      return;
    }
    updateCalendarIdMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage terms versions and admin access.
        </p>
      </div>

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{feedback}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Current signed-in account.</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Name:</span> {user.name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Role:</span> {user.role}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active session.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms versions</CardTitle>
          <CardDescription>Draft and activate legal terms used by bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onCreateTerms}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Version label (e.g. v1.2)"
                value={termsVersionLabel}
                onChange={(e) => setTermsVersionLabel(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={termsActivate}
                  onChange={(e) => setTermsActivate(e.target.checked)}
                />
                Activate immediately
              </label>
            </div>
            <textarea
              rows={5}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Terms content"
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
            />
            <Button type="submit" disabled={createTermsMutation.isPending}>
              {createTermsMutation.isPending ? 'Saving…' : 'Create terms version'}
            </Button>
          </form>

          {termsQuery.isError ? (
            <p className="text-sm text-destructive">{errorMessage(termsQuery.error)}</p>
          ) : termsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading versions…</p>
          ) : (
            <div className="space-y-2">
              {(termsQuery.data ?? []).map((terms) => (
                <div key={terms.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                  <div>
                    <p className="font-medium">{terms.versionLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatLagos(terms.createdAt)}
                      {terms.publishedAt ? ` · Published ${formatLagos(terms.publishedAt)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {terms.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={terms.isActive || activateTermsMutation.isPending}
                      onClick={() => activateTermsMutation.mutate(terms.id)}
                    >
                      Activate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Connect and manage the Google Calendar used for booking sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calendarStatusQuery.isError ? (
            <p className="text-sm text-destructive">{errorMessage(calendarStatusQuery.error)}</p>
          ) : calendarStatusQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading connection status…</p>
          ) : (
            <>
              <div className="rounded-md border p-3 text-sm">
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {calendarStatusQuery.data?.connected ? 'Connected' : 'Not connected'}
                </p>
                <p>
                  <span className="font-medium">Calendar ID:</span>{' '}
                  {calendarStatusQuery.data?.calendarId ?? '—'}
                </p>
                <p>
                  <span className="font-medium">Refresh token:</span>{' '}
                  {calendarStatusQuery.data?.hasRefreshToken ? 'Available' : 'Missing'}
                </p>
                <p>
                  <span className="font-medium">Token expiry:</span>{' '}
                  {calendarStatusQuery.data?.tokenExpiry
                    ? formatLagos(calendarStatusQuery.data.tokenExpiry)
                    : '—'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => connectCalendarMutation.mutate()}
                  disabled={connectCalendarMutation.isPending}
                >
                  {connectCalendarMutation.isPending ? 'Opening…' : 'Connect / Reconnect'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] })
                  }
                >
                  Refresh status
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => disconnectCalendarMutation.mutate()}
                  disabled={
                    !calendarStatusQuery.data?.connected || disconnectCalendarMutation.isPending
                  }
                >
                  {disconnectCalendarMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
                </Button>
              </div>

              <form className="space-y-2" onSubmit={onUpdateCalendarId}>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    placeholder='Calendar ID (e.g. "primary" or calendar email)'
                    value={calendarIdInput}
                    onChange={(e) => setCalendarIdInput(e.target.value)}
                  />
                  <Button type="submit" disabled={updateCalendarIdMutation.isPending}>
                    {updateCalendarIdMutation.isPending ? 'Saving…' : 'Update calendar ID'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin users</CardTitle>
          <CardDescription>
            {isSuperAdmin
              ? 'Create admins and manage active status.'
              : 'Super Admin permissions required.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSuperAdmin ? (
            <p className="text-sm text-muted-foreground">Only Super Admin can manage admin users.</p>
          ) : (
            <>
              <form className="grid gap-3 md:grid-cols-4" onSubmit={onCreateAdmin}>
                <Input placeholder="Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                <Input
                  placeholder="Email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value as AdminRole)}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
                <div className="md:col-span-4">
                  <Button type="submit" disabled={createAdminMutation.isPending}>
                    {createAdminMutation.isPending ? 'Creating…' : 'Create admin'}
                  </Button>
                </div>
              </form>

              {adminsQuery.isError ? (
                <p className="text-sm text-destructive">{errorMessage(adminsQuery.error)}</p>
              ) : adminsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading admins…</p>
              ) : (
                <div className="space-y-2">
                  {(adminsQuery.data ?? []).map((admin) => (
                    <div key={admin.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {admin.email} · {admin.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {admin.isActive ? 'Active' : 'Disabled'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={toggleAdminMutation.isPending}
                          onClick={() => toggleAdminMutation.mutate(admin.id)}
                        >
                          Toggle status
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
