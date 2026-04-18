import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number | null;
  helper?: string;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

export function KpiCard({ label, value, helper, icon: Icon, loading, className }: KpiCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="mt-2">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="font-serif text-3xl font-semibold leading-none tracking-tight">
                {value ?? '—'}
              </p>
            )}
          </div>
          {helper && (
            <p className="mt-2 truncate text-xs text-muted-foreground">{helper}</p>
          )}
        </div>
        {Icon && (
          <div className="shrink-0 rounded-md border bg-secondary p-2 text-secondary-foreground">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
