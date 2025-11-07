'use client'

import React from 'react'
import { FileText, Shield, CheckCircle2 } from 'lucide-react'

interface VerificationScannerProps {
  isScanning: boolean
  status?: 'idle' | 'scanning' | 'complete' | 'error'
  documentName?: string
}

export function VerificationScanner({ 
  isScanning, 
  status = 'idle',
  documentName = 'Document'
}: VerificationScannerProps) {
  const statusConfig = {
    idle: {
      icon: FileText,
      text: 'Ready to Verify',
      color: 'text-gray-400',
      gradient: 'from-gray-400 to-gray-500'
    },
    scanning: {
      icon: Shield,
      text: 'Scanning Document...',
      color: 'text-blue-500',
      gradient: 'from-blue-500 to-purple-600'
    },
    complete: {
      icon: CheckCircle2,
      text: 'Verification Complete',
      color: 'text-green-500',
      gradient: 'from-green-400 to-emerald-500'
    },
    error: {
      icon: FileText,
      text: 'Verification Failed',
      color: 'text-red-500',
      gradient: 'from-red-400 to-pink-500'
    }
  }
  
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-8 shadow-lg">
      {/* Document preview area */}
      <div className="relative min-h-[200px] flex items-center justify-center">
        <Icon className={`h-32 w-32 ${config.color} transition-all duration-300`} />
        
        {/* Scanning line effect */}
        {isScanning && status === 'scanning' && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />
          </div>
        )}
        
        {/* Glow effect when scanning */}
        {isScanning && (
          <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-10 blur-3xl animate-pulse`} />
        )}
      </div>
      
      {/* Status text */}
      <div className="text-center mt-6 space-y-2">
        <p className={`font-semibold text-lg bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
          {config.text}
        </p>
        {documentName && status !== 'idle' && (
          <p className="text-sm text-gray-600">{documentName}</p>
        )}
        
        {/* Progress indicator */}
        {isScanning && status === 'scanning' && (
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${config.gradient} animate-shimmer relative`} style={{ width: '100%' }} />
          </div>
        )}
      </div>
      
      {/* Security badge overlay */}
      {status === 'complete' && (
        <div className="absolute top-4 right-4">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            ✓ Verified
          </div>
        </div>
      )}
    </div>
  )
}














