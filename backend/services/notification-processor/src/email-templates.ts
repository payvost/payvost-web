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
  headerLabel?: string;
  bodyHtml: string;
  button?: Button;
  footerNote?: string;
}): { html: string; textPrelude: string } {
  const brand = '#0b3d91';
  const brand2 = '#1460d1';
  const bg = '#f5f7fb';
  const card = '#ffffff';

  const headerLabel = params.headerLabel ? esc(params.headerLabel) : '';

  const buttonHtml = params.button
    ? `
      <tr>
        <td align="center" style="padding: 8px 28px 28px 28px;">
          <a href="${esc(params.button.href)}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-weight:700;border-radius:10px;padding:12px 18px;font-size:14px;">
            ${esc(params.button.label)}
          </a>
        </td>
      </tr>
    `
    : '';

  const footerNote = params.footerNote
    ? `<p class="muted" style="margin: 14px 0 0 0; font-size: 13px; line-height: 20px; color: #6b7280;">${esc(params.footerNote)}</p>`
    : '';

  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${esc(params.title)}</title>
  <style>
    @media only screen and (max-width: 600px) {
      table[class="container"] { width: 100% !important; border-radius: 0 !important; }
      td[class="padded"] { padding: 24px 18px !important; }
      img[class="logo"] { width: 120px !important; }
      h1 { font-size: 22px !important; line-height: 30px !important; }
      p { font-size: 15px !important; line-height: 22px !important; }
      td[class="footer-text"] { text-align: center !important; display: block !important; margin-bottom: 10px !important; }
      td[class="footer-link"] { text-align: center !important; display: block !important; }
    }
    @media (prefers-color-scheme: dark) {
      body, table[class="bg"] { background-color: #0b1220 !important; }
      table[class="container"] { background-color: #0f172a !important; }
      td[class="padded"] { background-color: #0f172a !important; }
      .text { color: #e5e7eb !important; }
      .muted { color: #a1a1aa !important; }
      .panel { background: #0b1a3a !important; border-color: rgba(20,96,209,0.35) !important; }
      a { color: #93c5fd !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${bg}; font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#fff; opacity:0;">
    ${esc(params.preheader)}
  </div>
  <table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bg}; padding:28px 0;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; background-color:${card}; border-radius:12px; overflow:hidden; box-shadow:0 6px 24px rgba(11,61,145,0.08);">
          <tr>
            <td style="padding:0; text-align:left; background-color:${brand};">
              <div style="padding:20px 28px; background:linear-gradient(90deg,${brand},${brand2});">
                <table role="presentation" width="100%">
                  <tr>
                    <td valign="middle" style="vertical-align:middle;">
                      <img class="logo" src="https://www.payvost.com/Payvost%20White.png" alt="Payvost" width="140" style="display:block; height:auto;">
                    </td>
                    <td valign="middle" style="text-align:right; color:#ffffff; font-size:14px;">
                      <span style="opacity:0.95;">${headerLabel}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td class="padded" style="padding:36px 28px; background-color:${card};">
              <h1 class="text" style="margin:0 0 12px 0; font-size:26px; line-height:34px; color:${brand}; font-weight:700;">
                ${esc(params.title)}
              </h1>
              ${params.subtitle ? `<p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">${esc(params.subtitle)}</p>` : ''}
              ${params.bodyHtml}
              ${footerNote}
              <p class="muted" style="margin:24px 0 0 0; font-size:13px; color:#6b7280;">
                Need help? Visit <a href="https://payvost.com/support" target="_blank" style="color:${brand}; text-decoration:underline;">payvost.com/support</a>
                or email <a href="mailto:support@payvost.com" style="color:${brand}; text-decoration:underline;">support@payvost.com</a>.
              </p>
            </td>
          </tr>
          ${buttonHtml}
          <tr>
            <td style="padding:18px 28px; background-color:${brand}; color:#ffffff;">
              <table role="presentation" width="100%">
                <tr>
                  <td class="footer-text" style="font-size:13px; color:#e6eefc;">
                    © ${new Date().getFullYear()} Payvost. All rights reserved.<br>
                    651 North Broad Street, Middletown, Delaware, US
                  </td>
                  <td class="footer-link" style="text-align:right; font-size:13px;">
                    <a href="https://payvost.com/support" style="color:#e6eefc; text-decoration:underline;">Support</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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
    <div class="panel" style="background:#f4f7ff; border:1px solid rgba(11,61,145,0.1); border-radius:8px; padding:18px; margin:20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${safeRows.map(r => `
          <tr>
            <td style="padding:8px 0; font-size:14px; color:#374151;"><strong>${esc(r.k)}:</strong></td>
            <td style="padding:8px 0; font-size:14px; color:#111827; text-align:right;">${esc(r.v)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
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
  const title = 'New Login Detected 🔐';

  const bodyHtml = `
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Hello ${esc(params.name || 'User')},
    </p>
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      We detected a new login to your Payvost account. If this was you, you can safely ignore this email.
    </p>
    ${kvTable([
      { k: 'Device', v: params.device || 'Unknown' },
      { k: 'Location', v: params.location || 'Unknown' },
      { k: 'Time', v: when.replace('T', ' ').replace('Z', ' UTC') },
      { k: 'IP Address', v: params.ipAddress || '' },
    ])}
    <p class="muted" style="margin:24px 0 0 0; font-size:14px; line-height:21px; color:#6b7280;">
      If this wasn't you, please <a href="https://payvost.com/security" style="color:#0b3d91; text-decoration:underline;">secure your account</a> immediately by changing your password.
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: 'We detected a new login to your Payvost account.',
    title,
    headerLabel: 'Security Alert',
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
  const title = approved ? 'Welcome to Payvost 👋' : 'KYC Review Update';
  const headerLabel = approved ? 'Welcome on board' : 'Action required';

  const bodyHtml = `
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Hello ${esc(params.name || 'User')},
    </p>
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      ${approved
        ? "We're excited to have you with us. Your KYC verification is complete, and your account is now fully active."
        : "We reviewed your documents, and we need additional information to complete your verification."}
    </p>
    ${approved ? '' : kvTable([
      { k: 'Reason', v: params.reason || '' },
      { k: 'Next steps', v: params.nextSteps || '' },
    ])}
    <p class="muted" style="margin:24px 0 0 0; font-size:13px; color:#6b7280;">
      ${approved
        ? 'You can now access all Payvost features available for your account.'
        : 'Please log in to review the requirements and resubmit your documents.'}
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: approved ? 'Your KYC has been approved.' : 'Action required to complete KYC.',
    title,
    headerLabel,
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
  const title = approved ? 'Business Approved' : 'Business Review Update';
  const headerLabel = approved ? 'Approved' : 'Action required';

  const bodyHtml = `
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Hello ${esc(params.name || 'User')},
    </p>
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Your business <strong>${esc(params.businessName)}</strong> has been ${approved ? 'approved' : 'reviewed'}.
    </p>
    ${approved ? '' : kvTable([
      { k: 'Reason', v: params.reason || '' },
      { k: 'Next steps', v: params.nextSteps || '' },
    ])}
    <p class="muted" style="margin:24px 0 0 0; font-size:13px; color:#6b7280;">
      ${approved ? 'You can now access business features in your dashboard.' : 'Log in to review required changes and resubmit.'}
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: title,
    title,
    headerLabel,
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

  const headerLabel =
    params.status === 'success' ? 'Transaction Update' :
    params.status === 'failed' ? 'Action required' :
    'In progress';

  const bodyHtml = `
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Hello ${esc(params.name || 'User')},
    </p>
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Here is an update on your transaction.
    </p>
    ${kvTable([
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Recipient', v: params.recipientName || '' },
      { k: 'Transaction ID', v: params.transactionId || '' },
      { k: 'Status', v: params.status },
      { k: 'Reason', v: params.status === 'failed' ? (params.reason || '') : '' },
    ])}
    <p class="muted" style="margin:24px 0 0 0; font-size:13px; color:#6b7280;">
      ${params.status === 'failed'
        ? 'If you need help, contact support and include the transaction ID.'
        : 'You can view details from your dashboard.'}
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: title,
    title,
    headerLabel,
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

  const headerLabel =
    params.type === 'paid' ? 'Paid' :
    params.type === 'reminder' ? 'Reminder' :
    'Invoice';

  const due = params.dueDate ? formatTimestamp(params.dueDate).split('T')[0] : '';
  const bodyHtml = `
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Hello ${esc(params.name || 'User')},
    </p>
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      ${params.type === 'paid' ? 'Your invoice has been marked as paid.' : 'Here are the invoice details.'}
    </p>
    ${kvTable([
      { k: 'Invoice number', v: params.invoiceNumber || '' },
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Due date', v: due },
      { k: 'Business', v: params.businessName || 'Payvost' },
    ])}
    ${params.downloadLink ? `
      <p class="muted" style="margin:14px 0 0;color:#6b7280;font-size:13px;line-height:1.7;">
        You can view or download the invoice here: <a href="${esc(params.downloadLink)}" style="color:#0B3D91;text-decoration:none;">${esc(params.downloadLink)}</a>
      </p>
    ` : ''}
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: title,
    title,
    headerLabel,
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
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Hello ${esc(params.name || 'User')},
    </p>
    <p class="text" style="margin:0 0 18px 0; font-size:16px; line-height:24px; color:#111827;">
      Here is your payment link.
    </p>
    ${kvTable([
      { k: 'Amount', v: money(params.amount, params.currency) },
      { k: 'Description', v: params.description || '' },
      { k: 'Expires', v: expiry ? expiry.replace('T', ' ').replace('Z', '') : '' },
      { k: 'Link', v: params.paymentLink },
    ])}
    <p class="muted" style="margin:24px 0 0 0; font-size:13px; color:#6b7280;">
      Share this link with the payer. Keep it private if it grants access to payment details.
    </p>
  `.trim();

  const { html, textPrelude } = baseLayout({
    preheader: 'Your payment link is ready.',
    title,
    headerLabel: 'Payment',
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
