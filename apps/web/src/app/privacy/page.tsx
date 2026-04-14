import { apiGet } from '@/lib/api';

type PolicyResponse = {
  privacy: { contentMarkdown: string } | null;
};

export default async function PrivacyPage() {
  let privacy = 'Privacy policy not published yet.';

  try {
    const data = await apiGet<PolicyResponse>('/api/v1/policies/active');
    privacy = data.privacy?.contentMarkdown || privacy;
  } catch {
    // Ignore network failure in SSR path.
  }

  return (
    <article className="rounded border bg-white p-6">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <pre className="mt-4 whitespace-pre-wrap text-sm text-neutral-700">{privacy}</pre>
    </article>
  );
}
