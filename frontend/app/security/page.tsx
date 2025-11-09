'use client';

import Link from 'next/link';
import { Shield, AlertCircle, Lock, FileKey, ArrowRight, CheckCircle2, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SecurityPage() {
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
                Complete Security Suite
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mt-2">
                Three-layer security architecture for loan document integrity
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mt-8">
            <h2 className="text-2xl font-bold mb-4">🎯 Security Architecture</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="font-semibold">PRE-UPLOAD</h3>
                </div>
                <p className="text-sm text-blue-100">ML Fraud Detection</p>
                <p className="text-xs text-blue-200 mt-1">Catch fraudulent applications before sealing</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="font-semibold">SEALING</h3>
                </div>
                <p className="text-sm text-blue-100">Blockchain Immutability</p>
                <p className="text-xs text-blue-200 mt-1">Lock document integrity on-chain</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                  <h3 className="font-semibold">POST-SEAL</h3>
                </div>
                <p className="text-sm text-blue-100">ZKP Verification + Forensics</p>
                <p className="text-xs text-blue-200 mt-1">Privacy-safe verification & tampering detection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Layer 1: Fraud Detection */}
        <Card className="border-2 border-red-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Layer 1: ML Fraud Detection</h2>
                  <p className="text-red-100">Real-time fraud risk assessment during upload</p>
                </div>
              </div>
              <Link href="/upload">
                <Button variant="secondary" size="sm">
                  Try Upload <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">🔍 Detection Capabilities</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Missing Critical Fields:</strong> Flags incomplete KYC data (SSN, income, employment)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Inconsistent Data:</strong> Email vs name mismatch, phone area code validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Suspicious Patterns:</strong> Sequential SSNs, disposable emails, round number fraud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Duplicate Detection:</strong> Cross-document SSN/email duplication (identity theft)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Income-to-Loan Ratio:</strong> Flags extreme debt-to-income ratios (>5x, >10x)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Format Anomalies:</strong> Invalid email, phone, ZIP code formats</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 text-red-900">Risk Scoring (0-100)</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">CRITICAL (70-100)</span>
                      <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">REJECT</span>
                    </div>
                    <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600" style={{ width: '90%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">HIGH (45-69)</span>
                      <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">REVIEW</span>
                    </div>
                    <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-600" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">MEDIUM (20-44)</span>
                      <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">CAUTION</span>
                    </div>
                    <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-600" style={{ width: '35%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">LOW (0-19)</span>
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">APPROVE</span>
                    </div>
                    <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded border border-red-300">
                  <p className="text-xs text-gray-700">
                    <strong>Example:</strong> Duplicate SSN (different name) = <span className="text-red-600 font-bold">+30 risk points</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layer 2: Blockchain Sealing */}
        <Card className="border-2 border-green-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Layer 2: Blockchain Immutability</h2>
                  <p className="text-green-100">Cryptographic sealing on Walacor blockchain</p>
                </div>
              </div>
              <Link href="/documents">
                <Button variant="secondary" size="sm">
                  View Documents <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">🔐 Immutability Guarantees</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Tamper-Proof:</strong> Once sealed, documents cannot be modified without detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Publicly Verifiable:</strong> Blockchain transactions visible on Walacor explorer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Timestamped:</strong> Cryptographic proof of document existence at specific time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Decentralized:</strong> No single point of failure or manipulation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Permanent Record:</strong> Blockchain maintains eternal audit trail</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 text-green-900">Sealing Process</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <div>
                      <p className="text-sm font-medium">Document Hash Generation</p>
                      <p className="text-xs text-gray-600">SHA-256 cryptographic hash of document</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <div>
                      <p className="text-sm font-medium">Blockchain Transaction</p>
                      <p className="text-xs text-gray-600">Submit hash to Walacor network</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <div>
                      <p className="text-sm font-medium">Network Confirmation</p>
                      <p className="text-xs text-gray-600">Miners validate and add to blockchain</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    <div>
                      <p className="text-sm font-medium">Permanent Seal</p>
                      <p className="text-xs text-gray-600">Document integrity locked forever</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layer 3: ZKP + Forensics */}
        <Card className="border-2 border-purple-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Layer 3: Verification & Forensics</h2>
                  <p className="text-purple-100">Privacy-safe verification + Tampering detection</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/zkp-verify">
                  <Button variant="secondary" size="sm">
                    ZKP Verify <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Zero Knowledge Proof */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileKey className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-lg text-purple-900">Zero Knowledge Proof</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Privacy-Preserving:</strong> Verify without revealing borrower data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Third-Party Verification:</strong> Auditors can verify without data access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Cryptographic Proofs:</strong> One-way hashes, no data exposure risk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Exportable:</strong> Share proofs via JSON/text without revealing data</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-white rounded border border-purple-300">
                  <p className="text-xs font-semibold text-purple-900 mb-1">What Auditors See:</p>
                  <p className="text-xs text-gray-700">
                    ✅ Document exists | ✅ On blockchain | ✅ Hash: zkp_abc123...
                    <br />❌ NO borrower name | ❌ NO loan amount | ❌ NO SSN
                  </p>
                </div>
              </div>

              {/* Forensics */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg text-blue-900">Forensic Analysis</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Tampering Detection:</strong> Compare document versions for changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Timeline Analysis:</strong> Track all events (access, modification, sealing)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Pattern Detection:</strong> Unusual access times, rapid modifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Risk Scoring:</strong> Critical/high/medium/low change assessment</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Detects:</p>
                  <p className="text-xs text-gray-700">
                    • Financial value changes (+95% risk)<br />
                    • Identity modifications (+90% risk)<br />
                    • Signature tampering (+85% risk)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complete Flow Diagram */}
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Complete Security Flow
            </CardTitle>
            <CardDescription>
              How all 3 layers work together to protect loan documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 text-red-700 rounded-lg p-3 min-w-[180px] text-center">
                  <p className="text-sm font-bold">1. Upload Document</p>
                  <p className="text-xs">User submits loan app</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <div className="bg-orange-100 text-orange-700 rounded-lg p-3 min-w-[180px] text-center">
                  <p className="text-sm font-bold">2. Fraud Check</p>
                  <p className="text-xs">ML engine analyzes</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <div className="bg-green-100 text-green-700 rounded-lg p-3 min-w-[180px] text-center">
                  <p className="text-sm font-bold">3. Blockchain Seal</p>
                  <p className="text-xs">Lock integrity</p>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-[190px]">
                <div className="bg-purple-100 text-purple-700 rounded-lg p-3 min-w-[180px] text-center">
                  <p className="text-sm font-bold">4. ZKP Available</p>
                  <p className="text-xs">Auditors verify</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <div className="bg-blue-100 text-blue-700 rounded-lg p-3 min-w-[180px] text-center">
                  <p className="text-sm font-bold">5. Forensics Monitoring</p>
                  <p className="text-xs">Ongoing tamper detection</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-gray-800">
                  <strong>Result:</strong> Complete end-to-end security from fraud detection through blockchain sealing
                  to privacy-preserving verification and ongoing forensic monitoring. No single point of failure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/upload" className="block">
            <Card className="border-2 border-transparent hover:border-red-300 transition-all cursor-pointer h-full">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Test Fraud Detection</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a loan document and see real-time fraud risk scoring
                </p>
                <Button className="w-full" variant="outline">
                  Go to Upload <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/zkp-verify" className="block">
            <Card className="border-2 border-transparent hover:border-purple-300 transition-all cursor-pointer h-full">
              <CardContent className="pt-6 text-center">
                <Lock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Generate ZK Proof</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Verify documents without revealing private borrower data
                </p>
                <Button className="w-full" variant="outline">
                  Go to ZKP Verify <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics" className="block">
            <Card className="border-2 border-transparent hover:border-blue-300 transition-all cursor-pointer h-full">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">View Analytics</h3>
                <p className="text-sm text-gray-600 mb-4">
                  See AI performance, fraud stats, and security metrics
                </p>
                <Button className="w-full" variant="outline">
                  Go to Analytics <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
