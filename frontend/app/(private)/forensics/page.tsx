'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText, Search, TrendingUp, Dna, FileSearch } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ForensicDiffViewer } from '@/components/forensics/ForensicDiffViewer';
import { ForensicTimeline } from '@/components/forensics/ForensicTimeline';
import { PatternAnalysisDashboard } from '@/components/forensics/PatternAnalysisDashboard';
import { DocumentDNAViewer } from '@/components/forensics/DocumentDNAViewer';
import {
  compareDocuments,
  getForensicTimeline,
  createDocumentFingerprint,
  findSimilarDocuments,
  detectAllPatterns,
} from '@/lib/api/forensics';
import type {
  DiffResult,
  ForensicTimeline as ForensicTimelineType,
  PatternDetectionResult,
  DocumentFingerprint,
  SimilarityResult,
} from '@/types/forensics';

export default function ForensicsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('comparison');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comparison tab state
  const [doc1Id, setDoc1Id] = useState('');
  const [doc2Id, setDoc2Id] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  // Timeline tab state
  const [timelineDocId, setTimelineDocId] = useState('');
  const [timeline, setTimeline] = useState<ForensicTimelineType | null>(null);

  // Pattern detection state
  const [patterns, setPatterns] = useState<PatternDetectionResult | null>(null);
  const [patternLoading, setPatternLoading] = useState(false);

  // DNA tab state
  const [dnaDocId, setDnaDocId] = useState('');
  const [fingerprint, setFingerprint] = useState<DocumentFingerprint | null>(null);
  const [similarDocs, setSimilarDocs] = useState<SimilarityResult[]>([]);
  const [similarityLoading, setSimilarityLoading] = useState(false);

  // Check for document query parameter
  useEffect(() => {
    const documentId = searchParams.get('document');
    if (documentId) {
      setActiveTab('timeline');
      setTimelineDocId(documentId);
      loadTimeline(documentId);
    }
  }, [searchParams]);

  // Load timeline
  const loadTimeline = async (artifactId: string) => {
    setLoading(true);
    setError(null);
    try {
      const timelineData = await getForensicTimeline(artifactId);
      setTimeline(timelineData);
    } catch (err: any) {
      setError(err.message || 'Failed to load forensic timeline');
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  // Handle document comparison
  const handleCompare = async () => {
    if (!doc1Id.trim() || !doc2Id.trim()) {
      toast.error('Please provide both document IDs');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await compareDocuments(doc1Id.trim(), doc2Id.trim(), true);
      setDiffResult(result.diff_result);
      toast.success('Document comparison completed');
    } catch (err: any) {
      setError(err.message || 'Failed to compare documents');
      toast.error('Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  // Load pattern detection
  const loadPatterns = async () => {
    setPatternLoading(true);
    setError(null);
    try {
      const patternsData = await detectAllPatterns(100);
      setPatterns(patternsData);
    } catch (err: any) {
      setError(err.message || 'Failed to detect patterns');
      toast.error('Pattern detection failed');
    } finally {
      setPatternLoading(false);
    }
  };

  // Load DNA fingerprint
  const loadFingerprint = async () => {
    if (!dnaDocId.trim()) {
      toast.error('Please provide a document ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fp = await createDocumentFingerprint(dnaDocId.trim());
      setFingerprint(fp);
    } catch (err: any) {
      setError(err.message || 'Failed to create fingerprint');
      toast.error('Fingerprint creation failed');
    } finally {
      setLoading(false);
    }
  };

  // Search for similar documents
  const handleSearchSimilar = async (threshold: number = 0.7) => {
    if (!dnaDocId.trim()) {
      toast.error('Please provide a document ID');
      return;
    }

    setSimilarityLoading(true);
    setError(null);
    try {
      const result = await findSimilarDocuments(dnaDocId.trim(), threshold, 10);
      setSimilarDocs(result.similar_documents || []);
      toast.success(`Found ${result.found_count} similar documents`);
    } catch (err: any) {
      setError(err.message || 'Failed to find similar documents');
      toast.error('Similarity search failed');
    } finally {
      setSimilarityLoading(false);
    }
  };

  // Auto-load patterns when tab is selected
  useEffect(() => {
    if (activeTab === 'patterns' && !patterns && !patternLoading) {
      loadPatterns();
    }
  }, [activeTab]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Forensic Analysis</h1>
          <p className="text-blue-100 text-lg">
            Advanced document comparison, tamper detection, and fraud analysis tools
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">
            <FileSearch className="h-4 w-4 mr-2" />
            Document Comparison
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <FileText className="h-4 w-4 mr-2" />
            Forensic Timeline
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <TrendingUp className="h-4 w-4 mr-2" />
            Pattern Detection
          </TabsTrigger>
          <TabsTrigger value="dna">
            <Dna className="h-4 w-4 mr-2" />
            DNA Analysis
          </TabsTrigger>
        </TabsList>

        {/* Document Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Comparison</CardTitle>
              <CardDescription>
                Compare two documents to detect changes, tampering, and assess risk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document 1 ID</label>
                  <input
                    type="text"
                    value={doc1Id}
                    onChange={(e) => setDoc1Id(e.target.value)}
                    placeholder="Enter document ID"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document 2 ID</label>
                  <input
                    type="text"
                    value={doc2Id}
                    onChange={(e) => setDoc2Id(e.target.value)}
                    placeholder="Enter document ID"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <button
                onClick={handleCompare}
                disabled={loading || !doc1Id.trim() || !doc2Id.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Comparing...' : 'Compare Documents'}
              </button>
            </CardContent>
          </Card>

          {loading && !diffResult && (
            <Card>
              <CardContent className="py-8">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          )}

          {diffResult && (
            <ForensicDiffViewer
              diffResult={diffResult}
              mode="side-by-side"
              highlightRiskyChanges={true}
            />
          )}
        </TabsContent>

        {/* Forensic Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Forensic Timeline</CardTitle>
              <CardDescription>
                View complete event history and suspicious patterns for a document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={timelineDocId}
                    onChange={(e) => setTimelineDocId(e.target.value)}
                    placeholder="Enter document ID"
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button
                    onClick={() => loadTimeline(timelineDocId)}
                    disabled={loading || !timelineDocId.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Load Timeline'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && !timeline && (
            <Card>
              <CardContent className="py-8">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          )}

          {timeline && (
            <ForensicTimeline
              timeline={timeline}
              riskThreshold={0.7}
              showPredictions={true}
            />
          )}
        </TabsContent>

        {/* Pattern Detection Tab */}
        <TabsContent value="patterns" className="space-y-6">
          {patternLoading && !patterns && (
            <Card>
              <CardContent className="py-8">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          )}

          {patterns && (
            <PatternAnalysisDashboard
              patterns={patterns}
              alertThreshold="high"
            />
          )}

          {!patternLoading && !patterns && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Click "Load Patterns" to start analyzing documents for fraud patterns.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* DNA Analysis Tab */}
        <TabsContent value="dna" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document DNA Fingerprinting</CardTitle>
              <CardDescription>
                Create multi-layered fingerprints and find similar documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dnaDocId}
                    onChange={(e) => setDnaDocId(e.target.value)}
                    placeholder="Enter document ID"
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button
                    onClick={loadFingerprint}
                    disabled={loading || !dnaDocId.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Fingerprint'}
                  </button>
                </div>
              </div>
              {fingerprint && (
                <button
                  onClick={() => handleSearchSimilar(0.7)}
                  disabled={similarityLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {similarityLoading ? 'Searching...' : 'Find Similar Documents'}
                </button>
              )}
            </CardContent>
          </Card>

          {loading && !fingerprint && (
            <Card>
              <CardContent className="py-8">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          )}

          {fingerprint && (
            <DocumentDNAViewer
              fingerprint={fingerprint}
              similarDocuments={similarDocs}
              onSearchSimilar={handleSearchSimilar}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}








