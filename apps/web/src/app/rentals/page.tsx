import { apiGet } from '@/lib/api';

type Rental = {
  id: string;
  name: string;
  description: string;
  size?: string;
  price: string | number;
};

export const metadata = {
  title: 'Rental Archive | St Agnes',
};

export default async function RentalsPage() {
  let rentals: Rental[] = [];

  try {
    rentals = await apiGet<Rental[]>('/api/v1/rentals');
  } catch {
    rentals = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Rental Archive</h1>
      <p className="text-sm text-neutral-600">Select one or more pieces on the booking page.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {rentals.map((rental) => (
          <article key={rental.id} className="rounded border bg-white p-4">
            <h2 className="font-semibold">{rental.name}</h2>
            <p className="mt-1 text-sm text-neutral-600">{rental.description}</p>
            <p className="mt-1 text-xs text-neutral-500">Size: {rental.size || 'N/A'}</p>
            <p className="mt-2 font-medium">₦{rental.price}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
