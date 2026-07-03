// lib/email/template-render.ts
// Variable substitution for {{first_name}}, {{last_name}}, etc.
// Also handles {{unsubscribe_url}} and {{tracking_pixel}} placeholders.

import type { EmailContact } from './types';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface RenderContext {
  contact: EmailContact;
  unsubscribeUrl?: string;
  trackingPixelUrl?: string;
  customFields?: Record<string, string>;
  fallbacks?: Record<string, string>; // e.g. { first_name: 'there' }
}

export function renderTemplate(html: string, ctx: RenderContext): string {
  const fallbacks = ctx.fallbacks || {};
  const variables: Record<string, string> = {
    first_name: ctx.contact.first_name || fallbacks.first_name || '',
    last_name:  ctx.contact.last_name  || fallbacks.last_name  || '',
    full_name:  [ctx.contact.first_name, ctx.contact.last_name].filter(Boolean).join(' ') || fallbacks.full_name || '',
    email:      ctx.contact.email,
    company:    ctx.contact.company    || fallbacks.company    || '',
    phone:      ctx.contact.phone      || fallbacks.phone      || '',
    unsubscribe_url: ctx.unsubscribeUrl || '#',
    tracking_pixel:  ctx.trackingPixelUrl ? `<img src="${ctx.trackingPixelUrl}" width="1" height="1" alt="" style="display:none">` : '',
    ...(ctx.customFields || {}),
    // Custom fields from contact
    ...Object.fromEntries(
      Object.entries(ctx.contact.custom_fields || {}).map(([k, v]) => [k, String(v ?? '')])
    ),
  };

  let out = html;
  // {{var}} replacement — case-insensitive, allows surrounding whitespace inside braces
  out = out.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const k = key.toLowerCase();
    const v = variables[k];
    // tracking_pixel and unsubscribe_url are HTML-safe by construction
    if (k === 'tracking_pixel' || k === 'unsubscribe_url') return v ?? '';
    return v != null ? escapeHtml(String(v)) : '';
  });

  return out;
}

export function renderSubject(subject: string, ctx: RenderContext): string {
  // Subjects shouldn't contain HTML; replace without escaping (but still trim newlines)
  return subject.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const k = key.toLowerCase();
    const v =
      k === 'first_name' ? (ctx.contact.first_name || ctx.fallbacks?.first_name || '') :
      k === 'last_name'  ? (ctx.contact.last_name  || ctx.fallbacks?.last_name  || '') :
      k === 'full_name'  ? ([ctx.contact.first_name, ctx.contact.last_name].filter(Boolean).join(' ') || '') :
      k === 'email'      ? ctx.contact.email :
      k === 'company'    ? (ctx.contact.company || '') :
      ((ctx.contact.custom_fields as any)?.[k] ?? ctx.customFields?.[k] ?? '');
    return String(v ?? '').replace(/[\r\n]/g, ' ');
  });
}
