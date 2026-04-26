'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function CalendarCallbackContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const message = searchParams.get('message') ?? (success ? 'Google Calendar connected.' : 'Connection failed.');

  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.close();
      } catch {
        // Browser blocked close
      }
      setCanClose(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-sm w-full rounded-lg border p-6 text-center space-y-3">
        <div className={`text-2xl ${success ? 'text-green-600' : 'text-destructive'}`}>
          {success ? '✓' : '✕'}
        </div>
        <p className="font-medium text-sm">{message}</p>
        {canClose ? (
          <p className="text-xs text-muted-foreground">You may close this tab.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Closing this tab…</p>
        )}
      </div>
    </div>
  );
}

export default function CalendarCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <CalendarCallbackContent />
    </Suspense>
  );
}
