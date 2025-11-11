'use client'

import { usePathname } from 'next/navigation'
import MainNav from '@/components/MainNav'
import { SimpleToastContainer as ToastContainer } from '@/components/ui/simple-toast'
import { SessionManager } from '@/components/SessionManager'

export function LayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()

  // Check if current route is public
  // Must match middleware.ts public routes
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/landing') ||
    pathname.startsWith('/redirect')

  return (
    <>
      <SessionManager />
      {/* Top navigation removed - using left sidebar navigation in DashboardLayout instead */}
      {/* {!isPublicRoute && <MainNav />} */}
      <main className={isPublicRoute ? "" : "min-h-screen bg-[#F8F7F4] dark:bg-black"}>
        {children}
      </main>
      <ToastContainer />
    </>
  )
}

