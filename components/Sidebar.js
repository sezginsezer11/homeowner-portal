'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, MessageSquare, Users, TrendingUp, LogOut, Building2, Percent } from 'lucide-react'

const NAV = {
  homeowner: [
    { href: '/dashboard/homeowner',          label: 'Dashboard', icon: Home },
    { href: '/dashboard/homeowner/messages', label: 'Messages',  icon: MessageSquare },
    { href: '/dashboard/homeowner/team',     label: 'My Team',   icon: Users },
  ],
  agent: [
    { href: '/dashboard/agent',              label: 'Dashboard', icon: Home },
    { href: '/dashboard/agent/clients',      label: 'Clients',   icon: Users },
    { href: '/dashboard/agent/messages',     label: 'Messages',  icon: MessageSquare },
  ],
  lender: [
    { href: '/dashboard/lender',             label: 'Dashboard',   icon: Home },
    { href: '/dashboard/lender/clients',     label: 'Clients',     icon: Users },
    { href: '/dashboard/lender/messages',    label: 'Messages',    icon: MessageSquare },
    { href: '/dashboard/lender/rates',       label: 'Rate Alerts', icon: Percent },
  ],
}

const ROLE_LABEL = { homeowner: 'Homeowner', agent: 'Real Estate Agent', lender: 'Lender' }
const ROLE_COLOR = { homeowner: 'text-[#c9a84c]', agent: 'text-green-400', lender: 'text-blue-400' }

export default function Sidebar({ profile }) {
  const router   = useRouter()
  const pathname = usePathname()
  const navItems = NAV[profile?.role] || NAV.homeowner

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1a2332] border-r border-[#344a57]/20 flex flex-col z-40">

      {/* Logo */}
      <div className="p-6 border-b border-[#344a57]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#344a57] flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-[#c9a84c]" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">HomeOwner</div>
            <div className="text-[#8fa1ad] text-xs">Portal</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-[#344a57]/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#344a57] to-[#1a2332] border border-[#344a57] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{profile?.full_name || 'User'}</div>
            <div className={`text-xs ${ROLE_COLOR[profile?.role] || 'text-[#8fa1ad]'}`}>
              {ROLE_LABEL[profile?.role] || 'User'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                active ? 'bg-[#344a57] text-white font-medium' : 'text-[#8fa1ad] hover:bg-[#344a57]/30 hover:text-white'
              }`}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#c9a84c]' : ''}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#344a57]/20">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#8fa1ad] hover:text-red-400 hover:bg-red-900/20 transition-all text-sm w-full">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
