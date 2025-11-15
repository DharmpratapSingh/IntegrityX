'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Hash, FileText, AlertTriangle, CheckCircle, XCircle, Clock, Copy, Shield, FileSearch, Lock, Download, FileKey, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { toast } from '@/components/ui/toast'
import { fetchWithTimeout } from '@/utils/api'
import { ForensicTimeline as ForensicTimelineComponent } from '@/components/forensics/ForensicTimeline'
import type { ForensicTimeline } from '@/types/forensics'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { GLOSSARY } from '@/lib/glossary'
import {
  fetchAndGenerateProof,
  verifyZKProof,
  formatProofForDisplay,
  exportProofAsJSON,
  exportProofAsText,
  type ZKPProof,
  type VerificationResult as ZKPVerificationResult
} from '@/utils/zkpProofGenerator'

interface VerificationResult {
  status: 'sealed' | 'tampered' | 'not_found' | 'error'
  message: string
  document?: {
    id: string
    loan_id: string
    borrower_name: string
    created_at: string
    walacor_tx_id: string
    payload_sha256: string
  }
  verification_details?: {
    hash_match: boolean
    blockchain_verified: boolean
    last_verified: string
    tamper_detected: boolean
  }
}

interface VerificationStats {
  verified_today: number
  success_rate: number
  avg_time_ms: number
  total_verifications: number
}

interface FieldChange {
  field: string
  type: 'added' | 'removed' | 'modified'
  original_value: any
  new_value: any
  risk: 'low' | 'medium' | 'high' | 'critical'
}

interface ComparisonResult {
  match_type: 'exact' | 'loan_id'
  matches: boolean
  original_hash: string
  uploaded_hash: string
  document?: {
    id: string
    loan_id: string
    created_at: string
    walacor_tx_id: string
  }
  message: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  changes: FieldChange[]
  total_changes?: number
}

