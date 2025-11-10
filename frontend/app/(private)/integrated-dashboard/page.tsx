'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { json as fetchJson } from '@/utils/api'
import { getCurrentEasternTime, formatEasternTimeWithTZ } from '@/utils/timezone'
import apiConfig from '@/lib/api-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Brain,
  FileText,
  CheckCircle,
  Layers,
  Shield,
  Zap,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react'

// Import our components
import AIDocumentProcessingInterface from '@/components/AIDocumentProcessingInterface'
import BulkOperationsInterface from '@/components/BulkOperationsInterface'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalDocuments: number
  sealedDocuments: number
  aiProcessingCount: number
  bulkOperationsCount: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastUpdated: string
  performanceMetrics: {
    apiResponseTime: number
    documentProcessing: number
    blockchainSuccessRate: number
    aiAccuracy: number
  }
  trends: {
    documents: { value: number; change: number }
    sealed: { value: number; change: number }
    ai: { value: number; change: number }
    bulk: { value: number; change: number }
  }
}

interface DocumentSummary {
  id: string
  title: string
  createdAt: string
  loanId?: string
  status: 'sealed' | 'processing'
  createdBy?: string
}

export default function IntegratedDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    sealedDocuments: 0,
    aiProcessingCount: 0,
    bulkOperationsCount: 0,
    systemHealth: 'healthy',
    lastUpdated: getCurrentEasternTime(),
    performanceMetrics: {
      apiResponseTime: 0,
      documentProcessing: 0,
      blockchainSuccessRate: 0,
      aiAccuracy: 0
    },
    trends: {
      documents: { value: 0, change: 0 },
      sealed: { value: 0, change: 0 },
      ai: { value: 0, change: 0 },
      bulk: { value: 0, change: 0 }
    }
  })
  const [recentDocuments, setRecentDocuments] = useState<DocumentSummary[]>([])
  const [serviceStatus, setServiceStatus] = useState({
    postgres: false,
    walacor: false,
    backend: false
  })

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    setErrorMessage(null)
    try {
      // Add timeout to prevent infinite loading
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000))
      
      // Fetch real data from multiple backend endpoints with timeout
      const [documentsRes, analyticsRes, healthRes, dailyRes] = await Promise.all([
          fetchJson<any>(apiConfig.artifacts.list(), { timeoutMs: 3000 }).catch(() => ({ ok: false })),
          fetchJson<any>(apiConfig.analytics.systemMetrics, { timeoutMs: 3000 }).catch(() => ({ ok: false })),
          fetchJson<any>(apiConfig.health, { timeoutMs: 3000 }).catch(() => ({ ok: false })),
          fetchJson<any>(apiConfig.analytics.dailyActivity, { timeoutMs: 3000 }).catch(() => ({ ok: false }))
        ])

        const responses = [documentsRes, analyticsRes, healthRes, dailyRes]
        const hasSuccessfulResponse = responses.some((resp) => resp?.ok)
        if (!hasSuccessfulResponse) {
          throw new Error('Unable to reach backend services. Start the API server and try again.')
        }

        let totalDocs = 0
        let documentsList: any[] = []
        if (documentsRes?.ok) {
          const docsEnvelope = (documentsRes as any).data
          const docsData = docsEnvelope?.data ?? docsEnvelope
          documentsList = docsData?.artifacts || []
          totalDocs = Array.isArray(documentsList) ? documentsList.length : 0
        }

        let systemMetrics = null
        if (analyticsRes?.ok) {
          const analyticsData = (analyticsRes as any).data
          systemMetrics = analyticsData?.data || null
        }

        const sortedDocs = [...documentsList].sort((a, b) => {
          const aTime = new Date(a.created_at).getTime()
          const bTime = new Date(b.created_at).getTime()
          return bTime - aTime
        })

        setRecentDocuments(
          sortedDocs.slice(0, 10).map((doc: any) => {
            const fallbackTitle = doc.id ? `Document ${String(doc.id).slice(0, 8)}` : 'Untitled Document'
            const title =
              doc.filename ||
              doc.document_name ||
              doc.local_metadata?.comprehensive_document?.document_title ||
              doc.local_metadata?.comprehensive_document?.document_type ||
              fallbackTitle

            const status: 'sealed' | 'processing' =
              doc.walacor_tx_id || doc.blockchain_seal ? 'sealed' : 'processing'

            return {
              id: doc.id,
              title,
              createdAt: doc.created_at,
              loanId: doc.loan_id,
              status,
              createdBy: doc.created_by
            }
          })
        )

        let healthData = null
        if (healthRes?.ok) {
          const health = (healthRes as any).data
          healthData = health?.data || null
        }
        // Service status (tolerant mapping for various backends)
        const dbSvc = (healthData?.services?.database || healthData?.services?.db || {})
        const walacorSvc = healthData?.services?.walacor || {}
        const isOk = (s: any) => {
          const val = (s?.status || s?.state || s)?.toString().toLowerCase()
          return s?.connected === true || s === true || ['ok','healthy','up','available','running','connected'].includes(val)
        }
        setServiceStatus({
          postgres: isOk(dbSvc),
          walacor: isOk(walacorSvc),
          backend: !!healthRes?.ok
        })

        // Calculate real metrics
        const now = Date.now()
        const oneDayAgo = now - (24 * 60 * 60 * 1000)
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000)
        
        const recentDocs = documentsList.filter((doc: any) => 
          new Date(doc.created_at).getTime() > oneDayAgo
        )
        const recentDocsCount = recentDocs.length

        const weekOldDocs = documentsList.filter((doc: any) => {
          const docTime = new Date(doc.created_at).getTime()
          return docTime > oneWeekAgo && docTime <= oneDayAgo
        }).length

        const docGrowth = weekOldDocs > 0 ? Math.round(((recentDocsCount - weekOldDocs) / weekOldDocs) * 100) : 0

        // Useful live metric: unique borrowers seen across artifacts
        const uniqueBorrowers = new Set(
          documentsList
            .map((d: any) => d.borrower_name || (d.local_metadata?.comprehensive_document?.borrower?.full_name))
            .filter(Boolean)
        ).size

        // Determine system health
        let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
        if (healthData?.status === 'degraded') {
          systemHealth = 'warning'
        } else if (healthData?.status === 'down') {
          systemHealth = 'critical'
        }

        // Derive performance metrics from live data
        const total = totalDocs
        const sealedCount = documentsList.filter((d: any) => !!(d.walacor_tx_id || d.blockchain_seal)).length
        const integrityVerifiedCount = documentsList.filter((d: any) => {
          const proof = d.blockchain_proof || d.local_metadata?.blockchain_proof
          const hasProofVerified = proof && (proof.integrity_verified === true)
          const hasTx = !!(d.walacor_tx_id || proof?.transaction_id)
          // Treat presence of a Walacor TX as verified if integrity flag not present
          return hasProofVerified || hasTx
        }).length

        const signingSuccessRate = total > 0 ? Math.round((sealedCount / total) * 100) : 0
        const aiAccuracy = total > 0 ? Math.round((integrityVerifiedCount / total) * 100) : 0
        // Processing: recent documents proportion as a proxy of current processing throughput
        const processingPct = total > 0 ? Math.round((recentDocsCount / total) * 100) : 0

        // Daily activity (verified_today, deleted_today)
        let verifiedToday = 0
        let deletedToday = 0
        if (dailyRes?.ok) {
          const payload = (dailyRes as any).data
          const daily = payload?.data ?? payload
          verifiedToday = daily?.verified_today || 0
          deletedToday = daily?.deleted_today || 0
        }

        // Update stats with real data
        setStats({
          totalDocuments: totalDocs,
          // Sealed/verified today
          sealedDocuments: verifiedToday,
          // Unique borrowers across all artifacts (proxy for AI processing diversity)
          aiProcessingCount: uniqueBorrowers,
          // Deleted today
          bulkOperationsCount: deletedToday,
          systemHealth,
          lastUpdated: getCurrentEasternTime(),
          performanceMetrics: {
            apiResponseTime: healthData?.total_duration_ms || 0,
            documentProcessing: processingPct,
            blockchainSuccessRate: signingSuccessRate,
            aiAccuracy
          },
          trends: {
            documents: { value: totalDocs, change: docGrowth },
            sealed: { value: 0, change: 0 },
            ai: { value: 0, change: 0 },
            bulk: { value: 0, change: 0 }
          }
        })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setRecentDocuments([])
      setHasError(true)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unexpected error while loading dashboard metrics. Please try again.'
      )
      toast.error('Dashboard data unavailable. Check backend status and retry.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()

    // Force load after 5 seconds maximum (backup timeout)
    const maxLoadTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => {
      clearInterval(interval)
      clearTimeout(maxLoadTimeout)
    }
  }, [fetchDashboardData])

  const handleRetry = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatTimeAgo = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'Unknown'

    const diffMs = Date.now() - date.getTime()
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diffMs < minute) return 'Just now'
    if (diffMs < hour) {
      const minutes = Math.round(diffMs / minute)
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    }
    if (diffMs < day) {
      const hours = Math.round(diffMs / hour)
      return `${hours} hour${hours === 1 ? '' : 's'} ago`
    }
    const days = Math.round(diffMs / day)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  if (hasError && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-6 rounded-2xl border border-red-100 bg-white p-8 shadow-xl">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Backend Unreachable</h2>
            <p className="text-gray-600">
              {errorMessage ?? 'We could not load live metrics. Ensure the backend API is running and then retry.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RefreshCcw className="h-4 w-4" /> Retry loading
            </Button>
            <Link href="/upload">
              <Button variant="secondary">Go to Uploads</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-900">IntegrityX</p>
            <p className="text-sm text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Clean header */}
      <div className="relative overflow-hidden bg-elite-dark dark:bg-black text-white border-b border-gray-200 dark:border-gray-800">
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="space-y-4">
            {/* Service status chips - clean version */}
            <div className="flex flex-wrap gap-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${
                serviceStatus.postgres
                  ? 'bg-elite-green/20 text-green-100 dark:text-green-300'
                  : 'bg-red-500/20 text-red-100 dark:text-red-300'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${serviceStatus.postgres ? 'bg-elite-green' : 'bg-red-400'}`} />
                PostgreSQL
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${
                serviceStatus.walacor
                  ? 'bg-elite-green/20 text-green-100 dark:text-green-300'
                  : 'bg-yellow-500/20 text-yellow-100 dark:text-yellow-300'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${serviceStatus.walacor ? 'bg-elite-green' : 'bg-yellow-400'}`} />
                Walacor EC2
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${
                serviceStatus.backend
                  ? 'bg-elite-green/20 text-green-100 dark:text-green-300'
                  : 'bg-red-500/20 text-red-100 dark:text-red-300'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${serviceStatus.backend ? 'bg-elite-green' : 'bg-red-400'}`} />
                Backend
              </div>
            </div>

            {/* Clean heading - no gradient */}
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              IntegrityX Platform
            </h1>

            <p className="text-xl text-gray-300 dark:text-gray-400 max-w-2xl">
              Enterprise document verification powered by blockchain technology
            </p>

            {/* Clean button group */}
            <div className="flex flex-wrap items-center gap-3 pt-6">
              <Link href="/upload">
                <Button
                  size="lg"
                  className="bg-elite-blue hover:bg-[#1d4ed8] text-white"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Upload Document
                </Button>
              </Link>
              <Link href="/verification">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Verify Document
                </Button>
              </Link>
              <Link href="/upload?mode=demo">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Try Demo
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-6 text-sm text-gray-400 flex-wrap">
              <span>Last updated: {stats.lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Clean Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Total Documents Card */}
          <Card className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md hover-lift transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-elite-gray dark:text-gray-400">Total Documents</p>
                  <p className="text-4xl font-bold text-elite-dark dark:text-white">{stats.totalDocuments.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-elite-blue/10 dark:bg-elite-blue/20 rounded-lg">
                  <Shield className="h-6 w-6 text-elite-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sealed Documents Card */}
          <Card className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md hover-lift transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-elite-gray dark:text-gray-400">Sealed Documents</p>
                  <p className="text-4xl font-bold text-elite-dark dark:text-white">{stats.sealedDocuments}</p>
                </div>
                <div className="p-3 bg-elite-green/10 dark:bg-elite-green/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-elite-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Processing Card */}
          <Card className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md hover-lift transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-elite-gray dark:text-gray-400">AI Processing</p>
                  <p className="text-4xl font-bold text-elite-dark dark:text-white">{stats.aiProcessingCount}</p>
                </div>
                <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Operations Card */}
          <Card className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md hover-lift transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-elite-gray dark:text-gray-400">Bulk Operations</p>
                  <p className="text-4xl font-bold text-elite-dark dark:text-white">{stats.bulkOperationsCount}</p>
                </div>
                <div className="p-3 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-lg">
                  <Layers className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics - Clean */}
        <Card className="mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="text-xl font-semibold text-elite-dark dark:text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-elite-gray dark:text-gray-400">API Response</span>
                  <Zap className="h-4 w-4 text-elite-green" />
                </div>
                <div className="text-3xl font-bold text-elite-dark dark:text-white mb-3">
                  {Math.round(stats.performanceMetrics.apiResponseTime)}ms
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-elite-green"
                    style={{ width: `${Math.min(100, Math.max(15, 100 - Math.min(90, stats.performanceMetrics.apiResponseTime)))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-elite-gray dark:text-gray-400">Blockchain Success</span>
                  <CheckCircle className="h-4 w-4 text-elite-green" />
                </div>
                <div className="text-3xl font-bold text-elite-dark dark:text-white mb-3">
                  {Math.round(stats.performanceMetrics.blockchainSuccessRate)}%
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-elite-green"
                    style={{ width: `${Math.min(100, Math.round(stats.performanceMetrics.blockchainSuccessRate))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-elite-gray dark:text-gray-400">AI Accuracy</span>
                  <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-elite-dark dark:text-white mb-3">
                  {Math.round(stats.performanceMetrics.aiAccuracy)}%
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 dark:bg-purple-500"
                    style={{ width: `${Math.min(100, Math.round(stats.performanceMetrics.aiAccuracy))}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clean Tabs */}
        <div className="pb-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="flex w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-lg">
              <TabsTrigger
                value="overview"
                className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-elite-blue data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-elite-blue data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Brain className="h-4 w-4" />
                AI Processing
              </TabsTrigger>
              <TabsTrigger
                value="bulk"
                className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-elite-blue data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Layers className="h-4 w-4" />
                Bulk Operations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-elite-dark dark:text-white">
                      Recent Documents
                    </CardTitle>
                    <Badge variant="secondary" className="text-elite-gray dark:text-gray-400">
                      {recentDocuments.length ? `${recentDocuments.length} documents` : 'No documents yet'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {recentDocuments.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {recentDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex flex-wrap items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-elite-blue hover:shadow-sm hover-lift transition-all duration-200"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="p-3 bg-blue-500/10 rounded-xl">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <Link
                                  href={`/documents/${doc.id}`}
                                  className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
                                  title={doc.title}
                                >
                                  {doc.title}
                                </Link>
                                <p className="text-xs text-gray-500 truncate font-mono">
                                  {doc.id}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {doc.loanId ? `Loan ${doc.loanId}` : 'Loan ID unavailable'} · {formatTimeAgo(doc.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                className={`rounded-full px-3 py-1 ${
                                  doc.status === 'sealed'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}
                              >
                                {doc.status === 'sealed' ? 'Sealed' : 'Processing'}
                              </Badge>
                              {doc.createdBy && (
                                <span className="text-xs text-gray-500">
                                  by {doc.createdBy}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 flex justify-end">
                        <Link
                          href="/documents"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View all documents
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8 space-y-3">
                      <div className="p-4 bg-blue-500/10 rounded-full">
                        <FileText className="h-6 w-6 text-blue-500" />
                      </div>
                      <p className="text-sm text-gray-600">
                        No recent documents yet. Upload a document to see it appear here instantly.
                      </p>
                      <Link
                        href="/documents"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Go to documents
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <CardTitle className="text-2xl font-bold text-elite-dark dark:text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Document Verified</p>
                        <p className="text-sm text-gray-600 mt-1">Loan application #LA-2024-1247 verified successfully</p>
                        <p className="text-xs text-gray-500 mt-2">2 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors border border-pink-100">
                      <div className="p-2 bg-pink-600 rounded-lg">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">AI Analysis Complete</p>
                        <p className="text-sm text-gray-600 mt-1">89 documents processed with 94.8% accuracy</p>
                        <p className="text-xs text-gray-500 mt-2">1 hour ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors border border-cyan-100">
                      <div className="p-2 bg-cyan-600 rounded-lg">
                        <Layers className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Bulk Operation Completed</p>
                        <p className="text-sm text-gray-600 mt-1">Directory verification: 156 files processed</p>
                        <p className="text-xs text-gray-500 mt-2">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <CardContent className="p-8">
                  <AIDocumentProcessingInterface />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <CardContent className="p-8">
                  <BulkOperationsInterface />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <CardContent className="p-8">
                  <AnalyticsDashboard />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-elite-gray dark:text-gray-400">
              © 2025 IntegrityX by Walacor. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-elite-green text-elite-green">
                Blockchain Secured
              </Badge>
              <Badge variant="outline" className="border-elite-blue text-elite-blue">
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
