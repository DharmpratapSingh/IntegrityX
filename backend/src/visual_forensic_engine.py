"""
Visual Forensic Engine

Provides pixel-perfect diff visualization, change detection, and risk scoring
for document modifications. This is the core of the forensic analysis system.
"""

import json
import hashlib
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from enum import Enum
import re
import difflib
from collections import defaultdict

logger = logging.getLogger(__name__)


class ChangeType(Enum):
    """Types of document changes detected."""
    ADDITION = "addition"
    DELETION = "deletion"
    MODIFICATION = "modification"
    STRUCTURAL = "structural"
    FINANCIAL = "financial"
    IDENTITY = "identity"
    SIGNATURE = "signature"
    METADATA = "metadata"


class RiskLevel(Enum):
    """Risk levels for document changes."""
    CRITICAL = "critical"  # 0.9-1.0
    HIGH = "high"          # 0.7-0.9
    MEDIUM = "medium"      # 0.4-0.7
    LOW = "low"            # 0.1-0.4
    MINIMAL = "minimal"    # 0.0-0.1


@dataclass
class DocumentChange:
    """Represents a single change in a document."""
    field_path: str
    change_type: ChangeType
    old_value: Any
    new_value: Any
    risk_score: float
    risk_level: RiskLevel
    reason: str
    location: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None
    changed_by: Optional[str] = None

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'field_path': self.field_path,
            'change_type': self.change_type.value,
            'old_value': str(self.old_value) if self.old_value is not None else None,
            'new_value': str(self.new_value) if self.new_value is not None else None,
            'risk_score': self.risk_score,
            'risk_level': self.risk_level.value,
            'reason': self.reason,
            'location': self.location,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'changed_by': self.changed_by
        }


@dataclass
class DiffResult:
    """Result of document comparison."""
    document1_id: str
    document2_id: str
    overall_similarity: float
    total_changes: int
    changes: List[DocumentChange]
    risk_score: float
    risk_level: RiskLevel
    change_summary: Dict[str, int]
    suspicious_patterns: List[str]
    recommendation: str
    analyzed_at: datetime

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'document1_id': self.document1_id,
            'document2_id': self.document2_id,
            'overall_similarity': self.overall_similarity,
            'total_changes': self.total_changes,
            'changes': [change.to_dict() for change in self.changes],
            'risk_score': self.risk_score,
            'risk_level': self.risk_level.value,
            'change_summary': self.change_summary,
            'suspicious_patterns': self.suspicious_patterns,
            'recommendation': self.recommendation,
            'analyzed_at': self.analyzed_at.isoformat()
        }


