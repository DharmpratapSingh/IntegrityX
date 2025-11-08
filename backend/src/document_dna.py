"""
Document DNA Fingerprinting

Multi-layered fingerprinting system for detecting partial tampering,
document derivatives, and similarity matching across document corpus.
"""

import json
import hashlib
import logging
from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from collections import Counter
import re

logger = logging.getLogger(__name__)


@dataclass
class DocumentFingerprint:
    """Multi-layered document fingerprint."""
    document_id: str
    structural_hash: str      # Layout, sections, hierarchy
    content_hash: str         # Text, numbers, data values
    style_hash: str           # Formatting, metadata
    semantic_hash: str        # Meaning, entities, keywords
    combined_hash: str        # Combined fingerprint
    field_count: int
    nested_depth: int
    keywords: List[str]
    entities: Dict[str, List[str]]
    structural_signature: str
    created_at: datetime

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'document_id': self.document_id,
            'structural_hash': self.structural_hash,
            'content_hash': self.content_hash,
            'style_hash': self.style_hash,
            'semantic_hash': self.semantic_hash,
            'combined_hash': self.combined_hash,
            'field_count': self.field_count,
            'nested_depth': self.nested_depth,
            'keywords': self.keywords,
            'entities': self.entities,
            'structural_signature': self.structural_signature,
            'created_at': self.created_at.isoformat()
        }


@dataclass
class SimilarityResult:
    """Result of similarity comparison."""
    document1_id: str
    document2_id: str
    overall_similarity: float
    structural_similarity: float
    content_similarity: float
    style_similarity: float
    semantic_similarity: float
    matching_patterns: List[str]
    diverging_patterns: List[str]
    is_derivative: bool
    is_duplicate: bool
    confidence: float

    def to_dict(self):
        """Convert to dictionary."""
        return asdict(self)


