'use client'

import { useAuth } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// List of public routes that don't require authentication
const publicRoutes = ['/', '/sign-in', '/sign-up', '/sign-out', '/landing', '/redirect']

export function ForceAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  const pathname = usePathname()

  // Determine if we're on a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname?.startsWith(route + '/')
  )

  // Show loading only during initial Clerk load
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow public routes without check
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For private routes, show if signed in, otherwise middleware will redirect
  if (isSignedIn) {
    return <>{children}</>
  }

  // Not signed in on private route - show loading while middleware redirects
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  )
}
