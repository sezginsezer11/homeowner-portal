import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import dynamic from 'next/dynamic'

const HomePageContent = dynamic(() => import('./(public)/HomePageContent'), { ssr: false })

export default async function RootPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'agent') redirect('/dashboard/agent')
      if (profile?.role === 'lender') redirect('/dashboard/lender')
      redirect('/dashboard/homeowner')
    }
  } catch {}

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <main className="flex-1"><HomePageContent /></main>
      <PublicFooter />
    </div>
  )
}
