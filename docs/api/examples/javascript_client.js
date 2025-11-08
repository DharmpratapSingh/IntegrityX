/**
 * IntegrityX JavaScript/TypeScript Client Library
 * 
 * A complete JavaScript client for the IntegrityX API with authentication,
 * error handling, and retry logic.
 * 
 * Usage:
 *   import { IntegrityXClient } from './integrityx_client';
 *   
 *   const client = new IntegrityXClient('http://localhost:8000', 'your_jwt_token');
 *   const result = await client.uploadDocument({ loan_id: 'LOAN-123', amount: 250000 });
 *   console.log(`Sealed with ETID: ${result.etid}`);
 */

class IntegrityXError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IntegrityXError';
  }
}

class AuthenticationError extends IntegrityXError {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends IntegrityXError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class IntegrityXClient {
  /**
   * Create an IntegrityX API client.
   * 
   * @param {string} baseUrl - Base URL of the IntegrityX API
   * @param {string} token - Clerk JWT token for authentication
   * @param {number} timeout - Request timeout in milliseconds (default: 30000)
   * @param {number} maxRetries - Maximum number of retries (default: 3)
   */
  constructor(baseUrl, token, timeout = 30000, maxRetries = 3) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * Make HTTP request with retry logic.
   * @private
   */
  async _request(method, endpoint, data = null, requiresAuth = true) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (requiresAuth) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          throw new AuthenticationError('Invalid or expired token');
        }

        if (response.status === 400) {
          const errorData = await response.json();
          throw new ValidationError(`Validation error: ${errorData.detail || 'Unknown error'}`);
        }

