/**
 * IntegrityX Glossary - Technical Term Definitions
 *
 * Comprehensive glossary of all technical terms used throughout the application.
 * Used by InfoTooltip component to provide consistent explanations.
 */

export interface GlossaryEntry {
  term: string;
  definition: string;
  example?: string;
  whenToUse?: string;
  category: 'blockchain' | 'security' | 'forensics' | 'verification' | 'general';
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ==================== BLOCKCHAIN TERMS ====================
  ETID: {
    term: 'ETID (Entity Type ID)',
    definition: 'A unique identifier for the type of data stored in Walacor blockchain. Each document category has its own ETID.',
    example: '100001 for loan documents, 100002 for provenance records, 100003 for attestations, 100004 for audit logs',
    whenToUse: 'Auto-selected based on your document type - you rarely need to change this',
    category: 'blockchain'
  },

  ARTIFACT_ID: {
    term: 'Artifact ID',
    definition: 'A unique identifier (UUID) for your document stored in both blockchain and database. This is your document\'s permanent reference number.',
    example: '56f34957-82d4-4e6b-9e3f-1a2b3c4d5e6f',
    whenToUse: 'Use this ID to verify, retrieve, or share your document. Copy it from the success screen after upload.',
    category: 'blockchain'
  },

  DOCUMENT_HASH: {
    term: 'Document Hash',
    definition: 'A cryptographic fingerprint (SHA-256) of your file. Even the tiniest change to the document creates a completely different hash.',
    example: 'a7f3d9e2b5c8f1a4d6e9b2c5f8a1d4e7b0c3f6a9d2e5b8c1f4a7d0e3b6c9f2a5',
    whenToUse: 'Automatically computed on upload. Only this hash goes to blockchain - never your actual document data.',
    category: 'security'
  },

  BLOCKCHAIN_SEAL: {
    term: 'Blockchain Seal',
    definition: 'Recording your document\'s hash on Walacor blockchain to create tamper-proof evidence that the document existed at this exact time.',
    example: 'Sealed at 2025-01-15 10:30:45 UTC with transaction ID TX_a8d92f1b',
    whenToUse: 'Happens automatically during upload. Takes ~300ms. Makes tampering mathematically impossible to hide.',
    category: 'blockchain'
  },

  WALACOR_TX_ID: {
    term: 'Walacor Transaction ID',
    definition: 'The unique blockchain transaction identifier that proves your document was sealed. This ID can be verified on the Walacor blockchain explorer.',
    example: 'TX_a8d92f1b4e7c3f9d2a5e8b1c4f7a0d3e',
    whenToUse: 'Use to track or verify the blockchain seal independently on Walacor dashboard at 13.220.225.175',
    category: 'blockchain'
  },

  WALACOR: {
    term: 'Walacor',
    definition: 'The enterprise blockchain platform securing all document hashes and integrity seals. Provides an immutable, tamper-proof ledger.',
    example: 'Connected to: 13.220.225.175 (AWS EC2 instance)',
    whenToUse: 'Runs automatically in the background. Fallback to local simulation if temporarily unavailable.',
    category: 'blockchain'
  },

  PROVENANCE: {
    term: 'Provenance',
    definition: 'The complete history and origin trail of a document - who created it, when, who accessed it, all modifications, and chain of custody.',
    example: 'Created by John Doe → Uploaded 2025-01-10 → Modified 2025-01-12 → Signed by Jane Smith → Sealed on blockchain',
    whenToUse: 'View forensic timeline to see full provenance for investigation or compliance purposes.',
    category: 'blockchain'
  },

  ATTESTATION: {
    term: 'Attestation',
    definition: 'A cryptographic statement vouching for the authenticity or properties of a document. Like a digital notary seal.',
    example: 'Bank attests: "This loan application has not been modified since January 10, 2025"',
    whenToUse: 'Generated automatically when documents are sealed. Stored on Walacor blockchain for permanent proof.',
    category: 'blockchain'
  },

  // ==================== SECURITY TERMS ====================
  QUANTUM_SAFE: {
    term: 'Quantum-Safe Cryptography',
    definition: 'Encryption algorithms that even future quantum computers cannot break. Uses post-quantum cryptographic algorithms approved by NIST.',
    example: 'Algorithms: SPHINCS+, CRYSTALS-Dilithium, SHA-512',
    whenToUse: 'For highly sensitive documents that must stay secure for 10+ years (mortgages, government records, legal contracts).',
    category: 'security'
  },

