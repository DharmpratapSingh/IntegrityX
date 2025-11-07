/**
 * Pattern Analysis Dashboard Component
 *
 * Displays detected patterns across document corpus,
 * fraud indicators, and cross-document analysis.
 */

'use client';

import React, { useState } from 'react';
import { DetectedPattern, PatternDetectionResult } from '@/types/forensics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  FileText,
  TrendingUp,
  Users,
  Shield,
  X,
  Copy,
  Eye,
  Download,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PatternAnalysisDashboardProps {
  patterns: PatternDetectionResult;
  onPatternClick?: (pattern: DetectedPattern) => void;
  alertThreshold?: 'critical' | 'high' | 'medium' | 'low';
}

export const PatternAnalysisDashboard: React.FC<PatternAnalysisDashboardProps> = ({
  patterns,
  onPatternClick,
  alertThreshold = 'high'
}) => {
  const [selectedPattern, setSelectedPattern] = useState<DetectedPattern | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Pattern type descriptions
  const getPatternTypeDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      duplicate_signature: '🖋️ Duplicate Signature - Same signature used across multiple documents',
      amount_manipulation: '💰 Amount Manipulation - Suspicious changes to financial values',
      identity_reuse_ssn: '🆔 Identity Reuse (SSN) - Same SSN on multiple applications',
      identity_reuse_address: '🏠 Identity Reuse (Address) - Same address with different applicants',
      coordinated_tampering: '🔄 Coordinated Tampering - Bulk modifications by same user',
      template_fraud: '📋 Template Fraud - Documents created from same template',
      rapid_submissions: '⚡ Rapid Submissions - Automated or bot-like submission pattern'
    };
    return descriptions[type] || `Pattern: ${type}`;
  };

  // Get severity badge color
  const getSeverityBadgeColor = (severity: string): string => {
    const colors = {
      critical: 'bg-red-100 text-red-900 border-red-500',
      high: 'bg-orange-100 text-orange-900 border-orange-500',
      medium: 'bg-yellow-100 text-yellow-900 border-yellow-500',
      low: 'bg-blue-100 text-blue-900 border-blue-500'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  // Get border color for pattern cards
  const getBorderColor = (severity: string): string => {
    const colors = {
      critical: 'border-red-500',
      high: 'border-orange-500',
      medium: 'border-yellow-500',
      low: 'border-blue-500'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Filter patterns
  const filteredPatterns = filterType === 'all'
    ? patterns.patterns
    : patterns.patterns.filter(p => p.pattern_type === filterType);

  // Get unique pattern types
  const patternTypes = Array.from(new Set(patterns.patterns.map(p => p.pattern_type)));

  const handlePatternClick = (pattern: DetectedPattern) => {
    setSelectedPattern(pattern);
    onPatternClick?.(pattern);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pattern Analysis Dashboard
          </CardTitle>
          <CardDescription>
            Cross-document fraud detection and pattern analysis across {patterns.analyzed_documents} documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Documents Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{patterns.analyzed_documents}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Total Patterns</p>
              <p className="text-2xl font-bold text-gray-900">{patterns.total_patterns}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <p className="text-red-600 text-xs font-medium mb-1">Critical Patterns</p>
              <p className="text-2xl font-bold text-red-600">{patterns.by_severity.critical || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <p className="text-orange-600 text-xs font-medium mb-1">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">{patterns.by_severity.high || 0}</p>
            </div>
          </div>

          {/* Alert banner for critical patterns */}
          {patterns.critical_patterns.length > 0 && (
            <Alert className="border-red-300 bg-red-50 border-l-4 border-red-500">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <p className="font-semibold mb-1">
                  {patterns.critical_patterns.length} Critical Pattern{patterns.critical_patterns.length !== 1 ? 's' : ''} Detected
                </p>
                <p className="text-sm">
                  Immediate action required. These patterns indicate potential fraud or security issues.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Pattern Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All patterns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patterns</SelectItem>
                  {patternTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredPatterns.length}</span> of{' '}
                <span className="font-semibold">{patterns.total_patterns}</span> patterns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patterns Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPatterns.map((pattern, index) => (
          <Card
            key={pattern.pattern_id}
            className={`cursor-pointer hover:shadow-lg transition-all border-l-4 ${getBorderColor(pattern.severity)} ${
              selectedPattern?.pattern_id === pattern.pattern_id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handlePatternClick(pattern)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Pattern type */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-lg font-semibold">{getPatternTypeDescription(pattern.pattern_type)}</p>
                    <Badge
                      variant={pattern.severity === 'critical' || pattern.severity === 'high' ? 'destructive' : 'default'}
                      className={`${getSeverityBadgeColor(pattern.severity)} border-2`}
                    >
                      {pattern.severity.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-3">{pattern.description}</p>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span className="font-semibold">Documents:</span> {pattern.affected_documents.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">Users:</span> {pattern.affected_users.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span className="font-semibold">Confidence:</span> {(pattern.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-semibold">Risk:</span> {(pattern.risk_score * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Recommendation */}
                  <Alert className="mt-3 bg-gray-50 border-gray-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Recommendation:</p>
                      <p className="text-sm text-gray-600">{pattern.recommendation}</p>
                    </AlertDescription>
                  </Alert>

                  {/* Evidence preview */}
                  {Object.keys(pattern.evidence).length > 0 && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 font-semibold hover:text-blue-700">
                          View Evidence
                        </summary>
                        <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <pre className="text-xs overflow-auto max-h-32 font-mono">
                            {JSON.stringify(pattern.evidence, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected pattern details */}
      {selectedPattern && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pattern Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPattern(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Pattern ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono break-all">{selectedPattern.pattern_id}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedPattern.pattern_id, 'Pattern ID')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Pattern Type</p>
                <Badge variant="outline" className="capitalize">
                  {selectedPattern.pattern_type.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Severity</p>
                <Badge
                  variant={selectedPattern.severity === 'critical' || selectedPattern.severity === 'high' ? 'destructive' : 'default'}
                  className={`${getSeverityBadgeColor(selectedPattern.severity)} border-2`}
                >
                  {selectedPattern.severity.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Confidence</p>
                <p className="text-sm font-semibold">{(selectedPattern.confidence * 100).toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Risk Score</p>
                <p className="text-sm font-semibold">{(selectedPattern.risk_score * 100).toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Detected At</p>
                <p className="text-sm font-semibold">{new Date(selectedPattern.detected_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
              <p className="text-sm">{selectedPattern.description}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">
                Affected Documents ({selectedPattern.affected_documents.length})
              </p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-auto">
                <div className="space-y-1">
                  {selectedPattern.affected_documents.map((docId, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <p className="text-sm font-mono break-all">{docId}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(docId, 'Document ID')}
                        className="h-5 w-5 p-0 ml-auto"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedPattern.affected_users.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Affected Users ({selectedPattern.affected_users.length})
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-auto">
                  <div className="space-y-1">
                    {selectedPattern.affected_users.map((userId, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-gray-400" />
                        <p className="text-sm font-mono break-all">{userId}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(userId, 'User ID')}
                          className="h-5 w-5 p-0 ml-auto"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Evidence</p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <pre className="text-xs overflow-auto max-h-48 font-mono">
                  {JSON.stringify(selectedPattern.evidence, null, 2)}
                </pre>
              </div>
            </div>

            <Alert className="bg-yellow-50 border-yellow-500 border-l-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                <p className="font-semibold mb-1">Recommendation</p>
                <p className="text-sm">{selectedPattern.recommendation}</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {filteredPatterns.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-gray-500 text-lg font-medium">No patterns detected</p>
            <p className="text-gray-400 text-sm mt-2">
              {filterType === 'all' 
                ? 'No suspicious patterns found across analyzed documents.'
                : 'No patterns match the selected filter. Try adjusting your criteria.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatternAnalysisDashboard;
