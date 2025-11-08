import React from 'react'
import { LucideIcon } from 'lucide-react'

interface Stat {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
}

interface PageHeroProps {
  title: string
  subtitle: string
  stats?: Stat[]
  accentColor?: 'blue' | 'purple' | 'green' | 'cyan' | 'pink'
}

const gradientMap = {
  blue: 'from-blue-600 via-blue-500 to-purple-600',
  purple: 'from-purple-600 via-purple-500 to-blue-600',
  green: 'from-green-600 via-emerald-500 to-cyan-600',
  cyan: 'from-cyan-600 via-blue-500 to-purple-600',
  pink: 'from-pink-600 via-purple-500 to-blue-600',
}

const iconColorMap = {
  blue: 'bg-blue-500/20 text-white',
  purple: 'bg-purple-500/20 text-white',
  green: 'bg-green-500/20 text-white',
  cyan: 'bg-cyan-500/20 text-white',
  pink: 'bg-pink-500/20 text-white',
}

export function PageHero({ title, subtitle, stats, accentColor = 'blue' }: PageHeroProps) {
  const gradientClass = gradientMap[accentColor]
  const iconColorClass = iconColorMap[accentColor]

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradientClass} text-white`}>
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-size-200 animate-gradient-shift"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      {/* Floating gradient orbs */}
      <div className="absolute top-10 right-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute bottom-10 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              {title}
            </h1>
            
            <p className="text-lg md:text-xl text-blue-50 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          {stats && stats.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3 pt-4">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-100">{stat.label}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">{stat.value}</p>
                    </div>
                    <div className={`p-3 ${iconColorClass} rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