  PKI: {
    term: 'PKI Signature',
    definition: 'Public Key Infrastructure - uses digital certificates to cryptographically prove who signed the document and detect any tampering.',
    example: 'Like a notary seal, but digital and mathematically unforgeable',
    whenToUse: 'Maximum Security mode. Anyone can verify the signature without seeing your private key.',
    category: 'security'
  },

  ZKP: {
    term: 'ZKP (Zero-Knowledge Proof)',
    definition: 'Prove a document is authentic WITHOUT revealing its contents. Allows third-party verification while maintaining complete privacy.',
    example: 'Prove you paid taxes without revealing the exact amount, or verify loan approval without seeing borrower\'s salary',
    whenToUse: 'When sharing verification with auditors, regulators, or partners who should NOT see sensitive document data.',
    category: 'security'
  },

  TAMPER_DETECTED: {
    term: 'Tamper Detected',
    definition: 'The document\'s current hash does NOT match the original hash stored on blockchain. This means the document was modified after sealing.',
    example: 'Original hash: a7f3d9... → Current hash: b8e4c2... (MISMATCH)',
    whenToUse: 'Red flag! Use Forensic Comparison to see exactly what changed, when, and by whom.',
    category: 'security'
  },

  // ==================== FORENSIC TERMS ====================
  FORENSIC_COMPARISON: {
    term: 'Forensic Comparison',
    definition: 'CSI-grade analysis comparing two versions of a document to show exactly what changed, with risk levels (low/medium/high/critical).',
    example: 'Detected: Loan amount changed from $100,000 to $900,000 (CRITICAL risk)',
    whenToUse: 'When tamper is detected or you need to investigate differences between document versions.',
    category: 'forensics'
  },

  DOCUMENT_DNA: {
    term: 'Document DNA',
    definition: 'A 4-layer fingerprint analyzing structure, content, style, and semantic meaning. Like biological DNA, but for documents.',
    example: 'Layer 1: File structure → Layer 2: Text content → Layer 3: Writing style → Layer 4: Meaning/intent',
    whenToUse: 'Detects copy-paste fraud, template reuse, AI-generated content, and document cloning attacks.',
    category: 'forensics'
  },

  PATTERN_DETECTION: {
    term: 'Pattern Detection',
    definition: 'AI scans all documents to find suspicious patterns across your entire database using 6 specialized fraud detection algorithms.',
    example: 'Detected: Same loan officer altered 15 applications with round-number increases ($100K → $900K pattern)',
    whenToUse: 'Run regularly to find systemic fraud: duplicate signatures, identity reuse, coordinated attacks, bot submissions.',
    category: 'forensics'
  },

  FORENSIC_TIMELINE: {
    term: 'Forensic Timeline',
    definition: 'CSI-style chronological reconstruction of all document events with exact timestamps and actors. Creates auditable chain of custody.',
    example: 'Timeline: Created → Uploaded → Modified (unauthorized) → Signature added → Blockchain sealed',
    whenToUse: 'Investigate when/how document was tampered with, or create court-ready evidence trail.',
    category: 'forensics'
  },

  SIDE_BY_SIDE_VIEW: {
    term: 'Side-by-Side View',
    definition: 'Shows original and modified documents in two columns for easy comparison. Color-coded to highlight changes.',
    example: 'Left: Original loan $100,000 → Right: Modified $900,000 (RED highlight)',
    whenToUse: 'When you need to see both full versions simultaneously. Best for detailed comparison and compliance reports.',
    category: 'forensics'
  },

  OVERLAY_VIEW: {
    term: 'Overlay View',
    definition: 'Inline diff with strikethrough for deleted text and highlights for added text, showing changes in original context.',
    example: 'Loan amount: $100,000 $900,000 (strikethrough old, highlight new)',
    whenToUse: 'Quick reviews and presentations where you want to see changes inline with surrounding text.',
    category: 'forensics'
  },

  UNIFIED_VIEW: {
    term: 'Unified View',
    definition: 'List view with expandable details and risk badges, focusing attention on high-risk changes first.',
    example: 'Critical (2) → High (5) → Medium (12) → Low (3) changes',
    whenToUse: 'Executive summaries and audits where you need to quickly identify the most important changes.',
    category: 'forensics'
  },

