# Document Delete Functionality

## Overview

The IntegrityX system now includes comprehensive document deletion functionality that preserves metadata for verification purposes. This feature ensures that even after a document is deleted, users can still verify its authenticity and trace its history for compliance and audit purposes.

## Key Features

### 1. Metadata Preservation
- **Complete History Tracking**: When a document is deleted, all essential metadata is preserved in a dedicated `deleted_documents` table
- **Verification Capability**: Deleted documents can still be verified using their SHA-256 hash
- **Audit Trail**: Complete audit trail is maintained showing when documents were uploaded and when they were deleted
- **User Attribution**: Tracks who uploaded and who deleted each document

### 2. Detailed Information Preservation
The system preserves the following information for deleted documents:
- Original artifact ID and loan ID
- Document type and payload hash
- Blockchain transaction ID and seal information
- Original creation timestamp and creator
- Deletion timestamp and deleter
- Deletion reason (optional)
- All original metadata and borrower information
- File information (names, sizes, content types)

### 3. Verification Capabilities
- **Hash-based Verification**: Users can verify deleted documents using their SHA-256 hash
- **Detailed Status Messages**: Clear messages explaining the document's status and history
- **Compliance Support**: Full audit trail for regulatory compliance

## Database Schema

### New Table: `deleted_documents`

```sql
CREATE TABLE deleted_documents (
    id VARCHAR(36) PRIMARY KEY,
    original_artifact_id VARCHAR(36) UNIQUE NOT NULL,
    loan_id VARCHAR(255) NOT NULL,
    artifact_type VARCHAR(50) NOT NULL,
    etid INTEGER NOT NULL,
    payload_sha256 VARCHAR(64) NOT NULL,
    manifest_sha256 VARCHAR(64),
    walacor_tx_id VARCHAR(255) NOT NULL,
    schema_version VARCHAR(20) DEFAULT '1.0',
    original_created_at TIMESTAMP NOT NULL,
    original_created_by VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(255) NOT NULL,
    deletion_reason TEXT,
    blockchain_seal VARCHAR(255),
    preserved_metadata JSON,
    borrower_info JSON,
    files_info JSON
);
```

### Indexes
- `idx_deleted_loan_id` on `loan_id`
- `idx_deleted_payload_hash` on `payload_sha256`
- `idx_deleted_walacor_tx` on `walacor_tx_id`
- `idx_deleted_original_created` on `original_created_at`
- `idx_deleted_deleted_at` on `deleted_at`
- `idx_deleted_deleted_by` on `deleted_by`

## API Endpoints

### 1. Delete Document
**DELETE** `/api/artifacts/{artifact_id}`
- Deletes an artifact while preserving metadata
- Requires `deleted_by` query parameter
- Optional `deletion_reason` query parameter

**POST** `/api/artifacts/delete`
- Alternative endpoint using request body
- Accepts `DeleteDocumentRequest` with artifact ID and deletion reason

### 2. Retrieve Deleted Document Information
**GET** `/api/deleted-documents/{original_artifact_id}`
- Retrieves information about a specific deleted document

**GET** `/api/deleted-documents/loan/{loan_id}`
- Retrieves all deleted documents for a specific loan

### 3. Verify Deleted Documents
**POST** `/api/verify-deleted-document`
- Verifies deleted documents by hash
- Returns detailed information about the document's status and history

**POST** `/api/verify-by-hash` (Enhanced)
- Enhanced existing endpoint to also check for deleted documents
- Returns "deleted" status when document is found in deleted documents

## Request/Response Models

### DeleteDocumentRequest
```typescript
{
  artifact_id: string;
  deletion_reason?: string;
}
```

### DeleteDocumentResponse
```typescript
{
  deleted_artifact_id: string;
  deleted_document_id: string;
  deletion_event_id: string;
  verification_info: {
    document_id: string;
    payload_sha256: string;
    walacor_tx_id: string;
    original_created_at: string;
    original_created_by: string;
    deleted_at: string;
    deleted_by: string;
    deletion_reason?: string;
    status: "deleted";
    verification_message: string;
  };
  preserved_metadata: {
    loan_id: string;
    payload_sha256: string;
    walacor_tx_id: string;
    original_created_at: string;
    original_created_by: string;
    files_info: Array<{
      id: string;
      name: string;
      uri: string;
      sha256: string;
      size_bytes: number;
      content_type: string;
    }>;
  };
}
```

