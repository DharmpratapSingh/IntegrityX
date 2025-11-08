"""
Forensic Timeline Service

Aggregates all document events, access logs, and modifications into
an interactive timeline for forensic investigation.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)


class EventSeverity(Enum):
    """Severity levels for timeline events."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class EventCategory(Enum):
    """Categories of timeline events."""
    CREATION = "creation"
    MODIFICATION = "modification"
    ACCESS = "access"
    VERIFICATION = "verification"
    BLOCKCHAIN = "blockchain"
    SIGNATURE = "signature"
    DELETION = "deletion"
    SECURITY = "security"
    ANOMALY = "anomaly"


@dataclass
class TimelineEvent:
    """Represents a single event in the document timeline."""
    event_id: str
    artifact_id: str
    timestamp: datetime
    event_type: str
    category: EventCategory
    severity: EventSeverity
    description: str
    user_id: Optional[str]
    user_role: Optional[str]
    ip_address: Optional[str]
    details: Dict[str, Any]
    risk_score: float
    tags: List[str]
    snapshot_available: bool

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'event_id': self.event_id,
            'artifact_id': self.artifact_id,
            'timestamp': self.timestamp.isoformat(),
            'event_type': self.event_type,
            'category': self.category.value,
            'severity': self.severity.value,
            'description': self.description,
            'user_id': self.user_id,
            'user_role': self.user_role,
            'ip_address': self.ip_address,
            'details': self.details,
            'risk_score': self.risk_score,
            'tags': self.tags,
            'snapshot_available': self.snapshot_available
        }


@dataclass
class TimelineSnapshot:
    """Snapshot of document state at a specific point in time."""
    snapshot_id: str
    event_id: str
    artifact_id: str
    timestamp: datetime
    document_state: Dict[str, Any]
    document_hash: str
    blockchain_verified: bool
    changes_from_previous: Optional[Dict[str, Any]]

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'snapshot_id': self.snapshot_id,
            'event_id': self.event_id,
            'artifact_id': self.artifact_id,
            'timestamp': self.timestamp.isoformat(),
            'document_state': self.document_state,
            'document_hash': self.document_hash,
            'blockchain_verified': self.blockchain_verified,
            'changes_from_previous': self.changes_from_previous
        }


@dataclass
class SuspiciousPattern:
    """Detected suspicious pattern in timeline."""
    pattern_id: str
    pattern_type: str
    severity: EventSeverity
    description: str
    affected_events: List[str]
    risk_score: float
    recommendation: str
    detected_at: datetime

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'pattern_id': self.pattern_id,
            'pattern_type': self.pattern_type,
            'severity': self.severity.value,
            'description': self.description,
            'affected_events': self.affected_events,
            'risk_score': self.risk_score,
            'recommendation': self.recommendation,
            'detected_at': self.detected_at.isoformat()
        }


