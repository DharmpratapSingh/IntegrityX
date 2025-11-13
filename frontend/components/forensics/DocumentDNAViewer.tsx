/**
 * Document DNA Viewer Component
 *
 * Displays multi-layered DNA fingerprinting for documents,
 * similarity analysis, and tamper detection.
 */

'use client';

import React, { useState } from 'react';
import { DocumentFingerprint, SimilarityResult } from '@/types/forensics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dna,
  Hash,
  FileText,
  Search,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link2,
  Layers,
  Fingerprint,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DocumentDNAViewerProps {
  fingerprint: DocumentFingerprint;
  similarDocuments?: SimilarityResult[];
  comparisonFingerprint?: DocumentFingerprint;
  comparisonResult?: SimilarityResult;
  onCompareDocument?: (documentId: string) => void;
  onSearchSimilar?: (threshold: number) => void;
}

export const DocumentDNAViewer: React.FC<DocumentDNAViewerProps> = ({
  fingerprint,
  similarDocuments = [],
  comparisonFingerprint,
  comparisonResult,
  onCompareDocument,
  onSearchSimilar,
}) => {
  const [selectedLayer, setSelectedLayer] = useState<'structural' | 'content' | 'style' | 'semantic' | 'combined'>('combined');
  const [showFullHashes, setShowFullHashes] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getHashDisplay = (hash: string, maxLength: number = 16) => {
    if (showFullHashes) {
      return hash;
    }
    return `${hash.substring(0, maxLength)}...${hash.substring(hash.length - maxLength)}`;
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 0.9) return 'text-green-600';
    if (similarity >= 0.7) return 'text-yellow-600';
    if (similarity >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSimilarityBadge = (similarity: number) => {
    const percentage = (similarity * 100).toFixed(1);
    let variant: 'default' | 'destructive' | 'secondary' = 'default';
    let color = '';

    if (similarity >= 0.9) {
      variant = 'default';
      color = 'bg-green-100 text-green-900 border-green-500';
    } else if (similarity >= 0.7) {
      variant = 'default';
      color = 'bg-yellow-100 text-yellow-900 border-yellow-500';
    } else if (similarity >= 0.5) {
      variant = 'default';
      color = 'bg-orange-100 text-orange-900 border-orange-500';
    } else {
      variant = 'destructive';
      color = 'bg-red-100 text-red-900 border-red-500';
    }

    return (
      <Badge variant={variant} className={`${color} border-2`}>
        {percentage}% Similar
      </Badge>
    );
  };

  const layerInfo = {
    structural: {
      name: 'Structural Layer',
      description: 'Document structure, field organization, nesting depth',
      icon: Layers,
      hash: fingerprint.structural_hash,
      signature: fingerprint.structural_signature,
    },
    content: {
      name: 'Content Layer',
      description: 'Actual text and data values',
      icon: FileText,
      hash: fingerprint.content_hash,
    },
    style: {
      name: 'Style Layer',
      description: 'Formatting, styling, and presentation patterns',
      icon: Fingerprint,
      hash: fingerprint.style_hash,
    },
    semantic: {
      name: 'Semantic Layer',
      description: 'Meaning, entities, and relationships',
      icon: Dna,
      hash: fingerprint.semantic_hash,
    },
    combined: {
      name: 'Combined DNA',
      description: 'Complete multi-layer fingerprint',
      icon: Hash,
      hash: fingerprint.combined_hash,
    },
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="h-5 w-5" />
            Document DNA Fingerprint
          </CardTitle>
          <CardDescription>
            Multi-layered fingerprinting for document: <span className="font-mono text-xs">{fingerprint.document_id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Field Count</p>
              <p className="text-2xl font-bold text-gray-900">{fingerprint.field_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Nested Depth</p>
              <p className="text-2xl font-bold text-gray-900">{fingerprint.nested_depth}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Keywords</p>
              <p className="text-2xl font-bold text-gray-900">{fingerprint.keywords.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Entities</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(fingerprint.entities).flat().length}
              </p>
            </div>
          </div>

          {/* Layer Selection */}
          <Tabs value={selectedLayer} onValueChange={(value) => setSelectedLayer(value as typeof selectedLayer)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="structural">Structural</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="semantic">Semantic</TabsTrigger>
              <TabsTrigger value="combined">Combined</TabsTrigger>
            </TabsList>

            {(['structural', 'content', 'style', 'semantic', 'combined'] as const).map((layer) => {
              const info = layerInfo[layer];
              const Icon = info.icon;
              return (
                <TabsContent key={layer} value={layer}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {info.name}
                      </CardTitle>
                      <CardDescription>{info.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-500">Hash</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowFullHashes(!showFullHashes)}
                              className="h-7 text-xs"
                            >
                              {showFullHashes ? 'Show Short' : 'Show Full'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(info.hash, 'Hash')}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-xs font-mono break-all">{getHashDisplay(info.hash)}</p>
                        </div>
                      </div>

                      {layer === 'structural' && info.signature && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">Structural Signature</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(info.signature!, 'Structural Signature')}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-xs font-mono break-all">{info.signature}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Keywords and Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {fingerprint.keywords.length > 0 ? (
                    fingerprint.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No keywords extracted</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Extracted Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.keys(fingerprint.entities).length > 0 ? (
                    Object.entries(fingerprint.entities).map(([type, values]) => (
                      <div key={type} className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 capitalize">{type}</p>
                        <div className="flex flex-wrap gap-1">
                          {values.map((value, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No entities extracted</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Similarity Comparison */}
      {comparisonResult && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Similarity Comparison
            </CardTitle>
            <CardDescription>
              Comparing with document: <span className="font-mono text-xs">{comparisonResult.document2_id}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">Overall Similarity</p>
              {getSimilarityBadge(comparisonResult.overall_similarity)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Structural</p>
                <p className={`text-xl font-bold ${getSimilarityColor(comparisonResult.structural_similarity)}`}>
                  {(comparisonResult.structural_similarity * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Content</p>
                <p className={`text-xl font-bold ${getSimilarityColor(comparisonResult.content_similarity)}`}>
                  {(comparisonResult.content_similarity * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Style</p>
                <p className={`text-xl font-bold ${getSimilarityColor(comparisonResult.style_similarity)}`}>
                  {(comparisonResult.style_similarity * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Semantic</p>
                <p className={`text-xl font-bold ${getSimilarityColor(comparisonResult.semantic_similarity)}`}>
                  {(comparisonResult.semantic_similarity * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisonResult.matching_patterns.length > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold text-green-900 mb-2">Matching Patterns</p>
                    <ul className="list-disc list-inside space-y-1">
                      {comparisonResult.matching_patterns.map((pattern, idx) => (
                        <li key={idx} className="text-sm text-green-800">{pattern}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {comparisonResult.diverging_patterns.length > 0 && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <p className="font-semibold text-red-900 mb-2">Diverging Patterns</p>
                    <ul className="list-disc list-inside space-y-1">
                      {comparisonResult.diverging_patterns.map((pattern, idx) => (
                        <li key={idx} className="text-sm text-red-800">{pattern}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {comparisonResult.is_duplicate && (
              <Alert className="bg-yellow-50 border-yellow-500 border-l-4">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <p className="font-semibold">Potential Duplicate Detected</p>
                  <p className="text-sm">
                    These documents appear to be duplicates with {comparisonResult.confidence * 100}% confidence.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {comparisonResult.is_derivative && (
              <Alert className="bg-blue-50 border-blue-500 border-l-4">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <p className="font-semibold">Derivative Document Detected</p>
                  <p className="text-sm">
                    This document appears to be derived from the comparison document.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Similar Documents List */}
      {similarDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Similar Documents
            </CardTitle>
            <CardDescription>
              Found {similarDocuments.length} document{similarDocuments.length !== 1 ? 's' : ''} with similar DNA patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {similarDocuments.map((result, index) => (
                <Card
                  key={result.document2_id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                  onClick={() => onCompareDocument?.(result.document2_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-sm font-mono">{result.document2_id}</p>
                          {getSimilarityBadge(result.overall_similarity)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Structural:</span>{' '}
                            {(result.structural_similarity * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="font-medium">Content:</span>{' '}
                            {(result.content_similarity * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="font-medium">Style:</span>{' '}
                            {(result.style_similarity * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="font-medium">Semantic:</span>{' '}
                            {(result.semantic_similarity * 100).toFixed(0)}%
                          </div>
                        </div>
                        {result.is_duplicate && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            Duplicate
                          </Badge>
                        )}
                        {result.is_derivative && (
                          <Badge variant="secondary" className="mt-2 text-xs ml-2">
                            Derivative
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompareDocument?.(result.document2_id);
                        }}
                      >
                        Compare
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for similar documents */}
      {similarDocuments.length === 0 && onSearchSimilar && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-gray-500 text-lg font-medium">No Similar Documents Found</p>
            <p className="text-gray-400 text-sm mt-2 mb-4">
              Search for documents with similar DNA fingerprints
            </p>
            <Button onClick={() => onSearchSimilar(0.7)} variant="outline">
              Search Similar Documents
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentDNAViewer;











