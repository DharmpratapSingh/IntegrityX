'use client'

import React from 'react'
import { Shield, Lock, CheckCircle, Users, Award, Zap } from 'lucide-react'

interface TrustSignal {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  description?: string
}

interface TrustSignalsProps {
  signals?: TrustSignal[]
  title?: string
  subtitle?: string
}

export default function TrustSignals({ 
  signals,
  title = "Trusted by Financial Institutions Worldwide",
  subtitle = "Bank-grade security and compliance you can rely on"
}: TrustSignalsProps) {
  const defaultSignals: TrustSignal[] = [
    { 
      icon: Shield, 
      label: '99.9% Uptime', 
      value: 'Guaranteed',
      description: 'Enterprise-grade reliability'
    },
    { 
      icon: Lock, 
      label: 'Bank-Grade', 
      value: 'Encryption',
      description: '256-bit AES encryption'
    },
    { 
      icon: CheckCircle, 
      label: 'SOC 2', 
      value: 'Compliant',
      description: 'Type II certified'
    },
    { 
      icon: Users, 
      label: '10,000+', 
      value: 'Documents',
      description: 'Verified daily'
    },
    { 
      icon: Award, 
      label: 'ISO 27001', 
      value: 'Certified',
      description: 'Information security'
    },
    { 
      icon: Zap, 
      label: '<100ms', 
      value: 'Response',
      description: 'Lightning fast'
    }
  ]
  
  const displaySignals = signals || defaultSignals
  
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      
      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="text-gray-600 text-lg">{subtitle}</p>
        </div>
        
        {/* Trust signals grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {displaySignals.map((signal, i) => {
            const Icon = signal.icon
            return (
              <div key={i} className="group relative">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                
                {/* Card */}
                <div className="relative bg-white rounded-2xl p-6 text-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2 border border-gray-100">
                  {/* Icon */}
                  <div className="mb-3 flex justify-center">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Value */}
                  <p className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {signal.value}
                  </p>
                  
                  {/* Label */}
                  <p className="text-sm font-semibold text-gray-900 mb-1">{signal.label}</p>
                  
                  {/* Description */}
                  {signal.description && (
                    <p className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {signal.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Bottom decoration */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">
              Blockchain-verified security
            </span>
            <span className="text-green-600">✓</span>
          </div>
        </div>
      </div>
    </section>
  )
}
















