import React from 'react'
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

type SecurityStatus = 'verified' | 'pending' | 'failed' | 'warning'

interface SecurityBadgeProps {
  status: SecurityStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function SecurityBadge({ status, showIcon = true, size = 'md' }: SecurityBadgeProps) {
  const styles = {
    verified: {
      gradient: 'bg-gradient-to-r from-green-400 to-emerald-500',
      icon: CheckCircle,
      text: 'Blockchain Verified',
      glow: 'shadow-lg shadow-green-500/50'
    },
    pending: {
      gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      icon: Clock,
      text: 'Verification Pending',
      glow: 'shadow-lg shadow-yellow-500/50'
    },
    failed: {
      gradient: 'bg-gradient-to-r from-red-400 to-pink-500',
      icon: XCircle,
      text: 'Verification Failed',
      glow: 'shadow-lg shadow-red-500/50'
    },
    warning: {
      gradient: 'bg-gradient-to-r from-orange-400 to-red-400',
      icon: AlertCircle,
      text: 'Review Required',
      glow: 'shadow-lg shadow-orange-500/50'
    }
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }
  
  const config = styles[status]
  const Icon = config.icon
  
  return (
    <div className={`${config.gradient} ${config.glow} ${sizeClasses[size]} text-white rounded-full font-semibold inline-flex items-center gap-2 transition-all duration-300 hover:scale-105`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.text}</span>
    </div>
  )
}



