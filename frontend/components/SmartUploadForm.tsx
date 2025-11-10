'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, CheckCircle, AlertCircle, Upload, Sparkles } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { fetchWithTimeout } from '@/utils/api'

interface ExtractedData {
  documentType: string
  loanId?: string
  borrowerName?: string
  propertyAddress?: string
  amount?: string
  rate?: string
  term?: string
  confidence: number
}

interface SmartUploadFormProps {
  onUpload: (formData: FormData) => Promise<void>
  isUploading: boolean
}

export default function SmartUploadForm({ onUpload, isUploading }: SmartUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [formData, setFormData] = useState({
    loanId: '',
    documentType: '',
    borrowerName: '',
    propertyAddress: '',
    amount: '',
    rate: '',
    term: '',
    notes: ''
  })

  // Auto-populate form when data is extracted
  useEffect(() => {
    if (extractedData) {
      setFormData(prev => ({
        ...prev,
        loanId: extractedData.loanId || prev.loanId,
        documentType: extractedData.documentType || prev.documentType,
        borrowerName: extractedData.borrowerName || prev.borrowerName,
        propertyAddress: extractedData.propertyAddress || prev.propertyAddress,
        amount: extractedData.amount || prev.amount,
        rate: extractedData.rate || prev.rate,
        term: extractedData.term || prev.term
      }))
    }
  }, [extractedData])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)
      setExtractedData(null)

      // Start extraction process
      setIsExtracting(true)
      try {
        await extractDocumentData(selectedFile)
      } catch (error) {
        console.error('Extraction failed:', error)
        toast.error('Failed to extract document data')
      } finally {
        setIsExtracting(false)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const extractDocumentData = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetchWithTimeout('http://localhost:8000/api/extract-document-data', {
        method: 'POST',
        body: formData,
        timeoutMs: 20000,
        retries: 1
      })

      if (response.ok) {
        const result = await response.json()
        setExtractedData(result.data)
        toast.success('Document data extracted successfully!')
      } else {
        throw new Error('Extraction failed')
      }
    } catch (error) {
      console.error('Extraction error:', error)
      toast.error('Failed to extract document data')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please select a file first')
      return
    }

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('loan_id', formData.loanId)
    uploadFormData.append('document_type', formData.documentType)
    uploadFormData.append('borrower_name', formData.borrowerName)
    uploadFormData.append('property_address', formData.propertyAddress)
    uploadFormData.append('amount', formData.amount)
    uploadFormData.append('rate', formData.rate)
    uploadFormData.append('term', formData.term)
    uploadFormData.append('notes', formData.notes)
    uploadFormData.append('created_by', 'user') // This should come from auth context

    await onUpload(uploadFormData)
  }

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'docx':
      case 'doc':
        return '📝'
      case 'xlsx':
      case 'xls':
        return '📊'
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️'
      case 'json':
        return '📋'
      default:
        return '📁'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Smart Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-elite-blue" />
            Smart Document Upload
          </CardTitle>
          <CardDescription>
            Upload your document and let AI automatically extract key information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-elite-blue bg-blue-50 dark:bg-blue-950/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-elite-blue dark:hover:border-elite-blue'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            {isDragActive ? (
              <p className="text-elite-blue font-medium">Drop the file here...</p>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Drag and drop a file here, or click to select
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports PDF, DOCX, XLSX, images, and more (max 50MB)
                </p>
              </>
            )}
          </div>

          {/* File Preview & Extraction Status */}
          {file && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(file.name)}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {isExtracting && (
                  <div className="flex items-center gap-2 text-elite-blue">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Extracting data...</span>
                  </div>
                )}
                {extractedData && !isExtracting && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Data Extracted
                  </Badge>
                )}
              </div>

              {/* Extraction Confidence */}
              {extractedData && (
                <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                  <Sparkles className="h-4 w-4 text-elite-blue" />
                  <AlertDescription className="text-sm">
                    AI extracted data with <strong>{Math.round(extractedData.confidence * 100)}% confidence</strong>.
                    Please review and correct any fields below.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Details Form */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Review and complete the document information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loan ID */}
                <div className="space-y-2">
                  <Label htmlFor="loanId">
                    Loan ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="loanId"
                    placeholder="e.g., LN-2024-001"
                    value={formData.loanId}
                    onChange={(e) => setFormData({ ...formData, loanId: e.target.value })}
                    required
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                {/* Document Type */}
                <div className="space-y-2">
                  <Label htmlFor="documentType">
                    Document Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="documentType"
                    placeholder="e.g., Loan Application"
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    required
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                {/* Borrower Name */}
                <div className="space-y-2">
                  <Label htmlFor="borrowerName">Borrower Name</Label>
                  <Input
                    id="borrowerName"
                    placeholder="e.g., John Doe"
                    value={formData.borrowerName}
                    onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                {/* Property Address */}
                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Property Address</Label>
                  <Input
                    id="propertyAddress"
                    placeholder="e.g., 123 Main St, City, State"
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Loan Amount</Label>
                  <Input
                    id="amount"
                    placeholder="e.g., $250,000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                {/* Rate */}
                <div className="space-y-2">
                  <Label htmlFor="rate">Interest Rate</Label>
                  <Input
                    id="rate"
                    placeholder="e.g., 4.5%"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                {/* Term */}
                <div className="space-y-2">
                  <Label htmlFor="term">Loan Term</Label>
                  <Input
                    id="term"
                    placeholder="e.g., 30 years"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about this document..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isUploading || isExtracting || !file}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
                {file && !isUploading && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFile(null)
                      setExtractedData(null)
                      setFormData({
                        loanId: '',
                        documentType: '',
                        borrowerName: '',
                        propertyAddress: '',
                        amount: '',
                        rate: '',
                        term: '',
                        notes: ''
                      })
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
