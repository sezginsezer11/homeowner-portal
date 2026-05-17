'use client'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import HomePageContent from './(public)/HomePageContent'

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <main className="flex-1"><HomePageContent /></main>
      <PublicFooter />
    </div>
  )
}
