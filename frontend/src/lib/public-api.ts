const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface ContentRow {
  pageKey: string;
  value: string;
}

export interface GalleryRow {
  id: string;
  category: 'COLLECTION' | 'MUSE';
  title: string;
  description: string | null;
  imageUrl: string;
}

export interface RentalRow {
  id: string;
  name: string;
  description: string | null;
  sizes: string[];
  pricePerDay: string | number;
  depositAmount?: string | number;
  imageUrls: string[];
  quantity?: number;
  availableCount?: number;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TermsRow {
  id: string;
  versionLabel: string;
  content: string;
}

export interface CreateBookingPayload {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceType: 'CUSTOM_DESIGN' | 'ALTERATION' | 'RENTAL';
  startTime: string;
  rentalEndDate?: string;
  notes?: string;
  specialRequests?: string;
  rentalItems?: Array<{ rentalProductId: string; selectedSize?: string }>;
  termsAccepted: boolean;
  termsVersionId: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface AvailabilityDay {
  date: string;
  slots: AvailabilitySlot[];
}

export interface MonthAvailability {
  month: string;
  timezone: string;
  available_slots: AvailabilityDay[];
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'message' in json
        ? Array.isArray((json as { message: unknown }).message)
          ? (json as { message: string[] }).message.join(', ')
          : String((json as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}

async function publicGet<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    next: { revalidate },
  });
  return parseResponse<T>(res);
}

async function publicMutate<T>(path: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function getContentMap(): Promise<Record<string, string>> {
  const rows = await publicGet<ContentRow[]>('/content', 120);
  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.pageKey] = row.value;
    return acc;
  }, {});
}

export function getPublicGallery(category?: 'COLLECTION' | 'MUSE') {
  const query = category ? `?category=${category}` : '';
  return publicGet<GalleryRow[]>(`/gallery${query}`, 120);
}

export function getPublicRentals(startTime?: string) {
  const params = new URLSearchParams({ page: '1', limit: '24' });
  if (startTime) params.set('startTime', startTime);
  return publicGet<Paginated<RentalRow>>(`/rentals?${params.toString()}`, startTime ? 0 : 120);
}

export function getPublicRental(id: string) {
  return publicGet<RentalRow>(`/rentals/${id}`, 120);
}

export function getActiveTerms() {
  return publicGet<TermsRow>('/terms/active', 120);
}

export function getMonthAvailability(
  month: string,
  service?: CreateBookingPayload['serviceType'],
) {
  const query = service
    ? `/availability?month=${encodeURIComponent(month)}&service=${encodeURIComponent(service)}`
    : `/availability?month=${encodeURIComponent(month)}`;
  return publicGet<MonthAvailability>(query, 0);
}

export function createBooking(payload: CreateBookingPayload) {
  return publicMutate<{
    id: string;
    status: string;
    manageToken: string;
    manageUrl: string;
  }>('/bookings', 'POST', payload);
}

export function getBookingByToken(token: string) {
  return publicGet<{ id: string; status: string; startTime: string; endTime: string; serviceType: string }>(
    `/bookings/manage/${token}`,
    0,
  );
}

export function cancelBookingByToken(token: string, reason?: string) {
  return publicMutate(`/bookings/manage/${token}/cancel`, 'PATCH', { reason });
}

export function rescheduleBookingByToken(token: string, startTime: string) {
  return publicMutate(`/bookings/manage/${token}/reschedule`, 'PATCH', { startTime });
}

export function recoverBooking(email: string): Promise<void> {
  return publicMutate<void>('/bookings/recover', 'POST', { email });
}
