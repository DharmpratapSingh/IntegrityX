/**
 * Forensic Diff Viewer Component
 *
 * Displays side-by-side or overlay comparison of two documents
 * with highlighted changes, risk indicators, and forensic analysis.
 */

'use client';

import React, { useState } from 'react';
import { DocumentChange, DiffResult, VisualOverlay } from '@/types/forensics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  FileText, 
  Hash, 
  Copy, 
  ChevronRight,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ForensicDiffViewerProps {
  diffResult: DiffResult;
  visualOverlay?: VisualOverlay;
  mode?: 'side-by-side' | 'overlay' | 'unified';
  showTimeline?: boolean;
  highlightRiskyChanges?: boolean;
}

export const ForensicDiffViewer: React.FC<ForensicDiffViewerProps> = ({
  diffResult,
  visualOverlay,
  mode = 'side-by-side',
  showTimeline = true,
  highlightRiskyChanges = true
}) => {
  const [selectedChange, setSelectedChange] = useState<DocumentChange | null>(null);
  const [viewMode, setViewMode] = useState(mode);

  // Risk color mapping for borders and backgrounds
  const getRiskColor = (riskLevel: string): string => {
    const colors = {
      critical: 'bg-red-100 border-red-500 text-red-900',
      high: 'bg-orange-100 border-orange-500 text-orange-900',
      medium: 'bg-yellow-100 border-yellow-500 text-yellow-900',
      low: 'bg-green-100 border-green-500 text-green-900',
      minimal: 'bg-gray-100 border-gray-500 text-gray-900'
    };
    return colors[riskLevel as keyof typeof colors] || colors.minimal;
  };

  // Risk badge variant
  const getRiskBadgeVariant = (riskLevel: string): 'destructive' | 'default' => {
    return riskLevel === 'critical' || riskLevel === 'high' ? 'destructive' : 'default';
  };

  // Risk badge component
  const RiskBadge: React.FC<{ level: string; score: number }> = ({ level, score }) => {
    const badgeClass = getRiskColor(level);
    return (
      <Badge 
        variant={getRiskBadgeVariant(level)}
        className={`${badgeClass} border-2`}
      >
        {level.toUpperCase()} ({(score * 100).toFixed(0)}%)
      </Badge>
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with summary */}
      <Card className={`${getRiskColor(diffResult.risk_level)} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {diffResult.risk_level === 'critical' || diffResult.risk_level === 'high' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
                Forensic Document Comparison
              </CardTitle>
              <CardDescription className="mt-1">
                Comparing <span className="font-mono text-xs">{diffResult.document1_id}</span> vs{' '}
                <span className="font-mono text-xs">{diffResult.document2_id}</span>
              </CardDescription>
            </div>
            <RiskBadge level={diffResult.risk_level} score={diffResult.risk_score} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-medium mb-1">Total Changes</p>
              <p className="text-3xl font-bold text-gray-900">{diffResult.total_changes}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-medium mb-1">Similarity</p>
              <p className="text-3xl font-bold text-gray-900">
                {(diffResult.overall_similarity * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-medium mb-1">Suspicious Patterns</p>
              <p className="text-3xl font-bold text-red-600">{diffResult.suspicious_patterns.length}</p>
            </div>
          </div>

          {/* Recommendation Alert */}
          <Alert className={`border-l-4 ${getRiskColor(diffResult.risk_level)}`}>
            {diffResult.risk_level === 'critical' || diffResult.risk_level === 'high' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <p className="font-semibold mb-1">Recommendation:</p>
              <p>{diffResult.recommendation}</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* View mode selector */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="side-by-side">Side-by-Side</TabsTrigger>
              <TabsTrigger value="overlay">Overlay</TabsTrigger>
              <TabsTrigger value="unified">Unified</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Changes list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Changes Detected</CardTitle>
          <CardDescription>
            {highlightRiskyChanges 
              ? 'Showing high-risk changes only' 
              : `Showing all ${diffResult.changes.length} changes`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {diffResult.changes
              .filter(change => !highlightRiskyChanges || change.risk_level === 'critical' || change.risk_level === 'high')
              .map((change, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-colors hover:shadow-md ${
                    selectedChange === change ? 'ring-2 ring-blue-500' : ''
                  } ${getRiskColor(change.risk_level)}`}
                  onClick={() => setSelectedChange(change)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm break-words">{change.field_path}</p>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{change.reason}</p>
                      <div className="space-y-1 text-sm">
                        {change.old_value !== null && (
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold text-red-800">Old:</span>{' '}
                              <span className="text-red-700 font-mono text-xs break-all">
                                {typeof change.old_value === 'string' 
                                  ? change.old_value 
                                  : JSON.stringify(change.old_value)}
                              </span>
                            </div>
                          </div>
                        )}
                        {change.new_value !== null && (
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold text-green-800">New:</span>{' '}
                              <span className="text-green-700 font-mono text-xs break-all">
                                {typeof change.new_value === 'string' 
                                  ? change.new_value 
                                  : JSON.stringify(change.new_value)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <RiskBadge level={change.risk_level} score={change.risk_score} />
                    </div>
                  </div>
                </div>
              ))}
            {diffResult.changes.filter(change => !highlightRiskyChanges || change.risk_level === 'critical' || change.risk_level === 'high').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No high-risk changes detected</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suspicious patterns */}
      {diffResult.suspicious_patterns.length > 0 && (
        <Alert className="border-red-300 bg-red-50 border-l-4 border-red-500">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <p className="font-semibold mb-3 text-lg">Suspicious Patterns Detected</p>
            <ul className="space-y-2">
              {diffResult.suspicious_patterns.map((pattern, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Selected change details */}
      {selectedChange && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Change Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedChange(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Field Path</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono break-all">{selectedChange.field_path}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedChange.field_path, 'Field path')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Change Type</p>
                <Badge variant="outline" className="capitalize">
                  {selectedChange.change_type}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Risk Assessment</p>
                <RiskBadge level={selectedChange.risk_level} score={selectedChange.risk_score} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Reason</p>
                <p className="text-sm">{selectedChange.reason}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedChange.old_value !== null && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800 mb-2">Old Value</p>
                    <p className="text-sm font-mono text-red-900 break-all">
                      {typeof selectedChange.old_value === 'string' 
                        ? selectedChange.old_value 
                        : JSON.stringify(selectedChange.old_value, null, 2)}
                    </p>
                  </div>
                )}
                {selectedChange.new_value !== null && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-2">New Value</p>
                    <p className="text-sm font-mono text-green-900 break-all">
                      {typeof selectedChange.new_value === 'string' 
                        ? selectedChange.new_value 
                        : JSON.stringify(selectedChange.new_value, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {(selectedChange.changed_by || selectedChange.timestamp) && (
              <div className="border-t pt-4 space-y-2">
                {selectedChange.changed_by && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500">Changed by:</span>
                    <span className="text-gray-900">{selectedChange.changed_by}</span>
                  </div>
                )}
                {selectedChange.timestamp && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500">Timestamp:</span>
                    <span className="text-gray-900">
                      {new Date(selectedChange.timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForensicDiffViewer;
