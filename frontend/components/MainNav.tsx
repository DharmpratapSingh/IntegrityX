'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Menu, X, Home, Upload, FileText, BarChart3, Shield, Search } from 'lucide-react'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { Input } from '@/components/ui/input'

export default function MainNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/integrated-dashboard', icon: Home },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Verification', href: '/verification', icon: Shield },
    { name: 'Security', href: '/security', icon: Shield },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ]

  const isActive = (href: string) => {
    if (href === '/integrated-dashboard') {
      return pathname === '/integrated-dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white/95 dark:bg-black/95 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/integrated-dashboard" className="flex items-center space-x-3 transition-smooth hover:opacity-80">
              <div className="w-10 h-10 bg-elite-blue rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="font-bold text-2xl text-elite-dark dark:text-white">IntegrityX</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Search, User Controls */}
          <div className="flex items-center space-x-3">
            {/* Search Bar - Desktop only */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-48 lg:w-64 rounded-lg border-gray-200 bg-gray-50 pl-9 pr-4 text-sm transition-smooth focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:w-72 dark:bg-gray-900 dark:border-gray-700"
              />
            </div>

            {/* User Button, Dark Mode Toggle, and Mobile Menu */}
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* User Button */}
            <UserButton />

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-smooth"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-smooth ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