### VerifyDeletedDocumentResponse
```typescript
{
  is_deleted: boolean;
  document_info?: DeletedDocumentInfo;
  verification_message: string;
}
```

## Frontend Components

### 1. DeleteDocumentModal
- Modal interface for deleting documents
- Includes reason input and confirmation
- Shows warning about metadata preservation

### 2. DeletedDocumentInfo
- Displays comprehensive information about deleted documents
- Shows timeline of upload and deletion
- Provides verification and detail viewing options

### 3. VerifyDeletedDocument
- Interface for verifying deleted documents by hash
- Shows verification results and document status
- Handles different verification scenarios

## Usage Examples

### 1. Delete a Document
```typescript
// Using DELETE endpoint
const response = await fetch(`/api/artifacts/${artifactId}?deleted_by=user@example.com&deletion_reason=Data cleanup`, {
  method: 'DELETE'
});

// Using POST endpoint
const response = await fetch('/api/artifacts/delete?deleted_by=user@example.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    artifact_id: artifactId,
    deletion_reason: 'Data cleanup'
  })
});
```

### 2. Verify a Deleted Document
```typescript
const response = await fetch('/api/verify-deleted-document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document_hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
  })
});

const result = await response.json();
if (result.data.is_deleted) {
  console.log('Document was deleted:', result.data.document_info);
  console.log('Verification message:', result.data.verification_message);
}
```

### 3. Retrieve Deleted Documents for a Loan
```typescript
const response = await fetch(`/api/deleted-documents/loan/${loanId}`);
const result = await response.json();
console.log(`Found ${result.data.total_deleted} deleted documents for loan ${loanId}`);
```

## Verification Messages

The system provides clear, informative messages for deleted documents:

```
"This document was uploaded on 2024-01-15 10:30:00 and deleted on 2024-01-20 14:45:00 by admin@company.com."
```

## Compliance and Audit Benefits

### 1. Regulatory Compliance
- **Data Retention**: Metadata is preserved for regulatory compliance requirements
- **Audit Trails**: Complete history of document lifecycle
- **User Attribution**: Clear tracking of who performed what actions

### 2. Legal Protection
- **Document History**: Proof of document existence and management
- **Chain of Custody**: Complete chain of custody for deleted documents
- **Verification Capability**: Ability to verify document authenticity even after deletion

### 3. Business Continuity
- **Data Recovery**: Essential metadata preserved for business continuity
- **Verification Services**: Continued verification capabilities for deleted documents
- **Historical Analysis**: Ability to analyze document management patterns

## Security Considerations

### 1. Access Control
- Deletion requires proper authentication
- Audit trail tracks all deletion activities
- User attribution prevents anonymous deletions

### 2. Data Protection
- Sensitive data is handled according to privacy requirements
- Metadata preservation maintains data integrity
- Secure verification process for deleted documents

### 3. Compliance
- Full audit trail for regulatory compliance
- Data retention policies can be enforced
- Verification capabilities support legal requirements

## Testing

The functionality includes comprehensive tests covering:
- Database operations for deletion and metadata preservation
- API endpoint functionality
- Verification logic for deleted documents
- Error handling and edge cases

Run tests with:
```bash
cd backend
python test_delete_functionality.py
```

## Future Enhancements

### 1. Bulk Operations
- Bulk deletion of multiple documents
- Bulk verification of deleted documents

### 2. Advanced Analytics
- Deletion pattern analysis
- Document lifecycle analytics
- Compliance reporting

### 3. Integration Features
- Integration with external audit systems
- Automated compliance reporting
- Advanced search and filtering capabilities

## Conclusion

The document deletion functionality provides a comprehensive solution for managing document lifecycles while maintaining compliance and audit requirements. The metadata preservation ensures that deleted documents can still be verified and traced, providing essential capabilities for regulatory compliance and business continuity.

This implementation demonstrates the system's commitment to data integrity, security, and compliance while providing users with powerful tools for document management and verification.
