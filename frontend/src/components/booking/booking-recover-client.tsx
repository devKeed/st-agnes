'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { recoverBooking } from '@/lib/public-api';

type State = 'idle' | 'loading' | 'sent' | 'error';

export function BookingRecoverClient() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setErrorMsg(null);
    try {
      await recoverBooking(email.trim());
      setState('sent');
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800 space-y-2">
        <p className="font-medium">Check your inbox.</p>
        <p>
          If we found any active bookings for <strong>{email}</strong>, you will receive an email
          with your manage links within a few minutes. Check your spam folder if needed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recover-email">Email address</Label>
        <Input
          id="recover-email"
          type="email"
          required
          placeholder="jane@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === 'loading'}
        />
      </div>

      {state === 'error' && errorMsg ? (
        <p className="text-sm text-red-600">{errorMsg}</p>
      ) : null}

      <Button type="submit" disabled={state === 'loading' || !email.trim()}>
        {state === 'loading' ? 'Sending…' : 'Send my booking links'}
      </Button>

      <p className="text-xs text-muted-foreground">
        We will never expose your booking details in a response — links are emailed only.
      </p>
    </form>
  );
}
