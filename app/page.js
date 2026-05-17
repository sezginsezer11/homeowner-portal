'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import HomePageContent from './(public)/HomePageContent'

export default function RootPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data: profile }) => {
          if (profile?.role === 'agent') router.push('/dashboard/agent')
          else if (profile?.role === 'lender') router.push('/dashboard/lender')
          else router.push('/dashboard/homeowner')
        })
      } else {
        setChecked(true)
      }
    })
  }, [])

  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <main className="flex-1"><HomePageContent /></main>
      <PublicFooter />
    </div>
  )
}
