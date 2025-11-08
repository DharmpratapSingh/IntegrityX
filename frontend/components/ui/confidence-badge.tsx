'use client'

import { Badge } from '@/components/ui/badge'
import { HelpCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ConfidenceBadgeProps {
  confidence: number // 0-100
  source?: 'backend_ai' | 'frontend_fallback' | 'user_input'
  extractedFrom?: string
  className?: string
  showIcon?: boolean
  compact?: boolean
}

export function ConfidenceBadge({
  confidence,
  source = 'frontend_fallback',
  extractedFrom,
  className = '',
  showIcon = true,
  compact = false
}: ConfidenceBadgeProps) {
  const getColor = () => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-300'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (confidence >= 40) return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  const getIcon = () => {
    if (confidence >= 80) return <CheckCircle className="w-3 h-3" />
    if (confidence >= 60) return <HelpCircle className="w-3 h-3" />
    if (confidence >= 40) return <AlertTriangle className="w-3 h-3" />
    return <XCircle className="w-3 h-3" />
  }

  const getText = () => {
    if (confidence >= 80) return compact ? 'High' : 'High Confidence'
    if (confidence >= 60) return compact ? 'Med' : 'Medium Confidence'
    if (confidence >= 40) return compact ? 'Low' : 'Low Confidence'
    return compact ? 'Very Low' : 'Very Low Confidence'
  }

  const getTooltipText = () => {
    const sourceText = source === 'backend_ai' ? 'AI-extracted' : source === 'user_input' ? 'User input' : 'Auto-detected'
    const extractionInfo = extractedFrom ? ` from field: ${extractedFrom}` : ''

    if (confidence >= 80) {
      return `${sourceText} with high confidence (${confidence}%)${extractionInfo}. This value is likely accurate.`
    } else if (confidence >= 60) {
      return `${sourceText} with medium confidence (${confidence}%)${extractionInfo}. Please verify this value.`
    } else if (confidence >= 40) {
      return `${sourceText} with low confidence (${confidence}%)${extractionInfo}. Review and correct if needed.`
    }
    return `${sourceText} with very low confidence (${confidence}%)${extractionInfo}. This field requires manual input.`
  }

  if (confidence === 0) {
    return null // Don't show badge if no confidence
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${getColor()} text-xs font-medium border ${className}`}
          >
            {showIcon && <span className="mr-1">{getIcon()}</span>}
            <span>{getText()}</span>
            {!compact && <span className="ml-1 opacity-70">({confidence}%)</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ConfidenceIndicatorProps {
  confidence: number
  className?: string
}

export function ConfidenceIndicator({ confidence, className = '' }: ConfidenceIndicatorProps) {
  const getColor = () => {
    if (confidence >= 80) return 'bg-green-500'
    if (confidence >= 60) return 'bg-yellow-500'
    if (confidence >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 min-w-[40px]">
        {confidence}%
      </span>
    </div>
  )
}

interface FieldConfidenceWrapperProps {
  confidence: number
  source?: 'backend_ai' | 'frontend_fallback' | 'user_input'
  extractedFrom?: string
  children: React.ReactNode
  highlightLowConfidence?: boolean
}

export function FieldConfidenceWrapper({
  confidence,
  source,
  extractedFrom,
  children,
  highlightLowConfidence = true
}: FieldConfidenceWrapperProps) {
  const shouldHighlight = highlightLowConfidence && confidence < 60 && confidence > 0

  return (
    <div className="relative">
      {children}
      {confidence > 0 && (
        <div className="absolute -top-2 right-0">
          <ConfidenceBadge
            confidence={confidence}
            source={source}
            extractedFrom={extractedFrom}
            compact
            showIcon={false}
          />
        </div>
      )}
      {shouldHighlight && (
        <div className="absolute inset-0 border-2 border-yellow-400 rounded-md pointer-events-none animate-pulse" />
      )}
    </div>
  )
}
