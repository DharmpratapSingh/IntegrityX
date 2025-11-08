"""
Pattern Detection Engine

Cross-document pattern detection for fraud detection, duplicate signatures,
amount manipulation, and coordinated tampering.
"""

import json
import hashlib
import logging
from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter
import re

logger = logging.getLogger(__name__)


@dataclass
class DetectedPattern:
    """Represents a detected suspicious pattern."""
    pattern_id: str
    pattern_type: str
    severity: str  # critical, high, medium, low
    description: str
    affected_documents: List[str]
    affected_users: List[str]
    evidence: Dict[str, Any]
    confidence: float
    risk_score: float
    recommendation: str
    detected_at: datetime

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'pattern_id': self.pattern_id,
            'pattern_type': self.pattern_type,
            'severity': self.severity,
            'description': self.description,
            'affected_documents': self.affected_documents,
            'affected_users': self.affected_users,
            'evidence': self.evidence,
            'confidence': self.confidence,
            'risk_score': self.risk_score,
            'recommendation': self.recommendation,
            'detected_at': self.detected_at.isoformat()
        }


class PatternDetector:
    """
    Cross-document pattern detection engine.

    Detects:
    - Duplicate signatures across documents
    - Amount manipulation patterns
    - Coordinated tampering
    - Template-based fraud
    - Identity reuse
    - Synthetic documents
    """

    def __init__(self, db_service=None):
        """Initialize pattern detector."""
        self.db_service = db_service

        # Cache for document data
        self.document_cache: Dict[str, Dict] = {}

        # Signature database
        self.signature_database: Dict[str, List[str]] = defaultdict(list)  # sig_hash -> [doc_ids]

        # User activity tracking
        self.user_activity: Dict[str, List[Dict]] = defaultdict(list)

        logger.info("✅ Pattern Detector initialized")
    
    def _parse_timestamp(self, timestamp: Any) -> datetime:
        """Parse timestamp from various formats to datetime object."""
        if isinstance(timestamp, datetime):
            return timestamp
        elif isinstance(timestamp, str):
            try:
                # Try ISO format first
                return datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except ValueError:
                try:
                    # Try parsing with datetime.strptime for common formats
                    return datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f')
                except ValueError:
                    try:
                        return datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S')
                    except ValueError:
                        logger.warning(f"Could not parse timestamp: {timestamp}")
                        return datetime.now(timezone.utc)
        else:
            logger.warning(f"Unknown timestamp type: {type(timestamp)}")
            return datetime.now(timezone.utc)

    def detect_all_patterns(self, documents: List[Dict[str, Any]]) -> List[DetectedPattern]:
        """
        Run all pattern detection algorithms on document corpus.

        Args:
            documents: List of documents with metadata

        Returns:
            List of detected patterns
        """
        logger.info(f"🔍 Running pattern detection on {len(documents)} documents")

        all_patterns = []

        # Pattern 1: Duplicate signatures
        dup_sig_patterns = self.detect_duplicate_signatures(documents)
        all_patterns.extend(dup_sig_patterns)

        # Pattern 2: Amount manipulation
        amount_patterns = self.detect_amount_manipulations(documents)
        all_patterns.extend(amount_patterns)

        # Pattern 3: Identity reuse
        identity_patterns = self.detect_identity_reuse(documents)
        all_patterns.extend(identity_patterns)

        # Pattern 4: Coordinated tampering
        tampering_patterns = self.detect_coordinated_tampering(documents)
        all_patterns.extend(tampering_patterns)

        # Pattern 5: Template-based fraud
        template_patterns = self.detect_template_fraud(documents)
        all_patterns.extend(template_patterns)

        # Pattern 6: Rapid submission patterns
        rapid_patterns = self.detect_rapid_submissions(documents)
        all_patterns.extend(rapid_patterns)

        logger.info(f"✅ Detected {len(all_patterns)} suspicious patterns")

        return all_patterns

    def detect_duplicate_signatures(self, documents: List[Dict[str, Any]]) -> List[DetectedPattern]:
        """
        Detect duplicate signatures across multiple documents.

        Common fraud indicator: same signature image used on multiple documents.
        """
        logger.info("🔍 Detecting duplicate signatures...")

        patterns = []
        signature_map: Dict[str, List[str]] = defaultdict(list)

        # Extract signatures from all documents
        for doc in documents:
            doc_id = doc.get('id', doc.get('artifact_id', 'unknown'))
            signatures = self._extract_signatures(doc)

            for sig_data in signatures:
                # Hash the signature
                sig_hash = self._hash_signature(sig_data)
                signature_map[sig_hash].append(doc_id)

        # Find duplicates
        for sig_hash, doc_ids in signature_map.items():
            if len(doc_ids) > 1:
                # This is a duplicate signature
                pattern = DetectedPattern(
                    pattern_id=f"dup_sig_{sig_hash[:8]}",
                    pattern_type="duplicate_signature",
                    severity="critical",
                    description=f"Identical signature found on {len(doc_ids)} different documents",
                    affected_documents=doc_ids,
                    affected_users=self._extract_users_from_docs(documents, doc_ids),
                    evidence={
                        'signature_hash': sig_hash,
                        'occurrence_count': len(doc_ids),
                        'document_ids': doc_ids
                    },
                    confidence=0.95,
                    risk_score=0.95,
                    recommendation="CRITICAL: Investigate potential signature forgery or copy-paste fraud",
                    detected_at=datetime.now(timezone.utc)
                )
                patterns.append(pattern)

        logger.info(f"✅ Found {len(patterns)} duplicate signature patterns")
        return patterns

    def detect_amount_manipulations(self, documents: List[Dict[str, Any]]) -> List[DetectedPattern]:
        """
        Detect suspicious patterns in amount modifications.

        Patterns:
        - Same user modifying amounts across multiple documents
        - Amounts always changed to round numbers
        - Consistent percentage increases
        """
        logger.info("🔍 Detecting amount manipulation patterns...")

        patterns = []

        # Track amount changes by user
        user_modifications: Dict[str, List[Dict]] = defaultdict(list)

        for doc in documents:
            doc_id = doc.get('id', doc.get('artifact_id', 'unknown'))
            modifications = self._extract_amount_modifications(doc)

            for mod in modifications:
                user_id = mod.get('modified_by', 'unknown')
                user_modifications[user_id].append({
                    'document_id': doc_id,
                    'field': mod.get('field'),
                    'old_amount': mod.get('old_value'),
                    'new_amount': mod.get('new_value'),
                    'change_pct': mod.get('change_pct', 0)
                })

        # Analyze each user's modifications
        for user_id, mods in user_modifications.items():
            if len(mods) < 3:  # Need at least 3 to establish pattern
                continue

            # Check for suspicious patterns
            suspicious = False
            evidence = {}

            # Pattern 1: Always round numbers
            round_numbers = sum(1 for m in mods if self._is_round_number(m['new_amount']))
            if round_numbers / len(mods) > 0.7:  # >70% round numbers
                suspicious = True
                evidence['round_number_ratio'] = round_numbers / len(mods)

            # Pattern 2: Consistent percentage changes
            if self._has_consistent_percentage(mods):
                suspicious = True
                evidence['consistent_percentage'] = True

            # Pattern 3: Always increases (never decreases)
            increases = sum(1 for m in mods if m['new_amount'] > m['old_amount'])
            if increases == len(mods) and len(mods) > 5:
                suspicious = True
                evidence['always_increases'] = True

            if suspicious:
                pattern = DetectedPattern(
                    pattern_id=f"amount_manip_{user_id}",
                    pattern_type="amount_manipulation",
                    severity="high",
                    description=f"User {user_id} shows suspicious amount modification patterns across {len(mods)} documents",
                    affected_documents=[m['document_id'] for m in mods],
                    affected_users=[user_id],
                    evidence=evidence,
                    confidence=0.85,
                    risk_score=0.85,
                    recommendation="Review all amount modifications by this user for authorization",
                    detected_at=datetime.now(timezone.utc)
                )
                patterns.append(pattern)

        logger.info(f"✅ Found {len(patterns)} amount manipulation patterns")
        return patterns

    def detect_identity_reuse(self, documents: List[Dict[str, Any]]) -> List[DetectedPattern]:
        """
        Detect identity information reused across multiple documents.

        Fraud indicators:
        - Same SSN on multiple applications
        - Same address with different names
        - Same phone/email with different identities
        """
        logger.info("🔍 Detecting identity reuse patterns...")

        patterns = []

        # Track identity fields
        ssn_map: Dict[str, List[str]] = defaultdict(list)
        address_map: Dict[str, List[Dict]] = defaultdict(list)
        email_map: Dict[str, List[Dict]] = defaultdict(list)
        phone_map: Dict[str, List[Dict]] = defaultdict(list)

        for doc in documents:
            doc_id = doc.get('id', doc.get('artifact_id', 'unknown'))
            identity = self._extract_identity_info(doc)

            if identity.get('ssn'):
                ssn_map[identity['ssn']].append(doc_id)

            if identity.get('address'):
                address_map[identity['address']].append({
                    'doc_id': doc_id,
                    'name': identity.get('name', 'unknown')
                })

            if identity.get('email'):
                email_map[identity['email']].append({
                    'doc_id': doc_id,
                    'name': identity.get('name', 'unknown')
                })

            if identity.get('phone'):
                phone_map[identity['phone']].append({
                    'doc_id': doc_id,
                    'name': identity.get('name', 'unknown')
                })

        # Check for SSN reuse
        for ssn, doc_ids in ssn_map.items():
            if len(doc_ids) > 1:
                pattern = DetectedPattern(
                    pattern_id=f"ssn_reuse_{hashlib.md5(ssn.encode()).hexdigest()[:8]}",
                    pattern_type="identity_reuse_ssn",
                    severity="critical",
                    description=f"Same SSN found on {len(doc_ids)} different applications",
                    affected_documents=doc_ids,
                    affected_users=[],
                    evidence={
                        'ssn': f"***-**-{ssn[-4:]}" if len(ssn) >= 4 else "****",
                        'occurrence_count': len(doc_ids)
                    },
                    confidence=0.98,
                    risk_score=0.98,
                    recommendation="CRITICAL: Verify identity - potential identity theft or fraud",
                    detected_at=datetime.now(timezone.utc)
                )
                patterns.append(pattern)

        # Check for address reuse with different names
        for address, entries in address_map.items():
            if len(entries) > 1:
                unique_names = set(e['name'] for e in entries)
                if len(unique_names) > 1:  # Different names at same address
                    pattern = DetectedPattern(
                        pattern_id=f"address_reuse_{hashlib.md5(address.encode()).hexdigest()[:8]}",
                        pattern_type="identity_reuse_address",
                        severity="medium",
                        description=f"Same address used by {len(unique_names)} different applicants",
                        affected_documents=[e['doc_id'] for e in entries],
                        affected_users=[],
                        evidence={
                            'address': address,
                            'different_names': list(unique_names),
                            'occurrence_count': len(entries)
                        },
                        confidence=0.70,
                        risk_score=0.65,
                        recommendation="Verify if applicants are related or if address is fraudulent",
                        detected_at=datetime.now(timezone.utc)
                    )
                    patterns.append(pattern)

        logger.info(f"✅ Found {len(patterns)} identity reuse patterns")
        return patterns

    def detect_coordinated_tampering(self, documents: List[Dict[str, Any]]) -> List[DetectedPattern]:
        """
        Detect coordinated tampering across multiple documents.

        Indicators:
        - Multiple documents modified by same user at same time
        - Similar modification patterns across documents
        - Sequential document modifications
        """
        logger.info("🔍 Detecting coordinated tampering patterns...")

        patterns = []

        # Track modifications by user and time
        user_time_mods: Dict[str, List[Dict]] = defaultdict(list)

        for doc in documents:
            doc_id = doc.get('id', doc.get('artifact_id', 'unknown'))
            events = doc.get('events', [])

            for event in events:
                if 'modif' in event.get('event_type', '').lower():
                    user_id = event.get('created_by', 'unknown')
                    timestamp = event.get('created_at')
                    timestamp = self._parse_timestamp(timestamp)

                    user_time_mods[user_id].append({
                        'doc_id': doc_id,
                        'timestamp': timestamp,
                        'event': event
                    })

        # Analyze for coordinated activity
        for user_id, mods in user_time_mods.items():
            if len(mods) < 3:
                continue

            # Sort by timestamp
            mods.sort(key=lambda x: x['timestamp'])

            # Find clusters of modifications within short time window
            clusters = []
            current_cluster = [mods[0]]

            for i in range(1, len(mods)):
                time_diff = (mods[i]['timestamp'] - current_cluster[-1]['timestamp']).total_seconds()

                if time_diff < 600:  # Within 10 minutes
                    current_cluster.append(mods[i])
                else:
                    if len(current_cluster) >= 3:
                        clusters.append(current_cluster)
                    current_cluster = [mods[i]]

            if len(current_cluster) >= 3:
                clusters.append(current_cluster)

            # Create patterns for significant clusters
            for cluster in clusters:
                if len(cluster) >= 3:
                    pattern = DetectedPattern(
                        pattern_id=f"coord_tamper_{user_id}_{cluster[0]['timestamp'].strftime('%Y%m%d%H%M')}",
                        pattern_type="coordinated_tampering",
                        severity="high",
                        description=f"User {user_id} modified {len(cluster)} documents within {int((cluster[-1]['timestamp'] - cluster[0]['timestamp']).total_seconds() / 60)} minutes",
                        affected_documents=[m['doc_id'] for m in cluster],
                        affected_users=[user_id],
                        evidence={
                            'modification_count': len(cluster),
                            'time_span_minutes': int((cluster[-1]['timestamp'] - cluster[0]['timestamp']).total_seconds() / 60),
                            'first_modification': cluster[0]['timestamp'].isoformat(),
                            'last_modification': cluster[-1]['timestamp'].isoformat()
                        },
                        confidence=0.80,
                        risk_score=0.78,
                        recommendation="Investigate bulk modification activity for authorization and intent",
                        detected_at=datetime.now(timezone.utc)
                    )
                    patterns.append(pattern)

        logger.info(f"✅ Found {len(patterns)} coordinated tampering patterns")
        return patterns

    def detect_template_fraud(self, documents: List[Dict[str, Any]]) -> List[DetectedPattern]:
        """
        Detect template-based fraud (documents created from same template with minimal changes).
        """
        logger.info("🔍 Detecting template-based fraud...")

        patterns = []

        # Group documents by structural similarity
        # (Would use DocumentDNA fingerprints in real implementation)

        # Simple implementation: group by field structure
        structure_groups: Dict[str, List[str]] = defaultdict(list)

        for doc in documents:
            doc_id = doc.get('id', doc.get('artifact_id', 'unknown'))
            structure = self._get_document_structure(doc)
            structure_hash = hashlib.md5(structure.encode()).hexdigest()
            structure_groups[structure_hash].append(doc_id)

        # Check for suspicious template usage
        for struct_hash, doc_ids in structure_groups.items():
            if len(doc_ids) >= 5:  # 5+ documents with identical structure
                pattern = DetectedPattern(
                    pattern_id=f"template_fraud_{struct_hash[:8]}",
                    pattern_type="template_fraud",
                    severity="medium",
                    description=f"Found {len(doc_ids)} documents with identical structure - possible template-based fraud",
                    affected_documents=doc_ids,
                    affected_users=[],
                    evidence={
                        'structure_hash': struct_hash,
                        'document_count': len(doc_ids),
                        'structure_signature': struct_hash[:16]
                    },
                    confidence=0.65,
                    risk_score=0.60,
                    recommendation="Review if template usage is legitimate or indicates batch fraud",
                    detected_at=datetime.now(timezone.utc)
                )
                patterns.append(pattern)

        logger.info(f"✅ Found {len(patterns)} template fraud patterns")
        return patterns

    def detect_rapid_submissions(self, documents: List[Dict[str, Any]]) -> List[DetectedPattern]:
        """
        Detect rapid document submissions (potential bot/automation).
        """
        logger.info("🔍 Detecting rapid submission patterns...")

        patterns = []

        # Track submissions by user
        user_submissions: Dict[str, List[Dict]] = defaultdict(list)

        for doc in documents:
            doc_id = doc.get('id', doc.get('artifact_id', 'unknown'))
            created_by = doc.get('created_by', doc.get('uploaded_by', 'unknown'))
            created_at = doc.get('created_at', datetime.now(timezone.utc))
            created_at = self._parse_timestamp(created_at)

            user_submissions[created_by].append({
                'doc_id': doc_id,
                'timestamp': created_at
            })

        # Analyze submission rates
        for user_id, submissions in user_submissions.items():
            if len(submissions) < 5:
                continue

            # Sort by timestamp
            submissions.sort(key=lambda x: x['timestamp'])

            # Calculate average time between submissions
            time_diffs = []
            for i in range(len(submissions) - 1):
                diff = (submissions[i + 1]['timestamp'] - submissions[i]['timestamp']).total_seconds()
                time_diffs.append(diff)

            avg_diff = sum(time_diffs) / len(time_diffs)

            # Rapid if average < 60 seconds
            if avg_diff < 60:
                pattern = DetectedPattern(
                    pattern_id=f"rapid_submit_{user_id}",
                    pattern_type="rapid_submissions",
                    severity="high",
                    description=f"User {user_id} submitted {len(submissions)} documents with average interval of {avg_diff:.1f} seconds",
                    affected_documents=[s['doc_id'] for s in submissions],
                    affected_users=[user_id],
                    evidence={
                        'submission_count': len(submissions),
                        'average_interval_seconds': round(avg_diff, 2),
                        'min_interval_seconds': round(min(time_diffs), 2),
                        'timespan': (submissions[-1]['timestamp'] - submissions[0]['timestamp']).total_seconds()
                    },
                    confidence=0.90,
                    risk_score=0.85,
                    recommendation="Investigate if automated submission is authorized or indicates bot activity",
                    detected_at=datetime.now(timezone.utc)
                )
                patterns.append(pattern)

        logger.info(f"✅ Found {len(patterns)} rapid submission patterns")
        return patterns

    # Helper methods

    def _extract_signatures(self, doc: Dict) -> List[Dict]:
        """Extract signature data from document."""
        signatures = []

        # Search for signature fields
        def find_signatures(obj, path=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    key_lower = key.lower()
                    if 'signature' in key_lower or 'signed' in key_lower:
                        signatures.append({'path': f"{path}.{key}", 'data': value})
                    elif isinstance(value, (dict, list)):
                        find_signatures(value, f"{path}.{key}")
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    if isinstance(item, (dict, list)):
                        find_signatures(item, f"{path}[{i}]")

        find_signatures(doc)
        return signatures

    def _hash_signature(self, sig_data: Dict) -> str:
        """Create hash of signature data."""
        sig_str = json.dumps(sig_data, sort_keys=True)
        return hashlib.sha256(sig_str.encode()).hexdigest()

    def _extract_users_from_docs(self, documents: List[Dict], doc_ids: List[str]) -> List[str]:
        """Extract user IDs from specific documents."""
        users = set()
        for doc in documents:
            doc_id = doc.get('id', doc.get('artifact_id'))
            if doc_id in doc_ids:
                user = doc.get('created_by', doc.get('uploaded_by'))
                if user:
                    users.add(user)
        return list(users)

    def _extract_amount_modifications(self, doc: Dict) -> List[Dict]:
        """Extract amount modification events from document."""
        modifications = []

        events = doc.get('events', [])
        for event in events:
            if 'modif' in event.get('event_type', '').lower():
                try:
                    payload = json.loads(event.get('payload_json', '{}'))
                    if 'amount' in str(payload).lower():
                        modifications.append({
                            'field': 'amount',
                            'old_value': payload.get('old_value', 0),
                            'new_value': payload.get('new_value', 0),
                            'change_pct': self._calculate_change_pct(
                                payload.get('old_value', 0),
                                payload.get('new_value', 0)
                            ),
                            'modified_by': event.get('created_by')
                        })
                except:
                    pass

        return modifications

    def _is_round_number(self, amount: float) -> bool:
        """Check if amount is a round number."""
        return amount % 1000 == 0 or amount % 10000 == 0 or amount % 100000 == 0

    def _has_consistent_percentage(self, mods: List[Dict]) -> bool:
        """Check if modifications show consistent percentage changes."""
        percentages = [m['change_pct'] for m in mods if m['change_pct'] != 0]
        if len(percentages) < 3:
            return False

        avg_pct = sum(percentages) / len(percentages)
        variance = sum((p - avg_pct) ** 2 for p in percentages) / len(percentages)

        return variance < 100  # Low variance indicates consistency

    def _calculate_change_pct(self, old_value: float, new_value: float) -> float:
        """Calculate percentage change."""
        if old_value == 0:
            return 0
        return ((new_value - old_value) / old_value) * 100

    def _extract_identity_info(self, doc: Dict) -> Dict[str, str]:
        """Extract identity information from document."""
        identity = {}

        # Search for identity fields
        doc_str = json.dumps(doc).lower()

        # Extract SSN (simplified)
        ssn_match = re.search(r'\b\d{3}-\d{2}-\d{4}\b', json.dumps(doc))
        if ssn_match:
            identity['ssn'] = ssn_match.group()

        # Extract other fields from document structure
        def find_identity_fields(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    key_lower = key.lower()
                    if 'name' in key_lower and isinstance(value, str):
                        identity['name'] = value
                    elif 'address' in key_lower and isinstance(value, str):
                        identity['address'] = value
                    elif 'email' in key_lower and isinstance(value, str):
                        identity['email'] = value
                    elif 'phone' in key_lower and isinstance(value, str):
                        identity['phone'] = value
                    elif isinstance(value, dict):
                        find_identity_fields(value)

        find_identity_fields(doc)
        return identity

    def _get_document_structure(self, doc: Dict) -> str:
        """Get document structure signature."""
        def get_structure(obj):
            if isinstance(obj, dict):
                return "{" + ",".join(sorted(k for k in obj.keys())) + "}"
            elif isinstance(obj, list):
                return "[list]"
            else:
                return type(obj).__name__

        return get_structure(doc)


# Singleton instance
_pattern_detector = None

def get_pattern_detector(db_service=None) -> PatternDetector:
    """Get or create the pattern detector singleton."""
    global _pattern_detector
    if _pattern_detector is None:
        _pattern_detector = PatternDetector(db_service=db_service)
    return _pattern_detector
