// app/dashboard/email/contacts/page.tsx
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import ContactsManager from '@/components/email/ContactsManager';

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <ContactsManager />;
}
