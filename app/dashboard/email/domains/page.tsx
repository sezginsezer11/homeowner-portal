// app/dashboard/email/domains/page.tsx
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import DomainsManager from '@/components/email/DomainsManager';

export const dynamic = 'force-dynamic';

export default async function DomainsPage() {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <DomainsManager />;
}
