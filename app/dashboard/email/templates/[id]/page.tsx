// app/dashboard/email/templates/[id]/page.tsx
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import TemplateEditor from '@/components/email/TemplateEditor';

export const dynamic = 'force-dynamic';

export default async function TemplateEditPage({ params }: { params: { id: string } }) {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <TemplateEditor templateId={params.id} />;
}