export default function VerificationPage() {
  const searchParams = useSearchParams()
  const [verificationType, setVerificationType] = useState<'hash' | 'document' | 'zkp'>('hash')
  const [hashInput, setHashInput] = useState('')
  const [documentInput, setDocumentInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [stats, setStats] = useState<VerificationStats>({
    verified_today: 0,
    success_rate: 100,
    avg_time_ms: 0,
    total_verifications: 0
  })
  const [comparisonFile, setComparisonFile] = useState<File | null>(null)
  const [comparingFile, setComparingFile] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)

  // Standalone comparison
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [comparing, setComparing] = useState(false)
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null)

  // Forensic timeline
  const [showTimeline, setShowTimeline] = useState(false)
  const [timelineData, setTimelineData] = useState<ForensicTimeline | null>(null)
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  // ZKP state
  const [zkpArtifactId, setZkpArtifactId] = useState('')
  const [isGeneratingZKP, setIsGeneratingZKP] = useState(false)
  const [zkpProof, setZkpProof] = useState<ZKPProof | null>(null)
  const [zkpVerificationResult, setZkpVerificationResult] = useState<ZKPVerificationResult | null>(null)
  const [zkpDocuments, setZkpDocuments] = useState<any[]>([])
  const [loadingZkpDocs, setLoadingZkpDocs] = useState(true)

  // Fetch verification statistics on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchWithTimeout('http://localhost:8000/api/verification-stats', {
          method: 'GET',
          timeoutMs: 5000,
          retries: 1
        })

        const data = await response.json()

        if (response.ok && data.ok) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch verification statistics:', error)
        // Keep default stats on error
      }
    }

    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch available documents for ZKP dropdown
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetchWithTimeout('http://localhost:8000/api/artifacts?limit=50', {
          method: 'GET',
          timeoutMs: 5000,
          retries: 1
        })

        const data = await response.json()

        if (response.ok && data.ok) {
          const artifacts = data.data?.artifacts || []
          setZkpDocuments(artifacts)
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error)
      } finally {
        setLoadingZkpDocs(false)
      }
    }

    fetchDocuments()
  }, [])

  // Handle artifact_id query parameter
  useEffect(() => {
    const artifactId = searchParams?.get('artifact_id')
    if (artifactId) {
      setVerificationType('document')
      setDocumentInput(artifactId)
      // Automatically verify the document
      handleVerificationWithId(artifactId)
    }
  }, [searchParams])

  const handleVerificationWithId = async (artifactId: string) => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetchWithTimeout('http://localhost:8000/api/verify-by-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_info: artifactId
        }),
        timeoutMs: 8000,
        retries: 1
      })

      const data = await response.json()
      
      if (response.ok && data.ok) {
        setResult(data.data)
      } else {
        setResult({
          status: 'error',
          message: data.error || 'Verification failed'
        })
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Failed to verify document. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    try {
      const response = await fetchWithTimeout('http://localhost:8000/api/verification-stats', {
        method: 'GET',
        timeoutMs: 5000,
        retries: 1
      })

      const data = await response.json()

      if (response.ok && data.ok) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to refresh verification statistics:', error)
    }
  }

  const handleVerification = async () => {
    if (verificationType === 'hash' && !hashInput.trim()) {
      toast.error('Please enter a document hash')
      return
    }

    if (verificationType === 'document' && !documentInput.trim()) {
      toast.error('Please enter document information')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      let response
      if (verificationType === 'hash') {
        response = await fetchWithTimeout('http://localhost:8000/api/verify-by-hash', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hash: hashInput.trim()
          }),
          timeoutMs: 8000,
          retries: 1
        })
      } else {
        response = await fetchWithTimeout('http://localhost:8000/api/verify-by-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_info: documentInput.trim()
          }),
          timeoutMs: 8000,
          retries: 1
        })
      }

      const data = await response.json()

      if (response.ok && data.ok) {
        setResult(data.data)
        // Refresh stats after successful verification
        refreshStats()
      } else {
        setResult({
          status: 'error',
          message: data.error || 'Verification failed'
        })
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Failed to verify document. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const computeFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  const handleComparisonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setComparisonFile(file)
      setComparisonResult(null)
    }
  }

  const handleCompareFile = async () => {
    if (!comparisonFile || !result?.document) {
      toast.error('Please select a file to compare')
      return
    }

    setComparingFile(true)
    setComparisonResult(null)

    try {
      // Compute hash of uploaded file
      const uploadedHash = await computeFileHash(comparisonFile)
      const originalHash = result.document.payload_sha256

      // Compare hashes
      const matches = uploadedHash === originalHash

      const compResult: ComparisonResult = {
        matches,
        original_hash: originalHash,
        uploaded_hash: uploadedHash,
        file_name: comparisonFile.name,
        risk_level: matches ? 'low' : 'high',
        differences: matches ? [] : [
          'File hash does not match original',
          'Document content has been modified',
          'Potential tampering detected'
        ]
      }

      setComparisonResult(compResult)

      if (matches) {
        toast.success('Document matches! No changes detected.')
      } else {
        toast.error('Document has been modified! Tampering detected.')
      }
    } catch (error) {
      console.error('Comparison error:', error)
      toast.error('Failed to compare file. Please try again.')
    } finally {
      setComparingFile(false)
    }
  }

  const clearComparison = () => {
    setComparisonFile(null)
    setComparisonResult(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setComparisonData(null)
    }
  }

  const handleCompareWithDatabase = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file to compare')
      return
    }

    setComparing(true)
    setComparisonData(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('http://localhost:8000/api/compare-document', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.ok) {
        setComparisonData(data.data)

        if (data.data.matches) {
          toast.success('Document matches! No tampering detected.')
        } else {
          toast.error(`Tampering detected! ${data.data.total_changes} field(s) changed.`)
        }
      } else {
        toast.error(data.error?.message || 'Comparison failed')
      }
    } catch (error) {
      console.error('Comparison error:', error)
      toast.error('Failed to compare document. Please try again.')
    } finally {
      setComparing(false)
    }
  }

  const handleViewForensicTimeline = async (artifactId: string) => {
    setLoadingTimeline(true)
    setShowTimeline(true)
    setTimelineData(null)

    try {
      const response = await fetch(`http://localhost:8000/api/forensics/timeline/${artifactId}`)
      const data = await response.json()

      if (response.ok && data.ok) {
        setTimelineData(data.data)
        toast.success('Forensic timeline loaded successfully!')
      } else {
        toast.error(data.error?.message || 'Failed to load timeline')
        setShowTimeline(false)
      }
    } catch (error) {
      console.error('Timeline fetch error:', error)
      toast.error('Failed to fetch forensic timeline')
      setShowTimeline(false)
    } finally {
      setLoadingTimeline(false)
    }
  }

  const handleGenerateZKP = async () => {
    if (!zkpArtifactId.trim()) {
      toast.error('Please enter an Artifact ID')
      return
    }

    setIsGeneratingZKP(true)
    setZkpProof(null)
    setZkpVerificationResult(null)

    try {
      console.log('🔐 Generating ZKP for artifact:', zkpArtifactId)

      // Generate proof
      const proof = await fetchAndGenerateProof(zkpArtifactId.trim())
      setZkpProof(proof)

      // Auto-verify proof
      const verificationResult = await verifyZKProof(zkpArtifactId.trim(), proof)
      setZkpVerificationResult(verificationResult)

      if (verificationResult.verified) {
        toast.success('✅ Zero Knowledge Proof generated successfully!')
      } else {
        toast.error('⚠️ Proof verification failed')
      }
    } catch (error: any) {
      console.error('Error generating ZKP:', error)
      toast.error(error.message || 'Failed to generate proof')
    } finally {
      setIsGeneratingZKP(false)
    }
  }

  const handleCopyZKPProof = () => {
    if (!zkpProof) return
    const formattedProof = formatProofForDisplay(zkpProof)
    navigator.clipboard.writeText(formattedProof)
    toast.success('Proof copied to clipboard!')
  }

  const handleDownloadZKPJSON = () => {
    if (!zkpProof) return
    const blob = exportProofAsJSON(zkpProof)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zkp_${zkpProof.artifactId}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Proof exported as JSON')
  }

  const handleDownloadZKPText = () => {
    if (!zkpProof) return
    const blob = exportProofAsText(zkpProof)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zkp_${zkpProof.artifactId}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Proof exported as text file')
  }

  const clearComparison_Standalone = () => {
    setUploadedFile(null)
    setComparisonData(null)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'text-red-700 bg-red-100 dark:bg-red-950/30'
      case 'high':
        return 'text-orange-700 bg-orange-100 dark:bg-orange-950/30'
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-950/30'
      default:
        return 'text-green-700 bg-green-100 dark:bg-green-950/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sealed':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'tampered':
        return <AlertTriangle className="h-6 w-6 text-red-600" />
      case 'not_found':
        return <XCircle className="h-6 w-6 text-gray-400" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />
      default:
        return <Clock className="h-6 w-6 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sealed':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'tampered':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'not_found':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  }

  return (
    <DashboardLayout
      rightSidebar={
        <div className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
            Verification Info
          </h2>

          {/* How to Verify */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              How to Verify
            </h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div>1. Enter document hash or ID</div>
              <div>2. Click verify button</div>
              <div>3. Review blockchain proof</div>
              <div>4. Check seal integrity</div>
            </div>
          </div>

          {/* What We Check */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              What We Check
            </h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div>• Document hash match</div>
              <div>• Blockchain timestamp</div>
              <div>• Seal integrity</div>
              <div>• Transaction validity</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Other Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/upload"
                className="block text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                📤 Upload New Document
              </Link>
              <Link
                href="/security"
                className="block text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                🔍 Forensic Comparison
              </Link>
            </div>
          </div>
        </div>
      }
    >
      <div>
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-elite-dark dark:bg-black text-white border-b border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Verify Documents
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
                Instant blockchain verification with cryptographic proof
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Verified Today</p>
                    <p className="text-3xl font-bold">{stats.verified_today}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 text-white rounded-xl">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Success Rate</p>
                    <p className="text-3xl font-bold">{stats.success_rate.toFixed(0)}%</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 text-white rounded-xl">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Avg Time</p>
                    <p className="text-3xl font-bold">
                      {stats.avg_time_ms > 0
                        ? stats.avg_time_ms < 1000
                          ? `${stats.avg_time_ms}ms`
                          : `${(stats.avg_time_ms / 1000).toFixed(1)}s`
                        : '0ms'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/20 text-white rounded-xl">
                    <Search className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Document Tampering Detection Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 rounded-3xl shadow-2xl border border-blue-200 dark:border-blue-800 p-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-elite-blue to-blue-600 text-white rounded-2xl shadow-lg">
              <FileSearch className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                Document Tampering Detection
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  AI-Powered
                </span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Upload a suspected document to perform comprehensive tampering analysis and field-level comparison
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Enhanced File Upload Box */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300">
                <input
                  type="file"
                  id="tampering-file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".json,application/json"
                />
                <label
                  htmlFor="tampering-file"
                  className="cursor-pointer flex flex-col items-center justify-center py-10 group-hover:scale-[1.02] transition-transform duration-200"
                >
                  {uploadedFile ? (
                    <>
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <CheckCircle className="relative h-16 w-16 text-green-600 dark:text-green-500" />
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {uploadedFile.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Click to select a different file
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <FileText className="relative h-16 w-16 text-blue-500 dark:text-blue-400" />
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Drop your file here or click to browse
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Supports JSON loan documents
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Shield className="h-4 w-4" />
                        <span>Secure • Encrypted • Private</span>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleCompareWithDatabase}
                disabled={!uploadedFile || comparing}
                className="relative flex-1 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-elite-blue via-blue-600 to-indigo-600 rounded-2xl transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/50"></div>
                <div className="relative flex items-center justify-center px-8 py-5 text-white font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {comparing ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                        Analyzing Document...
                      </span>
                    </>
                  ) : (
                    <>
                      <Search className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                      <span>Check for Tampering</span>
                      <AlertTriangle className="h-5 w-5 ml-3 group-hover:animate-pulse" />
                    </>
                  )}
                </div>
              </button>

              {uploadedFile && (
                <button
                  onClick={clearComparison_Standalone}
                  className="px-8 py-5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 flex items-center gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  Clear
                </button>
              )}
            </div>

            {/* Comparison Results */}
            {comparisonData && (
            <div className={`relative p-8 rounded-2xl border-2 shadow-2xl ${
              comparisonData.matches
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800'
                : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-400 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-6">
                <div className="relative">
                  {comparisonData.matches ? (
                    <>
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
                      <CheckCircle className="relative h-14 w-14 text-green-600 dark:text-green-500 flex-shrink-0" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
                      <AlertTriangle className="relative h-14 w-14 text-red-600 dark:text-red-500 flex-shrink-0 animate-bounce" />
                    </>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-3 flex items-center gap-3 ${
                    comparisonData.matches ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                  }`}>
                    {comparisonData.matches ? (
                      <>
                        <span>✓ Document is Authentic</span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          VERIFIED
                        </span>
                      </>
                    ) : (
                      <>
                        <span>⚠ Tampering Detected</span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse">
                          ALERT
                        </span>
                      </>
                    )}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    comparisonData.matches ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {comparisonData.message}
                  </p>

                  {/* Document Info */}
                  {comparisonData.document && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Original Document</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Loan ID:</span>
                          <span className="ml-2 font-mono text-gray-900 dark:text-white">{comparisonData.document.loan_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Created:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(comparisonData.document.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Field-Level Changes */}
                  {!comparisonData.matches && comparisonData.changes && comparisonData.changes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-red-900 dark:text-red-300 text-lg">
                        🔍 {comparisonData.total_changes} Field(s) Modified:
                      </h4>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {comparisonData.changes.map((change, idx) => (
                          <div key={idx} className={`p-4 rounded-lg border-l-4 ${getRiskColor(change.risk)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-sm font-semibold">{change.field}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getRiskColor(change.risk)}`}>
                                {change.risk.toUpperCase()}
                              </span>
                            </div>

                            <div className="text-sm space-y-1">
                              {change.type === 'modified' && (
                                <>
                                  <div className="flex items-start gap-2">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Original:</span>
                                    <span className="flex-1 font-mono text-gray-900 dark:text-white break-all">
                                      {JSON.stringify(change.original_value)}
                                    </span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-red-600 dark:text-red-400 font-medium">Modified:</span>
                                    <span className="flex-1 font-mono text-red-700 dark:text-red-300 break-all">
                                      {JSON.stringify(change.new_value)}
                                    </span>
                                  </div>
                                </>
                              )}
                              {change.type === 'added' && (
                                <div className="flex items-start gap-2">
                                  <span className="text-orange-600 dark:text-orange-400 font-medium">Added:</span>
                                  <span className="flex-1 font-mono text-gray-900 dark:text-white break-all">
                                    {JSON.stringify(change.new_value)}
                                  </span>
                                </div>
                              )}
                              {change.type === 'removed' && (
                                <div className="flex items-start gap-2">
                                  <span className="text-red-600 dark:text-red-400 font-medium">Removed:</span>
                                  <span className="flex-1 font-mono text-gray-900 dark:text-white break-all">
                                    {JSON.stringify(change.original_value)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hash Comparison */}
                  <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Hash Comparison</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Original Hash
                        </label>
                        <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all">
                          {comparisonData.original_hash}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Uploaded Hash
                        </label>
                        <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all">
                          {comparisonData.uploaded_hash}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">OR</span>
        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
      </div>

      {/* Verification Type Selection */}
      <div className="grid grid-cols-3 gap-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2">
        <button
          onClick={() => setVerificationType('hash')}
          className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            verificationType === 'hash'
              ? 'bg-elite-blue text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Hash className="h-4 w-4" />
          <span className="hidden sm:inline">Verify by Hash</span>
          <span className="sm:hidden">Hash</span>
          <InfoTooltip
            term={GLOSSARY.HASH_VERIFICATION.term}
            definition={GLOSSARY.HASH_VERIFICATION.definition}
            example={GLOSSARY.HASH_VERIFICATION.example}
            whenToUse={GLOSSARY.HASH_VERIFICATION.whenToUse}
            className={verificationType === 'hash' ? 'text-white' : ''}
          />
        </button>
        <button
          onClick={() => setVerificationType('document')}
          className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            verificationType === 'document'
              ? 'bg-elite-blue text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Document ID</span>
          <span className="sm:hidden">ID</span>
        </button>
        <button
          onClick={() => setVerificationType('zkp')}
          className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            verificationType === 'zkp'
              ? 'bg-elite-blue text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Zero Knowledge Proof</span>
          <span className="sm:hidden">ZKP</span>
          <InfoTooltip
            term={GLOSSARY.ZKP.term}
            definition={GLOSSARY.ZKP.definition}
            example={GLOSSARY.ZKP.example}
            whenToUse={GLOSSARY.ZKP.whenToUse}
            className={verificationType === 'zkp' ? 'text-white' : ''}
          />
        </button>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-elite-dark dark:text-white mb-4">
          {verificationType === 'zkp' ? 'Generate Zero Knowledge Proof' : 'Enter Information'}
        </h2>

        {verificationType === 'hash' ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Document Hash (SHA-256)
                </label>
                <InfoTooltip
                  term={GLOSSARY.DOCUMENT_HASH.term}
                  definition={GLOSSARY.DOCUMENT_HASH.definition}
                  example={GLOSSARY.DOCUMENT_HASH.example}
                  whenToUse={GLOSSARY.DOCUMENT_HASH.whenToUse}
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="Enter 64-character SHA-256 hash..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  onClick={handleVerification}
                  disabled={loading || !hashInput.trim()}
                  className="px-4 py-2 bg-elite-blue text-white rounded-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>Verify</span>
                </button>
              </div>
            </div>
          </div>
        ) : verificationType === 'document' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Information
              </label>
              <div className="flex space-x-2">
                <textarea
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                  placeholder="Enter document ID, loan ID, or other identifying information..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleVerification}
                  disabled={loading || !documentInput.trim()}
                  className="px-4 py-2 bg-elite-blue text-white rounded-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>Verify</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ZKP Section */
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-elite-blue to-blue-600 text-white rounded-xl">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Privacy-Preserving Verification</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Generate a cryptographic proof that verifies document authenticity <strong>without revealing any private data</strong> (no borrower names, SSN, loan amounts, or financial details).
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Document Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Choose from your documents
                  </label>
                  <select
                    value={zkpArtifactId}
                    onChange={(e) => setZkpArtifactId(e.target.value)}
                    disabled={loadingZkpDocs}
                    className="w-full px-4 py-3 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-elite-blue bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">
                      {loadingZkpDocs ? 'Loading documents...' : zkpDocuments.length === 0 ? 'No documents found' : 'Select a document'}
                    </option>
                    {zkpDocuments.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.loan_id} - {doc.borrower_name} ({doc.document_type || 'Document'})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    💡 {zkpDocuments.length > 0 ? `${zkpDocuments.length} documents available` : 'Upload documents to see them here'}
                  </p>
                </div>

                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-blue-300 dark:border-blue-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 px-2 text-gray-600 dark:text-gray-400">Or enter manually</span>
                  </div>
                </div>

                {/* Manual Input */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Artifact ID
                    </label>
                    <InfoTooltip
                      term={GLOSSARY.ARTIFACT_ID.term}
                      definition={GLOSSARY.ARTIFACT_ID.definition}
                      example={GLOSSARY.ARTIFACT_ID.example}
                      whenToUse={GLOSSARY.ARTIFACT_ID.whenToUse}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={zkpArtifactId}
                      onChange={(e) => setZkpArtifactId(e.target.value)}
                      placeholder="Enter Artifact ID (e.g., art_abc123xyz)"
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateZKP()}
                      className="flex-1 px-4 py-3 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-elite-blue font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleGenerateZKP}
                      disabled={isGeneratingZKP || !zkpArtifactId.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-elite-blue to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isGeneratingZKP ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5" />
                          <span>Generate Proof</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ZKP Results Section */}
      {zkpProof && zkpVerificationResult && (
        <div className="space-y-6">
          {/* Verification Result Alert */}
          <div className={`p-6 rounded-2xl border-2 ${
            zkpVerificationResult.verified
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400'
          }`}>
            <div className="flex items-center gap-3">
              {zkpVerificationResult.verified ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${zkpVerificationResult.verified ? 'text-green-900' : 'text-red-900'}`}>
                  {zkpVerificationResult.verified ? 'Verification Successful ✅' : 'Verification Failed ⚠️'}
                </h3>
                <p className={`text-sm ${zkpVerificationResult.verified ? 'text-green-700' : 'text-red-700'}`}>
                  {zkpVerificationResult.message}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Verified at: {new Date(zkpVerificationResult.verifiedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyZKPProof}
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Proof
            </button>
            <button
              onClick={handleDownloadZKPJSON}
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </button>
            <button
              onClick={handleDownloadZKPText}
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Text
            </button>
          </div>

          {/* Cryptographic Proofs */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-5 w-5 text-elite-blue" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cryptographic Proofs</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              One-way hashes and commitments (irreversible, no private data)
            </p>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Artifact ID</label>
                  <code className="block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs break-all font-mono mt-1">
                    {zkpProof.artifactId}
                  </code>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Proof ID</label>
                  <code className="block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs break-all font-mono mt-1">
                    {zkpProof.proofId}
                  </code>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Document Hash (SHA-256 equivalent)</label>
                <code className="block p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs break-all font-mono mt-1 text-blue-900 dark:text-blue-300">
                  {zkpProof.documentHash}
                </code>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  ℹ️ One-way cryptographic hash. Cannot be reversed to reveal original data.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Commitment Hash</label>
                <code className="block p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs break-all font-mono mt-1 text-indigo-900 dark:text-indigo-300">
                  {zkpProof.commitmentHash}
                </code>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  ℹ️ Cryptographic commitment proving we know the data without revealing it.
                </p>
              </div>

              {zkpProof.blockchainProof && (
                <div className="space-y-3">
                  {/* Enhanced Walacor Badge */}
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-400 dark:border-blue-600 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                          ✅ Verified on Walacor Blockchain
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-full font-medium">
                          Immutable
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        This document is permanently sealed and publicly verifiable on the Walacor network
                      </p>
                    </div>
                  </div>

                  {/* Transaction ID with Copy Button */}
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      Blockchain Transaction ID
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(zkpProof.blockchainProof || '')
                          toast.success('Transaction ID copied to clipboard')
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    </label>
                  <code className="block p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs break-all font-mono mt-1 text-blue-900 dark:text-blue-300">
                    {zkpProof.blockchainProof}
                  </code>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Publicly verifiable on Walacor network • Tamper-proof guarantee
                  </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-400 dark:border-blue-600 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-elite-blue to-blue-600 text-white rounded-xl shadow-lg flex-shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">🔒 Privacy Guarantee</h3>
                <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 font-medium">
                  This Zero Knowledge Proof contains <strong className="text-elite-blue">NO private data</strong>:
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside ml-2">
                  <li>No borrower names, addresses, or contact information</li>
                  <li>No Social Security Numbers (SSN) or government IDs</li>
                  <li>No loan amounts, interest rates, or financial details</li>
                  <li>No dates of birth, employment information, or income data</li>
                </ul>
                <p className="text-sm text-gray-800 dark:text-gray-200 mt-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-blue-200 dark:border-blue-700">
                  <strong className="text-elite-blue">What IS included:</strong> Cryptographic hashes (irreversible), blockchain transaction IDs (public), and existence proofs (yes/no verification only).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-elite-blue"></div>
            <span className="text-gray-600 dark:text-gray-300">Verifying document...</span>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-elite-dark dark:text-white">Verification Results</h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(result.status)}`}>
              {getStatusIcon(result.status)}
              <span className="font-medium capitalize">{result.status.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{result.message}</p>
            </div>

            {result.document && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-semibold text-elite-dark dark:text-white mb-3">Document Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Document ID</label>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {result.document.id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(result.document!.id, 'Document ID')}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Loan ID</label>
                      <span className="text-sm text-gray-900">{result.document.loan_id}</span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Borrower</label>
                      <span className="text-sm text-gray-900">{result.document.borrower_name}</span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <span className="text-sm text-gray-900">
                        {new Date(result.document.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-elite-dark dark:text-white mb-3">Blockchain Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Walacor TX ID</label>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded break-all">
                          {result.document.walacor_tx_id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(result.document!.walacor_tx_id, 'Transaction ID')}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Document Hash</label>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded break-all">
                          {result.document.payload_sha256}
                        </span>
                        <button
                          onClick={() => copyToClipboard(result.document!.payload_sha256, 'Document Hash')}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.verification_details && (
              <div className="border-t dark:border-gray-800 pt-4">
                <h3 className="text-md font-semibold text-elite-dark dark:text-white mb-3">Verification Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    {result.verification_details.hash_match ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm">Hash Match: {result.verification_details.hash_match ? 'Valid' : 'Invalid'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {result.verification_details.blockchain_verified ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm">Blockchain Verified: {result.verification_details.blockchain_verified ? 'Yes' : 'No'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {result.verification_details.tamper_detected ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className="text-sm">Tamper Detection: {result.verification_details.tamper_detected ? 'Detected' : 'Clean'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Last Verified: {new Date(result.verification_details.last_verified).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Document Comparison Section */}
            {result.document && (
              <div className="border-t dark:border-gray-800 pt-6 mt-6">
                <h3 className="text-md font-semibold text-elite-dark dark:text-white mb-4 flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Compare with Modified Version
                </h3>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    Upload a potentially modified version of this document to detect any changes or tampering.
                  </p>

                  {/* File Upload Area */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="comparison-file"
                        onChange={handleComparisonFileSelect}
                        className="hidden"
                        accept="*/*"
                      />
                      <label
                        htmlFor="comparison-file"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border-2 border-elite-blue text-elite-blue rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Hash className="h-4 w-4 mr-2" />
                        Select File
                      </label>

                      {comparisonFile && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {comparisonFile.name}
                          </span>
                          <button
                            onClick={clearComparison}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {comparisonFile && (
                      <button
                        onClick={handleCompareFile}
                        disabled={comparingFile}
                        className="inline-flex items-center px-6 py-3 bg-elite-blue text-white rounded-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {comparingFile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Comparing...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Compare Files
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Comparison Results */}
                  {comparisonResult && (
                    <div className={`mt-6 p-4 rounded-lg border-2 ${
                      comparisonResult.matches
                        ? 'bg-green-50 border-green-500 dark:bg-green-950/20 dark:border-green-900'
                        : 'bg-red-50 border-red-500 dark:bg-red-950/20 dark:border-red-900'
                    }`}>
                      <div className="flex items-start gap-3">
                        {comparisonResult.matches ? (
                          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <h4 className={`font-semibold mb-2 ${
                            comparisonResult.matches ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {comparisonResult.matches
                              ? '✓ Document Matches - No Changes Detected'
                              : '⚠ Document Modified - Tampering Detected'}
                          </h4>

                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className={`block font-medium mb-1 ${
                                  comparisonResult.matches ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  Original Hash
                                </label>
                                <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all">
                                  {comparisonResult.original_hash}
                                </div>
                              </div>
                              <div>
                                <label className={`block font-medium mb-1 ${
                                  comparisonResult.matches ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  Uploaded Hash
                                </label>
                                <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all">
                                  {comparisonResult.uploaded_hash}
                                </div>
                              </div>
                            </div>

                            {!comparisonResult.matches && comparisonResult.differences && (
                              <div className="mt-4">
                                <label className="block font-medium mb-2 text-red-800">
                                  Detected Issues:
                                </label>
                                <ul className="space-y-1">
                                  {comparisonResult.differences.map((diff, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-red-700">
                                      <XCircle className="h-4 w-4 flex-shrink-0" />
                                      {diff}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {comparisonResult.matches && (
                              <div className="text-sm text-green-700 dark:text-green-300">
                                The uploaded file is identical to the original verified document. No modifications or tampering detected.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Forensic Analysis Section */}
            {result.document && (
              <div className="border-t dark:border-gray-800 pt-6 mt-6">
                <h3 className="text-md font-semibold text-elite-dark dark:text-white mb-4">Advanced Forensic Analysis</h3>
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    View detailed forensic timeline and document history with all events, modifications, and security checks.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleViewForensicTimeline(result.document!.id)}
                      disabled={loadingTimeline}
                      className="inline-flex items-center px-4 py-2 bg-elite-dark dark:bg-gray-700 text-white rounded-md hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileSearch className="h-4 w-4 mr-2" />
                      {loadingTimeline ? 'Loading Timeline...' : showTimeline ? 'Refresh Timeline' : 'View Forensic Timeline'}
                    </button>
                    {showTimeline && timelineData && (
                      <button
                        onClick={() => {
                          setShowTimeline(false)
                          setTimelineData(null)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Hide Timeline
                      </button>
                    )}
                    {result.verification_details?.tamper_detected && (
                      <div className="flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                        <span className="text-sm text-red-800 font-medium">Tampering Detected - Investigation Recommended</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Display */}
                {showTimeline && (
                  <div className="mt-6">
                    {loadingTimeline ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-elite-blue animate-spin" />
                          <p className="text-gray-600 dark:text-gray-400">Loading forensic timeline...</p>
                        </div>
                      </div>
                    ) : timelineData ? (
                      <ForensicTimelineComponent timeline={timelineData} />
                    ) : (
                      <div className="flex items-center justify-center py-12 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                        <div className="text-center">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                          <p className="text-gray-600 dark:text-gray-400">Failed to load timeline data</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      </div>
    </DashboardLayout>
  )
}
