// app/dashboard/email/templates/new/page.tsx
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import TemplateEditor from '@/components/email/TemplateEditor';

export const dynamic = 'force-dynamic';

export default async function NewTemplatePage() {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <TemplateEditor />;
}
