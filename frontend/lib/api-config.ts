/**
 * API Configuration - Centralized API endpoints and base URLs
 *
 * This file provides a single source of truth for all API endpoints,
 * making it easy to switch between environments (dev, staging, production).
 */

// Get API base URL from environment variable or fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Walacor EC2 endpoint (if different from main API)
const WALACOR_BASE_URL = process.env.NEXT_PUBLIC_EC2_WALACOR || API_BASE_URL;

/**
 * API Configuration object with all endpoints
 */
export const apiConfig = {
  // Base URLs
  baseUrl: API_BASE_URL,
  walacorUrl: WALACOR_BASE_URL,

  // Document & Artifact Endpoints
  artifacts: {
    list: (limit = 50) => `${API_BASE_URL}/api/artifacts?limit=${limit}`,
    getById: (id: string) => `${API_BASE_URL}/api/artifacts/${id}`,
  },

  // Verification Endpoints
  verification: {
    verify: `${API_BASE_URL}/api/verify`,
    verifyByHash: (hash: string) => `${API_BASE_URL}/api/verify?hash=${hash}`,
    verifyByDocument: `${API_BASE_URL}/api/verify-by-document`,
    metrics: `${API_BASE_URL}/api/verification/metrics`,
  },

  // Analytics Endpoints
  analytics: {
    dashboard: `${API_BASE_URL}/api/analytics/dashboard`,
    systemMetrics: `${API_BASE_URL}/api/analytics/system-metrics`,
    dailyActivity: `${API_BASE_URL}/api/analytics/daily-activity`,
    documents: `${API_BASE_URL}/api/analytics/documents`,
    predictive: `${API_BASE_URL}/api/analytics/predictive`,
  },

  // Health & Status
  health: `${API_BASE_URL}/api/health`,
  metrics: `${API_BASE_URL}/metrics`,

  // Walacor-specific endpoints
  walacor: {
    storeFile: `${WALACOR_BASE_URL}/api/v2/files/store`,
    queryGet: `${WALACOR_BASE_URL}/api/query/get`,
    schemas: (etid: string) => `${WALACOR_BASE_URL}/api/schemas/${etid}`,
  },

  // Upload endpoints
  upload: {
    ingestJson: `${API_BASE_URL}/ingest-json`,
    ingestPacket: `${API_BASE_URL}/ingest-packet`,
  },

  // ZKP endpoints
  zkp: {
    generate: `${API_BASE_URL}/api/zkp/generate`,
    verify: `${API_BASE_URL}/api/zkp/verify`,
  },
};

/**
 * Helper function to build URL with query parameters
 */
export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean>): string {
  if (!params) return baseUrl;

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  return url.toString();
}

/**
 * Type-safe API endpoint getter
 */
export function getApiUrl(endpoint: keyof typeof apiConfig): string {
  const value = apiConfig[endpoint];
  return typeof value === 'string' ? value : API_BASE_URL;
}

export default apiConfig;
