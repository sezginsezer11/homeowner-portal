// app/dashboard/email/tags/page.tsx
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import TagsManager from '@/components/email/TagsManager';

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <TagsManager />;
}
