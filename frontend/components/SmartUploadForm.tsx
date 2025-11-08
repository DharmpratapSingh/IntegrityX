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
            <Sparkles className="h-5 w-5 text-blue-600" />
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
            className={`