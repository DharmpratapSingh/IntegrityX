/**
 * Forensic Timeline Component
 *
 * Interactive timeline visualization showing document lifecycle,
 * events, suspicious patterns, and risk assessment.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ForensicTimeline as ForensicTimelineType, TimelineEvent, SuspiciousPattern } from '@/types/forensics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  FileText,
  Edit,
  Eye,
  CheckCircle,
  Link2,
  PenTool,
  Trash2,
  Shield,
  AlertCircle,
  Clock,
  User,
  X,
  Copy,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ForensicTimelineProps {
  timeline: ForensicTimelineType;
  onEventClick?: (event: TimelineEvent) => void;
  onPatternClick?: (pattern: SuspiciousPattern) => void;
  riskThreshold?: number;
  showPredictions?: boolean;
}

export const ForensicTimeline: React.FC<ForensicTimelineProps> = ({
  timeline,
  onEventClick,
  onPatternClick,
  riskThreshold = 0.7,
  showPredictions = true
}) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter events
  const filteredEvents = useMemo(() => {
    let events = timeline.events;

    if (filterSeverity !== 'all') {
      events = events.filter(e => e.severity === filterSeverity);
    }

    if (filterCategory !== 'all') {
      events = events.filter(e => e.category === filterCategory);
    }

    return events;
  }, [timeline.events, filterSeverity, filterCategory]);

  // Severity color mapping
  const getSeverityColor = (severity: string): string => {
    const colors = {
      critical: 'bg-red-500 border-red-600',
      high: 'bg-orange-500 border-orange-600',
      medium: 'bg-yellow-500 border-yellow-600',
      low: 'bg-blue-500 border-blue-600',
      info: 'bg-gray-500 border-gray-600'
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  // Risk badge color
  const getRiskBadgeColor = (riskLevel: string): string => {
    const colors = {
      critical: 'bg-red-100 text-red-900 border-red-500',
      high: 'bg-orange-100 text-orange-900 border-orange-500',
      medium: 'bg-yellow-100 text-yellow-900 border-yellow-500',
      low: 'bg-green-100 text-green-900 border-green-500',
      minimal: 'bg-gray-100 text-gray-900 border-gray-500'
    };
    return colors[riskLevel as keyof typeof colors] || colors.minimal;
  };

  // Category icon component mapping
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      creation: <FileText className="h-4 w-4" />,
      modification: <Edit className="h-4 w-4" />,
      access: <Eye className="h-4 w-4" />,
      verification: <CheckCircle className="h-4 w-4" />,
      blockchain: <Link2 className="h-4 w-4" />,
      signature: <PenTool className="h-4 w-4" />,
      deletion: <Trash2 className="h-4 w-4" />,
      security: <Shield className="h-4 w-4" />,
      anomaly: <AlertCircle className="h-4 w-4" />
    };
    return iconMap[category] || <Clock className="h-4 w-4" />;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    onEventClick?.(event);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with risk assessment */}
      <Card className={`${getRiskBadgeColor(timeline.risk_assessment.risk_level)} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Forensic Timeline
              </CardTitle>
              <CardDescription className="mt-1">
                Document: <span className="font-mono text-xs">{timeline.artifact_id}</span>
              </CardDescription>
            </div>
            <Badge 
              variant={timeline.risk_assessment.risk_level === 'critical' || timeline.risk_assessment.risk_level === 'high' ? 'destructive' : 'default'}
              className={`${getRiskBadgeColor(timeline.risk_assessment.risk_level)} border-2`}
            >
              Risk: {timeline.risk_assessment.risk_level.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{timeline.total_events}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">{timeline.statistics.unique_users}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">High Risk Events</p>
              <p className="text-2xl font-bold text-red-600">{timeline.statistics.high_risk_events}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium mb-1">Patterns Detected</p>
              <p className="text-2xl font-bold text-orange-600">{timeline.risk_assessment.pattern_count}</p>
            </div>
          </div>

          {/* Investigation required alert */}
          {timeline.risk_assessment.requires_investigation && (
            <Alert className="border-red-300 bg-red-50 border-l-4 border-red-500">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <p className="font-semibold mb-1">Investigation Required</p>
                <p className="text-sm">
                  This document requires manual investigation due to high risk indicators.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Severity</label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="creation">Creation</SelectItem>
                  <SelectItem value="modification">Modification</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="blockchain">Blockchain</SelectItem>
                  <SelectItem value="signature">Signature</SelectItem>
                  <SelectItem value="deletion">Deletion</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="anomaly">Anomaly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Timeline</CardTitle>
          <CardDescription>
            {filteredEvents.length} of {timeline.total_events} events
            {timeline.date_range.start && timeline.date_range.end && (
              <> • {new Date(timeline.date_range.start).toLocaleDateString()} - {new Date(timeline.date_range.end).toLocaleDateString()}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

            {/* Events */}
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div
                  key={event.event_id}
                  className={`relative pl-16 cursor-pointer transition-all rounded-lg ${
                    selectedEvent?.event_id === event.event_id 
                      ? 'bg-blue-50 ring-2 ring-blue-500' 
                      : 'hover:bg-gray-50'
                  } p-4 border border-transparent hover:border-gray-200`}
                  onClick={() => handleEventClick(event)}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-5 w-6 h-6 rounded-full border-2 ${getSeverityColor(event.severity)} flex items-center justify-center text-white`}>
                    {getCategoryIcon(event.category)}
                  </div>

                  {/* Event content */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{event.description}</p>
                        {event.risk_score >= riskThreshold && (
                          <Badge variant="destructive" className="text-xs">
                            High Risk
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {event.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                        {event.user_id && (
                          <>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            <span>{event.user_id}</span>
                          </>
                        )}
                      </div>
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <Badge variant="outline" className="text-xs capitalize mb-2">
                        {event.category}
                      </Badge>
                      {event.snapshot_available && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                          <FileText className="h-3 w-3 mr-1" />
                          Snapshot
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events found matching the selected filters</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspicious patterns */}
      {timeline.suspicious_patterns.length > 0 && (
        <Alert className="border-red-300 bg-red-50 border-l-4 border-red-500">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <p className="font-semibold mb-4 text-lg">Suspicious Patterns Detected</p>
            <div className="space-y-3">
              {timeline.suspicious_patterns.map((pattern, index) => (
                <Card
                  key={pattern.pattern_id}
                  className="bg-white cursor-pointer hover:shadow-md transition-shadow border-red-200"
                  onClick={() => onPatternClick?.(pattern)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-red-900 mb-1">{pattern.description}</p>
                        <p className="text-sm text-gray-600 mb-2">{pattern.recommendation}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>Affected events: {pattern.affected_events.length}</span>
                          <span>•</span>
                          <span>Confidence: {(pattern.risk_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <Badge
                        variant={pattern.severity === 'critical' || pattern.severity === 'high' ? 'destructive' : 'default'}
                        className={`${
                          pattern.severity === 'critical' ? 'bg-red-100 text-red-900 border-red-500' :
                          pattern.severity === 'high' ? 'bg-orange-100 text-orange-900 border-orange-500' :
                          'bg-yellow-100 text-yellow-900 border-yellow-500'
                        } border-2`}
                      >
                        {pattern.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Selected event details */}
      {selectedEvent && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getCategoryIcon(selectedEvent.category)}
                Event Details
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Event Type</p>
                <p className="text-sm font-semibold">{selectedEvent.event_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Category</p>
                <Badge variant="outline" className="capitalize">
                  {selectedEvent.category}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Severity</p>
                <Badge 
                  variant={selectedEvent.severity === 'critical' || selectedEvent.severity === 'high' ? 'destructive' : 'default'}
                  className={`${getRiskBadgeColor(selectedEvent.severity)} border-2 capitalize`}
                >
                  {selectedEvent.severity}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Risk Score</p>
                <p className="text-sm font-semibold">{(selectedEvent.risk_score * 100).toFixed(0)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">User</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{selectedEvent.user_id || 'N/A'}</p>
                  {selectedEvent.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedEvent.user_id!, 'User ID')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Timestamp</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedEvent.timestamp, 'Timestamp')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {selectedEvent.ip_address && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-1">IP Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-semibold">{selectedEvent.ip_address}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedEvent.ip_address!, 'IP Address')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                <p className="text-sm">{selectedEvent.description}</p>
              </div>
            )}

            {Object.keys(selectedEvent.details).length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Additional Details</p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <pre className="text-xs overflow-auto max-h-48 font-mono">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {selectedEvent.tags.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForensicTimeline;
