'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  BarChart3,
  Target,
  AlertCircle,
  TrendingUp,
  Zap,
} from 'lucide-react'

interface DocumentAnalysisResult {
  document_type: string
  classification_confidence: number
  quality_score: number
  risk_score: number
  is_duplicate: boolean
  duplicate_match_type: string
  extracted_fields: Record<string, any>
  recommendations: string[]
  processing_time: number
  raw_text_content: string | null
  error: string | null
}

interface BatchAnalysisResult {
  results: Array<{
    filename: string
    success: boolean
    analysis_result?: DocumentAnalysisResult
    error?: string
  }>
  summary: {
    total_documents: number
    successful_analyses: number
    failed_analyses: number
    success_rate: number
  }
}

interface AICapabilities {
  document_classification: boolean
  content_extraction: boolean
  quality_assessment: boolean
  risk_scoring: boolean
  duplicate_detection: boolean
  recommendations: boolean
  batch_processing: boolean
  supported_formats: string[]
  document_types: string[]
  processing_features: string[]
}

export default function AIDocumentProcessingInterface() {
  const [activeTab, setActiveTab] = useState('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Single Document Analysis
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null)

  // Batch Analysis
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null)

  // AI Capabilities
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null)

  const handleSingleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAnalysisResult(null)
      setError(null)
    }
  }

  const handleBatchFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
    setBatchResult(null)
    setError(null)
  }

  const analyzeSingleDocument = async () => {
    if (!selectedFile) {
      setError('Please select a file to analyze')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('http://localhost:8000/api/ai/analyze-document-json', {
        method: 'POST',
        body: JSON.stringify({
          filename: selectedFile.name,
          content_type: selectedFile.type,
          file_content: await fileToBase64(selectedFile)
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.ok) {
        setAnalysisResult(data.data.analysis_result)
        setSuccess('Document analyzed successfully!')
      } else {
        setError(data.error?.message || 'Failed to analyze document')
      }
    } catch (err) {
      setError('Failed to analyze document')
    } finally {
      setLoading(false)
    }
  }

  const analyzeBatchDocuments = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to analyze')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const documents = await Promise.all(
        selectedFiles.map(async (file) => ({
          filename: file.name,
          content_type: file.type,
          file_content: await fileToBase64(file)
        }))
      )

      const response = await fetch('http://localhost:8000/api/ai/analyze-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documents })
      })

      const data = await response.json()

      if (data.ok) {
        setBatchResult(data.data.batch_analysis_result)
        setSuccess(`Batch analysis completed! ${data.data.batch_analysis_result.summary.successful_analyses}/${data.data.batch_analysis_result.summary.total_documents} documents processed successfully.`)
      } else {
        setError(data.error?.message || 'Failed to analyze documents')
      }
    } catch (err) {
      setError('Failed to analyze documents')
    } finally {
      setLoading(false)
    }
  }

  const fetchAICapabilities = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ai/ai-capabilities')
      const data = await response.json()

      if (data.ok) {
        setCapabilities(data.data.ai_capabilities)
      }
    } catch (err) {
      console.error('Failed to fetch AI capabilities:', err)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:type;base64, prefix
      }
      reader.onerror = error => reject(error)
    })
  }

  const getQualityBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800">High Quality</Badge>
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium Quality</Badge>
    return <Badge className="bg-red-100 text-red-800">Low Quality</Badge>
  }

  const getRiskBadge = (score: number) => {
    if (score <= 0.3) return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>
    if (score <= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
    return <Badge className="bg-red-100 text-red-800">High Risk</Badge>
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-blue-100 text-blue-800">High Confidence</Badge>
    if (confidence >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>
    return <Badge className="bg-gray-100 text-gray-800">Low Confidence</Badge>
  }

  React.useEffect(() => {
    fetchAICapabilities()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Document Processing</h2>
          <p className="text-gray-600">Analyze documents with AI-powered intelligence</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Document</TabsTrigger>
          <TabsTrigger value="batch">Batch Processing</TabsTrigger>
          <TabsTrigger value="capabilities">AI Capabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Single Document Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="singleFile">Select Document</Label>
                <Input
                  id="singleFile"
                  type="file"
                  onChange={handleSingleFileUpload}
                  accept=".pdf,.json,.docx,.doc,.xlsx,.xls,.txt,.jpg,.jpeg,.png"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <Button 
                onClick={analyzeSingleDocument} 
                disabled={loading || !selectedFile}
                className="w-full"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Analyze Document
              </Button>

              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Document Type</Label>
                        <p className="font-medium">{analysisResult.document_type}</p>
                        {getConfidenceBadge(analysisResult.classification_confidence)}
                      </div>
                      <div>
                        <Label>Quality Score</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={analysisResult.quality_score * 100} className="flex-1" />
                          <span className="text-sm">{(analysisResult.quality_score * 100).toFixed(1)}%</span>
                        </div>
                        {getQualityBadge(analysisResult.quality_score)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Risk Score</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={analysisResult.risk_score * 100} className="flex-1" />
                          <span className="text-sm">{(analysisResult.risk_score * 100).toFixed(1)}%</span>
                        </div>
                        {getRiskBadge(analysisResult.risk_score)}
                      </div>
                      <div>
                        <Label>Processing Time</Label>
                        <p className="font-medium">{analysisResult.processing_time.toFixed(3)}s</p>
                      </div>
                    </div>

                    {analysisResult.is_duplicate && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This document appears to be a duplicate. Match type: {analysisResult.duplicate_match_type}
                        </AlertDescription>
                      </Alert>
                    )}

                    {Object.keys(analysisResult.extracted_fields).length > 0 && (
                      <div>
                        <Label>Extracted Fields</Label>
                        <div className="mt-2 space-y-2">
                          {Object.entries(analysisResult.extracted_fields).map(([key, value]) => (
                            <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="font-medium">{key}</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.recommendations.length > 0 && (
                      <div>
                        <Label>Recommendations</Label>
                        <ul className="mt-2 space-y-1">
                          {analysisResult.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Target className="h-4 w-4 mt-0.5 text-blue-600" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Batch Document Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="batchFiles">Select Multiple Documents</Label>
                <Input
                  id="batchFiles"
                  type="file"
                  multiple
                  onChange={handleBatchFileUpload}
                  accept=".pdf,.json,.docx,.doc,.xlsx,.xls,.txt,.jpg,.jpeg,.png"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected {selectedFiles.length} files:
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={analyzeBatchDocuments} 
                disabled={loading || selectedFiles.length === 0}
                className="w-full"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Process {selectedFiles.length} Documents
              </Button>

              {batchResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Batch Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {batchResult.summary.successful_analyses}
                        </div>
                        <div className="text-sm text-green-600">Successful</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {batchResult.summary.failed_analyses}
                        </div>
                        <div className="text-sm text-red-600">Failed</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {batchResult.summary.success_rate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-blue-600">Success Rate</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Individual Results</Label>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {batchResult.results.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{result.filename}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <Badge className="bg-green-100 text-green-800">Success</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Failed</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Processing Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {capabilities ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Supported Formats</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {capabilities.supported_formats.map((format) => (
                          <Badge key={format} variant="outline">{format}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Document Types</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {capabilities.document_types.map((type) => (
                          <Badge key={type} variant="outline">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Processing Features</Label>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {capabilities.processing_features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Core Capabilities</Label>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${capabilities.document_classification ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm">Document Classification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${capabilities.content_extraction ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm">Content Extraction</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${capabilities.quality_assessment ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm">Quality Assessment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${capabilities.risk_scoring ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm">Risk Scoring</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${capabilities.duplicate_detection ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm">Duplicate Detection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${capabilities.batch_processing ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm">Batch Processing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading AI capabilities...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
