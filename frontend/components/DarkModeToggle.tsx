'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * DarkModeToggle - Simple toggle for OLED black dark mode
 *
 * Provides a clean toggle between light and dark modes.
 * Uses localStorage to persist user preference.
 * Applies 'dark' class to document root for Tailwind dark mode support.
 */
export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check localStorage and system preference
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    const shouldBeDark = stored === 'dark' || (!stored && prefersDark)
    setIsDark(shouldBeDark)

    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newValue = !isDark

    setIsDark(newValue)
    localStorage.setItem('theme', newValue ? 'dark' : 'light')

    if (newValue) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <div className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="relative hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-gray-300 hover:text-white transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 hover:text-elite-blue transition-colors" />
      )}
    </Button>
  )
}