class VisualForensicEngine:
    """
    Core forensic analysis engine for document comparison and tamper detection.
    """

    def __init__(self, db_service=None):
        """Initialize the forensic engine."""
        self.db_service = db_service

        # High-risk field patterns
        self.high_risk_patterns = {
            'financial': [
                r'amount', r'price', r'cost', r'fee', r'rate', r'interest',
                r'principal', r'payment', r'balance', r'total', r'sum'
            ],
            'identity': [
                r'ssn', r'social.?security', r'tax.?id', r'ein', r'name',
                r'address', r'email', r'phone', r'dob', r'birth'
            ],
            'signature': [
                r'signature', r'signed', r'signer', r'signatory', r'signed.?by',
                r'authorized', r'approved.?by'
            ],
            'dates': [
                r'date', r'timestamp', r'created', r'modified', r'signed.?on',
                r'effective', r'expiration'
            ]
        }

        # Risk scoring weights
        self.risk_weights = {
            ChangeType.FINANCIAL: 0.95,
            ChangeType.IDENTITY: 0.90,
            ChangeType.SIGNATURE: 0.85,
            ChangeType.STRUCTURAL: 0.40,
            ChangeType.METADATA: 0.30,
            ChangeType.MODIFICATION: 0.60,
            ChangeType.DELETION: 0.70,
            ChangeType.ADDITION: 0.50
        }

        logger.info("✅ Visual Forensic Engine initialized")

    def compare_documents(self, doc1: Dict[str, Any], doc2: Dict[str, Any],
                         doc1_id: str, doc2_id: str,
                         metadata1: Optional[Dict] = None,
                         metadata2: Optional[Dict] = None) -> DiffResult:
        """
        Compare two documents and generate forensic analysis.

        Args:
            doc1: First document (as dict/JSON)
            doc2: Second document (as dict/JSON)
            doc1_id: ID of first document
            doc2_id: ID of second document
            metadata1: Optional metadata for doc1
            metadata2: Optional metadata for doc2

        Returns:
            DiffResult with complete analysis
        """
        logger.info(f"🔍 Comparing documents {doc1_id} vs {doc2_id}")

        # Find all changes
        changes = self._deep_compare(doc1, doc2, path="")

        # Calculate similarity
        similarity = self._calculate_similarity(doc1, doc2, changes)

        # Calculate overall risk
        risk_score = self._calculate_overall_risk(changes)
        risk_level = self._get_risk_level(risk_score)

        # Generate change summary
        change_summary = self._generate_change_summary(changes)

        # Detect suspicious patterns
        suspicious_patterns = self._detect_suspicious_patterns(changes, metadata1, metadata2)

        # Generate recommendation
        recommendation = self._generate_recommendation(risk_score, changes, suspicious_patterns)

        result = DiffResult(
            document1_id=doc1_id,
            document2_id=doc2_id,
            overall_similarity=similarity,
            total_changes=len(changes),
            changes=changes,
            risk_score=risk_score,
            risk_level=risk_level,
            change_summary=change_summary,
            suspicious_patterns=suspicious_patterns,
            recommendation=recommendation,
            analyzed_at=datetime.now(timezone.utc)
        )

        logger.info(f"✅ Analysis complete: {len(changes)} changes, risk={risk_score:.2f}, similarity={similarity:.2f}")

        return result

    def _deep_compare(self, obj1: Any, obj2: Any, path: str = "") -> List[DocumentChange]:
        """
        Deep comparison of two objects.

        Args:
            obj1: First object
            obj2: Second object
            path: Current path in object hierarchy

        Returns:
            List of DocumentChange objects
        """
        changes = []

        # Handle None cases
        if obj1 is None and obj2 is None:
            return changes
        if obj1 is None:
            return [self._create_change(path, ChangeType.ADDITION, None, obj2)]
        if obj2 is None:
            return [self._create_change(path, ChangeType.DELETION, obj1, None)]

        # Type mismatch
        if type(obj1) != type(obj2):
            return [self._create_change(path, ChangeType.MODIFICATION, obj1, obj2)]

        # Dict comparison
        if isinstance(obj1, dict):
            all_keys = set(obj1.keys()) | set(obj2.keys())
            for key in all_keys:
                new_path = f"{path}.{key}" if path else key

                if key not in obj1:
                    changes.append(self._create_change(new_path, ChangeType.ADDITION, None, obj2[key]))
                elif key not in obj2:
                    changes.append(self._create_change(new_path, ChangeType.DELETION, obj1[key], None))
                else:
                    changes.extend(self._deep_compare(obj1[key], obj2[key], new_path))

        # List comparison
        elif isinstance(obj1, list):
            max_len = max(len(obj1), len(obj2))
            for i in range(max_len):
                new_path = f"{path}[{i}]"

                if i >= len(obj1):
                    changes.append(self._create_change(new_path, ChangeType.ADDITION, None, obj2[i]))
                elif i >= len(obj2):
                    changes.append(self._create_change(new_path, ChangeType.DELETION, obj1[i], None))
                else:
                    changes.extend(self._deep_compare(obj1[i], obj2[i], new_path))

        # Primitive comparison
        else:
            if obj1 != obj2:
                changes.append(self._create_change(path, ChangeType.MODIFICATION, obj1, obj2))

        return changes

    def _create_change(self, path: str, change_type: ChangeType,
                       old_value: Any, new_value: Any) -> DocumentChange:
        """Create a DocumentChange object with risk analysis."""

        # Classify the change
        classified_type = self._classify_change_type(path, old_value, new_value, change_type)

        # Calculate risk score
        risk_score = self._calculate_change_risk(path, classified_type, old_value, new_value)

        # Get risk level
        risk_level = self._get_risk_level(risk_score)

        # Generate reason
        reason = self._generate_change_reason(path, classified_type, old_value, new_value)

        return DocumentChange(
            field_path=path,
            change_type=classified_type,
            old_value=old_value,
            new_value=new_value,
            risk_score=risk_score,
            risk_level=risk_level,
            reason=reason,
            timestamp=datetime.now(timezone.utc)
        )

    def _classify_change_type(self, path: str, old_value: Any, new_value: Any,
                              base_type: ChangeType) -> ChangeType:
        """Classify the type of change based on field path and values."""

        path_lower = path.lower()

        # Check for financial fields
        for pattern in self.high_risk_patterns['financial']:
            if re.search(pattern, path_lower):
                return ChangeType.FINANCIAL

        # Check for identity fields
        for pattern in self.high_risk_patterns['identity']:
            if re.search(pattern, path_lower):
                return ChangeType.IDENTITY

        # Check for signature fields
        for pattern in self.high_risk_patterns['signature']:
            if re.search(pattern, path_lower):
                return ChangeType.SIGNATURE

        # Check for metadata fields
        if any(x in path_lower for x in ['metadata', 'created', 'updated', 'modified']):
            return ChangeType.METADATA

        return base_type

    def _calculate_change_risk(self, path: str, change_type: ChangeType,
                               old_value: Any, new_value: Any) -> float:
        """Calculate risk score for a change (0.0 - 1.0)."""

        base_risk = self.risk_weights.get(change_type, 0.5)

        # Increase risk for large numeric changes
        if isinstance(old_value, (int, float)) and isinstance(new_value, (int, float)):
            if old_value != 0:
                change_ratio = abs((new_value - old_value) / old_value)
                if change_ratio > 0.5:  # >50% change
                    base_risk = min(1.0, base_risk * 1.3)
                if change_ratio > 1.0:  # >100% change
                    base_risk = min(1.0, base_risk * 1.5)

        # Increase risk for complete value deletion
        if old_value is not None and new_value is None:
            base_risk = min(1.0, base_risk * 1.2)

        return round(base_risk, 3)

    def _get_risk_level(self, risk_score: float) -> RiskLevel:
        """Convert risk score to risk level."""
        if risk_score >= 0.9:
            return RiskLevel.CRITICAL
        elif risk_score >= 0.7:
            return RiskLevel.HIGH
        elif risk_score >= 0.4:
            return RiskLevel.MEDIUM
        elif risk_score >= 0.1:
            return RiskLevel.LOW
        else:
            return RiskLevel.MINIMAL

    def _generate_change_reason(self, path: str, change_type: ChangeType,
                                old_value: Any, new_value: Any) -> str:
        """Generate human-readable reason for the change."""

        reasons = {
            ChangeType.FINANCIAL: "Financial value modified - high fraud risk",
            ChangeType.IDENTITY: "Identity information changed - verification required",
            ChangeType.SIGNATURE: "Signature or authorization modified - critical review needed",
            ChangeType.STRUCTURAL: "Document structure changed",
            ChangeType.METADATA: "Metadata updated",
        }

        base_reason = reasons.get(change_type, "Document content modified")

        # Add specific details
        if isinstance(old_value, (int, float)) and isinstance(new_value, (int, float)):
            if old_value != 0:
                change_pct = ((new_value - old_value) / old_value) * 100
                base_reason += f" ({change_pct:+.1f}% change)"

        return base_reason

    def _calculate_similarity(self, doc1: Dict, doc2: Dict,
                             changes: List[DocumentChange]) -> float:
        """Calculate overall document similarity (0.0 - 1.0)."""

        # Convert to JSON strings for simple comparison
        str1 = json.dumps(doc1, sort_keys=True)
        str2 = json.dumps(doc2, sort_keys=True)

        # Use difflib for sequence matching
        matcher = difflib.SequenceMatcher(None, str1, str2)
        similarity = matcher.ratio()

        return round(similarity, 3)

    def _calculate_overall_risk(self, changes: List[DocumentChange]) -> float:
        """Calculate overall risk score for all changes."""

        if not changes:
            return 0.0

        # Weighted average of all change risks
        total_risk = sum(change.risk_score for change in changes)
        avg_risk = total_risk / len(changes)

        # Increase risk if there are many changes
        change_multiplier = min(1.2, 1.0 + (len(changes) / 100))

        # Increase risk if there are critical changes
        critical_changes = [c for c in changes if c.risk_level == RiskLevel.CRITICAL]
        if critical_changes:
            critical_multiplier = 1.0 + (len(critical_changes) * 0.1)
        else:
            critical_multiplier = 1.0

        overall_risk = min(1.0, avg_risk * change_multiplier * critical_multiplier)

        return round(overall_risk, 3)

    def _generate_change_summary(self, changes: List[DocumentChange]) -> Dict[str, int]:
        """Generate summary of changes by type and risk level."""

        summary = {
            'by_type': defaultdict(int),
            'by_risk_level': defaultdict(int),
            'high_risk_fields': []
        }

        for change in changes:
            summary['by_type'][change.change_type.value] += 1
            summary['by_risk_level'][change.risk_level.value] += 1

            if change.risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
                summary['high_risk_fields'].append(change.field_path)

        # Convert defaultdicts to regular dicts
        summary['by_type'] = dict(summary['by_type'])
        summary['by_risk_level'] = dict(summary['by_risk_level'])

        return summary

    def _detect_suspicious_patterns(self, changes: List[DocumentChange],
                                    metadata1: Optional[Dict],
                                    metadata2: Optional[Dict]) -> List[str]:
        """Detect suspicious patterns in the changes."""

        patterns = []

        # Pattern 1: Multiple financial changes
        financial_changes = [c for c in changes if c.change_type == ChangeType.FINANCIAL]
        if len(financial_changes) > 3:
            patterns.append(f"Multiple financial values modified ({len(financial_changes)} fields)")

        # Pattern 2: Identity changes
        identity_changes = [c for c in changes if c.change_type == ChangeType.IDENTITY]
        if identity_changes:
            patterns.append(f"Identity information modified ({len(identity_changes)} fields)")

        # Pattern 3: Signature tampering
        signature_changes = [c for c in changes if c.change_type == ChangeType.SIGNATURE]
        if signature_changes:
            patterns.append("Signature or authorization data modified - CRITICAL")

        # Pattern 4: Round number changes (common in fraud)
        for change in financial_changes:
            if isinstance(change.new_value, (int, float)):
                if change.new_value % 1000 == 0 or change.new_value % 10000 == 0:
                    patterns.append(f"Suspicious round number: {change.field_path} = {change.new_value}")

        # Pattern 5: Large magnitude changes
        large_changes = [c for c in changes if c.risk_score > 0.8]
        if len(large_changes) > 5:
            patterns.append(f"Numerous high-risk changes detected ({len(large_changes)} changes)")

        # Pattern 6: Deletion of critical fields
        deletions = [c for c in changes if c.change_type == ChangeType.DELETION and c.old_value is not None]
        critical_deletions = [d for d in deletions if d.risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]]
        if critical_deletions:
            patterns.append(f"Critical data deletion detected ({len(critical_deletions)} fields)")

        return patterns

    def _generate_recommendation(self, risk_score: float,
                                changes: List[DocumentChange],
                                patterns: List[str]) -> str:
        """Generate actionable recommendation based on analysis."""

        if risk_score >= 0.9:
            return "🚨 CRITICAL: Immediate investigation required. Block document and notify compliance team."
        elif risk_score >= 0.7:
            return "⚠️ HIGH RISK: Manual review required before approval. Flag for supervisor review."
        elif risk_score >= 0.4:
            return "⚡ MEDIUM RISK: Additional verification recommended. Review change history."
        elif risk_score >= 0.1:
            return "ℹ️ LOW RISK: Changes appear normal. Standard processing can continue."
        else:
            return "✅ MINIMAL RISK: Documents are nearly identical. No action required."

    def generate_diff_overlay(self, doc1: Dict, doc2: Dict) -> Dict[str, Any]:
        """
        Generate visual diff overlay data for frontend rendering.

        Returns structured data that frontend can use to highlight changes.
        """
        changes = self._deep_compare(doc1, doc2)

        overlay = {
            'additions': [],
            'deletions': [],
            'modifications': [],
            'highlights': {}
        }

        for change in changes:
            highlight_data = {
                'path': change.field_path,
                'old_value': change.old_value,
                'new_value': change.new_value,
                'risk_level': change.risk_level.value,
                'color': self._get_highlight_color(change.risk_level)
            }

            if change.change_type == ChangeType.ADDITION:
                overlay['additions'].append(highlight_data)
            elif change.change_type == ChangeType.DELETION:
                overlay['deletions'].append(highlight_data)
            else:
                overlay['modifications'].append(highlight_data)

            overlay['highlights'][change.field_path] = highlight_data

        return overlay

    def _get_highlight_color(self, risk_level: RiskLevel) -> str:
        """Get color code for risk level highlighting."""
        colors = {
            RiskLevel.CRITICAL: '#DC2626',  # Red
            RiskLevel.HIGH: '#EA580C',      # Orange
            RiskLevel.MEDIUM: '#F59E0B',    # Amber
            RiskLevel.LOW: '#10B981',       # Green
            RiskLevel.MINIMAL: '#6B7280'    # Gray
        }
        return colors.get(risk_level, '#6B7280')

    def extract_modification_metadata(self, diff_result: DiffResult) -> Dict[str, Any]:
        """
        Extract structured metadata about modifications.

        Returns detailed metadata for analysis and reporting.
        """
        metadata = {
            'summary': {
                'total_changes': diff_result.total_changes,
                'similarity': diff_result.overall_similarity,
                'risk_score': diff_result.risk_score,
                'risk_level': diff_result.risk_level.value
            },
            'changed_fields': [c.field_path for c in diff_result.changes],
            'high_risk_changes': [
                c.to_dict() for c in diff_result.changes
                if c.risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]
            ],
            'change_types': diff_result.change_summary['by_type'],
            'risk_distribution': diff_result.change_summary['by_risk_level'],
            'affected_sections': self._extract_affected_sections(diff_result.changes),
            'suspicious_patterns': diff_result.suspicious_patterns,
            'recommendation': diff_result.recommendation,
            'requires_review': diff_result.risk_score >= 0.4,
            'requires_approval': diff_result.risk_score >= 0.7,
            'block_document': diff_result.risk_score >= 0.9
        }

        return metadata

    def _extract_affected_sections(self, changes: List[DocumentChange]) -> List[str]:
        """Extract unique section names from change paths."""
        sections = set()

        for change in changes:
            # Extract top-level section from path
            if '.' in change.field_path:
                section = change.field_path.split('.')[0]
            else:
                section = change.field_path
            sections.add(section)

        return sorted(list(sections))


# Singleton instance
_forensic_engine = None

def get_forensic_engine(db_service=None) -> VisualForensicEngine:
    """Get or create the forensic engine singleton."""
    global _forensic_engine
    if _forensic_engine is None:
        _forensic_engine = VisualForensicEngine(db_service=db_service)
    return _forensic_engine
