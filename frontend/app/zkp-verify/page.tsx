'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Lock, CheckCircle2, Download, Copy, AlertCircle, Loader2, FileKey } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchAndGenerateProof,
  verifyZKProof,
  formatProofForDisplay,
  exportProofAsJSON,
  exportProofAsText,
  type ZKPProof,
  type VerificationResult
} from '@/utils/zkpProofGenerator';
import toast from 'react-hot-toast';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [artifactId, setArtifactId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proof, setProof] = useState<ZKPProof | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Auto-fill artifact ID from URL query parameter
  useEffect(() => {
    const artifactParam = searchParams.get('artifact');
    if (artifactParam) {
      setArtifactId(artifactParam);
      // Show a toast to inform user
      toast.success('Artifact ID loaded from URL. Click "Generate Proof" to continue.');
    }
  }, [searchParams]);

  const handleGenerateProof = async () => {
    if (!artifactId.trim()) {
      toast.error('Please enter an Artifact ID');
      return;
    }

    setIsGenerating(true);
    setProof(null);
    setVerificationResult(null);

    try {
      console.log('🔐 Generating ZKP for artifact:', artifactId);

      // Generate proof
      const zkpProof = await fetchAndGenerateProof(artifactId.trim());
      setProof(zkpProof);

      // Auto-verify proof
      const result = await verifyZKProof(artifactId.trim(), zkpProof);
      setVerificationResult(result);

      if (result.verified) {
        toast.success('✅ Zero Knowledge Proof generated successfully!');
      } else {
        toast.error('⚠️ Proof verification failed');
      }
    } catch (error: any) {
      console.error('Error generating proof:', error);
      toast.error(error.message || 'Failed to generate proof');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyProof = () => {
    if (!proof) return;

    const formattedProof = formatProofForDisplay(proof);
    navigator.clipboard.writeText(formattedProof);
    toast.success('Proof copied to clipboard!');
  };

  const handleDownloadJSON = () => {
    if (!proof) return;

    const blob = exportProofAsJSON(proof);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zkp_${proof.artifactId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Proof exported as JSON');
  };

  const handleDownloadText = () => {
    if (!proof) return;

    const blob = exportProofAsText(proof);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zkp_${proof.artifactId}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Proof exported as text file');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Shield className="h-12 w-12" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Zero Knowledge Proof Verification
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mt-2">
                Verify document authenticity without revealing private data
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Lock className="h-6 w-6 mb-2" />
              <h3 className="font-semibold mb-1">Privacy Preserving</h3>
              <p className="text-sm text-blue-100">No borrower data, SSN, or loan amounts revealed</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <CheckCircle2 className="h-6 w-6 mb-2" />
              <h3 className="font-semibold mb-1">Cryptographically Secure</h3>
              <p className="text-sm text-blue-100">One-way hashes and blockchain verification</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <FileKey className="h-6 w-6 mb-2" />
              <h3 className="font-semibold mb-1">Third-Party Verifiable</h3>
              <p className="text-sm text-blue-100">Auditors can verify without data access</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Verification Input */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Verification Proof</CardTitle>
            <CardDescription>
              Enter an Artifact ID to generate a Zero Knowledge Proof. No private data will be exposed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter Artifact ID (e.g., art_abc123xyz)"
                value={artifactId}
                onChange={(e) => setArtifactId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateProof()}
                className="flex-1"
              />
              <Button
                onClick={handleGenerateProof}
                disabled={isGenerating || !artifactId.trim()}
                className="min-w-[150px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Generate Proof
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              💡 Tip: Find Artifact IDs in your Documents page or from blockchain transaction receipts
            </p>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {verificationResult && (
          <Card className={verificationResult.verified ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {verificationResult.verified ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-600" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${verificationResult.verified ? 'text-green-900' : 'text-red-900'}`}>
                    {verificationResult.verified ? 'Verification Successful' : 'Verification Failed'}
                  </h3>
                  <p className={`text-sm ${verificationResult.verified ? 'text-green-700' : 'text-red-700'}`}>
                    {verificationResult.message}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proof Details */}
        {proof && (
          <>
            {/* Proof Actions */}
            <div className="flex gap-3">
              <Button onClick={handleCopyProof} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Proof
              </Button>
              <Button onClick={handleDownloadJSON} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
              <Button onClick={handleDownloadText} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Text
              </Button>
            </div>

            {/* Cryptographic Proofs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Cryptographic Proofs
                </CardTitle>
                <CardDescription>
                  One-way hashes and commitments (irreversible, no private data)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Artifact ID</label>
                    <code className="block p-3 bg-gray-100 rounded-lg text-xs break-all font-mono">
                      {proof.artifactId}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Proof ID</label>
                    <code className="block p-3 bg-gray-100 rounded-lg text-xs break-all font-mono">
                      {proof.proofId}
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Document Hash (SHA-256 equivalent)</label>
                  <code className="block p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs break-all font-mono">
                    {proof.documentHash}
                  </code>
                  <p className="text-xs text-gray-600">
                    ℹ️ One-way cryptographic hash. Cannot be reversed to reveal original data.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Commitment Hash</label>
                  <code className="block p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs break-all font-mono">
                    {proof.commitmentHash}
                  </code>
                  <p className="text-xs text-gray-600">
                    ℹ️ Cryptographic commitment proving we know the data without revealing it.
                  </p>
                </div>

                {proof.blockchainProof && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Blockchain Transaction ID</label>
                    <code className="block p-3 bg-green-50 border border-green-200 rounded-lg text-xs break-all font-mono">
                      {proof.blockchainProof}
                    </code>
                    <p className="text-xs text-gray-600">
                      ✅ Document is sealed on blockchain. Publicly verifiable on Walacor network.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Verification Status
                </CardTitle>
                <CardDescription>
                  What this proof verifies (without revealing private data)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border-2 ${proof.proofsProvided.documentExists ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {proof.proofsProvided.documentExists ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-semibold">Document Exists</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {proof.proofsProvided.documentExists
                        ? 'Document is registered in the system'
                        : 'Document not found'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${proof.proofsProvided.onBlockchain ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {proof.proofsProvided.onBlockchain ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-semibold">On Blockchain</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {proof.proofsProvided.onBlockchain
                        ? 'Sealed to blockchain for immutability'
                        : 'Not yet sealed to blockchain'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${proof.proofsProvided.integrityVerified ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {proof.proofsProvided.integrityVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-semibold">Integrity Verified</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {proof.proofsProvided.integrityVerified
                        ? 'Document integrity cryptographically verified'
                        : 'Integrity verification not available'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${proof.proofsProvided.timestampVerified ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {proof.proofsProvided.timestampVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-semibold">Timestamp Verified</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {proof.proofsProvided.timestampVerified
                        ? `Created: ${new Date(proof.timestamp).toLocaleString()}`
                        : 'Timestamp not available'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Redacted Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileKey className="h-5 w-5 text-purple-600" />
                  Redacted Summary (No Private Data)
                </CardTitle>
                <CardDescription>
                  General information about document structure without revealing sensitive content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Document Type</span>
                    <span className="text-sm text-gray-700">{proof.redactedSummary.documentType}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Total Fields</span>
                    <span className="text-sm text-gray-700">{proof.redactedSummary.fieldCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Contains Loan Info</span>
                    <span className={`text-sm font-semibold ${proof.redactedSummary.hasLoanInfo ? 'text-green-600' : 'text-gray-400'}`}>
                      {proof.redactedSummary.hasLoanInfo ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Contains Borrower Info</span>
                    <span className={`text-sm font-semibold ${proof.redactedSummary.hasBorrowerInfo ? 'text-green-600' : 'text-gray-400'}`}>
                      {proof.redactedSummary.hasBorrowerInfo ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Contains KYC Data</span>
                    <span className={`text-sm font-semibold ${proof.redactedSummary.hasKYCData ? 'text-green-600' : 'text-gray-400'}`}>
                      {proof.redactedSummary.hasKYCData ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Guarantee */}
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Lock className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">🔒 Privacy Guarantee</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      This Zero Knowledge Proof contains <strong>NO private data</strong>:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>No borrower names, addresses, or contact information</li>
                      <li>No Social Security Numbers (SSN) or government IDs</li>
                      <li>No loan amounts, interest rates, or financial details</li>
                      <li>No dates of birth, employment information, or income data</li>
                    </ul>
                    <p className="text-sm text-blue-800 mt-3">
                      <strong>What IS included:</strong> Cryptographic hashes (irreversible), blockchain transaction IDs (public),
                      and existence proofs (yes/no verification only).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Use Cases */}
        {!proof && (
          <Card>
            <CardHeader>
              <CardTitle>Use Cases for Zero Knowledge Proof</CardTitle>
              <CardDescription>
                Who can use ZKP verification and why it matters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="p-3 bg-blue-100 rounded-lg w-fit">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Auditors & Regulators</h3>
                  <p className="text-sm text-gray-600">
                    Verify loan documents exist and are sealed on blockchain without accessing borrower private data.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-green-100 rounded-lg w-fit">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Credit Bureaus</h3>
                  <p className="text-sm text-gray-600">
                    Confirm document authenticity for credit checks while maintaining borrower privacy.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-purple-100 rounded-lg w-fit">
                    <FileKey className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Third-Party Verifiers</h3>
                  <p className="text-sm text-gray-600">
                    Independent verification of document integrity without data exposure risk.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
