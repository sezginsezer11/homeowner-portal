'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, ChevronDown, LayoutDashboard, Heart, Search, Home, MessageSquare, UserCheck, Settings, LogOut, User, Bell, Star } from 'lucide-react'

const NAV_LINKS = [
  { label:'Buy',      href:'/buy' },
  { label:'Rent',     href:'/rent' },
  { label:'Sell',     href:'/sell' },
  { label:'Mortgage', href:'/mortgage' },
]

const DASHBOARD_URL = {
  homeowner: '/dashboard/homeowner',
  agent:     '/dashboard/agent',
  lender:    '/dashboard/lender',
}

export default function PublicNav() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser]               = useState(null)
  const [profile, setProfile]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const menuRef = useRef(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: p } = await supabase.from('profiles').select('role, full_name, avatar_url').eq('id', user.id).single()
        setProfile(p)
      }
      setLoading(false)
    })
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setUserMenuOpen(false)
    router.refresh()
  }

  const dashboardUrl = DASHBOARD_URL[profile?.role] || '/dashboard/homeowner'
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Me'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-[#1877F2] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">3</span>
            </div>
            <span className="font-black text-[#1a1a2e] text-lg tracking-tight hidden sm:block">
              360<span className="text-[#1877F2]">Everywhere</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(item => (
              <Link key={item.href} href={item.href}
                className="px-3 py-2 text-[#444] hover:text-[#1877F2] text-sm font-semibold transition-colors rounded-lg hover:bg-[#f0f7ff]">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user && profile ? (
              /* LOGGED IN STATE */
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border border-gray-200 hover:border-[#1877F2] hover:bg-[#f0f7ff] transition-all">
                  <div className="w-7 h-7 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold text-xs flex-shrink-0 overflow-hidden">
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : firstName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-[#1a1a2e] hidden sm:block max-w-[80px] truncate">{firstName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 bg-[#f8f9fa] border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold overflow-hidden flex-shrink-0">
                          {profile.avatar_url
                            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            : firstName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#1a1a2e] text-sm truncate">{profile.full_name || firstName}</div>
                          <div className="text-[#9ca3af] text-xs truncate">{user.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* My Dashboard — top prominent link */}
                    <Link href={dashboardUrl} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-[#e7f0fd] hover:bg-[#1877F2] text-[#1877F2] hover:text-white transition-all border-b border-gray-100 group">
                      <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-sm">My Dashboard</div>
                        <div className="text-[10px] opacity-70 group-hover:opacity-90">Equity, mortgage, home value</div>
                      </div>
                    </Link>

                    {/* Menu items */}
                    <div className="py-1.5">
                      {[
                        { icon: Heart,       label: 'Favorites',       href: '/placeholder' },
                        { icon: Search,      label: 'Saved Searches',  href: '/placeholder' },
                        { icon: Home,        label: 'My Homes',        href: `${dashboardUrl}` },
                        { icon: MessageSquare, label: 'Messages',      href: '/dashboard/homeowner/messages' },
                        { icon: UserCheck,   label: 'My Connections',  href: '/dashboard/homeowner/connections' },
                        { icon: Star,        label: 'Reviews',         href: '/placeholder' },
                      ].map(item => (
                        <Link key={item.label} href={item.href} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#444] hover:text-[#1877F2] hover:bg-[#f0f7ff] transition-all text-sm">
                          <item.icon className="w-4 h-4 flex-shrink-0 text-[#9ca3af]" />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Settings + Sign out */}
                    <div className="border-t border-gray-100 py-1.5">
                      <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[#444] hover:text-[#1877F2] hover:bg-[#f0f7ff] transition-all text-sm">
                        <Settings className="w-4 h-4 flex-shrink-0 text-[#9ca3af]" />
                        Account Settings
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[#444] hover:text-red-500 hover:bg-red-50 transition-all text-sm">
                        <LogOut className="w-4 h-4 flex-shrink-0 text-[#9ca3af]" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* LOGGED OUT STATE */
              <div className="flex items-center gap-2">
                <Link href="/dashboard/homeowner"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#444] hover:text-[#1877F2] hover:bg-[#f0f7ff] rounded-lg transition-all">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  My Dashboard
                </Link>
                <Link href="/auth/login"
                  className="px-3 py-2 text-sm font-semibold text-[#1a1a2e] hover:text-[#1877F2] transition-colors">
                  Log In
                </Link>
                <Link href="/auth/signup"
                  className="px-4 py-2 bg-[#1877F2] hover:bg-[#1665d8] text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-[#444] ml-1">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-semibold text-[#444] hover:text-[#1877F2] transition-colors">
              {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
            {user ? (
              <>
                <Link href={dashboardUrl} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2.5 text-sm font-bold text-[#1877F2]">
                  <LayoutDashboard className="w-4 h-4" /> My Dashboard
                </Link>
                <button onClick={handleLogout} className="block py-2.5 text-sm font-semibold text-red-500">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/dashboard/homeowner" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2.5 text-sm font-semibold text-[#1877F2]">
                  <LayoutDashboard className="w-4 h-4" /> My Dashboard
                </Link>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-semibold text-[#444]">Log In</Link>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-bold text-[#1877F2]">Sign Up Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