class DocumentDNA:
    """
    Document DNA fingerprinting and similarity detection system.

    Creates multi-layered fingerprints that can detect:
    - Partial tampering (some sections changed)
    - Document derivatives (copy-paste from other documents)
    - Near-duplicates (similar but not identical)
    - Template-based documents
    """

    def __init__(self, db_service=None):
        """Initialize DNA service."""
        self.db_service = db_service

        # Cache for fingerprints
        self.fingerprint_cache: Dict[str, DocumentFingerprint] = {}

        # Financial keywords for entity extraction
        self.financial_keywords = {
            'loan', 'mortgage', 'interest', 'principal', 'payment', 'borrower',
            'lender', 'amount', 'rate', 'term', 'collateral', 'credit', 'debt',
            'apr', 'refinance', 'equity', 'appraisal', 'closing', 'escrow'
        }

        # Identity keywords
        self.identity_keywords = {
            'name', 'ssn', 'address', 'email', 'phone', 'dob', 'birth',
            'citizenship', 'employer', 'income', 'occupation'
        }

        logger.info("✅ Document DNA service initialized")

    def fingerprint(self, document: Dict[str, Any], document_id: str) -> DocumentFingerprint:
        """
        Create multi-layered fingerprint of a document.

        Args:
            document: Document data as dictionary
            document_id: Unique document identifier

        Returns:
            DocumentFingerprint with all layers
        """
        logger.info(f"🧬 Creating DNA fingerprint for document {document_id}")

        # Check cache first
        if document_id in self.fingerprint_cache:
            logger.info(f"✅ Using cached fingerprint for {document_id}")
            return self.fingerprint_cache[document_id]

        # Layer 1: Structural hash (document structure)
        structural_hash = self._create_structural_hash(document)
        structural_sig = self._create_structural_signature(document)

        # Layer 2: Content hash (actual data values)
        content_hash = self._create_content_hash(document)

        # Layer 3: Style hash (formatting, metadata)
        style_hash = self._create_style_hash(document)

        # Layer 4: Semantic hash (meaning, entities)
        semantic_hash, keywords, entities = self._create_semantic_hash(document)

        # Combined hash
        combined = f"{structural_hash}:{content_hash}:{style_hash}:{semantic_hash}"
        combined_hash = hashlib.sha256(combined.encode()).hexdigest()[:16]

        # Document metrics
        field_count = self._count_fields(document)
        nested_depth = self._calculate_depth(document)

        fingerprint = DocumentFingerprint(
            document_id=document_id,
            structural_hash=structural_hash,
            content_hash=content_hash,
            style_hash=style_hash,
            semantic_hash=semantic_hash,
            combined_hash=combined_hash,
            field_count=field_count,
            nested_depth=nested_depth,
            keywords=keywords,
            entities=entities,
            structural_signature=structural_sig,
            created_at=datetime.now(timezone.utc)
        )

        # Cache it
        self.fingerprint_cache[document_id] = fingerprint

        logger.info(f"✅ DNA fingerprint created: {combined_hash}")
        return fingerprint

    def _create_structural_hash(self, obj: Any, path: str = "") -> str:
        """
        Create hash of document structure (keys, hierarchy, types).

        This hash changes only if the structure changes, not the values.
        """
        if isinstance(obj, dict):
            # Sort keys and hash the structure
            structure = []
            for key in sorted(obj.keys()):
                value = obj[key]
                type_name = type(value).__name__
                structure.append(f"{key}:{type_name}")

                # Recurse for nested objects
                if isinstance(value, (dict, list)):
                    nested = self._create_structural_hash(value, f"{path}.{key}")
                    structure.append(nested)

            struct_str = "|".join(structure)

        elif isinstance(obj, list):
            if not obj:
                struct_str = "[]"
            else:
                # Hash the structure of first element (assumes homogeneous list)
                first_type = type(obj[0]).__name__
                struct_str = f"[{first_type}]"
                if isinstance(obj[0], (dict, list)):
                    struct_str += self._create_structural_hash(obj[0], f"{path}[0]")

        else:
            struct_str = type(obj).__name__

        return hashlib.md5(struct_str.encode()).hexdigest()[:8]

    def _create_content_hash(self, obj: Any) -> str:
        """
        Create hash of actual content values.

        This hash changes when any value changes.
        """
        # Convert to sorted JSON for consistent hashing
        json_str = json.dumps(obj, sort_keys=True, default=str)
        return hashlib.sha256(json_str.encode()).hexdigest()[:16]

    def _create_style_hash(self, obj: Dict) -> str:
        """
        Create hash of style/metadata aspects.

        Includes field naming conventions, metadata fields, etc.
        """
        style_features = []

        # Extract metadata fields
        metadata_keys = ['created', 'updated', 'modified', 'version', 'author', 'source']
        for key in metadata_keys:
            if key in obj:
                style_features.append(f"{key}:present")

        # Naming convention analysis
        def extract_naming_style(obj, features_list):
            if isinstance(obj, dict):
                for key in obj.keys():
                    # Detect snake_case, camelCase, PascalCase
                    if '_' in key:
                        features_list.append('snake_case')
                    elif key[0].islower() and any(c.isupper() for c in key[1:]):
                        features_list.append('camelCase')
                    elif key[0].isupper():
                        features_list.append('PascalCase')

                    if isinstance(obj[key], dict):
                        extract_naming_style(obj[key], features_list)

        extract_naming_style(obj, style_features)

        # Count style features
        style_counter = Counter(style_features)
        style_str = "|".join(f"{k}:{v}" for k, v in sorted(style_counter.items()))

        return hashlib.md5(style_str.encode()).hexdigest()[:8]

    def _create_semantic_hash(self, obj: Dict) -> Tuple[str, List[str], Dict[str, List[str]]]:
        """
        Create hash of semantic content (keywords, entities, meaning).

        Returns: (hash, keywords list, entities dict)
        """
        # Extract all text values
        text_values = []

        def extract_text(o):
            if isinstance(o, dict):
                for v in o.values():
                    extract_text(v)
            elif isinstance(o, list):
                for item in o:
                    extract_text(item)
            elif isinstance(o, str):
                text_values.append(o.lower())

        extract_text(obj)

        # Combine all text
        combined_text = " ".join(text_values)

        # Extract keywords
        words = re.findall(r'\b[a-z]+\b', combined_text)
        keyword_counts = Counter(words)

        # Get top keywords (excluding common words)
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
        keywords = [
            word for word, count in keyword_counts.most_common(20)
            if word not in common_words and len(word) > 3
        ]

        # Extract entities
        entities = {
            'financial': [word for word in keywords if word in self.financial_keywords],
            'identity': [word for word in keywords if word in self.identity_keywords],
            'numbers': re.findall(r'\b\d+\.?\d*\b', combined_text)[:10]
        }

        # Create semantic hash from keywords
        keyword_str = "|".join(sorted(keywords))
        semantic_hash = hashlib.md5(keyword_str.encode()).hexdigest()[:8]

        return semantic_hash, keywords, entities

    def _create_structural_signature(self, obj: Dict) -> str:
        """
        Create human-readable structural signature.

        Example: "borrower_info{name,ssn,address}|loan_details{amount,rate,term}"
        """
        def build_signature(o, depth=0):
            if depth > 3:  # Limit depth
                return "..."

            if isinstance(o, dict):
                parts = []
                for key in sorted(o.keys()):
                    value = o[key]
                    if isinstance(value, dict):
                        nested = build_signature(value, depth + 1)
                        parts.append(f"{key}{{{nested}}}")
                    elif isinstance(value, list):
                        parts.append(f"{key}[]")
                    else:
                        parts.append(key)
                return "|".join(parts)
            else:
                return ""

        return build_signature(obj)

    def _count_fields(self, obj: Any) -> int:
        """Count total number of fields in document."""
        count = 0

        if isinstance(obj, dict):
            count = len(obj)
            for value in obj.values():
                if isinstance(value, (dict, list)):
                    count += self._count_fields(value)
        elif isinstance(obj, list):
            for item in obj:
                if isinstance(item, (dict, list)):
                    count += self._count_fields(item)

        return count

    def _calculate_depth(self, obj: Any, current_depth: int = 0) -> int:
        """Calculate maximum nesting depth."""
        if isinstance(obj, dict):
            if not obj:
                return current_depth
            return max(self._calculate_depth(v, current_depth + 1) for v in obj.values())
        elif isinstance(obj, list):
            if not obj:
                return current_depth
            return max(self._calculate_depth(item, current_depth + 1) for item in obj)
        else:
            return current_depth

    def similarity_score(self, fp1: DocumentFingerprint, fp2: DocumentFingerprint) -> SimilarityResult:
        """
        Calculate similarity between two document fingerprints.

        Returns similarity score 0.0-1.0 across all layers.
        """
        logger.info(f"📊 Calculating similarity: {fp1.document_id} vs {fp2.document_id}")

        # Structural similarity (exact match or no match)
        structural_sim = 1.0 if fp1.structural_hash == fp2.structural_hash else 0.0

        # Content similarity (Jaccard similarity of keywords)
        content_sim = self._jaccard_similarity(fp1.keywords, fp2.keywords)

        # Style similarity
        style_sim = 1.0 if fp1.style_hash == fp2.style_hash else 0.5

        # Semantic similarity (keyword overlap)
        semantic_sim = self._semantic_similarity(fp1, fp2)

        # Overall similarity (weighted average)
        overall_sim = (
            structural_sim * 0.3 +
            content_sim * 0.3 +
            style_sim * 0.1 +
            semantic_sim * 0.3
        )

        # Detect patterns
        matching_patterns = self._find_matching_patterns(fp1, fp2)
        diverging_patterns = self._find_diverging_patterns(fp1, fp2)

        # Derivative detection
        is_derivative = (
            structural_sim == 1.0 and  # Same structure
            content_sim < 0.8 and      # Different content
            semantic_sim > 0.5         # Similar meaning
        )

        # Duplicate detection
        is_duplicate = overall_sim > 0.95

        # Confidence score
        confidence = self._calculate_confidence(overall_sim, structural_sim, content_sim)

        result = SimilarityResult(
            document1_id=fp1.document_id,
            document2_id=fp2.document_id,
            overall_similarity=round(overall_sim, 3),
            structural_similarity=round(structural_sim, 3),
            content_similarity=round(content_sim, 3),
            style_similarity=round(style_sim, 3),
            semantic_similarity=round(semantic_sim, 3),
            matching_patterns=matching_patterns,
            diverging_patterns=diverging_patterns,
            is_derivative=is_derivative,
            is_duplicate=is_duplicate,
            confidence=round(confidence, 3)
        )

        logger.info(f"✅ Similarity: {overall_sim:.3f} (derivative={is_derivative}, duplicate={is_duplicate})")

        return result

    def _jaccard_similarity(self, set1: List[str], set2: List[str]) -> float:
        """Calculate Jaccard similarity coefficient."""
        s1 = set(set1)
        s2 = set(set2)

        if not s1 and not s2:
            return 1.0
        if not s1 or not s2:
            return 0.0

        intersection = len(s1 & s2)
        union = len(s1 | s2)

        return intersection / union if union > 0 else 0.0

    def _semantic_similarity(self, fp1: DocumentFingerprint, fp2: DocumentFingerprint) -> float:
        """Calculate semantic similarity based on entities and keywords."""

        # Keyword similarity
        keyword_sim = self._jaccard_similarity(fp1.keywords, fp2.keywords)

        # Entity similarity
        entity_scores = []
        for entity_type in ['financial', 'identity']:
            e1 = fp1.entities.get(entity_type, [])
            e2 = fp2.entities.get(entity_type, [])
            entity_scores.append(self._jaccard_similarity(e1, e2))

        avg_entity_sim = sum(entity_scores) / len(entity_scores) if entity_scores else 0.0

        # Combine
        return (keyword_sim * 0.6 + avg_entity_sim * 0.4)

    def _find_matching_patterns(self, fp1: DocumentFingerprint, fp2: DocumentFingerprint) -> List[str]:
        """Find patterns that match between documents."""
        patterns = []

        if fp1.structural_hash == fp2.structural_hash:
            patterns.append("Identical document structure")

        if fp1.style_hash == fp2.style_hash:
            patterns.append("Same formatting style")

        common_keywords = set(fp1.keywords) & set(fp2.keywords)
        if len(common_keywords) > 10:
            patterns.append(f"High keyword overlap ({len(common_keywords)} common terms)")

        if abs(fp1.field_count - fp2.field_count) <= 2:
            patterns.append("Similar field count")

        return patterns

    def _find_diverging_patterns(self, fp1: DocumentFingerprint, fp2: DocumentFingerprint) -> List[str]:
        """Find patterns that differ between documents."""
        patterns = []

        if fp1.content_hash != fp2.content_hash:
            patterns.append("Different content values")

        if abs(fp1.field_count - fp2.field_count) > 10:
            patterns.append(f"Significantly different field counts ({fp1.field_count} vs {fp2.field_count})")

        if fp1.nested_depth != fp2.nested_depth:
            patterns.append(f"Different nesting depths ({fp1.nested_depth} vs {fp2.nested_depth})")

        return patterns

    def _calculate_confidence(self, overall: float, structural: float, content: float) -> float:
        """Calculate confidence score for similarity assessment."""

        # High confidence if structure matches
        if structural == 1.0:
            confidence = 0.9
        # Medium confidence if partial match
        elif overall > 0.5:
            confidence = 0.7
        # Low confidence
        else:
            confidence = 0.5

        # Boost confidence if content is very similar or very different
        if content > 0.9 or content < 0.1:
            confidence += 0.1

        return min(1.0, confidence)

    def find_similar_documents(self, target_fingerprint: DocumentFingerprint,
                              candidate_fingerprints: List[DocumentFingerprint],
                              threshold: float = 0.7) -> List[SimilarityResult]:
        """
        Find similar documents in a corpus.

        Args:
            target_fingerprint: Fingerprint to match against
            candidate_fingerprints: List of candidate fingerprints
            threshold: Minimum similarity threshold (0.0-1.0)

        Returns:
            List of similar documents sorted by similarity
        """
        logger.info(f"🔍 Searching for documents similar to {target_fingerprint.document_id} (threshold={threshold})")

        similar_docs = []

        for candidate in candidate_fingerprints:
            # Skip self-comparison
            if candidate.document_id == target_fingerprint.document_id:
                continue

            # Calculate similarity
            similarity = self.similarity_score(target_fingerprint, candidate)

            # Add if above threshold
            if similarity.overall_similarity >= threshold:
                similar_docs.append(similarity)

        # Sort by similarity (highest first)
        similar_docs.sort(key=lambda x: x.overall_similarity, reverse=True)

        logger.info(f"✅ Found {len(similar_docs)} similar documents")

        return similar_docs

    def detect_partial_tampering(self, original_fp: DocumentFingerprint,
                                current_fp: DocumentFingerprint) -> Dict[str, Any]:
        """
        Detect partial tampering by comparing fingerprints.

        Returns analysis of what layers changed.
        """
        analysis = {
            'is_tampered': False,
            'tampering_type': None,
            'confidence': 0.0,
            'details': []
        }

        # Check each layer
        if original_fp.structural_hash != current_fp.structural_hash:
            analysis['is_tampered'] = True
            analysis['tampering_type'] = 'structural'
            analysis['details'].append("Document structure has been altered")
            analysis['confidence'] = 0.95

        elif original_fp.content_hash != current_fp.content_hash:
            analysis['is_tampered'] = True

            # Check if semantic hash matches
            if original_fp.semantic_hash == current_fp.semantic_hash:
                analysis['tampering_type'] = 'content_preserving_meaning'
                analysis['details'].append("Content values changed but meaning preserved")
                analysis['confidence'] = 0.6
            else:
                analysis['tampering_type'] = 'content_and_meaning'
                analysis['details'].append("Both content and meaning have changed")
                analysis['confidence'] = 0.9

        elif original_fp.style_hash != current_fp.style_hash:
            analysis['is_tampered'] = True
            analysis['tampering_type'] = 'metadata_only'
            analysis['details'].append("Only metadata/style fields changed")
            analysis['confidence'] = 0.4

        else:
            analysis['details'].append("No tampering detected - documents are identical")

        return analysis


# Singleton instance
_dna_service = None

def get_dna_service(db_service=None) -> DocumentDNA:
    """Get or create the DNA service singleton."""
    global _dna_service
    if _dna_service is None:
        _dna_service = DocumentDNA(db_service=db_service)
    return _dna_service
