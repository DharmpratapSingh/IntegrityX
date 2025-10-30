import React from 'react'

interface GradientProgressRingProps {
  progress: number
  label: string
  size?: 'sm' | 'md' | 'lg'
  colors?: {
    start: string
    middle: string
    end: string
  }
}

export function GradientProgressRing({ 
  progress, 
  label, 
  size = 'md',
  colors = { start: '#3b82f6', middle: '#8b5cf6', end: '#ec4899' }
}: GradientProgressRingProps) {
  const sizes = {
    sm: { container: 'w-24 h-24', svg: 'w-24 h-24', center: 48, radius: 40, text: 'text-xl' },
    md: { container: 'w-32 h-32', svg: 'w-32 h-32', center: 64, radius: 56, text: 'text-3xl' },
    lg: { container: 'w-40 h-40', svg: 'w-40 h-40', center: 80, radius: 72, text: 'text-4xl' }
  }
  
  const { container, svg, center, radius, text } = sizes[size]
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress / 100)
  
  return (
    <div className={`relative ${container}`}>
      <svg className={`transform -rotate-90 ${svg}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200"
        />
        {/* Gradient circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="50%" stopColor={colors.middle} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className={`${text} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
          {Math.round(progress)}%
        </span>
        <span className="text-xs text-gray-600 text-center px-2">{label}</span>
      </div>
    </div>
  )
}



