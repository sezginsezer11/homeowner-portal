'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, MessageSquare, User, Handshake, Calculator, DollarSign, Percent, BarChart2, Heart, Search, Calendar, Users, UserCircle, Globe, LayoutDashboard } from 'lucide-react'

const HOMEOWNER_TABS = [
  { href: '/dashboard/homeowner',            label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/homeowner/messages',   label: 'Messages',      icon: MessageSquare },
  { href: '/dashboard/homeowner/agent',      label: 'My Agent',      icon: User },
  { href: '/dashboard/homeowner/lender',     label: 'My Lender',     icon: Handshake },
  { href: '/dashboard/homeowner/mortgage',   label: 'Mortgage',      icon: Calculator },
  { href: '/dashboard/homeowner/heloc',      label: 'HELOC',         icon: DollarSign },
  { href: '/dashboard/homeowner/rates',      label: 'Shop Rates',    icon: Percent },
  { href: '/dashboard/profile',             label: 'Profile',       icon: UserCircle },
]

const AGENT_TABS = [
  { href: '/dashboard/agent',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/agent/clients',       label: 'Clients',       icon: Users },
  { href: '/dashboard/agent/messages',      label: 'Messages',      icon: MessageSquare },
  { href: '/dashboard/profile',             label: 'Profile',       icon: UserCircle },
]

const LENDER_TABS = [
  { href: '/dashboard/lender',              label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/lender/clients',      label: 'Clients',       icon: Users },
  { href: '/dashboard/lender/messages',     label: 'Messages',      icon: MessageSquare },
  { href: '/dashboard/lender/rates',        label: 'Rate Alerts',   icon: Percent },
  { href: '/dashboard/profile',             label: 'Profile',       icon: UserCircle },
]

const TABS_BY_ROLE = {
  homeowner: HOMEOWNER_TABS,
  agent:     AGENT_TABS,
  lender:    LENDER_TABS,
}

export default function DashboardTabNav({ profile }) {
  const pathname = usePathname()
  const tabs = TABS_BY_ROLE[profile?.role] || HOMEOWNER_TABS
  const roleLabel = { homeowner: 'Homeowner', agent: 'Agent', lender: 'Lender' }[profile?.role] || 'Dashboard'

  return (
    <div className="bg-white border-b border-[#e4e6eb] sticky top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Role badge + name */}
        <div className="flex items-center justify-between py-2 border-b border-[#f0f2f5]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold text-xs overflow-hidden flex-shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                : (profile?.full_name?.charAt(0) || 'U')}
            </div>
            <span className="text-xs font-semibold text-[#1a1a2e]">{profile?.full_name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              profile?.role === 'agent' ? 'bg-green-50 text-green-700' :
              profile?.role === 'lender' ? 'bg-blue-50 text-blue-700' :
              'bg-[#e7f0fd] text-[#1877F2]'
            }`}>{roleLabel}</span>
          </div>
          <Link href="/" className="text-xs text-[#65676b] hover:text-[#1877F2] transition-colors flex items-center gap-1">
            <Globe className="w-3 h-3"/> Public Site
          </Link>
        </div>

        {/* Tab navigation - horizontally scrollable */}
        <div className="flex overflow-x-auto scrollbar-hide gap-0 -mb-px">
          {tabs.map(tab => {
            const isActive = tab.href === '/dashboard/homeowner'
              ? pathname === tab.href
              : pathname.startsWith(tab.href)
            const Icon = tab.icon
            return (
              <Link key={tab.href} href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  isActive
                    ? 'border-[#1877F2] text-[#1877F2]'
                    : 'border-transparent text-[#65676b] hover:text-[#1a1a2e] hover:border-[#e4e6eb]'
                }`}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0"/>
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
