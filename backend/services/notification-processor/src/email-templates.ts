type Button = {
  label: string;
  href: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
  tags: string[];
};

function esc(input: any): string {
  const s = String(input ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimestamp(value?: string | Date): string {
  if (!value) return new Date().toISOString();
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function money(amount: any, currency?: string): string {
  const c = (currency || '').trim() || 'USD';
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return esc(`${c} ${amount ?? ''}`.trim());
  return `${esc(c)} ${n.toFixed(2)}`;
}

function baseLayout(params: {
  preheader: string;
  title: string;
  subtitle?: string;
  badge?: { label: string; tone: 'success' | 'warning' | 'danger' | 'info' };
  bodyHtml: string;
  button?: Button;
  footerNote?: string;
}): { html: string; textPrelude: string } {
  const brand = '#0B3D91';
  const bg = '#F4F7FB';
  const card = '#FFFFFF';
  const muted = '#6B7280';

  const badgeBg =
    params.badge?.tone === 'success' ? '#ECFDF5' :
    params.badge?.tone === 'warning' ? '#FFFBEB' :
    params.badge?.tone === 'danger' ? '#FEF2F2' :
    '#EFF6FF';
  const badgeFg =
    params.badge?.tone === 'success' ? '#047857' :
    params.badge?.tone === 'warning' ? '#B45309' :
    params.badge?.tone === 'danger' ? '#B91C1C' :
    '#1D4ED8';

  const badgeHtml = params.badge
    ? `<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${badgeBg};color:${badgeFg};font-size:12px;font-weight:700;letter-spacing:.02em;">${esc(params.badge.label)}</span>`
    : '';

  const buttonHtml = params.button
    ? `
      <tr>
        <td align="center" style="padding: 20px 30px 0;">
          <a href="${esc(params.button.href)}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-weight:700;border-radius:10px;padding:12px 18px;font-size:14px;">
            ${esc(params.button.label)}
          </a>
        </td>
      </tr>
    `
    : '';

  const footerNote = params.footerNote
    ? `<p style="margin: 16px 0 0; color: ${muted}; font-size: 12px; line-height: 1.6;">${esc(params.footerNote)}</p>`
    : '';

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(params.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(params.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${bg};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
            <tr>
              <td style="padding: 0 6px 14px;">
                <div style="font-size:14px;font-weight:800;letter-spacing:.06em;color:${brand};text-transform:uppercase;">Payvost</div>
              </td>
            </tr>
            <tr>
              <td style="background:${card};border-radius:16px;box-shadow:0 10px 25px rgba(2,6,23,.08);overflow:hidden;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 26px 30px 10px;">
                      ${badgeHtml}
                      <h1 style="margin: 14px 0 6px;font-size:22px;line-height:1.25;color:#0F172A;">${esc(params.title)}</h1>
                      ${params.subtitle ? `<p style="margin:0;color:${muted};font-size:14px;line-height:1.6;">${esc(params.subtitle)}</p>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 30px 18px;">
                      ${params.bodyHtml}
                    </td>
                  </tr>
                  ${buttonHtml}
                  <tr>
                    <td style="padding: 22px 30px 26px;border-top:1px solid #E5E7EB;">
                      <p style="margin:0;color:${muted};font-size:12px;line-height:1.6;">
                        If you need help, reply to this email or contact support at <a href="mailto:support@payvost.com" style="color:${brand};text-decoration:none;">support@payvost.com</a>.
                      </p>
                      ${footerNote}
                      <p style="margin: 14px 0 0; color:#94A3B8; font-size:11px;">© ${new Date().getFullYear()} Payvost</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td style="height:10px;"></td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `.trim();

  const textPrelude = `${params.title}\n\n${params.subtitle ? `${params.subtitle}\n\n` : ''}`.trim();
  return { html, textPrelude };
}

function kvTable(rows: Array<{ k: string; v: string }>): string {
  const safeRows = rows.filter(r => r.v.trim() !== '');
  if (safeRows.length === 0) return '';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
      ${safeRows.map(r => `
        <tr>
          <td style="padding:12px 14px;background:#F8FAFC;color:#475569;font-size:12px;font-weight:700;width:38%;">${esc(r.k)}</td>
          <td style="padding:12px 14px;background:#FFFFFF;color:#0F172A;font-size:13px;">${esc(r.v)}</td>
        </tr>
      `).join('')}
    </table>
  `.trim();
}

function toTextFromPairs(title: string, pairs: Array<{ k: string; v: string }>, extra?: string[]): string {
  const lines = [title, ''];
  for (const p of pairs) {
    if (p.v.trim() === '') continue;
    lines.push(`${p.k}: ${p.v}`);
  }
  if (extra && extra.length > 0) {
    lines.push('');
    lines.push(...extra.filter(Boolean));
  }
  return lines.join('\n');
}

export function renderLoginEmail(params: {
  to: string;
  name?: string;
  device?: string;
  location?: string;
  ipAddress?: string;
  timestamp?: string | Date;
}): RenderedEmail {
  const when = formatTimestamp(params.timestamp);
  const title = 'New login to your Payvost account';

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#0F172A;font-size:14px;line-height:1.7;">
      Hi ${esc(params.name || 'there')}, we detected a new login to your account.
    </p>
    ${kvTable([
      { k: 'Device', v: params.device || 'Unknown' },
      { k: 'Location', v: params.location || 'Unknown' },
      { k: 'IP address', v: params.ipAddress || 'Unknown' },
      { k: 'Time (UTC)', v: when.replace('T', ' ').replace('Z', '') },
    ])}
    <p style="margin:14px 0 0;color:#334155;font-size:13px;line-height:1.7;">
      If this was not you, secure your account immediately: change your password and review your recent activity.
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: 'We detected a new login to your Payvost account.',
    title,
    badge: { label: 'Security alert', tone: 'warning' },
    bodyHtml,
    button: { label: 'Review security settings', href: 'https://payvost.com/dashboard/settings/security' },
  });

  const text = [
    textPrelude,
    toTextFromPairs(title, [
      { k: 'Device', v: params.device || 'Unknown' },
      { k: 'Location', v: params.location || 'Unknown' },
      { k: 'IP address', v: params.ipAddress || 'Unknown' },
      { k: 'Time (UTC)', v: when },
    ], [
      'If this was not you, change your password and review your account activity.',
    ]),
  ].join('\n\n');

  return { subject: title, html, text, tags: ['security', 'login'] };
}

export function renderKycEmail(params: {
  to: string;
  name?: string;
  status: 'approved' | 'rejected';
  reason?: string;
  nextSteps?: string;
}): RenderedEmail {
  const approved = params.status === 'approved';
  const title = approved ? 'KYC approved' : 'KYC review update';
  const badge = approved ? { label: 'Verified', tone: 'success' as const } : { label: 'Action required', tone: 'danger' as const };

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#0F172A;font-size:14px;line-height:1.7;">
      Hi ${esc(params.name || 'there')}, ${approved ? 'your identity verification has been approved.' : 'we need additional information to complete your verification.'}
    </p>
    ${approved ? '' : kvTable([
      { k: 'Reason', v: params.reason || '' },
      { k: 'Next steps', v: params.nextSteps || '' },
    ])}
    <p style="margin:14px 0 0;color:#334155;font-size:13px;line-height:1.7;">
      ${approved ? 'You now have access to all features available for your account tier.' : 'Please log in to review and resubmit the requested documents.'}
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: approved ? 'Your KYC has been approved.' : 'Action required to complete KYC.',
    title,
    badge,
    bodyHtml,
    button: { label: 'Open verification', href: 'https://payvost.com/dashboard/settings' },
  });

  const text = [
    textPrelude,
    toTextFromPairs(title, [
      { k: 'Status', v: params.status },
      { k: 'Reason', v: params.reason || '' },
      { k: 'Next steps', v: params.nextSteps || '' },
    ]),
  ].join('\n\n');

  return { subject: title, html, text, tags: ['kyc'] };
}

export function renderBusinessEmail(params: {
  to: string;
  name?: string;
  status: 'approved' | 'rejected';
  businessName: string;
  reason?: string;
  nextSteps?: string;
}): RenderedEmail {
  const approved = params.status === 'approved';
  const title = approved ? 'Business approved' : 'Business review update';
  const badge = approved ? { label: 'Approved', tone: 'success' as const } : { label: 'Action required', tone: 'warning' as const };

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#0F172A;font-size:14px;line-height:1.7;">
      Hi ${esc(params.name || 'there')}, your business "${esc(params.businessName)}" has been ${approved ? 'approved' : 'reviewed'}.
    </p>
    ${approved ? '' : kvTable([
      { k: 'Reason', v: params.reason || '' },
      { k: 'Next steps', v: params.nextSteps || '' },
    ])}
    <p style="margin:14px 0 0;color:#334155;font-size:13px;line-height:1.7;">
      ${approved ? 'You can now access business features in your dashboard.' : 'Log in to review required changes and resubmit.'}
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: title,
    title,
    badge,
    bodyHtml,
    button: { label: 'Open business dashboard', href: 'https://payvost.com/dashboard' },
  });

  const text = [
    textPrelude,
    toTextFromPairs(title, [
      { k: 'Business', v: params.businessName },
      { k: 'Status', v: params.status },
      { k: 'Reason', v: params.reason || '' },
      { k: 'Next steps', v: params.nextSteps || '' },
    ]),
  ].join('\n\n');

  return { subject: title, html, text, tags: ['business', params.status] };
}

export function renderTransactionEmail(params: {
  to: string;
  name?: string;
  status: 'success' | 'failed' | 'initiated';
  amount?: any;
  currency?: string;
  recipientName?: string;
  transactionId?: string;
  reason?: string;
}): RenderedEmail {
  const title =
    params.status === 'success' ? 'Transaction successful' :
    params.status === 'failed' ? 'Transaction failed' :
    'Transaction initiated';

  const badge =
    params.status === 'success' ? { label: 'Success', tone: 'success' as const } :
    params.status === 'failed' ? { label: 'Failed', tone: 'danger' as const } :
    { label: 'In progress', tone: 'info' as const };

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#0F172A;font-size:14px;line-height:1.7;">
      Hi ${esc(params.name || 'there')}, here is an update on your transaction.
    </p>
    ${kvTable([
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Recipient', v: params.recipientName || '' },
      { k: 'Transaction ID', v: params.transactionId || '' },
      { k: 'Status', v: params.status },
      { k: 'Reason', v: params.status === 'failed' ? (params.reason || '') : '' },
    ])}
    <p style="margin:14px 0 0;color:#334155;font-size:13px;line-height:1.7;">
      ${params.status === 'failed' ? 'If you need help, contact support and include the transaction ID.' : 'You can view details from your dashboard.'}
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: title,
    title,
    badge,
    bodyHtml,
    button: { label: 'View transactions', href: 'https://payvost.com/dashboard/transactions' },
  });

  const text = [
    textPrelude,
    toTextFromPairs(title, [
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Recipient', v: params.recipientName || '' },
      { k: 'Transaction ID', v: params.transactionId || '' },
      { k: 'Status', v: params.status },
      { k: 'Reason', v: params.reason || '' },
    ]),
  ].join('\n\n');

  return { subject: title, html, text, tags: ['transaction', params.status] };
}

export function renderInvoiceEmail(params: {
  to: string;
  name?: string;
  type: 'generated' | 'reminder' | 'paid';
  invoiceNumber?: string;
  amount?: any;
  currency?: string;
  dueDate?: string | Date;
  businessName?: string;
  downloadLink?: string;
}): RenderedEmail {
  const title =
    params.type === 'paid' ? 'Invoice paid' :
    params.type === 'reminder' ? 'Invoice payment reminder' :
    'New invoice generated';

  const badge =
    params.type === 'paid' ? { label: 'Paid', tone: 'success' as const } :
    params.type === 'reminder' ? { label: 'Due soon', tone: 'warning' as const } :
    { label: 'New', tone: 'info' as const };

  const due = params.dueDate ? formatTimestamp(params.dueDate).split('T')[0] : '';
  const bodyHtml = `
    <p style="margin:0 0 14px;color:#0F172A;font-size:14px;line-height:1.7;">
      Hi ${esc(params.name || 'there')}, ${params.type === 'paid' ? 'your invoice has been marked as paid.' : 'here are the invoice details.'}
    </p>
    ${kvTable([
      { k: 'Invoice number', v: params.invoiceNumber || '' },
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Due date', v: due },
      { k: 'Business', v: params.businessName || 'Payvost' },
    ])}
    ${params.downloadLink ? `
      <p style="margin:14px 0 0;color:#334155;font-size:13px;line-height:1.7;">
        You can view or download the invoice here: <a href="${esc(params.downloadLink)}" style="color:#0B3D91;text-decoration:none;">${esc(params.downloadLink)}</a>
      </p>
    ` : ''}
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: title,
    title,
    badge,
    bodyHtml,
    button: params.downloadLink ? { label: 'View invoice', href: params.downloadLink } : { label: 'Open invoices', href: 'https://payvost.com/dashboard/invoices' },
  });

  const text = [
    textPrelude,
    toTextFromPairs(title, [
      { k: 'Invoice number', v: params.invoiceNumber || '' },
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Due date', v: due },
      { k: 'Business', v: params.businessName || 'Payvost' },
      { k: 'Link', v: params.downloadLink || '' },
    ]),
  ].join('\n\n');

  return { subject: title, html, text, tags: ['invoice', params.type] };
}

export function renderPaymentLinkEmail(params: {
  to: string;
  name?: string;
  amount?: any;
  currency?: string;
  paymentLink: string;
  expiryDate?: string | Date;
  description?: string;
}): RenderedEmail {
  const title = 'Payment link created';
  const expiry = params.expiryDate ? formatTimestamp(params.expiryDate) : '';

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#0F172A;font-size:14px;line-height:1.7;">
      Hi ${esc(params.name || 'there')}, here is your payment link.
    </p>
    ${kvTable([
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Description', v: params.description || '' },
      { k: 'Expires', v: expiry ? expiry.replace('T', ' ').replace('Z', '') : '' },
      { k: 'Link', v: params.paymentLink },
    ])}
    <p style="margin:14px 0 0;color:#334155;font-size:13px;line-height:1.7;">
      Share this link with the payer. Keep it private if it grants access to payment details.
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: 'Your payment link is ready.',
    title,
    badge: { label: 'Payment', tone: 'info' },
    bodyHtml,
    button: { label: 'Open payment link', href: params.paymentLink },
  });

  const text = [
    textPrelude,
    toTextFromPairs(title, [
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Description', v: params.description || '' },
      { k: 'Expires', v: expiry },
      { k: 'Link', v: params.paymentLink },
    ]),
  ].join('\n\n');

  return { subject: title, html, text, tags: ['payment-link'] };
}
