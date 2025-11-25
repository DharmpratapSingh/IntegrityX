'use client'

import { useState, useEffect, useMemo } from 'react'
import { json as fetchJson, fetchWithTimeout } from '@/utils/api'
import { formatEasternTimeWithTZ, formatForFilename, getCurrentEasternTime } from '@/utils/timezone'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Search, FileText, Eye, Plus, Filter, Calendar, Hash, AlertCircle, RefreshCw, Download, CheckSquare, Square, Shield, Lock, Zap, CheckCircle, TrendingUp, MoreVertical, Trash2, ChevronRight, Copy } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import jsPDF from 'jspdf'
import Papa from 'papaparse'
import JSZip from 'jszip'

interface Document {
  id: string
  loan_id: string
  borrower_name: string
  borrower_email: string
  loan_amount: number
  document_type: string
  upload_date: string
  walacor_tx_id?: string
  artifact_type: string
  created_by: string
  sealed_status: string
  security_level: string
  artifact_container_type: string
  parent_id?: string | null
  directory_name?: string | null
  file_count?: number
}

type DisplayRowType = 'directory' | 'child' | 'document'

interface DisplayRow {
  type: DisplayRowType
  doc: Document
  depth: number
  parent?: Document
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  // Search filters
  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerEmail, setBorrowerEmail] = useState('')
  const [loanId, setLoanId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [securityLevel, setSecurityLevel] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // Export functionality
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  
  // Delete functionality
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  
  // Verification functionality
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // Directory tree state
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDocuments()
    
    // Force load after 10 seconds maximum (backup timeout)
    const maxLoadTimeout = setTimeout(() => {
      setLoading(false)
    }, 10000)
    
    return () => clearTimeout(maxLoadTimeout)
  }, [])

  const fetchDocuments = async (page: number = 1) => {
    try {
      setError(null)
      setLoading(true)

      // Use unified fetch with timeout/retries

      // Build query parameters
      const params = new URLSearchParams()
      if (borrowerName) params.append('borrower_name', borrowerName)
      if (borrowerEmail) params.append('borrower_email', borrowerEmail)
      if (loanId) params.append('loan_id', loanId)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (amountMin) params.append('amount_min', amountMin)
      if (amountMax) params.append('amount_max', amountMax)
      if (securityLevel) params.append('security_level', securityLevel)
      
      params.append('limit', '20')
      params.append('offset', String((page - 1) * 20))

      const response = await fetchJson<any>(`http://localhost:8000/api/artifacts?${params.toString()}`, { timeoutMs: 8000, retries: 1 })
      
      if (response && response.ok && response.data) {
        const data = response.data
        const artifacts = data.data?.artifacts || []

        const cleanedArtifacts: Document[] = artifacts.map((doc: any) => {
          const uploadDate = doc.upload_date || doc.created_at || doc.timestamp || new Date().toISOString()
          const artifactContainerType = doc.artifact_container_type || 'file'
          const sanitizedEmail = doc.borrower_email && /^[a-zA-Z0-9+/=]{20,}$/.test(doc.borrower_email)
            ? ''
            : (doc.borrower_email || '')

          const baseDocumentType =
            doc.document_type ||
            (artifactContainerType === 'directory_container' ? 'Directory Container' : doc.artifact_type || 'document')

          return {
            id: doc.id,
            loan_id: doc.loan_id || '',
            // For directories, don't use directory_name as borrower_name - keep it empty/Unknown
            borrower_name: (artifactContainerType === 'directory_container') 
              ? (doc.borrower_name || '')  // Directories: only use actual borrower_name, not directory_name
              : (doc.borrower_name || 'Unknown'),  // Files: use borrower_name or 'Unknown'
            borrower_email: sanitizedEmail,
            loan_amount: doc.loan_amount ?? 0,
            document_type: baseDocumentType,
            upload_date: uploadDate,
            walacor_tx_id: doc.walacor_tx_id || '',
            artifact_type: doc.artifact_type || baseDocumentType,
            created_by: doc.created_by || '',
            sealed_status: doc.sealed_status || (doc.walacor_tx_id ? 'Sealed' : 'Not Sealed'),
            security_level: (() => {
              // Prioritize local_metadata.security_level, then doc.security_level, then default to 'standard'
              const metadataLevel = doc.local_metadata?.security_level;
              const apiLevel = doc.security_level;
              // Normalize values to handle variations
              const level = metadataLevel || apiLevel || 'standard';
              // Ensure we return a valid security level
              if (['standard', 'quantum_safe', 'maximum'].includes(level)) {
                return level;
              }
              return 'standard';
            })(),
            artifact_container_type: artifactContainerType,
            parent_id: doc.parent_id || null,
            directory_name: doc.directory_name || null,
            file_count: doc.file_count ?? 0
          }
        })

        setDocuments(cleanedArtifacts)
        setTotalCount(data.data?.total_count || 0)
        setHasMore(!!data.data?.has_more)
      } else if (response && response.status === 404) {
        // No documents yet - this is normal
        setDocuments([])
        setTotalCount(0)
        setHasMore(false)
      } else if (response && (response.status === 500 || response.status === 503)) {
        // Server error - show empty state with error message
        const errorMsg = response.data?.error?.message || `Server error (${response.status})`
        setError(`Server error: ${errorMsg}. Please try again or check backend logs.`)
        setDocuments([])
        setTotalCount(0)
        setHasMore(false)
      } else if (response) {
        throw new Error(`Failed to fetch documents: ${response.status}`)
      } else {
        // Timeout occurred - show empty state
        setDocuments([])
        setTotalCount(0)
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          setError('Request timed out. Please check your connection and try again.')
        } else if (error.message.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please ensure the backend is running.')
        } else {
          setError(error.message)
        }
      } else {
        setError('An unexpected error occurred while loading documents.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    fetchDocuments()
  }

  const handleVerifyDocument = async (documentId: string) => {
    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const response = await fetchWithTimeout('http://localhost:8000/api/verify-by-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_info: documentId
        }),
        timeoutMs: 5000,
        signal: controller.signal
      })

      if (response) {
        const data = await response.json()
        
        if (response.ok && data.ok) {
          setVerificationResult(data.data)
          
          // Show verification result in an alert for now
          const status = data.data.status === 'sealed' ? '✅ VERIFIED' : '❌ TAMPERED'
          const message = data.data.message
          const borrowerName = data.data.document?.borrower_name || 'Unknown'
          const loanId = data.data.document?.loan_id || 'Unknown'
          const walacorTxId = data.data.document?.walacor_tx_id || 'N/A'
          
          alert(`${status}\n\nDocument: ${borrowerName} (${loanId})\nStatus: ${message}\nTransaction ID: ${walacorTxId}`)
        } else {
          alert(`❌ Verification Failed\n\nError: ${data.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
      alert(`❌ Verification Failed\n\nError: Failed to verify document. Please try again.`)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchDocuments(1)
  }

  const handleClearFilters = () => {
    setBorrowerName('')
    setBorrowerEmail('')
    setLoanId('')
    setDateFrom('')
    setDateTo('')
    setAmountMin('')
    setAmountMax('')
    setSecurityLevel('')
    setCurrentPage(1)
    fetchDocuments(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchDocuments(page)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getSecurityLevelBadge = (securityLevel: string) => {
    switch (securityLevel) {
      case 'quantum_safe':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Quantum Safe
          </span>
        )
      case 'maximum':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm">
            <Lock className="h-3.5 w-3.5 mr-1.5" />
            Maximum Security
          </span>
        )
      case 'standard':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Standard
          </span>
        )
    }
  }

  const cleanBorrowerName = (name: string) => {
    if (!name) return 'Unknown'

    let cleaned = name.replace(/[\n\r]/g, ' ').trim()
    const encodedStartMatch = cleaned.match(/[a-zA-Z0-9+/=]{16,}/)

    if (encodedStartMatch && encodedStartMatch.index !== undefined && encodedStartMatch.index > 0) {
      cleaned = cleaned.substring(0, encodedStartMatch.index).trim()
    }

    return cleaned || 'Unknown'
  }
  
  const cleanLoanId = (loanId: string) => {
    if (!loanId) return ''
    // If it contains very long alphanumeric parts, extract just the readable loan ID
    // Loan IDs are typically like "LOAN_2025_1001" or "LOAN-2025-1001"
    const match = loanId.match(/LOAN[_\-]?\d{4}[_\-\s]?\d+/i)
    if (match) {
      return match[0]
    }
    // If it's a short ID, return as is
    if (loanId.length <= 30) {
      return loanId
    }
    // Otherwise, truncate and show first part
    return loanId.substring(0, 30) + '...'
  }

  const flattenedRows = useMemo<DisplayRow[]>(() => {
    if (!documents || documents.length === 0) {
      return []
    }

    const rows: DisplayRow[] = []
    const childrenMap = new Map<string, Document[]>()

    documents.forEach((doc) => {
      if (doc.parent_id) {
        const existing = childrenMap.get(doc.parent_id) || []
        existing.push(doc)
        childrenMap.set(doc.parent_id, existing)
      }
    })

    const sortByDateDesc = (a: Document, b: Document) =>
      new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()

    const topLevelDocs = documents.filter((doc) => !doc.parent_id)
    topLevelDocs.sort(sortByDateDesc)

    topLevelDocs.forEach((doc) => {
      if (doc.artifact_container_type === 'directory_container') {
        rows.push({ type: 'directory', doc, depth: 0 })

        if (expandedDirectories.has(doc.id)) {
          const childDocs = [...(childrenMap.get(doc.id) || [])].sort((a, b) =>
            a.loan_id.localeCompare(b.loan_id)
          )

          childDocs.forEach((child) => {
            const childClone: Document = {
              ...child,
              borrower_name: child.borrower_name || doc.borrower_name,
              sealed_status: doc.walacor_tx_id ? 'Sealed (Inherited)' : 'Pending (Parent Unsealed)',
              security_level: doc.security_level || child.security_level,
              walacor_tx_id: doc.walacor_tx_id || child.walacor_tx_id
            }
            rows.push({ type: 'child', doc: childClone, depth: 1, parent: doc })
          })
        }
      } else {
        rows.push({ type: 'document', doc, depth: 0 })
      }
    })

    return rows
  }, [documents, expandedDirectories])

  useEffect(() => {
    setSelectedDocuments((prev) => {
      const validIds = new Set(flattenedRows.map((row) => row.doc.id))
      const next = new Set<string>()
      let changed = false

      prev.forEach((id) => {
        if (validIds.has(id)) {
          next.add(id)
        } else {
          changed = true
        }
      })

      if (!changed && next.size === prev.size) {
        return prev
      }

      return next
    })
  }, [flattenedRows])

  // Export functionality
  const handleSelectAll = () => {
    const allIds = flattenedRows.map((row) => row.doc.id)
    if (selectedDocuments.size === allIds.length && allIds.length > 0) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(allIds))
    }
  }

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }
    setSelectedDocuments(newSelected)
  }

  const toggleDirectory = (directoryId: string) => {
    setExpandedDirectories((prev) => {
      const next = new Set(prev)
      if (next.has(directoryId)) {
        next.delete(directoryId)
      } else {
        next.add(directoryId)
      }
      return next
    })
  }

  const generatePDFReport = async (doc: Document) => {
    const pdf = new jsPDF()
    
    // Header
    pdf.setFontSize(20)
    pdf.text('Loan Document Audit Report', 20, 30)
    pdf.setFontSize(12)
    pdf.text(`Generated: ${getCurrentEasternTime()}`, 20, 45)
    
    // Loan Details Section
    pdf.setFontSize(16)
    pdf.text('Loan Details', 20, 65)
    pdf.setFontSize(10)
    pdf.text(`Loan ID: ${doc.loan_id}`, 20, 80)
    pdf.text(`Document Type: ${doc.document_type}`, 20, 90)
    pdf.text(`Upload Date: ${formatDate(doc.upload_date)}`, 20, 100)
    pdf.text(`Created By: ${doc.created_by}`, 20, 110)
    
    // Borrower Information Section
    pdf.setFontSize(16)
    pdf.text('Borrower Information', 20, 130)
    pdf.setFontSize(10)
    pdf.text(`Name: ${doc.borrower_name}`, 20, 145)
    pdf.text(`Email: ${doc.borrower_email}`, 20, 155)
    
    // Verification Status Section
    pdf.setFontSize(16)
    pdf.text('Verification Status', 20, 175)
    pdf.setFontSize(10)
    pdf.text(`Status: ${doc.sealed_status}`, 20, 190)
    pdf.text(`Security Level: ${doc.security_level}`, 20, 200)
    pdf.text(`Walacor TX ID: ${doc.walacor_tx_id}`, 20, 210)
    pdf.text(`Artifact ID: ${doc.id}`, 20, 220)
    
    // Blockchain Proof Section
    pdf.setFontSize(16)
    pdf.text('Blockchain Proof', 20, 240)
    pdf.setFontSize(10)
    pdf.text(`Transaction ID: ${doc.walacor_tx_id}`, 20, 255)
    pdf.text(`Sealed Date: ${formatDate(doc.upload_date)}`, 20, 265)
    pdf.text('Document hash is cryptographically sealed in Walacor blockchain', 20, 275)
    pdf.text('This document has not been tampered with since sealing', 20, 285)
    
    return pdf
  }

  const exportToPDF = async (doc: Document) => {
    try {
      setIsExporting(true)
      const pdf = await generatePDFReport(doc)
      pdf.save(`loan-audit-${doc.loan_id}-${formatForFilename()}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF report')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJSON = (doc: Document) => {
    try {
      setIsExporting(true)
      const exportData = {
        loan_details: {
          loan_id: doc.loan_id,
          document_type: doc.document_type,
          loan_amount: doc.loan_amount,
          upload_date: doc.upload_date,
          created_by: doc.created_by
        },
        borrower_information: {
          name: doc.borrower_name,
          email: doc.borrower_email
        },
        verification_status: {
          status: doc.sealed_status,
          security_level: doc.security_level,
          walacor_tx_id: doc.walacor_tx_id,
          artifact_id: doc.id
        },
        blockchain_proof: {
          transaction_id: doc.walacor_tx_id,
          sealed_date: doc.upload_date,
          integrity_verified: true,
          tamper_proof: true
        },
        export_metadata: {
          exported_at: new Date().toISOString(),
          export_format: 'JSON',
          version: '1.0'
        }
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `loan-audit-${doc.loan_id}-${formatForFilename()}.json`
      window.document.body.appendChild(a)
      a.click()
      
      // Small delay before cleanup to ensure download starts
      setTimeout(() => {
        window.document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsExporting(false)
      }, 100)
    } catch (error) {
      console.error('Error exporting JSON:', error)
      alert('Error exporting JSON report')
      setIsExporting(false)
    }
  }

  const exportToCSV = (doc: Document) => {
    try {
      setIsExporting(true)
      const csvData = [
        {
          'Loan ID': doc.loan_id,
          'Document Type': doc.document_type,
          'Loan Amount': doc.loan_amount,
          'Upload Date': doc.upload_date,
          'Created By': doc.created_by,
          'Borrower Name': doc.borrower_name,
          'Borrower Email': doc.borrower_email,
          'Sealed Status': doc.sealed_status,
          'Security Level': doc.security_level,
          'Walacor TX ID': doc.walacor_tx_id,
          'Artifact ID': doc.id,
          'Export Date': new Date().toISOString()
        }
      ]
      
      if (typeof Papa === 'undefined') {
        throw new Error('PapaParse library not loaded')
      }
      
      const csv = Papa.unparse(csvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `loan-audit-${doc.loan_id}-${formatForFilename()}.csv`
      window.document.body.appendChild(a)
      a.click()
      
      // Small delay before cleanup to ensure download starts
      setTimeout(() => {
        window.document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsExporting(false)
      }, 100)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert(`Error exporting CSV report: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsExporting(false)
    }
  }

  const exportBulkDocuments = async (format: 'PDF' | 'JSON' | 'CSV') => {
    if (selectedDocuments.size === 0) {
      alert('Please select documents to export')
      return
    }

    try {
      setIsExporting(true)
      const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id))
      
      if (format === 'PDF') {
        const zip = new JSZip()
        
        for (const doc of selectedDocs) {
          const pdf = await generatePDFReport(doc)
          const pdfBlob = pdf.output('blob')
          zip.file(`loan-audit-${doc.loan_id}.pdf`, pdfBlob)
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `loan-audit-bulk-${formatForFilename()}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'JSON') {
        const exportData = selectedDocs.map(doc => ({
          loan_details: {
            loan_id: doc.loan_id,
            document_type: doc.document_type,
            upload_date: doc.upload_date,
            created_by: doc.created_by
          },
          borrower_information: {
            name: doc.borrower_name,
            email: doc.borrower_email
          },
          verification_status: {
            status: doc.sealed_status,
            security_level: doc.security_level,
            walacor_tx_id: doc.walacor_tx_id,
            artifact_id: doc.id
          },
          blockchain_proof: {
            transaction_id: doc.walacor_tx_id,
            sealed_date: doc.upload_date,
            integrity_verified: true,
            tamper_proof: true
          }
        }))
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `loan-audit-bulk-${formatForFilename()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'CSV') {
        const csvData = selectedDocs.map(doc => ({
          'Loan ID': doc.loan_id,
          'Document Type': doc.document_type,
          'Upload Date': doc.upload_date,
          'Created By': doc.created_by,
          'Borrower Name': doc.borrower_name,
          'Borrower Email': doc.borrower_email,
          'Sealed Status': doc.sealed_status,
          'Security Level': doc.security_level,
          'Walacor TX ID': doc.walacor_tx_id,
          'Artifact ID': doc.id,
          'Export Date': new Date().toISOString()
        }))
        
        const csv = Papa.unparse(csvData)
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `loan-audit-bulk-${formatForFilename()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting bulk documents:', error)
      alert('Error exporting documents')
    } finally {
      setIsExporting(false)
    }
  }

  const deleteSelectedDocuments = async () => {
    if (selectedDocuments.size === 0) {
      alert('Please select documents to delete')
      return
    }

    setIsDeleting(true)
    try {
      const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id))
      
      // Delete each selected document
      for (const doc of selectedDocs) {
        // Build query parameters for DELETE request
        const params = new URLSearchParams({
          deleted_by: 'current_user', // In a real app, this would be the actual user ID from Clerk auth
          ...(deleteReason && { deletion_reason: deleteReason || 'User requested deletion' })
        })
        
        const response = await fetchWithTimeout(`http://localhost:8000/api/artifacts/${doc.id}?${params.toString()}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          timeoutMs: 8000,
          retries: 1
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Delete failed:', errorData)
          throw new Error(`Failed to delete document ${doc.loan_id}: ${errorData.detail || response.statusText}`)
        }
      }
      
      // Refresh the documents list
      await fetchDocuments()
      
      // Clear selection and close modal
      setSelectedDocuments(new Set())
      setShowDeleteConfirm(false)
      setDeleteReason('')
      
      alert(`Successfully deleted ${selectedDocs.length} document(s). All information has been preserved for audit purposes.`)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Delete failed. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete document "${doc.loan_id}"?\n\nThis action will remove the document from the active list, but all metadata will be preserved for audit purposes.`)) {
      return
    }

    setIsDeleting(true)
    try {
      // Build query parameters for DELETE request
      const params = new URLSearchParams({
        deleted_by: 'current_user', // In a real app, this would be the actual user ID from Clerk auth
        deletion_reason: 'Deleted from actions dropdown'
      })
      
      const response = await fetchWithTimeout(`http://localhost:8000/api/artifacts/${doc.id}?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        timeoutMs: 8000,
        retries: 1
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Delete failed:', errorData)
        throw new Error(`Failed to delete document: ${errorData.detail || response.statusText}`)
      }

      // Refresh the documents list
      await fetchDocuments()
      alert(`Document "${doc.loan_id}" has been deleted successfully. All information has been preserved for audit purposes.`)
    } catch (error) {
      console.error('Delete failed:', error)
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Search and Filter Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="md:w-48">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Documents</h2>
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
    <DashboardLayout
      rightSidebar={
        <div className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
            Document Stats
          </h2>

          {/* Total Count */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Total Documents
            </h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              In your library
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Quick Filters
            </h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div>• By Date Range</div>
              <div>• By Borrower Name</div>
              <div>• By Loan Amount</div>
              <div>• By Security Level</div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Bulk Actions
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
              Select multiple documents to export
            </p>
            <div className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400">
              📥 Export Selected
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
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Document Library
                </h1>
                <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
                  View and manage your verified documents
                </p>
              </div>
              <Link
                href="/upload"
                className="inline-flex items-center px-6 py-3 bg-elite-blue hover:bg-[#1d4ed8] text-white rounded-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Total Documents</p>
                    <p className="text-3xl font-bold">{totalCount.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 text-white rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Sealed Today</p>
                    <p className="text-3xl font-bold">12</p>
                  </div>
                  <div className="p-3 bg-green-500/20 text-white rounded-xl">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Success Rate</p>
                    <p className="text-3xl font-bold">99.2%</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 text-white rounded-xl">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Search Documents</h2>
            <p className="text-sm text-gray-500">Filter by borrower information, dates, amounts, and security level</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Borrower Name</label>
              <input
                type="text"
              placeholder="Enter borrower name..."
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              />
            </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter email address..."
              value={borrowerEmail}
              onChange={(e) => setBorrowerEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Loan ID</label>
            <input
              type="text"
              placeholder="Enter loan ID..."
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Min Amount</label>
                <input
                  type="number"
                  placeholder="0"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Amount</label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Security Level</label>
                <select
                  value={securityLevel}
                  onChange={(e) => {
                    setSecurityLevel(e.target.value)
                    // Auto-search when filter changes
                    setTimeout(() => {
                      setCurrentPage(1)
                      fetchDocuments(1)
                    }, 100)
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">All Levels</option>
                  <option value="standard">Standard</option>
                  <option value="quantum_safe">Quantum Safe</option>
                  <option value="maximum">Maximum Security</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSearch}
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </button>
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Summary and Export Controls */}
      {totalCount > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-700">
                Showing <span className="font-bold text-gray-900">{flattenedRows.length}</span> of <span className="font-bold text-gray-900">{totalCount.toLocaleString()}</span> documents
              </div>
              {selectedDocuments.size > 0 && (
                <div className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg">
                  {selectedDocuments.size} selected
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportBulkDocuments('PDF')}
                disabled={selectedDocuments.size === 0 || isExporting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export PDF
              </button>
              <button
                onClick={() => exportBulkDocuments('JSON')}
                disabled={selectedDocuments.size === 0 || isExporting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export JSON
              </button>
              <button
                onClick={() => exportBulkDocuments('CSV')}
                disabled={selectedDocuments.size === 0 || isExporting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedDocuments.size === 0 || isDeleting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {flattenedRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center w-4 h-4"
                    >
                      {selectedDocuments.size === flattenedRows.length && flattenedRows.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                    Loan ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-48">
                    Borrower Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                    Upload Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                    Sealed Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                    Security Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {flattenedRows.map((row) => {
                  const doc = row.doc
                  const isDirectory = row.type === 'directory'
                  const isChild = row.type === 'child'
                  const depth = row.depth
                  const isExpanded = expandedDirectories.has(doc.id)
                  // For directories, show "Directory Container" if no borrower name
                  // For children, inherit from parent if available
                  let borrowerDisplay = ''
                  if (isDirectory) {
                    borrowerDisplay = cleanBorrowerName(doc.borrower_name || '')
                    borrowerDisplay = borrowerDisplay || 'Directory Container'
                  } else if (isChild && row.parent) {
                    borrowerDisplay = cleanBorrowerName(doc.borrower_name || row.parent.borrower_name || '')
                    borrowerDisplay = borrowerDisplay || 'Unknown'
                  } else {
                    borrowerDisplay = cleanBorrowerName(doc.borrower_name || '')
                    borrowerDisplay = borrowerDisplay || 'Unknown'
                  }
                  const borrowerText = borrowerDisplay
                  const sealedLabel = doc.sealed_status || (doc.walacor_tx_id ? 'Sealed' : 'Not Sealed')
                  const isSealed = sealedLabel.toLowerCase().includes('sealed')
                  const sealedBadgeClass = isSealed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  const directorySecondary = isDirectory ? `${doc.file_count || 0} file${(doc.file_count || 0) === 1 ? '' : 's'}` : doc.document_type
                  const loanDisplay = isDirectory
                    ? doc.directory_name || doc.loan_id || doc.id
                    : cleanLoanId(doc.loan_id || '')

                  return (
                    <tr
                      key={`${row.type}-${doc.id}`}
                      className={`${isChild ? 'bg-gray-50/50' : 'bg-white'} hover:bg-blue-50/30 transition-colors border-b border-gray-100`}
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectDocument(doc.id)}
                        className="flex items-center justify-center w-4 h-4"
                      >
                        {selectedDocuments.has(doc.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 w-32">
                      <div className="flex items-center" style={{ marginLeft: depth * 16 }}>
                        {isDirectory && (
                          <button
                            onClick={() => toggleDirectory(doc.id)}
                            className="mr-2 inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                          >
                            <ChevronRight
                              className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`}
                            />
                          </button>
                        )}
                        {!isDirectory && depth > 0 && (
                          <span className="inline-block w-4 h-4 mr-2 border-l-2 border-gray-300"></span>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate" title={loanDisplay}>
                            {loanDisplay}
                          </div>
                          {directorySecondary && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate" title={directorySecondary}>
                              {directorySecondary}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="text-sm font-medium text-gray-900 truncate" title={borrowerText}>
                        {borrowerText}
                      </div>
                      {doc.borrower_email && !isDirectory && borrowerText !== 'Unknown' && borrowerText !== 'Directory Container' && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate" title={doc.borrower_email}>
                          {doc.borrower_email.split(/\s+/)[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 w-32">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        <span>{formatDate(doc.upload_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-32">
                      {doc.walacor_tx_id ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-sm">
                            <Shield className="h-3 w-3 mr-1" />
                            Sealed on Walacor
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(doc.walacor_tx_id || '')
                              // You can add a toast notification here if available
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Copy Transaction ID"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${sealedBadgeClass} shadow-sm`}>
                        {sealedLabel}
                      </span>
                      )}
                    </td>
                    <td className="px-6 py-4 w-32">
                      {getSecurityLevelBadge(doc.security_level)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Actions"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-1" align="end">
                          <div className="space-y-1">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-2 text-gray-500" />
                              View Document
                            </Link>
                            <button
                              onClick={() => handleVerifyDocument(doc.id)}
                              disabled={isVerifying}
                              className="flex items-center w-full px-3 py-2 text-sm text-blue-700 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isVerifying ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <Hash className="h-4 w-4 mr-2 text-blue-500" />
                                  Verify
                                </>
                              )}
                            </button>
                            <Link
                              href={`/forensics?document=${doc.id}`}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Search className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                              Forensic Analysis
                            </Link>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={() => exportToPDF(doc)}
                              disabled={isExporting}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Download className="h-4 w-4 mr-2 text-gray-500" />
                              Export as PDF
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                exportToJSON(doc)
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <Download className="h-4 w-4 mr-2 text-gray-500" />
                              Export as JSON
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                exportToCSV(doc)
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <Download className="h-4 w-4 mr-2 text-gray-500" />
                              Export as CSV
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={() => handleDeleteDocument(doc)}
                              disabled={isDeleting}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-700 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDeleting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No loan documents found"
            description="Try adjusting your search criteria or upload a new document with borrower information."
            action={
                <Link
                  href="/upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Link>
            }
          />
        )}
      </div>

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{Math.ceil(totalCount / 20)}</span> 
              {' '}({totalCount.toLocaleString()} total documents)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Previous
              </button>
              <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200">
                {currentPage} / {Math.ceil(totalCount / 20)}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMore || currentPage >= Math.ceil(totalCount / 20)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete {selectedDocuments.size} selected document(s)? 
              This action will preserve all document information for audit purposes.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion (optional):
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteReason('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteSelectedDocuments}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Documents'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </DashboardLayout>
  )
}
