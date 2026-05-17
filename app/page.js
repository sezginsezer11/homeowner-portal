import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import HomePageContent from './(public)/HomePageContent'

export default async function RootPage() {
  // Redirect logged-in users to their dashboard
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
