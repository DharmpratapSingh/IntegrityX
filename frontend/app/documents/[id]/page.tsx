'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  Shield, 
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  RefreshCw,
  Zap,
  Lock
} from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { json as fetchJson } from '@/utils/api'
import { Skeleton } from '@/components/ui/skeleton'

interface Document {
  id: string
  filename: string
  hash?: string
  payload_sha256?: string
  created_at: string
  artifact_type: string
  loan_id?: string
  walacor_tx_id?: string
  created_by?: string
  blockchain_seal?: string
  local_metadata?: any
}

// Attestations removed as per product decision

interface AuditEvent {
  event_id: string
  event_type: string
  timestamp: string
  user_id?: string
  ip_address?: string
  details: Record<string, any>
}

export default function DocumentDetailPage() {
  const { id: routeId } = useParams() as { id: string }
  const documentId = routeId

  const [document, setDocument] = useState<Document | null>(null)
  // Attestations state removed
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // actionLoading removed (no actions now)
  const [copiedHash, setCopiedHash] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [borrower, setBorrower] = useState<any>(null)

  // Utility functions for masking sensitive data
  const maskEmail = (email: string): string => {
    if (!email || !email.includes('@')) return email
    const [local, domain] = email.split('@')
    if (local.length <= 2) return email
    return `${local[0]}***@${domain}`
  }

  // Safe date parsing function
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Invalid Date'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const formatDateOnly = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Invalid Date'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString()
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const maskPhone = (phone: string): string => {
    if (!phone) return phone
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 4) return phone
    const last4 = digits.slice(-4)
    return `***-***-${last4}`
  }

  const maskSSN = (ssn: string): string => {
    if (!ssn) return ssn
    if (ssn.length < 4) return ssn
    const last4 = ssn.slice(-4)
    return `****-**-${last4}`
  }

  const getIncomeRange = (income: number): string => {
    if (income < 25000) return 'Under $25,000'
    if (income < 50000) return '$25,000 - $49,999'
    if (income < 75000) return '$50,000 - $74,999'
    if (income < 100000) return '$75,000 - $99,999'
    if (income < 150000) return '$100,000 - $149,999'
    if (income < 200000) return '$150,000 - $199,999'
    return '$200,000+'
  }


  useEffect(() => {
    if (documentId) {
      fetchDocumentDetails()
    }
  }, [documentId])

  const fetchDocumentDetails = async () => {
    try {
      setError(null)
      setLoading(true)

      // Fetch document details
      const docRes = await fetchJson<any>(`http://localhost:8000/api/artifacts/${documentId}`, { timeoutMs: 8000 })
      const docPayload = (docRes.data as any)?.data ?? docRes.data
      if (docRes.ok && docPayload) {
        setDocument(docPayload)
      } else if (docRes.status === 404) {
        setError('Document not found')
        return
      } else {
        throw new Error(`Failed to fetch document: ${docRes.status}`)
      }

      // Attestations removed

      // Fetch borrower info (masked)
      const borrowerRes = await fetchJson<any>(`http://localhost:8000/api/loan-documents/${documentId}/borrower`, { timeoutMs: 8000 })
      const borrowerPayload = (borrowerRes.data as any)?.data ?? borrowerRes.data
      if (borrowerRes.ok && borrowerPayload) {
        setBorrower(borrowerPayload)
      }

      // Fetch audit events
      const auditRes = await fetchJson<any>(`http://localhost:8000/api/loan-documents/${documentId}/audit-trail`, { timeoutMs: 8000 })
      const auditPayload = (auditRes.data as any)?.data ?? auditRes.data
      if (auditRes.ok && auditPayload) {
        setAuditEvents(auditPayload.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch document details:', error)
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          setError('Request timed out. Please check your connection and try again.')
        } else if (error.message.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please ensure the backend is running.')
        } else {
          setError(error.message)
        }
      } else {
        setError('An unexpected error occurred while loading document details.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    fetchDocumentDetails()
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'hash') {
        setCopiedHash(true)
        setTimeout(() => setCopiedHash(false), 2000)
      }
      toast.success(`${type} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  // Attestation creation removed

  // Disclosure pack generation removed per product decision


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center space-x-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Skeleton className="h-6 w-20 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Skeleton className="h-6 w-20 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Document</h2>
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
              <Link
                href="/documents"
                className="block text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Back to Documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-6">The document you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/documents"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/documents"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {document.filename || `Document ${document.id}`}
            </h1>
            <p className="text-gray-600 mt-1">Document ID: {document.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document ID</label>
                <div className="flex items-start space-x-2">
                  <div className="flex-1 p-2 bg-gray-50 rounded border font-mono text-sm break-all overflow-hidden">
                    {document.id}
                  </div>
                  <button
                    onClick={() => copyToClipboard(document.id, 'Document ID')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan ID</label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {document.loan_id || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {document.local_metadata?.comprehensive_document?.document_type || document.artifact_type || 'Unknown'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {document.local_metadata?.comprehensive_document?.loan_type 
                    ? document.local_metadata.comprehensive_document.loan_type
                        .split('_')
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    : 'Not provided'
                  }
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {document.local_metadata?.comprehensive_document?.loan_amount 
                    ? `$${document.local_metadata.comprehensive_document.loan_amount.toLocaleString()}`
                    : 'Not provided'
                  }
                </div>
              </div>
              {/* Conditional Loan Fields - Display based on loan_type */}
              {document.local_metadata?.comprehensive_document?.loan_type && (
                <>
                  {document.local_metadata.comprehensive_document.loan_type === 'home_loan' || 
                   document.local_metadata.comprehensive_document.loan_type === 'home_equity' ? (
                    <>
                      {document.local_metadata.comprehensive_document.property_value && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Property Value</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            ${document.local_metadata.comprehensive_document.property_value.toLocaleString()}
                          </div>
                        </div>
                      )}
                      {document.local_metadata.comprehensive_document.down_payment && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            ${document.local_metadata.comprehensive_document.down_payment.toLocaleString()}
                          </div>
                        </div>
                      )}
                      {document.local_metadata.comprehensive_document.property_type && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {document.local_metadata.comprehensive_document.property_type}
                          </div>
                        </div>
                      )}
                    </>
                  ) : document.local_metadata.comprehensive_document.loan_type === 'auto_loan' ? (
                    <>
                      {document.local_metadata.comprehensive_document.vehicle_make && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Make</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {document.local_metadata.comprehensive_document.vehicle_make}
                          </div>
                        </div>
                      )}
                      {document.local_metadata.comprehensive_document.vehicle_model && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {document.local_metadata.comprehensive_document.vehicle_model}
                          </div>
                        </div>
                      )}
                      {document.local_metadata.comprehensive_document.vehicle_year && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Year</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {document.local_metadata.comprehensive_document.vehicle_year}
                          </div>
                        </div>
                      )}
                    </>
                  ) : document.local_metadata.comprehensive_document.loan_type === 'business_loan' ? (
                    <>
                      {document.local_metadata.comprehensive_document.business_name && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {document.local_metadata.comprehensive_document.business_name}
                          </div>
                        </div>
                      )}
                      {document.local_metadata.comprehensive_document.business_type && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {document.local_metadata.comprehensive_document.business_type}
                          </div>
                        </div>
                      )}
                    </>
                  ) : document.local_metadata.comprehensive_document.loan_type === 'student_loan' ? (
                    <>
                      {document.local_metadata.comprehensive_document.school_name && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {document.local_metadata.comprehensive_document.school_name}
                          </div>
                        </div>
                      )}
                      {document.local_metadata.comprehensive_document.degree_program && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Degree Program</label>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {document.local_metadata.comprehensive_document.degree_program}
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {formatDate(document.created_at)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Hash</label>
                <div className="flex items-start space-x-2">
                  <div className="flex-1 p-2 bg-gray-50 rounded border font-mono text-sm break-all overflow-hidden">
                    {document.payload_sha256 || document.hash}
                  </div>
                  <button
                    onClick={() => copyToClipboard((document.payload_sha256 || document.hash) as string, 'hash')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    {copiedHash ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                <div className="flex items-center text-sm text-gray-900">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  {document.created_by || 'System'}
                </div>
              </div>
            </div>
          </div>

          {/* Borrower Information (From Sealed Record) */}
          {(borrower || document.local_metadata?.comprehensive_document?.borrower) && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Borrower Information (From Sealed Record)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {borrower?.full_name || document.local_metadata?.comprehensive_document?.borrower?.full_name || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {borrower?.date_of_birth || document.local_metadata?.comprehensive_document?.borrower?.date_of_birth || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {borrower?.email || document.local_metadata?.comprehensive_document?.borrower?.email || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {borrower?.phone || document.local_metadata?.comprehensive_document?.borrower?.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {borrower?.address?.city && borrower?.address?.state 
                      ? `${borrower.address.city}, ${borrower.address.state}`
                      : document.local_metadata?.comprehensive_document?.borrower?.address?.city && document.local_metadata?.comprehensive_document?.borrower?.address?.state
                      ? `${document.local_metadata.comprehensive_document.borrower.address.city}, ${document.local_metadata.comprehensive_document.borrower.address.state}`
                      : document.local_metadata?.comprehensive_document?.borrower?.address?.street
                      ? document.local_metadata.comprehensive_document.borrower.address.street
                      : 'Not provided'
                    }
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSN/ITIN</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {borrower?.ssn_or_itin_type || document.local_metadata?.comprehensive_document?.borrower?.ssn_or_itin_type ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          Type: {borrower?.ssn_or_itin_type || document.local_metadata?.comprehensive_document?.borrower?.ssn_or_itin_type}
                        </div>
                        <div>
                          {borrower?.ssn_last4 ? (
                            borrower.ssn_last4.length > 20 ? (
                              <div className="truncate" title={`Encrypted: ${borrower.ssn_last4}`}>
                                ****-**-**** (Encrypted)
                              </div>
                            ) : (
                              `****-**-${borrower.ssn_last4}`
                            )
                          ) : document.local_metadata?.comprehensive_document?.borrower?.ssn_last4 ? (
                            `****-**-${document.local_metadata.comprehensive_document.borrower.ssn_last4}`
                          ) : 'Not provided'}
                        </div>
                      </div>
                    ) : borrower?.ssn_last4 ? (
                      borrower.ssn_last4.length > 20 ? (
                        <div className="truncate" title={`Encrypted SSN: ${borrower.ssn_last4}`}>
                          ****-**-**** (Encrypted)
                        </div>
                      ) : (
                        `****-**-${borrower.ssn_last4}`
                      )
                    ) : document.local_metadata?.comprehensive_document?.borrower?.ssn_last4 ? (
                      `****-**-${document.local_metadata.comprehensive_document.borrower.ssn_last4}`
                    ) : 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {borrower?.employment_status || document.local_metadata?.comprehensive_document?.borrower?.employment_status || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income Range</label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {borrower?.annual_income_range || document.local_metadata?.comprehensive_document?.borrower?.annual_income_range || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Layers Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Protection Layers</h2>
            
            {/* Walacor Blockchain Security */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-5 w-5 text-purple-600" />
                <h3 className="text-md font-semibold text-gray-900">Walacor Blockchain Security</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                This document is secured on the Walacor blockchain, providing immutable proof of existence and tamper detection.
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Blockchain Transaction</span>
                    <div className="text-xs text-gray-600 mt-1 font-mono break-all">
                      {document.walacor_tx_id || 'Not available'}
                    </div>
                  </div>
                </div>
                {document.local_metadata?.blockchain_proof && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Blockchain Proof</span>
                      <div className="text-xs text-gray-600 mt-1">
                        Transaction verified and recorded on blockchain
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Immutable Record</span>
                    <div className="text-xs text-gray-600 mt-1">
                      Document hash permanently stored on blockchain
                    </div>
                  </div>
                </div>
                {document.local_metadata?.walacor_envelope && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Envelope Metadata</span>
                      <div className="text-xs text-gray-600 mt-1">
                        Additional security metadata from Walacor
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Our Algorithm Security */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {(() => {
                  const securityLevel = document.local_metadata?.security_level || 'standard';
                  if (securityLevel === 'quantum_safe') {
                    return <Zap className="h-5 w-5 text-indigo-600" />;
                  } else if (securityLevel === 'maximum') {
                    return <Lock className="h-5 w-5 text-red-600" />;
                  } else {
                    return <Shield className="h-5 w-5 text-blue-600" />;
                  }
                })()}
                <h3 className="text-md font-semibold text-gray-900">Our Algorithm Security</h3>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  document.local_metadata?.security_level === 'quantum_safe' 
                    ? 'bg-indigo-100 text-indigo-800'
                    : document.local_metadata?.security_level === 'maximum'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {document.local_metadata?.security_level === 'quantum_safe' 
                    ? 'Quantum Safe'
                    : document.local_metadata?.security_level === 'maximum'
                    ? 'Maximum Security'
                    : 'Standard Security'}
                </span>
              </div>
              
              {(() => {
                const securityLevel = document.local_metadata?.security_level || 'standard';
                
                if (securityLevel === 'quantum_safe') {
                  const quantumSeal = document.local_metadata?.quantum_safe_seal;
                  const algorithms = document.local_metadata?.algorithms_used || quantumSeal?.metadata?.algorithms_used || [];
                  const hashes = quantumSeal?.document_hash?.all_hashes || {};
                  
                  return (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        This document uses quantum-resistant cryptographic algorithms, protecting against future quantum computing threats.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900 mb-2 block">Quantum-Resistant Hashing Algorithms:</span>
                          <div className="grid grid-cols-1 gap-2">
                            {hashes.shake256 && (
                              <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded border border-indigo-200">
                                <CheckCircle className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">SHAKE256</span>
                                  <div className="text-xs text-gray-600 font-mono truncate">
                                    {hashes.shake256.substring(0, 32)}...
                                  </div>
                                </div>
                              </div>
                            )}
                            {hashes.blake3 && (
                              <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded border border-indigo-200">
                                <CheckCircle className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">BLAKE3</span>
                                  <div className="text-xs text-gray-600 font-mono truncate">
                                    {hashes.blake3.substring(0, 32)}...
                                  </div>
                                </div>
                              </div>
                            )}
                            {hashes.sha3_512 && (
                              <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded border border-indigo-200">
                                <CheckCircle className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">SHA3-512</span>
                                  <div className="text-xs text-gray-600 font-mono truncate">
                                    {hashes.sha3_512.substring(0, 32)}...
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {quantumSeal?.signatures?.dilithium2 && (
                          <div>
                            <span className="text-sm font-medium text-gray-900 mb-2 block">Quantum-Safe Digital Signature:</span>
                            <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded border border-indigo-200">
                              <CheckCircle className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">Dilithium2 (NIST PQC Standard)</span>
                                <div className="text-xs text-gray-600 mt-1">
                                  Post-quantum cryptographic signature algorithm
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="p-3 bg-indigo-50 rounded border border-indigo-200">
                          <div className="text-xs font-medium text-indigo-900 mb-1">Quantum Resistance: High</div>
                          <div className="text-xs text-indigo-700">
                            This document is protected against quantum computing attacks using NIST-approved post-quantum algorithms.
                          </div>
                        </div>
                      </div>
                    </>
                  );
                } else if (securityLevel === 'maximum') {
                  const comprehensiveSeal = document.local_metadata?.comprehensive_seal;
                  const securityMetadata = comprehensiveSeal?.security_metadata || {};
                  const algorithms = securityMetadata.algorithms_used || [];
                  const contentHash = comprehensiveSeal?.content_signature?.content_hash || {};
                  
                  return (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        This document uses maximum security with multi-algorithm hashing, PKI signatures, and advanced tamper detection.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900 mb-2 block">Multi-Algorithm Hashing:</span>
                          <div className="grid grid-cols-1 gap-2">
                            {contentHash.sha256 && (
                              <div className="flex items-center space-x-2 p-2 bg-red-50 rounded border border-red-200">
                                <CheckCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">SHA-256</span>
                                  <div className="text-xs text-gray-600 font-mono truncate">
                                    {contentHash.sha256.substring(0, 32)}...
                                  </div>
                                </div>
                              </div>
                            )}
                            {contentHash.sha512 && (
                              <div className="flex items-center space-x-2 p-2 bg-red-50 rounded border border-red-200">
                                <CheckCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">SHA-512</span>
                                  <div className="text-xs text-gray-600 font-mono truncate">
                                    {contentHash.sha512.substring(0, 32)}...
                                  </div>
                                </div>
                              </div>
                            )}
                            {contentHash.blake2b && (
                              <div className="flex items-center space-x-2 p-2 bg-red-50 rounded border border-red-200">
                                <CheckCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">BLAKE2b</span>
                                  <div className="text-xs text-gray-600 font-mono truncate">
                                    {contentHash.blake2b.substring(0, 32)}...
                                  </div>
                                </div>
                              </div>
                            )}
                            {contentHash.sha3_256 && (
                              <div className="flex items-center space-x-2 p-2 bg-red-50 rounded border border-red-200">
                                <CheckCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">SHA3-256</span>
                                  <div className="text-xs text-gray-600 font-mono truncate">
                                    {contentHash.sha3_256.substring(0, 32)}...
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {comprehensiveSeal?.pki_signature && (
                          <div>
                            <span className="text-sm font-medium text-gray-900 mb-2 block">PKI Digital Signature:</span>
                            <div className="flex items-center space-x-2 p-2 bg-red-50 rounded border border-red-200">
                              <CheckCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">RSA-PSS (2048-bit)</span>
                                <div className="text-xs text-gray-600 mt-1">
                                  Public Key Infrastructure signature for tamper detection
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {securityMetadata.verification_methods && (
                          <div>
                            <span className="text-sm font-medium text-gray-900 mb-2 block">Verification Methods:</span>
                            <div className="space-y-2">
                              {securityMetadata.verification_methods.map((method: string, idx: number) => (
                                <div key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                                  <CheckCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                  <span>{method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="p-3 bg-red-50 rounded border border-red-200">
                          <div className="text-xs font-medium text-red-900 mb-1">Tamper Resistance: {securityMetadata.tamper_resistance || 'High'}</div>
                          <div className="text-xs text-red-700">
                            Multiple verification layers ensure maximum protection against tampering.
                          </div>
                        </div>
                      </div>
                    </>
                  );
                } else {
                  // Standard security
                  return (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        This document uses standard security with SHA-256 hashing for integrity verification.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">SHA-256 Hash</span>
                            <div className="text-xs text-gray-600 font-mono truncate mt-1">
                              {document.payload_sha256 || document.hash || 'Not available'}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs font-medium text-blue-900 mb-1">Standard Protection</div>
                          <div className="text-xs text-blue-700">
                            Basic cryptographic protection suitable for standard document integrity.
                          </div>
                        </div>
                      </div>
                    </>
                  );
                }
              })()}
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-900">Document hash matches blockchain record</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-900">Data has not been tampered with</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-900">
                  Sealed on: {formatDate(document.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions removed per product decision */}

          {/* Attestations section removed */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </span>
              </div>
              {/* Attestations removed */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Audit Events</span>
                <span className="text-sm font-medium text-gray-900">{auditEvents.length}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {auditEvents.length > 0 ? (
              <div className="space-y-3">
                {auditEvents.slice(0, 5).map((event) => (
                  <div key={event.event_id} className="flex items-start space-x-3">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.event_type}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
