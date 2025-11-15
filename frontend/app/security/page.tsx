'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, AlertCircle, Lock, Upload, ArrowRight, CheckCircle2, TrendingUp, FileSearch, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ForensicDiffViewer } from '@/components/forensics/ForensicDiffViewer';
import { PatternAnalysisDashboard } from '@/components/forensics/PatternAnalysisDashboard';
import { toast } from '@/components/ui/toast';
import type { DiffResult, PatternDetectionResult } from '@/types/forensics';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { GLOSSARY } from '@/lib/glossary';
import apiConfig from '@/lib/api-config';

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'patterns' | 'tools'>('comparison');

  // Forensic Comparison State
  const [doc1Id, setDoc1Id] = useState('');
  const [doc2Id, setDoc2Id] = useState('');
  const [comparingDocs, setComparingDocs] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Pattern Detection State
  const [detectingPatterns, setDetectingPatterns] = useState(false);
  const [patternResult, setPatternResult] = useState<PatternDetectionResult | null>(null);

  // Fetch available documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(apiConfig.artifacts.list());
        const payload = await response.json();

        if (response.ok && payload.ok) {
          const envelope = payload.data ?? {};
          const artifacts =
            envelope.artifacts ??
            envelope.items ??
            (Array.isArray(envelope) ? envelope : []);

          const parsedArtifacts = Array.isArray(artifacts) ? artifacts : [];
          const reportedTotal =
            envelope.total_count ??
            payload.total_count ??
            envelope.count ??
            parsedArtifacts.length;

          setDocuments(parsedArtifacts);
          setDocumentCount(
            typeof reportedTotal === 'number' && !Number.isNaN(reportedTotal)
              ? reportedTotal
              : parsedArtifacts.length
          );
        } else {
          setDocumentCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        setDocumentCount(0);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleCompareDocuments = async () => {
    if (!doc1Id || !doc2Id) {
      toast.error('Please select both documents');
      return;
    }

    if (doc1Id === doc2Id) {
      toast.error('Please select two different documents');
      return;
    }

    setComparingDocs(true);
    setDiffResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/forensics/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifact_id_1: doc1Id,
          artifact_id_2: doc2Id,
          include_overlay: true
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setDiffResult(data.data.diff_result);
        toast.success('Documents compared successfully!');
      } else {
        toast.error(data.error?.message || 'Comparison failed');
      }
    } catch (error) {
      console.error('Error comparing documents:', error);
      toast.error('Failed to compare documents');
    } finally {
      setComparingDocs(false);
    }
  };

  const handleDetectPatterns = async () => {
    setDetectingPatterns(true);
    setPatternResult(null);

    try {
      const totalDocs = documentCount || documents.length || 100;
      const response = await fetch(`${apiConfig.patterns.detect}?limit=${totalDocs}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setPatternResult(data.data);
        toast.success(`Found ${data.data.total_patterns} patterns!`);
      } else {
        toast.error(data.error?.message || 'Pattern detection failed');
      }
    } catch (error) {
      console.error('Error detecting patterns:', error);
      toast.error('Failed to detect patterns');
    } finally {
      setDetectingPatterns(false);
    }
  };

  return (
    <DashboardLayout
      rightSidebar={
        <div className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
            Security Overview
          </h2>

          {/* Security Score */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Security Score
            </h3>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              98/100
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Excellent
            </div>
          </div>

          {/* Active Protections */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Active Protections
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Encryption Active
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                2FA Enabled
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Blockchain Protected
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Other Tools
            </h3>
            <div className="space-y-2">
              <Link
                href="/upload"
                className="block text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                📤 Upload Documents
              </Link>
              <Link
                href="/verification"
                className="block text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                ✅ Verify Documents
              </Link>
            </div>
          </div>
        </div>
      }
    >
      <div>
      {/* Hero Section */}
      <div className="bg-elite-dark dark:bg-black text-white border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4">
            <Shield className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">Forensic Security Tools</h1>
              <p className="text-gray-300 mt-1">Advanced fraud detection, document comparison, and pattern analysis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 mb-8">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'comparison'
                  ? 'bg-elite-blue text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FileSearch className="h-5 w-5" />
              <span className="hidden sm:inline">Forensic Comparison</span>
              <span className="sm:hidden">Compare</span>
              <InfoTooltip
                term={GLOSSARY.FORENSIC_COMPARISON.term}
                definition={GLOSSARY.FORENSIC_COMPARISON.definition}
                example={GLOSSARY.FORENSIC_COMPARISON.example}
                whenToUse={GLOSSARY.FORENSIC_COMPARISON.whenToUse}
                className={activeTab === 'comparison' ? 'text-white' : ''}
              />
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'patterns'
                  ? 'bg-elite-blue text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="hidden sm:inline">Pattern Detection</span>
              <span className="sm:hidden">Patterns</span>
              <InfoTooltip
                term={GLOSSARY.PATTERN_DETECTION.term}
                definition={GLOSSARY.PATTERN_DETECTION.definition}
                example={GLOSSARY.PATTERN_DETECTION.example}
                whenToUse={GLOSSARY.PATTERN_DETECTION.whenToUse}
                className={activeTab === 'patterns' ? 'text-white' : ''}
              />
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'tools'
                  ? 'bg-elite-blue text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span className="hidden sm:inline">Quick Tools</span>
              <span className="sm:hidden">Tools</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Document Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Compare Two Documents</CardTitle>
                  <InfoTooltip
                    term={GLOSSARY.FORENSIC_COMPARISON.term}
                    definition={GLOSSARY.FORENSIC_COMPARISON.definition}
                    example={GLOSSARY.FORENSIC_COMPARISON.example}
                  />
                </div>
                <CardDescription>
                  Select two documents to perform detailed forensic comparison and detect tampering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Document 1
                    </label>
                    <select
                      value={doc1Id}
                      onChange={(e) => setDoc1Id(e.target.value)}
                      disabled={loadingDocs}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-elite-blue bg-white dark:bg-gray-800"
                    >
                      <option value="">
                        {loadingDocs ? 'Loading...' : documents.length === 0 ? 'No documents found' : 'Select first document'}
                      </option>
                      {documents.map((doc: any) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.loan_id} - {doc.borrower_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Document 2
                    </label>
                    <select
                      value={doc2Id}
                      onChange={(e) => setDoc2Id(e.target.value)}
                      disabled={loadingDocs}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-elite-blue bg-white dark:bg-gray-800"
                    >
                      <option value="">
                        {loadingDocs ? 'Loading...' : documents.length === 0 ? 'No documents found' : 'Select second document'}
                      </option>
                      {documents.map((doc: any) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.loan_id} - {doc.borrower_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleCompareDocuments}
                  disabled={comparingDocs || !doc1Id || !doc2Id}
                  className="w-full bg-gradient-to-r from-elite-blue to-blue-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  {comparingDocs ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileSearch className="h-5 w-5 mr-2" />
                      Compare Documents
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 {(documentCount || documents.length)} documents available for comparison
                </p>
              </CardContent>
            </Card>

            {/* Diff Results */}
            {diffResult && (
              <ForensicDiffViewer diffResult={diffResult} />
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {/* Pattern Detection Trigger */}
            <Card>
              <CardHeader>
                <CardTitle>Fraud Pattern Detection</CardTitle>
                <CardDescription>
                  Analyze all documents to detect suspicious patterns, duplicate signatures, amount manipulations, and identity reuse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleDetectPatterns}
                  disabled={detectingPatterns}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  size="lg"
                >
                  {detectingPatterns ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing All Documents...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Run Pattern Detection
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-600 dark:text-gray-400">
                  ⚠️ This will analyze all {documentCount || documents.length} documents for fraud patterns
                </p>
              </CardContent>
            </Card>

            {/* Pattern Results */}
            {patternResult && (
              <PatternAnalysisDashboard patterns={patternResult} />
            )}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Fraud Detection */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Detection Rate</p>
                    <p className="text-2xl font-bold text-red-600">94%</p>
                  </div>
                </div>
                <CardTitle>Fraud Detection</CardTitle>
                <CardDescription>
                  AI-powered fraud risk scoring on loan applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Income-to-loan ratio analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Duplicate SSN/email detection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Missing field validation</span>
                  </div>
                </div>
                <Link href="/upload">
                  <Button className="w-full">
                    Upload & Analyze
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Blockchain Verification */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Documents Sealed</p>
                    <p className="text-2xl font-bold text-green-600">{documents.length}</p>
                  </div>
                </div>
                <CardTitle>Blockchain Sealing</CardTitle>
                <CardDescription>
                  Immutable blockchain records on Walacor network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Tamper-proof integrity</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Cryptographic timestamping</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Permanent audit trail</span>
                  </div>
                </div>
                <Link href="/documents">
                  <Button className="w-full" variant="outline">
                    View Documents
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* ZKP Verification */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Privacy Level</p>
                    <p className="text-2xl font-bold text-blue-600">100%</p>
                  </div>
                </div>
                <CardTitle>ZK Proof Verify</CardTitle>
                <CardDescription>
                  Verify documents without revealing private data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Zero data exposure</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Third-party verification</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Exportable proof JSON</span>
                  </div>
                </div>
                <Link href="/verification">
                  <Button className="w-full" variant="outline">
                    Generate Proof
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
