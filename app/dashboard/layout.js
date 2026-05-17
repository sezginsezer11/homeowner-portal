import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <Sidebar profile={profile} />
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
