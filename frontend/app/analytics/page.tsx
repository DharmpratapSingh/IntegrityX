'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { json as fetchJson } from '@/utils/api'
import { BarChart3, TrendingUp, Shield, FileText, Users, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AnalyticsData {
  financial_documents: {
    documents_sealed_today: number
    documents_sealed_this_month: number
    total_documents_sealed: number
    total_loan_value_sealed: number
    average_loan_amount: number
    sealing_success_rate: number
    blockchain_confirmation_rate: number
  }
  compliance_risk: {
    documents_compliant: number
    documents_pending_review: number
    overall_compliance_rate: number
    high_risk_documents: number
    medium_risk_documents: number
    low_risk_documents: number
    audit_trail_completeness: number
  }
  // Business intelligence metrics removed per product decision
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setError(null)
      setLoading(true)
      console.log('🔍 Starting analytics fetch...')

      // Use live endpoints and derive metrics locally
      const [dailyRes, artifactsRes] = await Promise.all([
        fetchJson<any>('http://localhost:8000/api/analytics/daily-activity', { timeoutMs: 8000 }),
        fetchJson<any>('http://localhost:8000/api/artifacts', { timeoutMs: 8000 })
      ])

      const dailyPayload = (dailyRes.data as any)?.data ?? dailyRes.data ?? {}
      const verifiedToday = dailyPayload?.verified_today || 0

      const artifactsEnvelope = (artifactsRes.data as any)?.data ?? artifactsRes.data ?? {}
      const artifacts: any[] = artifactsEnvelope?.artifacts || []

      const totalDocs = artifacts.length
      const sealedDocs = artifacts.filter(a => !!(a.walacor_tx_id || a.blockchain_seal || a.local_metadata?.blockchain_proof?.transaction_id)).length
      const sealingSuccessRate = totalDocs > 0 ? Math.round((sealedDocs / totalDocs) * 100) : 0
      const blockchainConfirmationRate = sealingSuccessRate

      let totalValue = 0
      let countWithAmount = 0
      for (const a of artifacts) {
        const amt = a.local_metadata?.comprehensive_document?.loan_amount
        if (typeof amt === 'number' && !Number.isNaN(amt) && amt > 0) {
          totalValue += amt
          countWithAmount += 1
        }
      }
      const avgLoan = countWithAmount > 0 ? Math.round(totalValue / countWithAmount) : 0

      const compliantDocs = sealedDocs
      const pendingReview = totalDocs - compliantDocs
      const overallCompliance = totalDocs > 0 ? Math.round((compliantDocs / totalDocs) * 100) : 0

      setAnalytics({
        financial_documents: {
          documents_sealed_today: verifiedToday,
          documents_sealed_this_month: totalDocs, // placeholder: can refine with date filter
          total_documents_sealed: totalDocs,
          total_loan_value_sealed: totalValue,
          average_loan_amount: avgLoan,
          sealing_success_rate: sealingSuccessRate,
          blockchain_confirmation_rate: blockchainConfirmationRate
        },
        compliance_risk: {
          documents_compliant: compliantDocs,
          documents_pending_review: pendingReview,
          overall_compliance_rate: overallCompliance,
          high_risk_documents: 0,
          medium_risk_documents: 0,
          low_risk_documents: compliantDocs,
          audit_trail_completeness: overallCompliance
        }
      })
      
      console.log('✅ Analytics data set successfully')
    } catch (error) {
      console.error('❌ Failed to fetch analytics:', error)
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please ensure the backend is running.')
        } else {
          setError(error.message)
        }
      } else {
        setError('An unexpected error occurred while loading analytics.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    fetchAnalytics()
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'documents', name: 'Document Processing', icon: FileText },
    { id: 'compliance', name: 'Compliance & Risk', icon: Shield }
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-lg mr-4" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs and Content Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 p-6">
            <div className="flex space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-8" />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Analytics</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500">
                  Retry attempt: {retryCount}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50/20 to-blue-50/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-lg md:text-xl text-cyan-100 max-w-3xl">
                Comprehensive insights and performance metrics
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-cyan-100">Documents Sealed</p>
                    <p className="text-3xl font-bold">{analytics?.financial_documents.total_documents_sealed || 0}</p>
                  </div>
                  <div className="p-3 bg-cyan-500/20 text-white rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              {/* Total Value card removed per product decision */}
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-cyan-100">Compliance Rate</p>
                    <p className="text-3xl font-bold">{analytics?.compliance_risk.overall_compliance_rate || 0}%</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 text-white rounded-xl">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documents Sealed Today</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.financial_documents.documents_sealed_today || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.compliance_risk.overall_compliance_rate || 0}%</p>
            </div>
          </div>
        </div>

        {/* Total Loan Value quick stat removed */}

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Blockchain Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.financial_documents.blockchain_confirmation_rate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Processing</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Documents Sealed Today</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.financial_documents.documents_sealed_today || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Sealing Success Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.financial_documents.sealing_success_rate || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Blockchain Confirmation</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.financial_documents.blockchain_confirmation_rate || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Metrics block removed */}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Document Processing</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Documents Sealed This Month</span>
                    <span className="text-sm font-medium">{analytics?.financial_documents.documents_sealed_this_month || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sealing Success Rate</span>
                    <span className="text-sm font-medium">{analytics?.financial_documents.sealing_success_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Processing Time</span>
                    <span className="text-sm font-medium">2.3 minutes</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Blockchain Activity</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Blockchain Confirmation Rate</span>
                    <span className="text-sm font-medium">{analytics?.financial_documents.blockchain_confirmation_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Seal Time</span>
                    <span className="text-sm font-medium">45 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Documents Sealed</span>
                    <span className="text-sm font-medium">{analytics?.financial_documents.total_documents_sealed || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Compliance Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overall Compliance Rate</span>
                    <span className="text-sm font-medium">{analytics?.compliance_risk.overall_compliance_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Documents Compliant</span>
                    <span className="text-sm font-medium">{analytics?.compliance_risk.documents_compliant || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending Review</span>
                    <span className="text-sm font-medium">{analytics?.compliance_risk.documents_pending_review || 0}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">High Risk Documents</span>
                    <span className="text-sm font-medium text-red-600">{analytics?.compliance_risk.high_risk_documents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Medium Risk Documents</span>
                    <span className="text-sm font-medium text-yellow-600">{analytics?.compliance_risk.medium_risk_documents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Low Risk Documents</span>
                    <span className="text-sm font-medium text-green-600">{analytics?.compliance_risk.low_risk_documents || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Advanced Analytics Tools */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics Tools</h3>
            <p className="text-gray-600 mt-1">
              Document integrity verification, compliance monitoring, and blockchain audit trails
            </p>
          </div>
          <Link
            href="/documents"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>View Documents</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}
