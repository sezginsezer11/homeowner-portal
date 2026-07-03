// lib/email/segment.ts
// Resolves a SegmentDefinition into actual contact rows, applying tag
// includes/excludes, status filters, and suppression list.

import { getEmailServiceClient } from './supabase-server';
import type { EmailContact, SegmentDefinition } from './types';

export interface ResolvedSegment {
  contacts: EmailContact[];
  total_in_segment: number;
  suppressed_count: number;
}

export async function resolveSegment(userId: string, segment: SegmentDefinition): Promise<ResolvedSegment> {
  const supabase = getEmailServiceClient();
  const statuses = segment.statuses && segment.statuses.length > 0 ? segment.statuses : ['subscribed'];

  // Base: all contacts in those statuses
  let q = supabase
    .from('email_contacts')
    .select('*, email_contact_tags(tag_id)')
    .eq('user_id', userId)
    .in('status', statuses);

  const { data: rows, error } = await q;
  if (error) throw error;

  // Filter by tag includes/excludes in JS (Phase 5 will move this to a SQL view)
  let contacts: EmailContact[] = (rows || []).map((c: any) => ({
    ...c,
    tags: (c.email_contact_tags || []).map((j: any) => ({ id: j.tag_id })),
    email_contact_tags: undefined,
  }));

  const has = (c: any, id: string) => (c.tags || []).some((t: any) => t.id === id);

  if (segment.include_tags && segment.include_tags.length > 0) {
    if (segment.match_all_tags) {
      contacts = contacts.filter(c => segment.include_tags!.every(id => has(c, id)));
    } else {
      contacts = contacts.filter(c => segment.include_tags!.some(id => has(c, id)));
    }
  }
  if (segment.exclude_tags && segment.exclude_tags.length > 0) {
    contacts = contacts.filter(c => !segment.exclude_tags!.some(id => has(c, id)));
  }

  const totalInSegment = contacts.length;

  // Filter out suppressed addresses
  if (contacts.length > 0) {
    const emails = contacts.map(c => c.email);
    const { data: supp } = await supabase
      .from('email_suppression_list')
      .select('email')
      .eq('user_id', userId)
      .in('email', emails);
    const blocked = new Set((supp || []).map(s => s.email));
    const before = contacts.length;
    contacts = contacts.filter(c => !blocked.has(c.email));
    return {
      contacts,
      total_in_segment: totalInSegment,
      suppressed_count: before - contacts.length,
    };
  }

  return { contacts, total_in_segment: totalInSegment, suppressed_count: 0 };
}
