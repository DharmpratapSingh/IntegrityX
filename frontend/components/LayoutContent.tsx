'use client'

import { usePathname } from 'next/navigation'
import MainNav from '@/components/MainNav'
import { SimpleToastContainer as ToastContainer } from '@/components/ui/simple-toast'
import { ForceAuth } from '@/components/ForceAuth'
import { SessionManager } from '@/components/SessionManager'

export function LayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()

  // Check if current route is public
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname === '/landing'

  return (
    <ForceAuth>
      <SessionManager />
      {!isPublicRoute && <MainNav />}
      <main className={isPublicRoute ? "" : "min-h-screen bg-gray-50"}>
        {children}
      </main>
      <ToastContainer />
    </ForceAuth>
  )
}

