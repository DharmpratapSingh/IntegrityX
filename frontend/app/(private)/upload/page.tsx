'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccessibleDropzone } from '@/components/ui/accessible-dropzone';
import { Loader2, Upload, FileText, CheckCircle, ExternalLink, Hash, Shield, ArrowLeft } from 'lucide-react';
import { simpleToast as toast } from '@/components/ui/simple-toast';

interface UploadResult {
  artifactId: string;
  walacorTxId: string;
  sealedAt: string;
  proofBundle: any;
}

interface VerifyResult {
  is_valid: boolean;
  status: string;
  artifact_id: string;
  verified_at: string;
  details: {
    stored_hash: string;
    provided_hash: string;
    artifact_type: string;
    created_at: string;
  };
}

interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}


export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileHash, setFileHash] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [metadata, setMetadata] = useState('');
  const [etid, setEtid] = useState('100001');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate file hash on client side
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Check if document is already sealed
  const checkIfAlreadySealed = async (hash: string, etid: string): Promise<VerifyResult | null> => {
    try {
      const response = await fetch('http://localhost:8000/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          etid: parseInt(etid),
          payloadHash: hash
        })
      });

      if (!response.ok) {
        // If verification fails (document not found), return null
        return null;
      }

      const apiResponse: ApiResponse<VerifyResult> = await response.json();
      
      if (apiResponse.ok && apiResponse.data) {
        return apiResponse.data;
      }
      
      return null;
    } catch (error) {
      console.error('Verification check error:', error);
      return null;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      console.log('Selected file:', selectedFile.name, selectedFile.type, selectedFile.size);
      setFile(selectedFile);
      setUploadResult(null);
      setVerifyResult(null);
      
      // Calculate hash
      try {
        const hash = await calculateFileHash(selectedFile);
        setFileHash(hash);
        console.log('File hash calculated:', hash);
        toast.success('File hash calculated successfully');
        
        // Check if document is already sealed
        setIsVerifying(true);
        const existingVerify = await checkIfAlreadySealed(hash, etid);
        setIsVerifying(false);
        
        if (existingVerify && existingVerify.is_valid) {
          setVerifyResult(existingVerify);
          toast.success('Document already sealed!', undefined, 5000);
        }
      } catch (error) {
        toast.error('Failed to calculate file hash');
        console.error('Hash calculation error:', error);
      }
    }
  }, [etid]);

  // File acceptance configuration
  const fileAccept = {
    'application/pdf': ['.pdf'],
    'application/json': ['.json'],
    'text/plain': ['.txt'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
      setVerifyResult(null);
      
      // Calculate hash
      try {
        const hash = await calculateFileHash(selectedFile);
        setFileHash(hash);
        toast.success('File hash calculated successfully');
        
        // Check if document is already sealed
        setIsVerifying(true);
        const existingVerify = await checkIfAlreadySealed(hash, etid);
        setIsVerifying(false);
        
        if (existingVerify && existingVerify.is_valid) {
          setVerifyResult(existingVerify);
          toast.success('Document already sealed!', undefined, 5000);
        }
      } catch (error) {
        toast.error('Failed to calculate file hash');
        console.error('Hash calculation error:', error);
      }
    }
  };


  const handleUpload = async () => {
    console.log('Upload button clicked');
    if (!file || !fileHash) {
      console.log('No file or hash available');
      toast.error('Please select a file first');
      return;
    }

    console.log('Starting upload for file:', file.name);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata if provided
      if (metadata) {
        try {
          const parsedMetadata = JSON.parse(metadata);
          formData.append('metadata', JSON.stringify(parsedMetadata));
        } catch (e) {
          toast.error('Invalid JSON in metadata field');
          return;
        }
      }

      // Determine which endpoint to use based on file type
      let endpoint = '/api/ingest-json';
      if (file.type === 'application/json') {
        endpoint = '/api/ingest-json';
      } else {
        // For non-JSON files, we'll use the packet endpoint
        endpoint = '/api/ingest-packet';
      }

      toast.loading('Uploading and sealing document...', undefined, 'upload');

      // Upload and seal the document
      const uploadUrl = `http://localhost:8000${endpoint}?loan_id=test-loan-${Date.now()}&created_by=user`;
      console.log('Uploading to:', uploadUrl);
      console.log('FormData contents:', Array.from(formData.entries()));
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const uploadApiResponse: ApiResponse<any> = await uploadResponse.json();
      
      if (!uploadApiResponse.ok || !uploadApiResponse.data) {
        throw new Error(uploadApiResponse.error?.message || 'Upload failed');
      }

      const uploadResult = uploadApiResponse.data;
      
      // Create a mock UploadResult for compatibility
      const mockUploadResult: UploadResult = {
        artifactId: uploadResult.artifact_id || uploadResult.id || 'unknown',
        walacorTxId: uploadResult.walacor_tx_id || 'demo-tx-id',
        sealedAt: uploadResult.created_at || new Date().toISOString(),
        proofBundle: uploadResult
      };

      setUploadResult(mockUploadResult);
      toast.success('Document uploaded and sealed successfully!', undefined, undefined, 'upload');
      
      // Redirect to document detail page after successful upload
      setTimeout(() => {
        window.location.href = `/documents/${mockUploadResult.artifactId}`;
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileHash('');
    setUploadResult(null);
    setVerifyResult(null);
    setMetadata('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/dashboard"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">Document Upload & Seal</h1>
            <p className="text-muted-foreground">
              Upload documents and seal them in the Walacor blockchain for immutable integrity verification.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>
              Drag and drop a file or click to select. Maximum file size: 50MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AccessibleDropzone
              onDrop={onDrop}
              accept={fileAccept}
              maxFiles={1}
              maxSize={50 * 1024 * 1024} // 50MB
              description="Drag and drop a file here, or click to select. Supported formats: PDF, JSON, TXT, JPG, PNG, DOCX, XLSX"
              aria-label="File upload area for document sealing"
              id="file-upload-dropzone"
            />

            {file && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>

                {fileHash && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Hash className="h-4 w-4" />
                    <span className="text-sm font-mono break-all">{fileHash}</span>
                  </div>
                )}

                {isVerifying && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-800">Checking if document is already sealed...</span>
                  </div>
                )}

                {verifyResult && verifyResult.is_valid && (
                  <Alert className="border-green-200 bg-green-50">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-2">
                        <div className="font-medium">Document Already Sealed!</div>
                        <div className="text-sm">
                          This document was already sealed on{' '}
                          <span className="font-medium">
                            {new Date(verifyResult.details.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button asChild size="sm">
                            <a href={`http://localhost:8000/api/verify?hash=${fileHash}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Proof
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <a href={`http://localhost:8000/api/proof?id=${verifyResult.artifact_id}`} target="_blank" rel="noopener noreferrer">
                              <Shield className="h-3 w-3 mr-1" />
                              Download Proof Bundle
                            </a>
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Information */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Information</CardTitle>
            <CardDescription>
              Provide loan details and document context (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loanId">Loan ID</Label>
                <Input
                  id="loanId"
                  value={metadata ? JSON.parse(metadata || '{}').loanId || '' : ''}
                  onChange={(e) => {
                    const currentMeta = JSON.parse(metadata || '{}')
                    setMetadata(JSON.stringify({ ...currentMeta, loanId: e.target.value }, null, 2))
                  }}
                  placeholder="e.g., LOAN_2024_001"
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for the loan
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <select
                  id="documentType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={metadata ? JSON.parse(metadata || '{}').documentType || '' : ''}
                  onChange={(e) => {
                    const currentMeta = JSON.parse(metadata || '{}')
                    setMetadata(JSON.stringify({ ...currentMeta, documentType: e.target.value }, null, 2))
                  }}
                >
                  <option value="">Select document type</option>
                  <option value="loan_application">Loan Application</option>
                  <option value="credit_report">Credit Report</option>
                  <option value="property_appraisal">Property Appraisal</option>
                  <option value="income_verification">Income Verification</option>
                  <option value="bank_statements">Bank Statements</option>
                  <option value="tax_returns">Tax Returns</option>
                  <option value="employment_verification">Employment Verification</option>
                  <option value="underwriting_decision">Underwriting Decision</option>
                  <option value="closing_disclosure">Closing Disclosure</option>
                  <option value="title_insurance">Title Insurance</option>
                  <option value="homeowners_insurance">Homeowners Insurance</option>
                  <option value="flood_certificate">Flood Certificate</option>
                  <option value="compliance_document">Compliance Document</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Type of document being uploaded
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="borrowerName">Borrower Name</Label>
                <Input
                  id="borrowerName"
                  value={metadata ? JSON.parse(metadata || '{}').borrowerName || '' : ''}
                  onChange={(e) => {
                    const currentMeta = JSON.parse(metadata || '{}')
                    setMetadata(JSON.stringify({ ...currentMeta, borrowerName: e.target.value }, null, 2))
                  }}
                  placeholder="e.g., John Smith"
                />
                <p className="text-xs text-muted-foreground">
                  Primary borrower's full name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={metadata ? JSON.parse(metadata || '{}').loanAmount || '' : ''}
                  onChange={(e) => {
                    const currentMeta = JSON.parse(metadata || '{}')
                    setMetadata(JSON.stringify({ ...currentMeta, loanAmount: e.target.value }, null, 2))
                  }}
                  placeholder="e.g., 250000"
                />
                <p className="text-xs text-muted-foreground">
                  Loan amount in USD
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={metadata ? JSON.parse(metadata || '{}').notes || '' : ''}
                onChange={(e) => {
                  const currentMeta = JSON.parse(metadata || '{}')
                  setMetadata(JSON.stringify({ ...currentMeta, notes: e.target.value }, null, 2))
                }}
                placeholder="Any additional information about this document..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional notes or comments about the document
              </p>
            </div>

            {/* Advanced Options (Collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Advanced Options
              </summary>
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="etid">Entity Type ID (ETID)</Label>
                  <Input
                    id="etid"
                    value={etid}
                    onChange={(e) => setEtid(e.target.value)}
                    placeholder="100001"
                  />
                  <p className="text-xs text-muted-foreground">
                    100001 for loan packets, 100002 for JSON documents. Leave as default unless you know what you're doing.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rawMetadata">Raw Metadata (JSON)</Label>
                  <Textarea
                    id="rawMetadata"
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    placeholder='{"source": "api", "department": "finance"}'
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Advanced: Raw JSON metadata for technical users
                  </p>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Upload Result */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Document Sealed Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Artifact ID</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{uploadResult.artifactId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Walacor Transaction ID</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{uploadResult.walacorTxId}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Sealed At</Label>
                <p className="text-sm">{new Date(uploadResult.sealedAt).toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <Button asChild>
                  <a href={`http://localhost:8000/api/verify?hash=${fileHash}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Verify Document
                  </a>
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Upload Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !fileHash || isVerifying || uploadResult || (verifyResult && verifyResult.is_valid)}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sealing Document...
              </>
            ) : !file ? (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select File to Upload
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Seal
              </>
            )}
          </Button>
          {file && !uploadResult && !verifyResult && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>

        {/* Action Buttons for Already Sealed Documents */}
        {file && verifyResult && verifyResult.is_valid && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Upload Different File
            </Button>
            <Button asChild>
              <a href={`http://localhost:8000/api/verify?hash=${fileHash}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Verification
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