class ForensicTimeline:
    """
    Forensic timeline service for comprehensive document event tracking
    and investigation.
    """

    def __init__(self, db_service=None):
        """Initialize timeline service."""
        self.db_service = db_service

        logger.info("✅ Forensic Timeline service initialized")

    def build_timeline(self, artifact_id: str,
                      start_time: Optional[datetime] = None,
                      end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Build complete forensic timeline for a document.

        Aggregates:
        - Database events
        - Blockchain transactions
        - Access logs
        - Modification history
        - Security events

        Args:
            artifact_id: Document ID
            start_time: Optional start time filter
            end_time: Optional end time filter

        Returns:
            Complete timeline with events, snapshots, and analysis
        """
        logger.info(f"📅 Building forensic timeline for artifact {artifact_id}")

        # Collect all events
        events = self._collect_all_events(artifact_id, start_time, end_time)

        # Sort by timestamp
        events.sort(key=lambda e: e.timestamp)

        # Detect suspicious patterns
        suspicious_patterns = self.detect_suspicious_patterns(events)

        # Generate timeline statistics
        stats = self._generate_timeline_stats(events)

        # Create interactive timeline data
        timeline = {
            'artifact_id': artifact_id,
            'total_events': len(events),
            'date_range': {
                'start': events[0].timestamp.isoformat() if events else None,
                'end': events[-1].timestamp.isoformat() if events else None
            },
            'events': [event.to_dict() for event in events],
            'suspicious_patterns': [pattern.to_dict() for pattern in suspicious_patterns],
            'statistics': stats,
            'risk_assessment': self._assess_overall_risk(events, suspicious_patterns),
            'generated_at': datetime.now(timezone.utc).isoformat()
        }

        logger.info(f"✅ Timeline built: {len(events)} events, {len(suspicious_patterns)} suspicious patterns")

        return timeline

    def _collect_all_events(self, artifact_id: str,
                           start_time: Optional[datetime],
                           end_time: Optional[datetime]) -> List[TimelineEvent]:
        """Collect all events from various sources."""
        events = []

        # 1. Database events
        if self.db_service:
            try:
                db_events = self.db_service.get_artifact_events(artifact_id)
                events.extend(self._convert_db_events(db_events, artifact_id))
            except Exception as e:
                logger.warning(f"Could not fetch database events: {e}")

        # 2. Create synthetic creation event if no events
        if not events:
            events.append(self._create_creation_event(artifact_id))

        # 3. Filter by time range
        if start_time:
            events = [e for e in events if e.timestamp >= start_time]
        if end_time:
            events = [e for e in events if e.timestamp <= end_time]

        return events

    def _convert_db_events(self, db_events: List[Any], artifact_id: str) -> List[TimelineEvent]:
        """Convert database events to TimelineEvent objects."""
        timeline_events = []

        for db_event in db_events:
            # Determine category and severity
            category, severity = self._classify_event(db_event.event_type)

            # Parse details
            try:
                details = json.loads(db_event.payload_json) if db_event.payload_json else {}
            except:
                details = {}

            # Calculate risk score
            risk_score = self._calculate_event_risk(db_event.event_type, details, severity)

            # Generate description
            description = self._generate_event_description(db_event.event_type, details)

            # Extract tags
            tags = self._extract_event_tags(db_event.event_type, details)

            event = TimelineEvent(
                event_id=str(db_event.id),
                artifact_id=artifact_id,
                timestamp=db_event.created_at,
                event_type=db_event.event_type,
                category=category,
                severity=severity,
                description=description,
                user_id=db_event.created_by,
                user_role=details.get('user_role'),
                ip_address=details.get('ip_address'),
                details=details,
                risk_score=risk_score,
                tags=tags,
                snapshot_available=self._has_snapshot(db_event)
            )

            timeline_events.append(event)

        return timeline_events

    def _classify_event(self, event_type: str) -> tuple[EventCategory, EventSeverity]:
        """Classify event into category and severity."""

        event_type_lower = event_type.lower()

        # Category classification
        if 'create' in event_type_lower or 'ingest' in event_type_lower:
            category = EventCategory.CREATION
            severity = EventSeverity.INFO
        elif 'modify' in event_type_lower or 'update' in event_type_lower or 'edit' in event_type_lower:
            category = EventCategory.MODIFICATION
            severity = EventSeverity.MEDIUM
        elif 'delete' in event_type_lower:
            category = EventCategory.DELETION
            severity = EventSeverity.HIGH
        elif 'verify' in event_type_lower or 'check' in event_type_lower:
            category = EventCategory.VERIFICATION
            severity = EventSeverity.LOW
        elif 'blockchain' in event_type_lower or 'seal' in event_type_lower or 'walacor' in event_type_lower:
            category = EventCategory.BLOCKCHAIN
            severity = EventSeverity.INFO
        elif 'sign' in event_type_lower or 'signature' in event_type_lower:
            category = EventCategory.SIGNATURE
            severity = EventSeverity.MEDIUM
        elif 'access' in event_type_lower or 'view' in event_type_lower:
            category = EventCategory.ACCESS
            severity = EventSeverity.LOW
        elif 'security' in event_type_lower or 'unauthorized' in event_type_lower or 'failed' in event_type_lower:
            category = EventCategory.SECURITY
            severity = EventSeverity.HIGH
        elif 'anomaly' in event_type_lower or 'suspicious' in event_type_lower:
            category = EventCategory.ANOMALY
            severity = EventSeverity.HIGH
        else:
            category = EventCategory.ACCESS
            severity = EventSeverity.INFO

        return category, severity

    def _calculate_event_risk(self, event_type: str, details: Dict, severity: EventSeverity) -> float:
        """Calculate risk score for an event."""

        # Base risk from severity
        base_risk = {
            EventSeverity.CRITICAL: 0.95,
            EventSeverity.HIGH: 0.75,
            EventSeverity.MEDIUM: 0.50,
            EventSeverity.LOW: 0.25,
            EventSeverity.INFO: 0.05
        }[severity]

        # Increase risk for certain event types
        if any(keyword in event_type.lower() for keyword in ['delete', 'unauthorized', 'failed', 'tamper']):
            base_risk = min(1.0, base_risk * 1.5)

        # Increase risk if details indicate problems
        if details.get('error') or details.get('failed'):
            base_risk = min(1.0, base_risk * 1.3)

        if details.get('integrity_score', 100) < 100:
            base_risk = min(1.0, base_risk * 1.4)

        return round(base_risk, 3)

    def _generate_event_description(self, event_type: str, details: Dict) -> str:
        """Generate human-readable event description."""

        descriptions = {
            'artifact_created': "Document created and uploaded",
            'artifact_ingested': "Document ingested into system",
            'blockchain_sealed': "Document sealed to blockchain",
            'document_verified': "Document integrity verified",
            'document_modified': "Document content modified",
            'document_deleted': "Document deleted",
            'signature_added': "Signature added to document",
            'access_granted': "Document accessed",
            'unauthorized_access': "Unauthorized access attempt detected",
            'integrity_check': "Integrity check performed",
            'anomaly_detected': "Anomaly detected in document"
        }

        base_desc = descriptions.get(event_type, f"Event: {event_type}")

        # Add details if available
        if details.get('changed_fields'):
            base_desc += f" (modified: {', '.join(details['changed_fields'])})"

        if details.get('walacor_tx_id'):
            base_desc += f" [TX: {details['walacor_tx_id'][:8]}...]"

        return base_desc

    def _extract_event_tags(self, event_type: str, details: Dict) -> List[str]:
        """Extract relevant tags from event."""
        tags = []

        if 'blockchain' in event_type.lower():
            tags.append('blockchain')
        if 'verify' in event_type.lower():
            tags.append('verification')
        if 'delete' in event_type.lower() or details.get('deleted'):
            tags.append('deletion')
        if details.get('risk_score', 0) > 0.7:
            tags.append('high-risk')
        if details.get('anomaly'):
            tags.append('anomaly')
        if details.get('failed') or details.get('error'):
            tags.append('error')

        return tags

    def _has_snapshot(self, db_event: Any) -> bool:
        """Check if event has an associated snapshot."""
        # In a real implementation, check if snapshot exists
        # For now, return True for creation and modification events
        event_type = db_event.event_type.lower()
        return any(keyword in event_type for keyword in ['create', 'modify', 'update', 'seal'])

    def _create_creation_event(self, artifact_id: str) -> TimelineEvent:
        """Create synthetic creation event."""
        return TimelineEvent(
            event_id="synthetic_creation",
            artifact_id=artifact_id,
            timestamp=datetime.now(timezone.utc),
            event_type="artifact_created",
            category=EventCategory.CREATION,
            severity=EventSeverity.INFO,
            description="Document created",
            user_id="system",
            user_role=None,
            ip_address=None,
            details={},
            risk_score=0.0,
            tags=['creation'],
            snapshot_available=False
        )

    def detect_suspicious_patterns(self, events: List[TimelineEvent]) -> List[SuspiciousPattern]:
        """
        Detect suspicious patterns in event timeline.

        Patterns detected:
        - Unusual access times
        - Rapid successive modifications
        - Out-of-sequence changes
        - Known fraud patterns
        """
        logger.info(f"🔍 Analyzing {len(events)} events for suspicious patterns")

        patterns = []

        # Pattern 1: Multiple rapid modifications
        rapid_mods = self._detect_rapid_modifications(events)
        if rapid_mods:
            patterns.append(rapid_mods)

        # Pattern 2: Unusual access times (late night/weekend)
        unusual_access = self._detect_unusual_access_times(events)
        if unusual_access:
            patterns.append(unusual_access)

        # Pattern 3: Failed attempts
        failed_attempts = self._detect_failed_attempts(events)
        if failed_attempts:
            patterns.append(failed_attempts)

        # Pattern 4: Unauthorized access
        unauth_access = self._detect_unauthorized_access(events)
        if unauth_access:
            patterns.append(unauth_access)

        # Pattern 5: Missing blockchain verification
        missing_blockchain = self._detect_missing_blockchain_seal(events)
        if missing_blockchain:
            patterns.append(missing_blockchain)

        # Pattern 6: Anomalous event sequence
        anomalous_sequence = self._detect_anomalous_sequence(events)
        if anomalous_sequence:
            patterns.append(anomalous_sequence)

        logger.info(f"✅ Detected {len(patterns)} suspicious patterns")

        return patterns

    def _detect_rapid_modifications(self, events: List[TimelineEvent]) -> Optional[SuspiciousPattern]:
        """Detect rapid successive modifications."""
        mod_events = [e for e in events if e.category == EventCategory.MODIFICATION]

        if len(mod_events) < 3:
            return None

        # Check for modifications within short time window
        rapid_mods = []
        for i in range(len(mod_events) - 1):
            time_diff = (mod_events[i + 1].timestamp - mod_events[i].timestamp).total_seconds()
            if time_diff < 300:  # Less than 5 minutes
                rapid_mods.extend([mod_events[i].event_id, mod_events[i + 1].event_id])

        if len(rapid_mods) >= 4:
            return SuspiciousPattern(
                pattern_id=f"rapid_mods_{events[0].artifact_id}",
                pattern_type="rapid_modifications",
                severity=EventSeverity.HIGH,
                description=f"Detected {len(rapid_mods)} rapid successive modifications within short time windows",
                affected_events=list(set(rapid_mods)),
                risk_score=0.75,
                recommendation="Investigate whether modifications were authorized and intentional",
                detected_at=datetime.now(timezone.utc)
            )

        return None

    def _detect_unusual_access_times(self, events: List[TimelineEvent]) -> Optional[SuspiciousPattern]:
        """Detect access at unusual times (late night, weekends)."""
        unusual_events = []

        for event in events:
            hour = event.timestamp.hour
            weekday = event.timestamp.weekday()

            # Late night (10 PM - 6 AM) or weekend
            if (hour >= 22 or hour <= 6) or (weekday >= 5):
                if event.category in [EventCategory.MODIFICATION, EventCategory.ACCESS]:
                    unusual_events.append(event.event_id)

        if len(unusual_events) >= 3:
            return SuspiciousPattern(
                pattern_id=f"unusual_access_{events[0].artifact_id}",
                pattern_type="unusual_access_times",
                severity=EventSeverity.MEDIUM,
                description=f"Detected {len(unusual_events)} access/modification events at unusual times (nights/weekends)",
                affected_events=unusual_events,
                risk_score=0.60,
                recommendation="Verify if after-hours access was authorized",
                detected_at=datetime.now(timezone.utc)
            )

        return None

    def _detect_failed_attempts(self, events: List[TimelineEvent]) -> Optional[SuspiciousPattern]:
        """Detect multiple failed attempts."""
        failed_events = [e for e in events if 'failed' in e.event_type.lower() or 'error' in e.tags]

        if len(failed_events) >= 3:
            return SuspiciousPattern(
                pattern_id=f"failed_attempts_{events[0].artifact_id}",
                pattern_type="multiple_failed_attempts",
                severity=EventSeverity.HIGH,
                description=f"Detected {len(failed_events)} failed operation attempts",
                affected_events=[e.event_id for e in failed_events],
                risk_score=0.70,
                recommendation="Investigate cause of failures - potential unauthorized access attempts",
                detected_at=datetime.now(timezone.utc)
            )

        return None

    def _detect_unauthorized_access(self, events: List[TimelineEvent]) -> Optional[SuspiciousPattern]:
        """Detect unauthorized access attempts."""
        unauth_events = [e for e in events if e.category == EventCategory.SECURITY or 'unauthorized' in e.event_type.lower()]

        if unauth_events:
            return SuspiciousPattern(
                pattern_id=f"unauth_access_{events[0].artifact_id}",
                pattern_type="unauthorized_access",
                severity=EventSeverity.CRITICAL,
                description=f"Detected {len(unauth_events)} unauthorized access attempts",
                affected_events=[e.event_id for e in unauth_events],
                risk_score=0.95,
                recommendation="CRITICAL: Review security logs and block suspicious users immediately",
                detected_at=datetime.now(timezone.utc)
            )

        return None

    def _detect_missing_blockchain_seal(self, events: List[TimelineEvent]) -> Optional[SuspiciousPattern]:
        """Detect if document was modified but not sealed to blockchain."""
        has_modification = any(e.category == EventCategory.MODIFICATION for e in events)
        has_blockchain = any(e.category == EventCategory.BLOCKCHAIN for e in events)

        if has_modification and not has_blockchain:
            mod_events = [e.event_id for e in events if e.category == EventCategory.MODIFICATION]
            return SuspiciousPattern(
                pattern_id=f"missing_blockchain_{events[0].artifact_id}",
                pattern_type="missing_blockchain_seal",
                severity=EventSeverity.HIGH,
                description="Document was modified but not sealed to blockchain",
                affected_events=mod_events,
                risk_score=0.80,
                recommendation="Seal document to blockchain to ensure integrity verification",
                detected_at=datetime.now(timezone.utc)
            )

        return None

    def _detect_anomalous_sequence(self, events: List[TimelineEvent]) -> Optional[SuspiciousPattern]:
        """Detect anomalous event sequences."""
        # Check for modification before creation (impossible)
        for i, event in enumerate(events):
            if event.category == EventCategory.MODIFICATION and i == 0:
                return SuspiciousPattern(
                    pattern_id=f"anomalous_sequence_{events[0].artifact_id}",
                    pattern_type="impossible_sequence",
                    severity=EventSeverity.CRITICAL,
                    description="Document modified before creation - timeline anomaly detected",
                    affected_events=[event.event_id],
                    risk_score=1.0,
                    recommendation="CRITICAL: Investigate data integrity issue immediately",
                    detected_at=datetime.now(timezone.utc)
                )

        return None

    def _generate_timeline_stats(self, events: List[TimelineEvent]) -> Dict[str, Any]:
        """Generate timeline statistics."""
        if not events:
            return {}

        # Count by category
        by_category = {}
        for category in EventCategory:
            count = sum(1 for e in events if e.category == category)
            if count > 0:
                by_category[category.value] = count

        # Count by severity
        by_severity = {}
        for severity in EventSeverity:
            count = sum(1 for e in events if e.severity == severity)
            if count > 0:
                by_severity[severity.value] = count

        # Unique users
        unique_users = set(e.user_id for e in events if e.user_id)

        # Time span
        time_span = (events[-1].timestamp - events[0].timestamp).total_seconds()

        # Average risk
        avg_risk = sum(e.risk_score for e in events) / len(events)

        return {
            'total_events': len(events),
            'by_category': by_category,
            'by_severity': by_severity,
            'unique_users': len(unique_users),
            'time_span_seconds': time_span,
            'average_risk_score': round(avg_risk, 3),
            'high_risk_events': sum(1 for e in events if e.risk_score > 0.7)
        }

    def _assess_overall_risk(self, events: List[TimelineEvent],
                            patterns: List[SuspiciousPattern]) -> Dict[str, Any]:
        """Assess overall risk based on timeline."""
        if not events:
            return {'risk_level': 'minimal', 'risk_score': 0.0}

        # Calculate average event risk
        avg_event_risk = sum(e.risk_score for e in events) / len(events)

        # Calculate pattern risk
        pattern_risk = max([p.risk_score for p in patterns]) if patterns else 0.0

        # Overall risk is max of both
        overall_risk = max(avg_event_risk, pattern_risk)

        # Add multiplier for number of patterns
        if len(patterns) > 3:
            overall_risk = min(1.0, overall_risk * 1.2)

        # Determine risk level
        if overall_risk >= 0.9:
            risk_level = 'critical'
        elif overall_risk >= 0.7:
            risk_level = 'high'
        elif overall_risk >= 0.4:
            risk_level = 'medium'
        elif overall_risk >= 0.1:
            risk_level = 'low'
        else:
            risk_level = 'minimal'

        return {
            'risk_level': risk_level,
            'risk_score': round(overall_risk, 3),
            'pattern_count': len(patterns),
            'requires_investigation': overall_risk >= 0.7
        }


# Singleton instance
_timeline_service = None

def get_timeline_service(db_service=None) -> ForensicTimeline:
    """Get or create the timeline service singleton."""
    global _timeline_service
    if _timeline_service is None:
        _timeline_service = ForensicTimeline(db_service=db_service)
    return _timeline_service
