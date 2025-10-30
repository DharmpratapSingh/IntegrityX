'use client'

import React, { useState, useEffect } from 'react'
import { json as fetchJson, fetchWithTimeout } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileSignature, 
  Users, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Plus,
  X,
  Loader2
} from 'lucide-react'

interface Signer {
  email: string
  name: string
  role: string
  order: number
}

interface SigningField {
  field_type: string
  page_number: number
  x_position: number
  y_position: number
  width: number
  height: number
  recipient_id: string
  required: boolean
  tab_label: string
}

interface SigningResult {
  success: boolean
  envelope_id: string
  signing_url: string | null
  status: string
  error_message: string | null
  processing_time: number
  provider_response: any
}

interface SigningProvider {
  id: string
  name: string
  status: string
  features: string[]
}

export default function DocumentSigningInterface() {
  const [activeTab, setActiveTab] = useState('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create Envelope State
  const [documentId, setDocumentId] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [templateType, setTemplateType] = useState('loan_application')
  const [provider, setProvider] = useState('docusign')
  const [signers, setSigners] = useState<Signer[]>([
    { email: '', name: '', role: 'signer', order: 1 }
  ])
  const [signingFields, setSigningFields] = useState<SigningField[]>([])

  // Envelope Management State
  const [envelopes, setEnvelopes] = useState<any[]>([])
  const [providers, setProviders] = useState<SigningProvider[]>([])
  const [templates, setTemplates] = useState<any>({})

  useEffect(() => {
    fetchSigningProviders()
    fetchSigningTemplates()
  }, [])

  const fetchSigningProviders = async () => {
    try {
      const res = await fetchJson<any>('http://localhost:8000/api/signing/providers', { timeoutMs: 8000 })
      if (res.ok && res.data) {
        setProviders(res.data.data.signing_providers.map((p: string) => ({
          id: p,
          name: p.charAt(0).toUpperCase() + p.slice(1).replace('_', ' '),
          status: 'active',
          features: ['digital_signature', 'envelope_management', 'audit_trail']
        })))
      }
    } catch (err) {
      console.error('Failed to fetch signing providers:', err)
    }
  }

  const fetchSigningTemplates = async () => {
    try {
      const res = await fetchJson<any>('http://localhost:8000/api/signing/templates', { timeoutMs: 8000 })
      if (res.ok && res.data) {
        setTemplates(res.data.data.signing_templates)
      }
    } catch (err) {
      console.error('Failed to fetch signing templates:', err)
    }
  }

  const addSigner = () => {
    setSigners([...signers, { 
      email: '', 
      name: '', 
      role: 'signer', 
      order: signers.length + 1 
    }])
  }

  const removeSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index))
  }

  const updateSigner = (index: number, field: keyof Signer, value: string | number) => {
    const updatedSigners = [...signers]
    updatedSigners[index] = { ...updatedSigners[index], [field]: value }
    setSigners(updatedSigners)
  }

  const createSigningEnvelope = async () => {
    if (!documentId || !documentName || signers.length === 0) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithTimeout('http://localhost:8000/api/signing/create-envelope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          document_name: documentName,
          signers: signers.filter(s => s.email && s.name),
          signing_fields: signingFields,
          template_type: templateType,
          provider: provider
        }),
        timeoutMs: 12000,
        retries: 1
      })

      const data = await response.json()

      if (data.ok) {
        setSuccess(`Envelope created successfully! ID: ${data.data.signing_result.envelope_id}`)
        setDocumentId('')
        setDocumentName('')
        setSigners([{ email: '', name: '', role: 'signer', order: 1 }])
        setSigningFields([])
      } else {
        setError(data.error?.message || 'Failed to create signing envelope')
      }
    } catch (err) {
      setError('Failed to create signing envelope')
    } finally {
      setLoading(false)
    }
  }

  const sendEnvelope = async (envelopeId: string) => {
    setLoading(true)
    try {
      const response = await fetchWithTimeout(`http://localhost:8000/api/signing/send-envelope?envelope_id=${envelopeId}&provider=${provider}`, { timeoutMs: 10000 })
      const data = await response.json()
      
      if (data.ok) {
        setSuccess('Envelope sent successfully!')
      } else {
        setError(data.error?.message || 'Failed to send envelope')
      }
    } catch (err) {
      setError('Failed to send envelope')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
      delivered: { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      declined: { color: 'bg-red-100 text-red-800', icon: X },
      voided: { color: 'bg-red-100 text-red-800', icon: Trash2 }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Signing</h2>
          <p className="text-gray-600">Create and manage document signing workflows</p>
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
          <TabsTrigger value="create">Create Envelope</TabsTrigger>
          <TabsTrigger value="manage">Manage Envelopes</TabsTrigger>
          <TabsTrigger value="providers">Providers & Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Create Signing Envelope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentId">Document ID</Label>
                  <Input
                    id="documentId"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="Enter document ID"
                  />
                </div>
                <div>
                  <Label htmlFor="documentName">Document Name</Label>
                  <Input
                    id="documentName"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Enter document name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template">Template Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(templates).map((template) => (
                        <SelectItem key={template} value={template}>
                          {template.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="provider">Signing Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Signers</Label>
                  <Button onClick={addSigner} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Signer
                  </Button>
                </div>
                <div className="space-y-3">
                  {signers.map((signer, index) => (
                    <div key={index} className="grid grid-cols-4 gap-3 p-3 border rounded-lg">
                      <Input
                        placeholder="Email"
                        value={signer.email}
                        onChange={(e) => updateSigner(index, 'email', e.target.value)}
                      />
                      <Input
                        placeholder="Name"
                        value={signer.name}
                        onChange={(e) => updateSigner(index, 'name', e.target.value)}
                      />
                      <Select 
                        value={signer.role} 
                        onValueChange={(value) => updateSigner(index, 'role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="signer">Signer</SelectItem>
                          <SelectItem value="approver">Approver</SelectItem>
                          <SelectItem value="cc">CC</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => removeSigner(index)} 
                        size="sm" 
                        variant="outline"
                        disabled={signers.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={createSigningEnvelope} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Signing Envelope
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Envelope Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No envelopes created yet. Create your first signing envelope to get started.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-gray-500">{provider.features.length} features</p>
                      </div>
                      <Badge variant="outline">{provider.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signing Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(templates).map(([key, template]: [string, any]) => (
                    <div key={key} className="p-3 border rounded-lg">
                      <p className="font-medium">{key.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-gray-500">{template.subject}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



