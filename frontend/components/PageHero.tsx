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
    <div className={`relative overflow-hidden bg-gradient-to-r ${gradientClass} text-white`}>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {title}
            </h1>
            
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
              {subtitle}
            </p>
          </div>

          {stats && stats.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3 pt-4">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-100">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`p-3 ${iconColorClass} rounded-xl`}>
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

