'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// List of public routes that don't require authentication
const publicRoutes = ['/sign-in', '/sign-up', '/landing']

export function ForceAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    const isPublicRoute = publicRoutes.includes(pathname || '')

    // If on public route, allow access
    if (isPublicRoute) {
      setCheckingAuth(false)
      return
    }

    // For private routes: require authentication
    // If not signed in, redirect to sign-in
    if (!isSignedIn && !isPublicRoute) {
      router.push('/sign-in')
      return
    }

    // Signed in on private route - allow access
    if (isSignedIn && !isPublicRoute) {
      setCheckingAuth(false)
      return
    }

    setCheckingAuth(false)
  }, [isLoaded, isSignedIn, pathname, router])

  // Show loading during auth check or if not authenticated on private route
  if (checkingAuth || (!isSignedIn && !publicRoutes.includes(pathname || ''))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
