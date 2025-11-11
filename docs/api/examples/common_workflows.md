# 🔄 IntegrityX Common Workflows

**Complete end-to-end workflows for common use cases**

---

## 📋 Table of Contents

1. [Loan Application Workflow](#loan-application-workflow)
2. [Document Verification Workflow](#document-verification-workflow)
3. [Multi-Party Attestation Workflow](#multi-party-attestation-workflow)
4. [Compliance Audit Workflow](#compliance-audit-workflow)
5. [Batch Processing Workflow](#batch-processing-workflow)

---

## 1. Loan Application Workflow

### Use Case
A borrower submits a loan application, which goes through underwriting, compliance review, and final approval with full audit trail.

### Steps

#### Step 1: Submit Loan Application
```javascript
const client = new IntegrityXClient('http://localhost:8000', token);

const loanApp = await client.uploadDocument({
  loan_id: 'LOAN-2024-001',
  borrower_name: 'John Doe',
  amount: 350000,
  interest_rate: 4.5,
  term_months: 360,
  property_address: '123 Main St, New York, NY 10001',
  submission_date: '2024-10-28'
});

console.log(`📝 Application submitted: ${loanApp.etid}`);
```

#### Step 2: Underwriter Reviews and Attests
```javascript
const underwriterAttestation = await client.createAttestation(
  loanApp.etid,
  'underwriter',
  'approved',
  'Reviewed credit score (780), income verified, DTI ratio 32%',
  'jane.underwriter@bank.com'
);

console.log(`✅ Underwriter approved: ${underwriterAttestation.attestation_id}`);
```

#### Step 3: Compliance Officer Reviews
```javascript
const complianceAttestation = await client.createAttestation(
  loanApp.etid,
  'compliance_officer',
  'verified',
  'All regulatory requirements met. TRID compliance confirmed.',
  'bob.compliance@bank.com'
);

console.log(`✅ Compliance verified: ${complianceAttestation.attestation_id}`);
```

#### Step 4: Manager Final Approval
```javascript
const managerAttestation = await client.createAttestation(
  loanApp.etid,
  'manager',
  'approved',
  'Final approval granted. Proceed to closing.',
  'alice.manager@bank.com'
);

console.log(`✅ Manager approved: ${managerAttestation.attestation_id}`);
```

#### Step 5: Verify Complete Chain
```javascript
const provenance = await client.getProvenance(loanApp.etid);

console.log(`📜 Provenance chain:`);
provenance.chain.forEach((event, index) => {
  console.log(`   ${index + 1}. ${event.action} by ${event.user} at ${event.timestamp}`);
});

// Output:
// 1. created by john.applicant@email.com at 2024-10-28T10:00:00Z
// 2. sealed to blockchain at 2024-10-28T10:00:05Z
// 3. attested by jane.underwriter@bank.com at 2024-10-28T11:30:00Z
// 4. attested by bob.compliance@bank.com at 2024-10-28T12:15:00Z
// 5. attested by alice.manager@bank.com at 2024-10-28T13:00:00Z
```

---

## 2. Document Verification Workflow

### Use Case
A third party needs to verify the authenticity of a document without requiring API access.

### Steps

#### Step 1: Get ETID from Document
```javascript
// The ETID is embedded in the document or provided separately
const etid = 'ETID-20241028123456-ABC123';
```

#### Step 2: Verify Document (Public Endpoint)
```javascript
// No authentication required!
const verification = await fetch(`http://localhost:8000/public/verify/${etid}`);
const result = await verification.json();

if (result.verified && result.blockchain_verified) {
  console.log(`✅ Document is authentic`);
  console.log(`   Sealed at: ${result.sealed_at}`);
  console.log(`   Blockchain TX: ${result.walacor_txid}`);
  console.log(`   Hash: ${result.hash}`);
} else {
  console.log(`❌ Document verification failed`);
  console.log(`   Integrity check: ${result.integrity_check}`);
}
```

#### Step 3: Get Attestations
```javascript
const attestations = await client.getAttestations(etid);

console.log(`📋 Document has ${attestations.attestations.length} attestations:`);
attestations.attestations.forEach(att => {
  console.log(`   - ${att.role}: ${att.status} by ${att.attested_by}`);
});
```

---

## 3. Multi-Party Attestation Workflow

### Use Case
A disclosure package requires sign-off from multiple departments before release.

### Steps

#### Step 1: Upload Disclosure Package
```javascript
const disclosurePackage = await client.uploadDocument({
  package_id: 'DISCLOSURE-2024-Q4-001',
  document_type: 'disclosure_package',
  loan_id: 'LOAN-2024-001',
  disclosures: [
    'TILA',
    'GFE',
    'HUD-1',
    'Truth in Lending'
  ],
  prepared_date: '2024-10-28',
  prepared_by: 'disclosure.team@bank.com'
});

console.log(`📦 Disclosure package: ${disclosurePackage.etid}`);
```

#### Step 2: Parallel Attestations
```javascript
// Legal review
const legalReview = client.createAttestation(
  disclosurePackage.etid,
  'legal_reviewer',
  'approved',
  'All legal requirements satisfied',
  'legal@bank.com'
);

// Compliance review
const complianceReview = client.createAttestation(
  disclosurePackage.etid,
  'compliance_officer',
  'verified',
  'Regulatory compliance confirmed',
  'compliance@bank.com'
);

// Risk review
const riskReview = client.createAttestation(
  disclosurePackage.etid,
  'risk_officer',
  'approved',
  'Risk assessment complete',
  'risk@bank.com'
);

// Wait for all reviews
const [legal, compliance, risk] = await Promise.all([
  legalReview,
  complianceReview,
  riskReview
]);

console.log(`✅ All reviews complete`);
```

#### Step 3: Final Approval
```javascript
const allAttestations = await client.getAttestations(disclosurePackage.etid);

const allApproved = allAttestations.attestations.every(
  att => att.status === 'approved' || att.status === 'verified'
);

if (allApproved) {
  const finalApproval = await client.createAttestation(
    disclosurePackage.etid,
    'director',
    'released',
    'Package released for distribution',
    'director@bank.com'
  );
  
  console.log(`🎉 Package approved and released`);
} else {
  console.log(`⏸️ Package pending additional review`);
}
```

---

## 4. Compliance Audit Workflow

### Use Case
Internal or external auditors need to review document integrity and approval chains.

### Steps

#### Step 1: Get All Recent Documents
```javascript
const stats = await client.getStats();

console.log(`📊 Audit Period Statistics:`);
console.log(`   Total documents: ${stats.total_documents}`);
console.log(`   Sealed this month: ${stats.sealed_this_month}`);
console.log(`   Average health score: ${stats.average_health_score}`);
```

#### Step 2: Verify Random Sample
```javascript
const sampleETIDs = [
  'ETID-001',
  'ETID-002',
  'ETID-003',
  // ... more ETIDs
];

const verificationResults = await client.batchVerify(sampleETIDs);

const verifiedCount = verificationResults.results.filter(r => r.verified).length;
const totalCount = verificationResults.results.length;

console.log(`✅ Verified: ${verifiedCount}/${totalCount} (${Math.round(verifiedCount/totalCount*100)}%)`);
```

#### Step 3: Check Attestation Compliance
```javascript
async function checkAttestationCompliance(etid, requiredRoles) {
  const attestations = await client.getAttestations(etid);
  
  const attestedRoles = attestations.attestations.map(a => a.role);
  const missingRoles = requiredRoles.filter(role => !attestedRoles.includes(role));
  
  return {
    etid,
    compliant: missingRoles.length === 0,
    missingRoles
  };
}

// Check loan documents
const requiredRoles = ['underwriter', 'compliance_officer', 'manager'];

const complianceCheck = await checkAttestationCompliance('ETID-LOAN-001', requiredRoles);

if (complianceCheck.compliant) {
  console.log(`✅ Document ${complianceCheck.etid} is compliant`);
} else {
  console.log(`❌ Missing attestations: ${complianceCheck.missingRoles.join(', ')}`);
}
```

#### Step 4: Generate Audit Report
```javascript
async function generateAuditReport(etids) {
  const report = {
    audit_date: new Date().toISOString(),
    documents_reviewed: etids.length,
    verified: 0,
    blockchain_verified: 0,
    compliant: 0,
    issues: []
  };

  for (const etid of etids) {
    try {
      // Verify document
      const verification = await client.verifyDocument(etid);
      
      if (verification.verified) report.verified++;
      if (verification.blockchain_verified) report.blockchain_verified++;
      
      // Check attestations
      const attestations = await client.getAttestations(etid);
      if (attestations.attestations.length >= 3) report.compliant++;
      
      // Check for issues
      if (!verification.verified || attestations.attestations.length < 3) {
        report.issues.push({
          etid,
          reason: !verification.verified ? 'Verification failed' : 'Insufficient attestations'
        });
      }
    } catch (error) {
      report.issues.push({
        etid,
        reason: `Error: ${error.message}`
      });
    }
  }

  return report;
}

const auditReport = await generateAuditReport(sampleETIDs);

console.log(`\n📋 Audit Report:`);
console.log(`   Documents reviewed: ${auditReport.documents_reviewed}`);
console.log(`   Verified: ${auditReport.verified}`);
console.log(`   Blockchain verified: ${auditReport.blockchain_verified}`);
console.log(`   Compliant: ${auditReport.compliant}`);
console.log(`   Issues found: ${auditReport.issues.length}`);
```

---

## 5. Batch Processing Workflow

### Use Case
Process multiple loan applications at once during end-of-day batch processing.

### Steps

#### Step 1: Upload Batch of Documents
```javascript
const loanApplications = [
  { loan_id: 'LOAN-001', amount: 250000, borrower: 'John Doe' },
  { loan_id: 'LOAN-002', amount: 350000, borrower: 'Jane Smith' },
  { loan_id: 'LOAN-003', amount: 180000, borrower: 'Bob Johnson' },
  // ... more applications
];

async function uploadBatch(documents) {
  const results = [];
  
  for (const doc of documents) {
    try {
      const result = await client.uploadDocument(doc);
      results.push({
        loan_id: doc.loan_id,
        etid: result.etid,
        status: 'success'
      });
      console.log(`✅ ${doc.loan_id} → ${result.etid}`);
    } catch (error) {
      results.push({
        loan_id: doc.loan_id,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${doc.loan_id} → Error: ${error.message}`);
    }
  }
  
  return results;
}

const batchResults = await uploadBatch(loanApplications);

const successCount = batchResults.filter(r => r.status === 'success').length;
console.log(`\n📊 Batch complete: ${successCount}/${batchResults.length} successful`);
```

#### Step 2: Run AI Anomaly Detection on Batch
```javascript
async function detectBatchAnomalies(etids) {
  const anomalies = [];
  
  for (const etid of etids) {
    try {
      const result = await client.detectAnomalies(etid);
      
      if (result.anomalies_detected) {
        anomalies.push({
          etid,
          risk_score: result.risk_score,
          anomalies: result.anomalies
        });
      }
    } catch (error) {
      console.log(`Warning: Could not analyze ${etid}`);
    }
  }
  
  return anomalies;
}

const etids = batchResults
  .filter(r => r.status === 'success')
  .map(r => r.etid);

const anomalies = await detectBatchAnomalies(etids);

console.log(`\n🔍 Anomalies detected in ${anomalies.length} documents:`);
anomalies.forEach(a => {
  console.log(`   - ${a.etid}: Risk score ${a.risk_score}`);
});
```

#### Step 3: Generate Batch Summary
```javascript
const batchSummary = {
  total_processed: loanApplications.length,
  successful: successCount,
  failed: batchResults.length - successCount,
  anomalies_detected: anomalies.length,
  high_risk_count: anomalies.filter(a => a.risk_score > 75).length,
  processing_date: new Date().toISOString()
};

console.log(`\n📊 Batch Processing Summary:`);
console.log(JSON.stringify(batchSummary, null, 2));
```

---

## 🔗 Related Documentation

- **API Guide**: `docs/api/API_GUIDE.md`
- **Authentication**: `docs/api/AUTHENTICATION.md`
- **Python Client**: `docs/api/examples/python_client.py`
- **JavaScript Client**: `docs/api/examples/javascript_client.js`
- **Postman Collection**: `docs/api/IntegrityX.postman_collection.json`

---

**Last Updated**: October 28, 2024  
**Status**: Production Ready ✅
















