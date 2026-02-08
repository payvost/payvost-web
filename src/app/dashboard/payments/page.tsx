import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

function buildRedirectUrl(baseHref: string, searchParams: SearchParams, omitKeys: Set<string>) {
  const [basePath, baseQuery = ''] = baseHref.split('?');
  const out = new URLSearchParams(baseQuery);

  for (const [key, value] of Object.entries(searchParams || {})) {
    if (omitKeys.has(key)) continue;
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) out.append(key, v);
    } else {
      out.set(key, value);
    }
  }

  const qs = out.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function PaymentsHubPage({ searchParams }: { searchParams: SearchParams }) {
  // The "Payments hub" page has been removed from the dashboard navigation.
  // Keep this route as a backward-compatible redirect for old deep-links.
  const tab = typeof searchParams?.tab === 'string' ? searchParams.tab : undefined;

  const mapping: Record<string, string> = {
    remittances: '/dashboard/payments/send',
    'bill-payment': '/dashboard/payments/bills',
    'gift-cards': '/dashboard/payments/gift-cards',
    scheduled: '/dashboard/payments/scheduled',
    'bulk-transfer': '/dashboard/payments/bulk',
    'split-payment': '/dashboard/request-payment?tab=split-payment',
  };

  const targetBase = (tab && mapping[tab]) ? mapping[tab] : '/dashboard/payments/send';
  const target = buildRedirectUrl(targetBase, searchParams || {}, new Set(['tab']));
  redirect(target);
}
