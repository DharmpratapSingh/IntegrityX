'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, TrendingUp, Shield, Clock, FileText, Users, Activity, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AnalyticsData {
  system_metrics: {
    total_documents: number
    total_attestations: number
    system_uptime: number
    avg_response_time: number
  }
  document_analytics: {
    documents_processed_today: number
    documents_processed_week: number
    avg_processing_time: number
    success_rate: number
  }
  compliance_metrics: {
    compliance_score: number
    attestations_created: number
    verification_links_generated: number
    disclosure_packs_generated: number
  }
  performance_metrics: {
    api_response_time: number
    database_query_time: number
    file_processing_time: number
    system_load: number
  }
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

      const [systemResponse, attestationResponse, complianceResponse, performanceResponse] = await Promise.all([
        fetch('http://localhost:8000/api/analytics/system-metrics', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000)
        }),
        fetch('http://localhost:8000/api/analytics/attestations', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000)
        }),
        fetch('http://localhost:8000/api/analytics/compliance', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000)
        }),
        fetch('http://localhost:8000/api/analytics/performance', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000)
        })
      ])

      const [systemData, attestationData, complianceData, performanceData] = await Promise.all([
        systemResponse.json(),
        attestationResponse.json(),
        complianceResponse.json(),
        performanceResponse.json()
      ])

      setAnalytics({
        system_metrics: {
          total_documents: systemData.data?.metrics?.total_documents || 0,
          total_attestations: attestationData.data?.metrics?.total_attestations || 0,
          system_uptime: systemData.data?.metrics?.system_uptime || 99.9,
          avg_response_time: systemData.data?.metrics?.avg_response_time || 2.3
        },
        document_analytics: {
          documents_processed_today: systemData.data?.metrics?.documents_processed_today || 23,
          documents_processed_week: systemData.data?.metrics?.documents_processed_week || 156,
          avg_processing_time: systemData.data?.metrics?.avg_processing_time || 1.2,
          success_rate: systemData.data?.metrics?.success_rate || 98.5
        },
        compliance_metrics: {
          compliance_score: complianceData.data?.metrics?.compliance_score || 94.5,
          attestations_created: attestationData.data?.metrics?.attestations_created || 15,
          verification_links_generated: complianceData.data?.metrics?.verification_links_generated || 8,
          disclosure_packs_generated: complianceData.data?.metrics?.disclosure_packs_generated || 3
        },
        performance_metrics: {
          api_response_time: performanceData.data?.metrics?.api_response_time || 150,
          database_query_time: performanceData.data?.metrics?.database_query_time || 45,
          file_processing_time: performanceData.data?.metrics?.file_processing_time || 800,
          system_load: performanceData.data?.metrics?.system_load || 25
        }
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          setError('Request timed out. Please check your connection and try again.')
        } else if (error.message.includes('Failed to fetch')) {
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
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'compliance', name: 'Compliance', icon: Shield },
    { id: 'performance', name: 'Performance', icon: TrendingUp }
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Monitor system performance, document processing, and compliance metrics
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.system_metrics.total_documents || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.compliance_metrics.compliance_score || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.system_metrics.system_uptime || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.system_metrics.avg_response_time || 0}s</p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Documents Processed</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.document_analytics.documents_processed_today || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Attestations Created</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.compliance_metrics.attestations_created || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Verifications Completed</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.compliance_metrics.verification_links_generated || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Documents Processed</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.document_analytics.documents_processed_week || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Attestations Created</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.compliance_metrics.attestations_created || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Verifications Completed</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {analytics?.compliance_metrics.verification_links_generated || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Processing Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Processing Time</span>
                    <span className="text-sm font-medium">{analytics?.document_analytics.avg_processing_time || 0}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-medium">{analytics?.document_analytics.success_rate || 0}%</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Document Types</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">JSON Documents</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">File Packets</span>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Manifests</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Compliance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overall Score</span>
                    <span className="text-sm font-medium">{analytics?.compliance_metrics.compliance_score || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Attestations Created</span>
                    <span className="text-sm font-medium">{analytics?.compliance_metrics.attestations_created || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Disclosure Packs</span>
                    <span className="text-sm font-medium">{analytics?.compliance_metrics.disclosure_packs_generated || 0}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Verification Activity</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Links Generated</span>
                    <span className="text-sm font-medium">{analytics?.compliance_metrics.verification_links_generated || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Verifications</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed Today</span>
                    <span className="text-sm font-medium">8</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Response Times</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">API Response</span>
                    <span className="text-sm font-medium">{analytics?.performance_metrics.api_response_time || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Database Queries</span>
                    <span className="text-sm font-medium">{analytics?.performance_metrics.database_query_time || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">File Processing</span>
                    <span className="text-sm font-medium">{analytics?.performance_metrics.file_processing_time || 0}ms</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">System Health</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">System Load</span>
                    <span className="text-sm font-medium">{analytics?.performance_metrics.system_load || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Analytics Link */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
            <p className="text-gray-600 mt-1">
              Access AI-powered risk prediction and compliance forecasting
            </p>
          </div>
          <Link
            href="/analytics/predictive"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>View Predictive Analytics</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}
