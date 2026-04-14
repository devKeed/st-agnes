export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}
