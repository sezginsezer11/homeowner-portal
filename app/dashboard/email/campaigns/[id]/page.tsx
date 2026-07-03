// app/dashboard/email/campaigns/[id]/page.tsx
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import CampaignBuilder from '@/components/email/CampaignBuilder';

export const dynamic = 'force-dynamic';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <CampaignBuilder campaignId={id} />;
}
