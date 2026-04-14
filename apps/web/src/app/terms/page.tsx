import { apiGet } from '@/lib/api';

type PolicyResponse = {
  terms: { contentMarkdown: string } | null;
};

export default async function TermsPage() {
  let terms = 'Terms not published yet.';

  try {
    const data = await apiGet<PolicyResponse>('/api/v1/policies/active');
    terms = data.terms?.contentMarkdown || terms;
  } catch {
    // Ignore network failure in SSR path.
  }

  return (
    <article className="rounded border bg-white p-6">
      <h1 className="text-2xl font-semibold">Terms & Conditions</h1>
      <pre className="mt-4 whitespace-pre-wrap text-sm text-neutral-700">{terms}</pre>
    </article>
  );
}
