'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Home, MessageSquare, Users, TrendingUp, LogOut,
  Building2, Percent, Search, Heart, Star,
  BarChart2, Settings, Menu, X, ChevronDown, ChevronUp,
  Calculator, UserCircle
} from 'lucide-react'

const NAV = {
  homeowner: [
    { href: '/dashboard/homeowner',          label: 'Dashboard',   icon: Home },
    { href: '/dashboard/homeowner/search',   label: 'Search',      icon: Search,    soon: true },
    { href: '/dashboard/homeowner/matches',  label: 'My Matches',  icon: Heart,     soon: true },
    { href: '/dashboard/homeowner/messages', label: 'Messages',    icon: MessageSquare },
    { href: '/dashboard/homeowner/team',     label: 'My Team',     icon: Users },
    { href: '/dashboard/homeowner/mortgage', label: 'Mortgage',    icon: Calculator, soon: true },
    { href: '/dashboard/homeowner/market',   label: 'My Market',   icon: BarChart2,  soon: true },
    { href: '/dashboard/profile',            label: 'Profile',     icon: UserCircle },
  ],
  agent: [
    { href: '/dashboard/agent',              label: 'Dashboard',   icon: Home },
    { href: '/dashboard/agent/clients',      label: 'Clients',     icon: Users },
    { href: '/dashboard/agent/messages',     label: 'Messages',    icon: MessageSquare },
    { href: '/dashboard/profile',            label: 'Profile',     icon: UserCircle },
  ],
  lender: [
    { href: '/dashboard/lender',             label: 'Dashboard',   icon: Home },
    { href: '/dashboard/lender/clients',     label: 'Clients',     icon: Users },
    { href: '/dashboard/lender/messages',    label: 'Messages',    icon: MessageSquare },
    { href: '/dashboard/lender/rates',       label: 'Rate Alerts', icon: Percent },
    { href: '/dashboard/profile',            label: 'Profile',     icon: UserCircle },
  ],
}

const ROLE_LABEL = { homeowner: 'Homeowner', agent: 'Real Estate Agent', lender: 'Lender' }
const ROLE_COLOR = { homeowner: 'text-[#c9a84c]', agent: 'text-green-400', lender: 'text-blue-400' }

export default function Sidebar({ profile }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navItems = NAV[profile?.role] || NAV.homeowner

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-[#344a57]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#344a57] flex items-center justify-center shadow-md flex-shrink-0">
            <Building2 className="w-4 h-4 text-[#c9a84c]" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">HomeOwner</div>
            <div className="text-[#8fa1ad] text-xs">Portal</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-[#8fa1ad] hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User info */}
      <Link href="/dashboard/profile" className="p-4 border-b border-[#344a57]/20 hover:bg-[#344a57]/10 transition-colors">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-[#344a57] flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#344a57] to-[#1a2332] border border-[#344a57] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-white text-sm font-semibold truncate">{profile?.full_name || 'User'}</div>
            <div className={`text-xs ${ROLE_COLOR[profile?.role] || 'text-[#8fa1ad]'}`}>
              {ROLE_LABEL[profile?.role] || 'User'}
            </div>
            {profile?.company && <div className="text-[#464d4f] text-[10px] truncate">{profile.company}</div>}
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, soon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <div key={href}>
              {soon ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#464d4f] cursor-not-allowed">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{label}</span>
                  <span className="ml-auto text-[9px] bg-[#344a57]/40 text-[#8fa1ad] px-1.5 py-0.5 rounded-full">Soon</span>
                </div>
              ) : (
                <Link href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    active ? 'bg-[#344a57] text-white font-medium' : 'text-[#8fa1ad] hover:bg-[#344a57]/30 hover:text-white'
                  }`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#c9a84c]' : ''}`} />
                  {label}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom info + logout */}
      <div className="border-t border-[#344a57]/20">
        {profile?.email && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[#464d4f] text-xs truncate">{profile.email}</p>
            {profile?.license_number && (
              <p className="text-[#464d4f] text-xs">License # {profile.license_number}</p>
            )}
          </div>
        )}
        <div className="p-3 space-y-0.5">
          <Link href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#8fa1ad] hover:text-white hover:bg-[#344a57]/30 transition-all text-sm w-full">
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#8fa1ad] hover:text-red-400 hover:bg-red-900/20 transition-all text-sm w-full">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#1a2332] border border-[#344a57]/30 rounded-xl flex items-center justify-center text-white shadow-lg">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar (slide in) */}
      <aside className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-[#1a2332] border-r border-[#344a57]/20 z-50 transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#1a2332] border-r border-[#344a57]/20 flex-col z-40">
        <SidebarContent />
      </aside>
    </>
  )
}
