/**
 * Forensic Analysis Components
 *
 * Export all forensic analysis UI components
 */

export { ForensicDiffViewer } from './ForensicDiffViewer';
export { ForensicTimeline } from './ForensicTimeline';
export { PatternAnalysisDashboard } from './PatternAnalysisDashboard';

// Re-export types for convenience
export type {
  DocumentChange,
  DiffResult,
  VisualOverlay,
  DocumentFingerprint,
  SimilarityResult,
  TimelineEvent,
  SuspiciousPattern,
  ForensicTimeline as ForensicTimelineType,
  DetectedPattern,
  PatternDetectionResult
} from '@/types/forensics';
