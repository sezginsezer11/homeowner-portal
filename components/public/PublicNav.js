'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown } from 'lucide-react'

export default function PublicNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-[#1877F2] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">3</span>
            </div>
            <span className="font-black text-[#1a1a2e] text-lg tracking-tight">360<span className="text-[#1877F2]">Everywhere</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: 'Buy',            href: '/buy' },
              { label: 'Sell',           href: '/sell' },
              { label: 'Rent',           href: '/rent' },
              { label: 'Mortgage',       href: '/mortgage' },
              { label: 'My Home Value',  href: '/dashboard/homeowner' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="text-[#444] hover:text-[#1877F2] text-sm font-medium transition-colors">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login"
              className="text-sm font-semibold text-[#1a1a2e] hover:text-[#1877F2] transition-colors">
              Log In
            </Link>
            <Link href="/auth/signup"
              className="px-4 py-2 bg-[#1877F2] hover:bg-[#1665d8] text-white text-sm font-bold rounded-lg transition-colors">
              Sign Up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-[#444]">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {[
            { label: 'Buy', href: '/buy' },
            { label: 'Sell', href: '/sell' },
            { label: 'Rent', href: '/rent' },
            { label: 'Mortgage', href: '/mortgage' },
            { label: 'My Home Value', href: '/dashboard/homeowner' },
            { label: 'Log In', href: '/auth/login' },
            { label: 'Sign Up Free', href: '/auth/signup' },
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-medium text-[#444] hover:text-[#1877F2] transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
