'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, CheckCircle, XCircle, AlertTriangle, Hash, ExternalLink, Copy, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import ProofViewer from '@/components/proof/ProofViewer';
import { DisclosureButton } from '@/components/proof/DisclosureButton';
import { VerifyResultSkeleton, ProofResultSkeleton } from '@/components/ui/verify-result-skeleton';
import { EmptyState, NoResultsEmptyState } from '@/components/ui/empty-state';
import { AttestationList } from '@/components/attestations/AttestationList';
import { AttestationForm } from '@/components/attestations/AttestationForm';
import { LineageGraph } from '@/components/provenance/LineageGraph';
import { ProvenanceLinker } from '@/components/provenance/ProvenanceLinker';

interface VerifyResult {
  message: string;
  is_valid: boolean;
  status: 'ok' | 'tamper';
  artifact_id?: string;
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

interface ProofResult {
  proof_bundle: any;
  artifact_id: string;
  etid: number;
  retrieved_at: string;
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [etid, setEtid] = useState('100001');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);
  const [isProofViewerOpen, setIsProofViewerOpen] = useState(false);
  const [proofData, setProofData] = useState<any>(null);
  const viewProofButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for hash in URL params
  useEffect(() => {
    const hashFromUrl = searchParams.get('hash');
    if (hashFromUrl) {
      setFileHash(hashFromUrl);
    }
  }, [searchParams]);

  // Calculate file hash on client side
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVerifyResult(null);
      setProofResult(null);
      
