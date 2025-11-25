'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import { Home, Upload, FileText, BarChart3, Shield, Brain, CheckCircle } from 'lucide-react'
import WalacorLogo from '@/assets/walacor-logo.png'

interface DashboardLayoutProps {
  children: ReactNode
  rightSidebar?: ReactNode
}

export function DashboardLayout({ children, rightSidebar }: DashboardLayoutProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/integrated-dashboard', icon: Home },
    { name: 'Upload Documents', href: '/upload', icon: Upload },
    { name: 'All Documents', href: '/documents', icon: FileText },
    { name: 'Verification', href: '/verification', icon: CheckCircle },
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
    <div className="flex min-h-screen bg-[#F8F7F4] dark:bg-black">
      {/* Left Sidebar - Navigation */}
      <aside className="hidden lg:flex lg:flex-col w-64 xl:w-72 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/integrated-dashboard" className="flex items-center space-x-3 transition-smooth hover:opacity-80">
              <div className="flex flex-col">
                <span className="font-heading text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                  IntegrityX
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Powered by
                  </span>
                  <div className="relative bg-gray-900 dark:bg-transparent px-2.5 py-1 rounded" style={{ height: '20px', display: 'inline-flex', alignItems: 'center' }}>
                    <Image 
                      src={WalacorLogo} 
                      alt="Walacor" 
                      width={80}
                      height={24}
                      className="h-[16px] w-auto object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </Link>
          </div>


          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-smooth ${
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/upload"
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Upload className="h-3 w-3" />
                Upload Document
              </Link>
              <Link
                href="/verification"
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <CheckCircle className="h-3 w-3" />
                Verify Document
              </Link>
            </div>
          </div>

          {/* User Profile at Bottom */}
          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  My Account
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Manage settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-8 md:px-8 lg:px-10 overflow-x-hidden">
        {children}
      </main>

      {/* Right Sidebar - Conditional */}
      {rightSidebar && (
        <aside className="hidden xl:flex xl:flex-col w-80 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 sticky top-0 h-screen overflow-y-auto">
          {rightSidebar}
        </aside>
      )}
    </div>
  )
}
