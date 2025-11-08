/**
 * TypeScript interfaces for Forensic Analysis features
 */

// Visual Forensics Types

export interface DocumentChange {
  field_path: string;
  change_type: 'addition' | 'deletion' | 'modification' | 'structural' | 'financial' | 'identity' | 'signature' | 'metadata';
  old_value: any;
  new_value: any;
  risk_score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  reason: string;
  location?: Record<string, any>;
  timestamp?: string;
  changed_by?: string;
}

export interface DiffResult {
  document1_id: string;
  document2_id: string;
  overall_similarity: number;
  total_changes: number;
  changes: DocumentChange[];
  risk_score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  change_summary: Record<string, any>;
  suspicious_patterns: string[];
  recommendation: string;
  analyzed_at: string;
}

export interface VisualOverlay {
  additions: HighlightData[];
  deletions: HighlightData[];
  modifications: HighlightData[];
  highlights: Record<string, HighlightData>;
}

export interface HighlightData {
  path: string;
  old_value: any;
  new_value: any;
  risk_level: string;
  color: string;
}

// Document DNA Types

export interface DocumentFingerprint {
  document_id: string;
  structural_hash: string;
  content_hash: string;
  style_hash: string;
  semantic_hash: string;
  combined_hash: string;
  field_count: number;
  nested_depth: number;
  keywords: string[];
  entities: Record<string, string[]>;
  structural_signature: string;
  created_at: string;
}

export interface SimilarityResult {
  document1_id: string;
  document2_id: string;
  overall_similarity: number;
  structural_similarity: number;
  content_similarity: number;
  style_similarity: number;
  semantic_similarity: number;
  matching_patterns: string[];
  diverging_patterns: string[];
  is_derivative: boolean;
  is_duplicate: boolean;
  confidence: number;
}

// Forensic Timeline Types

export interface TimelineEvent {
  event_id: string;
  artifact_id: string;
  timestamp: string;
  event_type: string;
  category: 'creation' | 'modification' | 'access' | 'verification' | 'blockchain' | 'signature' | 'deletion' | 'security' | 'anomaly';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  user_id?: string;
  user_role?: string;
  ip_address?: string;
  details: Record<string, any>;
  risk_score: number;
  tags: string[];
  snapshot_available: boolean;
}

export interface SuspiciousPattern {
  pattern_id: string;
  pattern_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affected_events: string[];
  risk_score: number;
  recommendation: string;
  detected_at: string;
}

export interface ForensicTimeline {
  artifact_id: string;
  total_events: number;
  date_range: {
    start: string | null;
    end: string | null;
  };
  events: TimelineEvent[];
  suspicious_patterns: SuspiciousPattern[];
  statistics: TimelineStatistics;
  risk_assessment: RiskAssessment;
  generated_at: string;
}

export interface TimelineStatistics {
  total_events: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  unique_users: number;
  time_span_seconds: number;
  average_risk_score: number;
  high_risk_events: number;
}

export interface RiskAssessment {
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  risk_score: number;
  pattern_count: number;
  requires_investigation: boolean;
}

// Pattern Detection Types

export interface DetectedPattern {
  pattern_id: string;
  pattern_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affected_documents: string[];
  affected_users: string[];
  evidence: Record<string, any>;
  confidence: number;
  risk_score: number;
  recommendation: string;
  detected_at: string;
}

export interface PatternDetectionResult {
  analyzed_documents: number;
  total_patterns: number;
  by_severity: Record<string, number>;
  patterns: DetectedPattern[];
  critical_patterns: DetectedPattern[];
  high_priority_patterns: DetectedPattern[];
}

// API Request/Response Types

export interface ForensicDiffRequest {
  artifact_id_1: string;
  artifact_id_2: string;
  include_overlay?: boolean;
}

export interface ForensicDiffResponse {
  ok: boolean;
  data: {
    diff_result: DiffResult;
    visual_overlay: VisualOverlay;
    metadata: Record<string, any>;
  };
}

export interface ForensicTimelineResponse {
  ok: boolean;
  data: ForensicTimeline;
}

export interface PatternDetectionResponse {
  ok: boolean;
  data: PatternDetectionResult;
}

export interface SimilarDocumentsResponse {
  ok: boolean;
  data: {
    target_document_id: string;
    threshold: number;
    found_count: number;
    similar_documents: SimilarityResult[];
  };
}