        if (!response.ok) {
          throw new IntegrityXError(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();

      } catch (error) {
        if (error.name === 'AbortError') {
          if (attempt === this.maxRetries - 1) {
            throw new IntegrityXError(`Request timeout after ${this.maxRetries} attempts`);
          }
        } else if (error instanceof IntegrityXError) {
          throw error;
        } else {
          if (attempt === this.maxRetries - 1) {
            throw new IntegrityXError(`Request failed: ${error.message}`);
          }
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // ===========================
  // Document Operations
  // ===========================

  /**
   * Upload a single JSON document.
   * 
   * @param {Object} document - Document data
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<Object>} Response with ETID, hash, and blockchain transaction ID
   * 
   * @example
   * const result = await client.uploadDocument({
   *   loan_id: 'LOAN-12345',
   *   amount: 250000,
   *   borrower_name: 'John Doe'
   * });
   * console.log(`ETID: ${result.etid}`);
   */
  async uploadDocument(document, metadata = null) {
    const payload = { document };
    if (metadata) {
      payload.metadata = metadata;
    }

    return await this._request('POST', '/ingest-json', payload);
  }

  /**
   * Retrieve a document by ETID.
   * 
   * @param {string} etid - Document ETID
   * @returns {Promise<Object>} Document data with metadata
   */
  async getDocument(etid) {
    return await this._request('GET', `/document/${etid}`);
  }

  /**
   * Delete a document (admin only).
   * 
   * @param {string} etid - Document ETID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteDocument(etid) {
    return await this._request('DELETE', `/document/${etid}`);
  }

  // ===========================
  // Verification
  // ===========================

  /**
   * Verify a document (no auth required).
   * 
   * @param {string} etid - Document ETID
   * @returns {Promise<Object>} Verification result with blockchain proof
   * 
   * @example
   * const result = await client.verifyDocument('ETID-20241028123456-ABC123');
   * console.log(`Verified: ${result.verified}`);
   */
  async verifyDocument(etid) {
    return await this._request('GET', `/public/verify/${etid}`, null, false);
  }

  /**
   * Verify multiple documents at once.
   * 
   * @param {string[]} etids - List of document ETIDs
   * @returns {Promise<Object>} Verification results for all documents
   */
  async batchVerify(etids) {
    return await this._request('POST', '/verify/batch', { etids });
  }

  // ===========================
  // Attestations
  // ===========================

  /**
   * Create an attestation for a document.
   * 
   * @param {string} etid - Document ETID
   * @param {string} role - Attestor role
   * @param {string} status - Attestation status
   * @param {string} comments - Optional comments
   * @param {string} attestedBy - Email of attestor
   * @returns {Promise<Object>} Attestation confirmation
   */
  async createAttestation(etid, role, status, comments = null, attestedBy = null) {
    const payload = { etid, role, status };
    if (comments) payload.comments = comments;
    if (attestedBy) payload.attested_by = attestedBy;

    return await this._request('POST', '/attestations', payload);
  }

  /**
   * Get all attestations for a document.
   * 
   * @param {string} etid - Document ETID
   * @returns {Promise<Object>} List of attestations
   */
  async getAttestations(etid) {
    return await this._request('GET', `/attestations/${etid}`);
  }

  // ===========================
  // Provenance
  // ===========================

  /**
   * Get complete provenance chain for a document.
   * 
   * @param {string} etid - Document ETID
   * @returns {Promise<Object>} Complete chain of custody
   */
  async getProvenance(etid) {
    return await this._request('GET', `/provenance/${etid}`);
  }

  // ===========================
  // Analytics
  // ===========================

  /**
   * Get document statistics.
   * 
   * @returns {Promise<Object>} Statistics and insights
   */
  async getStats() {
    return await this._request('GET', '/analytics/stats');
  }

  /**
   * Get predictive analytics.
   * 
   * @param {string} metric - Metric to predict
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Object>} Prediction results
   */
  async predict(metric, timeframe) {
    return await this._request('POST', '/analytics/predictive', { metric, timeframe });
  }

  // ===========================
  // AI Features
  // ===========================

  /**
   * Detect anomalies in a document using AI.
   * 
   * @param {string} etid - Document ETID
   * @returns {Promise<Object>} Anomaly detection results
   */
  async detectAnomalies(etid) {
    return await this._request('POST', '/ai/detect-anomalies', { etid });
  }

  /**
   * Analyze document using NLP and entity extraction.
   * 
   * @param {string} etid - Document ETID
   * @returns {Promise<Object>} Document intelligence results
   */
  async analyzeDocument(etid) {
    return await this._request('POST', '/intelligence/analyze', { etid });
  }
}

// ===========================
// Usage Examples
// ===========================

async function exampleUploadAndVerify() {
  console.log('Example: Upload and verify a document\n');
  
  const client = new IntegrityXClient('http://localhost:8000', 'your_jwt_token');

  // Upload document
  const document = {
    loan_id: 'LOAN-12345',
    borrower_name: 'John Doe',
    amount: 250000,
    interest_rate: 4.5,
    term_months: 360
  };

  const result = await client.uploadDocument(document);
  console.log(`✅ Document sealed with ETID: ${result.etid}`);
  console.log(`   Blockchain TX: ${result.walacor_txid}`);

  // Verify document (no auth needed)
  const verification = await client.verifyDocument(result.etid);
  console.log(`✅ Document verified: ${verification.verified}`);
  console.log(`   Blockchain verified: ${verification.blockchain_verified}`);
}

async function exampleAttestations() {
  console.log('\nExample: Create and retrieve attestations\n');
  
  const client = new IntegrityXClient('http://localhost:8000', 'your_jwt_token');
  const etid = 'ETID-20241028123456-ABC123';

  // Create attestation
  const attestation = await client.createAttestation(
    etid,
    'underwriter',
    'approved',
    'Loan application approved after thorough review',
    'john.doe@company.com'
  );
  console.log(`✅ Attestation created: ${attestation.attestation_id}`);

  // Get all attestations
  const attestations = await client.getAttestations(etid);
  console.log(`✅ Found ${attestations.attestations.length} attestations`);
}

async function exampleAnalytics() {
  console.log('\nExample: Get analytics and predictions\n');
  
  const client = new IntegrityXClient('http://localhost:8000', 'your_jwt_token');

  // Get statistics
  const stats = await client.getStats();
  console.log(`📊 Total documents: ${stats.total_documents}`);
  console.log(`   Sealed today: ${stats.sealed_today}`);
  console.log(`   Average health score: ${stats.average_health_score}`);

  // Get predictions
  const prediction = await client.predict('document_volume', 'next_30_days');
  console.log(`📈 Predicted volume trend: ${prediction.forecast[0].predicted_value}`);
}

async function exampleErrorHandling() {
  console.log('\nExample: Proper error handling\n');
  
  const client = new IntegrityXClient('http://localhost:8000', 'your_jwt_token');

  try {
    const result = await client.uploadDocument({ loan_id: 'LOAN-123' });
    console.log(`✅ Success: ${result.etid}`);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log(`❌ Authentication error: ${error.message}`);
      // Handle token refresh
    } else if (error instanceof ValidationError) {
      console.log(`❌ Validation error: ${error.message}`);
      // Handle invalid data
    } else if (error instanceof IntegrityXError) {
      console.log(`❌ API error: ${error.message}`);
      // Handle other errors
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    IntegrityXClient,
    IntegrityXError,
    AuthenticationError,
    ValidationError
  };
}

// Run examples if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    await exampleUploadAndVerify();
    await exampleAttestations();
    await exampleAnalytics();
    await exampleErrorHandling();
  })().catch(console.error);
}














