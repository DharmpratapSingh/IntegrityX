import axios, { AxiosResponse } from 'axios';

// Types for duplicate detection
export interface DuplicateCheckRequest {
  file_hash?: string;
  loan_id?: string;
  borrower_email?: string;
  borrower_ssn_last4?: string;
  content_hash?: string;
}

export interface ExistingArtifact {
  type: string;
  artifact_id: string;
  loan_id: string;
  created_at: string;
  walacor_tx_id: string;
  file_hash?: string;
  artifact_type?: string;
  details: string;
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean;
  duplicate_type?: string;
  existing_artifacts: ExistingArtifact[];
  warnings: string[];
  recommendations: string[];
}

export interface DuplicateInfoResponse {
  artifact: {
    id: string;
    loan_id: string;
    artifact_type: string;
    payload_sha256: string;
    created_at: string;
    walacor_tx_id: string;
  };
  related_artifacts: ExistingArtifact[];
  total_related: number;
}

/**
 * Check for duplicates before uploading a document
 */
export async function checkForDuplicates(
  request: DuplicateCheckRequest
): Promise<DuplicateCheckResponse> {
  try {
    console.log('🔍 Checking for duplicates:', request);
    
    const response: AxiosResponse<{ ok: boolean; data: DuplicateCheckResponse }> = await axios.post(
      'http://localhost:8000/api/duplicate-check',
      request
    );
    
    if (!response.data.ok) {
      throw new Error('Duplicate check failed');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Duplicate check failed:', error);
    throw error;
  }
}

/**
 * Get detailed duplicate information for a specific artifact
 */
export async function getDuplicateInfo(
  artifactId: string
): Promise<DuplicateInfoResponse> {
  try {
    console.log('🔍 Getting duplicate info for artifact:', artifactId);
    
    const response: AxiosResponse<{ ok: boolean; data: DuplicateInfoResponse }> = await axios.get(
      `http://localhost:8000/api/duplicate-check/${artifactId}`
    );
    
    if (!response.data.ok) {
      throw new Error('Failed to get duplicate info');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get duplicate info:', error);
    throw error;
  }
}

/**
 * Check for duplicates based on file hash
 */
export async function checkFileHashDuplicate(
  fileHash: string
): Promise<DuplicateCheckResponse> {
  return checkForDuplicates({ file_hash: fileHash });
}

/**
 * Check for duplicates based on loan ID
 */
export async function checkLoanIdDuplicate(
  loanId: string
): Promise<DuplicateCheckResponse> {
  return checkForDuplicates({ loan_id: loanId });
}

/**
 * Check for duplicates based on borrower information
 */
export async function checkBorrowerDuplicate(
  email?: string,
  ssnLast4?: string
): Promise<DuplicateCheckResponse> {
  return checkForDuplicates({
    borrower_email: email,
    borrower_ssn_last4: ssnLast4
  });
}

/**
 * Comprehensive duplicate check for loan documents
 */
export async function checkLoanDocumentDuplicates(
  fileHash: string,
  loanId: string,
  borrowerEmail?: string,
  borrowerSsnLast4?: string,
  contentHash?: string
): Promise<DuplicateCheckResponse> {
  return checkForDuplicates({
    file_hash: fileHash,
    loan_id: loanId,
    borrower_email: borrowerEmail,
    borrower_ssn_last4: borrowerSsnLast4,
    content_hash: contentHash
  });
}

export default {
  checkForDuplicates,
  getDuplicateInfo,
  checkFileHashDuplicate,
  checkLoanIdDuplicate,
  checkBorrowerDuplicate,
  checkLoanDocumentDuplicates
};