  // ==================== VERIFICATION TERMS ====================
  HASH_VERIFICATION: {
    term: 'Hash Verification',
    definition: 'Verify a document by comparing its cryptographic fingerprint against the blockchain record. Fast and deterministic.',
    example: 'Computed hash → Compare to blockchain → Match = ✓ Authentic | Mismatch = ✗ Tampered',
    whenToUse: 'When you have the original hash or want to verify document integrity quickly (80-120ms).',
    category: 'verification'
  },

  BLOCKCHAIN_VERIFIED: {
    term: 'Blockchain Verified',
    definition: 'The document\'s hash matches the permanent record on Walacor blockchain. Proof that document has NOT been altered since sealing.',
    example: 'Status: SEALED ✓ | Hash Match: ✓ | Blockchain Verified: ✓ | Last Verified: 2 minutes ago',
    whenToUse: 'Green badge means document is authentic. Blockchain records are immutable and cannot be changed or deleted.',
    category: 'verification'
  },

  // ==================== RISK LEVEL TERMS ====================
  RISK_CRITICAL: {
    term: 'Risk Level: Critical',
    definition: 'Change affects loan amount, interest rate, borrower identity (SSN/name), or financial terms. Requires immediate investigation.',
    example: 'Loan amount: $100,000 → $900,000 | Borrower SSN: xxx-xx-1234 → xxx-xx-5678 | Rate: 3.5% → 8.2%',
    whenToUse: 'Flag for immediate fraud investigation. These changes often indicate intentional fraud.',
    category: 'forensics'
  },

  RISK_HIGH: {
    term: 'Risk Level: High',
    definition: 'Change affects important financial terms, payment schedules, collateral, or dates. Needs compliance review.',
    example: 'Payment schedule altered | Down payment: $50K → $10K | Collateral property address changed',
    whenToUse: 'Review with compliance team within 24 hours. May require borrower re-verification.',
    category: 'forensics'
  },

  RISK_MEDIUM: {
    term: 'Risk Level: Medium',
    definition: 'Change to non-critical fields that still warrant review - contact info, employment details, notes.',
    example: 'Phone number changed | Job title updated | Email modified | Additional notes added',
    whenToUse: 'Standard review process. Verify changes with borrower but not urgent.',
    category: 'forensics'
  },

  RISK_LOW: {
    term: 'Risk Level: Low',
    definition: 'Minor formatting, whitespace, or metadata changes that don\'t affect document meaning or validity.',
    example: 'Extra whitespace | Capitalization | Timestamp format | Field reordering',
    whenToUse: 'Informational only. Usually safe to ignore unless pattern of many low-risk changes appears.',
    category: 'forensics'
  },

  // ==================== ANALYTICS TERMS ====================
  DOCUMENTS_SEALED: {
    term: 'Documents Sealed',
    definition: 'Number of documents with their hashes successfully recorded on Walacor blockchain. Higher than just "uploaded".',
    example: 'Uploaded = 150 (in database only) | Sealed = 145 (also on blockchain)',
    whenToUse: 'Green status = sealed and tamper-proof. Yellow = pending blockchain confirmation.',
    category: 'general'
  },

  SEALING_SUCCESS_RATE: {
    term: 'Sealing Success Rate',
    definition: 'Percentage of uploads that successfully obtained blockchain seals. Should be >95% under normal conditions.',
    example: '148 sealed ÷ 150 uploaded = 98.7% success rate',
    whenToUse: 'Monitor health. Low rate (<90%) may indicate Walacor connection issues or circuit breaker activation.',
    category: 'general'
  },

  BLOCKCHAIN_ACTIVITY: {
    term: 'Blockchain Activity',
    definition: 'Real-time metrics about Walacor blockchain operations: confirmation rate, transaction speed, seal latency.',
    example: 'Seal time: 320ms | Confirmation: 98.5% | Avg latency: 280ms',
    whenToUse: 'Healthy range: 300-500ms seal time, 98%+ confirmation rate. Alerts trigger if degraded.',
    category: 'general'
  }
};

/**
 * Get glossary entry by key
 */
export function getGlossaryEntry(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key];
}

/**
 * Get all glossary entries for a specific category
 */
export function getGlossaryByCategory(category: GlossaryEntry['category']): GlossaryEntry[] {
  return Object.values(GLOSSARY).filter(entry => entry.category === category);
}

/**
 * Search glossary by term or definition
 */
export function searchGlossary(query: string): GlossaryEntry[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(GLOSSARY).filter(entry =>
    entry.term.toLowerCase().includes(lowerQuery) ||
    entry.definition.toLowerCase().includes(lowerQuery)
  );
}
