import React from 'react'

interface GradientLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function GradientLoader({ size = 'md', text }: GradientLoaderProps) {
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }
  
  return (
    <div className="w-full space-y-2">
      {text && (
        <p className="text-sm text-gray-600 text-center">{text}</p>
      )}
      <div className={`relative w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-shimmer" 
             style={{ width: '50%' }} />
      </div>
    </div>
  )
}
















