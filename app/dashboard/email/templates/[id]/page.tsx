// app/dashboard/email/templates/[id]/page.tsx
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import TemplateEditor from '@/components/email/TemplateEditor';

export const dynamic = 'force-dynamic';

export default async function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <TemplateEditor templateId={id} />;
}
