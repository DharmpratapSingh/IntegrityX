'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Layers, 
  Trash2, 
  CheckCircle, 
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  Folder,
  Hash,
  Activity,
  Zap,
  FileText,
  X,
  Plus
} from 'lucide-react'

interface BulkOperation {
  id: string
  type: 'delete' | 'verify' | 'export' | 'analyze'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  documents: string[]
  progress: number
  startTime: Date
  endTime?: Date
  result?: any
  error?: string
}

interface ObjectValidatorResult {
  directory_hash: string
  verification_status: string
  file_count: number
  total_size_mb: number
  processing_time: number
}

export default function BulkOperationsInterface() {
  const [activeTab, setActiveTab] = useState('operations')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Bulk Operations State
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [operationType, setOperationType] = useState<'delete' | 'verify' | 'export' | 'analyze'>('verify')
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([])

  // ObjectValidator State
  const [directoryPath, setDirectoryPath] = useState('')
  const [validatorResult, setValidatorResult] = useState<ObjectValidatorResult | null>(null)

  // Mock documents for demonstration
  const mockDocuments = [
    { id: 'doc1', name: 'Loan Application 001.pdf', type: 'pdf', size: '2.3 MB', status: 'active' },
    { id: 'doc2', name: 'Credit Report 002.pdf', type: 'pdf', size: '1.8 MB', status: 'active' },
    { id: 'doc3', name: 'Property Appraisal 003.pdf', type: 'pdf', size: '3.1 MB', status: 'active' },
    { id: 'doc4', name: 'Income Statement 004.pdf', type: 'pdf', size: '1.2 MB', status: 'active' },
    { id: 'doc5', name: 'Bank Statement 005.pdf', type: 'pdf', size: '2.7 MB', status: 'active' }
  ]

  const handleDocumentSelection = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments([...selectedDocuments, documentId])
    } else {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(mockDocuments.map(doc => doc.id))
    } else {
      setSelectedDocuments([])
    }
  }

  const executeBulkOperation = async () => {
    if (selectedDocuments.length === 0) {
      setError('Please select at least one document')
      return
    }

    setLoading(true)
    setError(null)

    const operation: BulkOperation = {
      id: `op_${Date.now()}`,
      type: operationType,
      status: 'processing',
      documents: selectedDocuments,
      progress: 0,
      startTime: new Date()
    }

    setBulkOperations([operation, ...bulkOperations])

    try {
      // Simulate bulk operation processing
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        
        setBulkOperations(prev => prev.map(op => 
          op.id === operation.id 
            ? { ...op, progress: i }
            : op
        ))
      }

      // Complete the operation
      setBulkOperations(prev => prev.map(op => 
        op.id === operation.id 
          ? { 
              ...op, 
              status: 'completed', 
              progress: 100, 
              endTime: new Date(),
              result: { 
                processed: selectedDocuments.length,
                successful: selectedDocuments.length,
                failed: 0
              }
            }
          : op
      ))

      setSuccess(`Bulk ${operationType} completed successfully! ${selectedDocuments.length} documents processed.`)
      setSelectedDocuments([])
    } catch (err) {
      setBulkOperations(prev => prev.map(op => 
        op.id === operation.id 
          ? { 
              ...op, 
              status: 'failed', 
              error: 'Operation failed',
              endTime: new Date()
            }
          : op
      ))
      setError('Bulk operation failed')
    } finally {
      setLoading(false)
    }
  }

  const generateDirectoryHash = async () => {
    if (!directoryPath) {
      setError('Please enter a directory path')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simulate ObjectValidator directory hashing
      await new Promise(resolve => setTimeout(resolve, 2000))

      const result: ObjectValidatorResult = {
        directory_hash: `dir_hash_${Date.now().toString(36)}`,
        verification_status: 'verified',
        file_count: Math.floor(Math.random() * 100) + 10,
        total_size_mb: Math.floor(Math.random() * 500) + 50,
        processing_time: Math.random() * 2 + 0.5
      }

      setValidatorResult(result)
      setSuccess('Directory hash generated successfully!')
    } catch (err) {
      setError('Failed to generate directory hash')
    } finally {
      setLoading(false)
    }
  }

  const getOperationBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Activity },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: X }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getOperationIcon = (type: string) => {
    const iconConfig = {
      delete: Trash2,
      verify: CheckCircle,
      export: Download,
      analyze: Activity
    }
    const Icon = iconConfig[type as keyof typeof iconConfig] || FileText
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Operations</h2>
          <p className="text-gray-600">Perform operations on multiple documents efficiently</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
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
          <TabsTrigger value="operations">Bulk Operations</TabsTrigger>
          <TabsTrigger value="object-validator">ObjectValidator</TabsTrigger>
          <TabsTrigger value="history">Operation History</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Select Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectedDocuments.length === mockDocuments.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="selectAll">Select All Documents</Label>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mockDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={doc.id}
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={(checked) => handleDocumentSelection(doc.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.size} • {doc.type.toUpperCase()}
                        </div>
                      </div>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600">
                  {selectedDocuments.length} of {mockDocuments.length} documents selected
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Bulk Operation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="operationType">Operation Type</Label>
                  <Select value={operationType} onValueChange={(value: any) => setOperationType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verify">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Verify Documents
                        </div>
                      </SelectItem>
                      <SelectItem value="analyze">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Analyze Documents
                        </div>
                      </SelectItem>
                      <SelectItem value="export">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Export Documents
                        </div>
                      </SelectItem>
                      <SelectItem value="delete">
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Documents
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getOperationIcon(operationType)}
                    <span className="font-medium">
                      {operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {operationType === 'verify' && 'Verify the integrity and authenticity of selected documents'}
                    {operationType === 'analyze' && 'Analyze documents using AI-powered processing'}
                    {operationType === 'export' && 'Export selected documents to a downloadable package'}
                    {operationType === 'delete' && 'Delete selected documents (metadata will be preserved)'}
                  </p>
                </div>

                <Button 
                  onClick={executeBulkOperation} 
                  disabled={loading || selectedDocuments.length === 0}
                  className="w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Execute Bulk {operationType.charAt(0).toUpperCase() + operationType.slice(1)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="object-validator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                ObjectValidator Directory Hashing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="directoryPath">Directory Path</Label>
                <Input
                  id="directoryPath"
                  value={directoryPath}
                  onChange={(e) => setDirectoryPath(e.target.value)}
                  placeholder="Enter directory path to hash"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">ObjectValidator Benefits</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Generate single hash for entire directory</li>
                  <li>• Efficient bulk verification</li>
                  <li>• Reduced storage requirements</li>
                  <li>• Faster integrity checking</li>
                </ul>
              </div>

              <Button 
                onClick={generateDirectoryHash} 
                disabled={loading || !directoryPath}
                className="w-full"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Directory Hash
              </Button>

              {validatorResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Directory Hash Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Directory Hash</Label>
                        <div className="p-2 bg-gray-100 rounded font-mono text-sm break-all">
                          {validatorResult.directory_hash}
                        </div>
                      </div>
                      <div>
                        <Label>Verification Status</Label>
                        <Badge className="bg-green-100 text-green-800">
                          {validatorResult.verification_status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{validatorResult.file_count}</div>
                        <div className="text-sm text-gray-600">Files</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{validatorResult.total_size_mb} MB</div>
                        <div className="text-sm text-gray-600">Total Size</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-lg font-bold">{validatorResult.processing_time.toFixed(2)}s</div>
                        <div className="text-sm text-gray-600">Processing Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Operation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bulkOperations.length > 0 ? (
                <div className="space-y-4">
                  {bulkOperations.map((operation) => (
                    <div key={operation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getOperationIcon(operation.type)}
                          <span className="font-medium">
                            {operation.type.charAt(0).toUpperCase() + operation.type.slice(1)} Operation
                          </span>
                        </div>
                        {getOperationBadge(operation.status)}
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        {operation.documents.length} documents • Started: {operation.startTime.toLocaleString()}
                        {operation.endTime && ` • Completed: ${operation.endTime.toLocaleString()}`}
                      </div>

                      {operation.status === 'processing' && (
                        <div className="mb-3">
                          <Progress value={operation.progress} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1">{operation.progress}% complete</div>
                        </div>
                      )}

                      {operation.result && (
                        <div className="text-sm text-green-600">
                          ✓ {operation.result.successful} successful, {operation.result.failed} failed
                        </div>
                      )}

                      {operation.error && (
                        <div className="text-sm text-red-600">
                          ✗ {operation.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No operations performed yet. Execute your first bulk operation to see the history.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
