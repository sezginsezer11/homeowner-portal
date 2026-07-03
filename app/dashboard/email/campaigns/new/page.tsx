// app/dashboard/email/campaigns/new/page.tsx
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import CampaignBuilder from '@/components/email/CampaignBuilder';

export const dynamic = 'force-dynamic';

export default async function NewCampaignPage() {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <CampaignBuilder />;
}
