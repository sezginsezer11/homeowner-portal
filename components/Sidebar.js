'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, MessageSquare, Users, LogOut, Building2, Percent, Search, Heart, BarChart2, Settings, Menu, X, Calculator, UserCircle, UserCheck, DollarSign } from 'lucide-react'

const NAV = {
  homeowner: [
    { href:'/dashboard/homeowner',             label:'Dashboard',   icon:Home },
    { href:'/dashboard/homeowner/search',      label:'Search',      icon:Search,      soon:true },
    { href:'/dashboard/homeowner/matches',     label:'My Matches',  icon:Heart,       soon:true },
    { href:'/dashboard/homeowner/messages',    label:'Messages',    icon:MessageSquare },
    { href:'/dashboard/homeowner/connections', label:'Connections', icon:UserCheck },
    { href:'/dashboard/homeowner/mortgage',    label:'Mortgage',    icon:Calculator },
    { href:'/dashboard/homeowner/heloc',       label:'HELOC',       icon:DollarSign },
    { href:'/dashboard/homeowner/rates',       label:'Shop Rates',  icon:Percent },
    { href:'/dashboard/homeowner/market',      label:'My Market',   icon:BarChart2,   soon:true },
    { href:'/dashboard/profile',               label:'Profile',     icon:UserCircle },
  ],
  agent: [
    { href:'/dashboard/agent',          label:'Dashboard', icon:Home },
    { href:'/dashboard/agent/clients',  label:'Clients',   icon:Users },
    { href:'/dashboard/agent/messages', label:'Messages',  icon:MessageSquare },
    { href:'/dashboard/profile',        label:'Profile',   icon:UserCircle },
  ],
  lender: [
    { href:'/dashboard/lender',          label:'Dashboard',   icon:Home },
    { href:'/dashboard/lender/clients',  label:'Clients',     icon:Users },
    { href:'/dashboard/lender/messages', label:'Messages',    icon:MessageSquare },
    { href:'/dashboard/lender/rates',    label:'Rate Alerts', icon:Percent },
    { href:'/dashboard/profile',         label:'Profile',     icon:UserCircle },
  ],
}
const ROLE_LABEL = { homeowner:'Homeowner', agent:'Real Estate Agent', lender:'Lender' }
const ROLE_DOT   = { homeowner:'bg-[#c9a84c]', agent:'bg-green-500', lender:'bg-blue-500' }

export default function Sidebar({ profile }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navItems = NAV[profile?.role] || NAV.homeowner

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3.5 border-b border-[#e4e6eb] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center shadow-sm flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-[#1a1a2e] text-sm leading-tight">HomeOwner</div>
            <div className="text-[#9ca3af] text-[10px]">Portal</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-[#65676b] hover:text-[#1a1a2e] p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <Link href="/dashboard/profile" className="px-4 py-3 border-b border-[#e4e6eb] hover:bg-[#f8f9fa] transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-[#e4e6eb]" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${ROLE_DOT[profile?.role] || 'bg-gray-400'}`} />
          </div>
          <div className="min-w-0">
            <div className="text-[#1a1a2e] text-sm font-semibold truncate">{profile?.full_name || 'User'}</div>
            <div className="text-[#9ca3af] text-xs">{ROLE_LABEL[profile?.role] || 'User'}</div>
          </div>
        </div>
      </Link>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, soon }) => {
          const active = pathname === href || (href !== '/dashboard/homeowner' && pathname.startsWith(href))
          return (
            <div key={href}>
              {soon ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#c8d0dc] cursor-not-allowed">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs flex-1">{label}</span>
                  <span className="text-[9px] bg-[#f0f2f5] text-[#9ca3af] px-1.5 py-0.5 rounded-full">Soon</span>
                </div>
              ) : (
                <Link href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-medium ${
                    active ? 'bg-[#e7f0fd] text-[#1877F2] font-semibold' : 'text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1a1a2e]'
                  }`}>
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-[#1877F2]' : ''}`} />
                  {label}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-[#e4e6eb]">
        {profile?.email && (
          <div className="px-4 pt-2.5 pb-1">
            <p className="text-[#9ca3af] text-[11px] truncate">{profile.email}</p>
            {profile?.license_number && <p className="text-[#9ca3af] text-[11px]">DRE# {profile.license_number}</p>}
          </div>
        )}
        <div className="p-2 space-y-0.5">
          <Link href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1a1a2e] transition-all text-xs font-medium w-full">
            <Settings className="w-3.5 h-3.5 flex-shrink-0" /> Settings
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#65676b] hover:text-red-500 hover:bg-red-50 transition-all text-xs font-medium w-full">
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-[#e4e6eb] rounded-xl flex items-center justify-center text-[#1a1a2e] shadow-card">
        <Menu className="w-5 h-5" />
      </button>
      {open && <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />}
      <aside className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-[#e4e6eb] z-50 transform transition-transform duration-300 shadow-nav ${open?'translate-x-0':'-translate-x-full'}`}>
        <SidebarContent />
      </aside>
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 bg-white border-r border-[#e4e6eb] flex-col z-40 shadow-nav">
        <SidebarContent />
      </aside>
    </>
  )
}
