'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Hash, FileText, AlertTriangle, CheckCircle, XCircle, Clock, Copy, Shield, FileSearch } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'
import { fetchWithTimeout } from '@/utils/api'

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

export default function VerificationPage() {
  const searchParams = useSearchParams()
  const [verificationType, setVerificationType] = useState<'hash' | 'document'>('hash')
  const [hashInput, setHashInput] = useState('')
  const [documentInput, setDocumentInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  // Handle artifact_id query parameter
  useEffect(() => {
    const artifactId = searchParams.get('artifact_id')
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-cyan-50/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-500 to-cyan-600 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Verify Documents
              </h1>
              <p className="text-lg md:text-xl text-green-100 max-w-3xl">
                Instant blockchain verification with cryptographic proof
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-100">Verified Today</p>
                    <p className="text-3xl font-bold">156</p>
                  </div>
                  <div className="p-3 bg-green-500/20 text-white rounded-xl">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-100">Success Rate</p>
                    <p className="text-3xl font-bold">100%</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 text-white rounded-xl">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-100">Avg Time</p>
                    <p className="text-3xl font-bold">&lt; 1s</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 text-white rounded-xl">
                    <Search className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Verification Type Selection */}
      <div className="flex gap-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-2">
        <button
          onClick={() => setVerificationType('hash')}
          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            verificationType === 'hash'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Verify by Hash
        </button>
        <button
          onClick={() => setVerificationType('document')}
          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            verificationType === 'document'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Verify by Document ID
        </button>
      </div>

      {/* Input Section - Removed old wrapper */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Information</h2>
        
        {/* Keep original grid structure but hidden */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{display: 'none'}}>
          <button
            onClick={() => setVerificationType('hash')}
            className={`p-4 border rounded-lg transition-colors ${
              verificationType === 'hash'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Hash className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Hash Verification</div>
                <div className="text-sm text-gray-500">Verify using document hash</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setVerificationType('document')}
            className={`p-4 border rounded-lg transition-colors ${
              verificationType === 'document'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Document Info</div>
                <div className="text-sm text-gray-500">Verify using document details</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Information</h2>
        
        {verificationType === 'hash' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Hash (SHA-256)
              </label>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
        )}
      </div>

      {/* Results Section */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Verifying document...</span>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Verification Results</h2>
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
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Document Information</h3>
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
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Blockchain Information</h3>
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
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Verification Details</h3>
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

            {/* Forensic Analysis Section */}
            {result.document && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Forensic Analysis</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-4">
                    Perform advanced forensic analysis including timeline review, document comparison, and tamper detection.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/forensics?document=${result.document.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <FileSearch className="h-4 w-4 mr-2" />
                      View Forensic Timeline
                    </Link>
                    <Link
                      href={`/forensics`}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <FileSearch className="h-4 w-4 mr-2" />
                      Compare Documents
                    </Link>
                    {result.verification_details?.tamper_detected && (
                      <div className="flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                        <span className="text-sm text-red-800 font-medium">Tampering Detected - Investigation Recommended</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