      // Calculate hash
      try {
        const hash = await calculateFileHash(selectedFile);
        setFileHash(hash);
        toast.success('File hash calculated successfully');
      } catch (error) {
        toast.error('Failed to calculate file hash');
        console.error('Hash calculation error:', error);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVerifyResult(null);
      setProofResult(null);
      
      // Calculate hash
      try {
        const hash = await calculateFileHash(selectedFile);
        setFileHash(hash);
        toast.success('File hash calculated successfully');
      } catch (error) {
        toast.error('Failed to calculate file hash');
        console.error('Hash calculation error:', error);
      }
    }
  };

  const handleVerify = async () => {
    if (!fileHash) {
      toast.error('Please provide a file hash');
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);
    setProofResult(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          etid: parseInt(etid),
          payloadHash: fileHash
        })
      });

      if (!response.ok) {
        throw new Error('Verification request failed');
      }

      const apiResponse: ApiResponse<VerifyResult> = await response.json();
      
      if (!apiResponse.ok || !apiResponse.data) {
        throw new Error(apiResponse.error?.message || 'Verification request failed');
      }

      const result = apiResponse.data;
      setVerifyResult(result);
      
      if (result.is_valid) {
        toast.success('Document verification successful!');
      } else {
        toast.error('Document verification failed - tampering detected!');
      }

    } catch (error) {
      console.error('Verification error:', error);
      toast.error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGetProof = async () => {
    if (!verifyResult?.artifact_id) {
      toast.error('No artifact ID available');
      return;
    }

    setIsLoadingProof(true);

    try {
      const response = await fetch(`/api/proof?id=${verifyResult.artifact_id}`);
      
      if (!response.ok) {
        throw new Error('Proof request failed');
      }

      const apiResponse: ApiResponse<ProofResult> = await response.json();
      
      if (!apiResponse.ok || !apiResponse.data) {
        throw new Error(apiResponse.error?.message || 'Proof request failed');
      }

      const result = apiResponse.data;
      setProofResult(result);
      toast.success('Proof bundle retrieved successfully!');

    } catch (error) {
      console.error('Proof error:', error);
      toast.error(`Failed to get proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingProof(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleReset = () => {
    setFile(null);
    setFileHash('');
    setVerifyResult(null);
    setProofResult(null);
    setProofData(null);
    setIsProofViewerOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewProof = async () => {
    if (!verifyResult?.artifact_id) {
      toast.error('No artifact ID available for proof');
      return;
    }

    setIsLoadingProof(true);
    try {
      const response = await fetch(`/api/proof?id=${verifyResult.artifact_id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch proof');
      }

      const apiResponse: ApiResponse<ProofResult> = await response.json();
      
      if (!apiResponse.ok || !apiResponse.data) {
        throw new Error(apiResponse.error?.message || 'Failed to fetch proof');
      }

      const proof = apiResponse.data;
      setProofData({
        proofId: verifyResult.artifact_id,
        etid: proof.etid,
        payloadHash: fileHash,
        timestamp: proof.retrieved_at,
        raw: proof.proof_bundle,
        // Mock data for demonstration - in real implementation, these would come from the proof bundle
        anchors: [
          {
            id: "anchor-1",
            type: "blockchain",
            value: "0x1234567890abcdef",
            timestamp: proof.retrieved_at
          }
        ],
        signatures: [
          {
            id: "sig-1",
            signer: "walacor-system",
            signature: "0xabcdef1234567890",
            timestamp: proof.retrieved_at
          }
        ]
      });
      setProofResult(proof);
      setIsProofViewerOpen(true);
      toast.success('Proof loaded successfully');
    } catch (error) {
      console.error('Proof loading error:', error);
      toast.error(`Failed to load proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingProof(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Verification</h1>
        <p className="text-muted-foreground">
          Verify document integrity by uploading a file or providing its hash.
        </p>
      </div>

      <div className="grid gap-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File or Hash Input
            </CardTitle>
            <CardDescription>
              Upload a file to calculate its hash, or enter a hash directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} ref={fileInputRef} onChange={handleFileSelect} />
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">Drag & drop a file here, or click to select</p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, JSON, TXT, JPG, PNG, DOCX, XLSX
                  </p>
                </div>
              )}
            </div>

            <div className="text-center text-muted-foreground">OR</div>

            <div className="space-y-2">
              <Label htmlFor="fileHash">File Hash (SHA-256)</Label>
              <div className="flex gap-2">
                <Input
                  id="fileHash"
                  value={fileHash}
                  onChange={(e) => setFileHash(e.target.value)}
                  placeholder="Enter 64-character SHA-256 hash"
                  className="font-mono"
                />
                {fileHash && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(fileHash)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="etid">Entity Type ID (ETID)</Label>
              <Input
                id="etid"
                value={etid}
                onChange={(e) => setEtid(e.target.value)}
                placeholder="100001"
              />
              <p className="text-xs text-muted-foreground">
                100001 for loan packets, 100002 for JSON documents
              </p>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            {fileHash && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Hash className="h-4 w-4" />
                <span className="text-sm font-mono break-all">{fileHash}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Result */}
        {isVerifying ? (
          <VerifyResultSkeleton />
        ) : verifyResult ? (
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${
                verifyResult.is_valid ? 'text-green-600' : 'text-red-600'
              }`}>
                {verifyResult.is_valid ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                {verifyResult.is_valid ? 'Document Verified' : 'Tampering Detected'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className={verifyResult.is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {verifyResult.message}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className={`text-sm font-medium ${
                    verifyResult.status === 'ok' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {verifyResult.status.toUpperCase()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Verified At</Label>
                  <p className="text-sm">{new Date(verifyResult.verified_at).toLocaleString()}</p>
                </div>
              </div>

              {verifyResult.artifact_id && (
                <div>
                  <Label className="text-sm font-medium">Artifact ID</Label>
                  <div className="flex gap-2">
                    <p className="text-sm font-mono bg-muted p-2 rounded flex-1">{verifyResult.artifact_id}</p>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(verifyResult.artifact_id!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Provided Hash</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">{verifyResult.details.provided_hash}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Stored Hash</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">{verifyResult.details.stored_hash}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Artifact Type</Label>
                  <p className="text-sm">{verifyResult.details.artifact_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm">{new Date(verifyResult.details.created_at).toLocaleString()}</p>
                </div>
              </div>

              {verifyResult.is_valid && verifyResult.artifact_id && (
                <div className="flex gap-2">
                  <Button 
                    ref={viewProofButtonRef}
                    onClick={handleViewProof} 
                    disabled={isLoadingProof}
                  >
                    {isLoadingProof ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading Proof...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        View Proof
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleGetProof}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download Proof
                  </Button>
                </div>
                
                {/* Disclosure Pack Download */}
                <div className="mt-4">
                  <DisclosureButton artifactId={verifyResult.artifact_id} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attestations Section - Only show for valid documents with artifact ID */}
        {verifyResult?.is_valid && verifyResult?.artifact_id && (
          <>
            <AttestationList artifactId={verifyResult.artifact_id} />
            <AttestationForm artifactId={verifyResult.artifact_id} currentUser="current_user" />
          </>
        )}

        {/* Provenance Section - Only show for valid documents with artifact ID */}
        {verifyResult?.is_valid && verifyResult?.artifact_id && (
          <>
            <LineageGraph artifactId={verifyResult.artifact_id} />
            <ProvenanceLinker artifactId={verifyResult.artifact_id} />
          </>
        )}

        {/* Proof Result */}
        {isLoadingProof ? (
          <ProofResultSkeleton />
        ) : proofResult ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Proof Bundle Retrieved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Artifact ID</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{proofResult.artifact_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ETID</Label>
                  <p className="text-sm">{proofResult.etid}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Retrieved At</Label>
                <p className="text-sm">{new Date(proofResult.retrieved_at).toLocaleString()}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Proof Bundle</Label>
                <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(proofResult.proof_bundle, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={isVerifying || !fileHash}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Document
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {/* Proof Viewer Modal */}
      {proofData && (
        <ProofViewer
          proofJson={proofData}
          isOpen={isProofViewerOpen}
          onClose={() => setIsProofViewerOpen(false)}
          triggerRef={viewProofButtonRef}
        />
      )}
    </div>
  );
}

