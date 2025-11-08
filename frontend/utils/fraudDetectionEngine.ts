/**
 * ML-POWERED FRAUD DETECTION ENGINE
 * Analyzes loan documents for suspicious patterns and fraud indicators
 *
 * Current Implementation: Rule-based detection
 * Future: Can be upgraded to ML model (TensorFlow.js, ONNX Runtime)
 */

export interface FraudDetectionResult {
  fraudRiskScore: number          // 0-100 (0 = clean, 100 = highly suspicious)
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  fraudIndicators: FraudIndicator[]
  recommendation: string
  confidence: number               // How confident we are in the assessment
}

export interface FraudIndicator {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedField?: string
  score: number                    // Contribution to overall fraud score
}

interface DocumentData {
  loanId?: string
  loanAmount?: number
  interestRate?: number
  borrowerName?: string
  borrowerEmail?: string
  borrowerPhone?: string
  borrowerSSNLast4?: string
  borrowerDateOfBirth?: string
  borrowerAnnualIncome?: number
  borrowerEmploymentStatus?: string
  borrowerStreetAddress?: string
  borrowerCity?: string
  borrowerState?: string
  borrowerZipCode?: string
  [key: string]: any
}

// In-memory cache for cross-document fraud detection
// In production, this would be a database query
const documentCache: Map<string, DocumentData> = new Map()

/**
 * Main fraud detection function
 */
export function detectFraud(documentData: DocumentData, documentId?: string): FraudDetectionResult {
  console.log('🔍 Starting fraud detection analysis...')

  const indicators: FraudIndicator[] = []

  // Run all fraud checks
  indicators.push(...checkMissingCriticalFields(documentData))
  indicators.push(...checkInconsistentData(documentData))
  indicators.push(...checkSuspiciousPatterns(documentData))
  indicators.push(...checkDuplicateIdentifiers(documentData))
  indicators.push(...checkIncomeToLoanRatio(documentData))
  indicators.push(...checkUnusualValues(documentData))
  indicators.push(...checkFormatAnomalies(documentData))

  // Cache document for cross-document analysis
  if (documentId) {
    documentCache.set(documentId, documentData)
  }

  // Calculate overall fraud score (weighted sum)
  const fraudRiskScore = calculateFraudScore(indicators)
  const riskLevel = getRiskLevel(fraudRiskScore)
  const confidence = calculateConfidence(indicators, documentData)
  const recommendation = getRecommendation(riskLevel, indicators)

  console.log(`📊 Fraud Analysis Complete: ${fraudRiskScore}/100 (${riskLevel} risk)`)
  console.log(`🚨 Found ${indicators.length} fraud indicators`)

  return {
    fraudRiskScore,
    riskLevel,
    fraudIndicators: indicators,
    recommendation,
    confidence
  }
}

/**
 * Check for missing critical KYC fields
 */
function checkMissingCriticalFields(data: DocumentData): FraudIndicator[] {
  const indicators: FraudIndicator[] = []

  const criticalFields = [
    { field: 'borrowerName', label: 'Borrower Name' },
    { field: 'borrowerEmail', label: 'Borrower Email' },
    { field: 'borrowerPhone', label: 'Borrower Phone' },
    { field: 'loanAmount', label: 'Loan Amount' },
    { field: 'borrowerAnnualIncome', label: 'Annual Income' }
  ]

  criticalFields.forEach(({ field, label }) => {
    if (!data[field] || data[field] === '' || data[field] === 0) {
      indicators.push({
        type: 'missing_critical_field',
        severity: 'high',
        description: `Missing critical field: ${label}`,
        affectedField: field,
        score: 15
      })
    }
  })

  return indicators
}

/**
 * Check for inconsistent or contradictory data
 */
function checkInconsistentData(data: DocumentData): FraudIndicator[] {
  const indicators: FraudIndicator[] = []

  // Check email format vs name consistency
  if (data.borrowerEmail && data.borrowerName) {
    const email = data.borrowerEmail.toLowerCase()
    const name = data.borrowerName.toLowerCase()
    const nameParts = name.split(' ').filter(p => p.length > 2)

    const emailMatchesName = nameParts.some(part => email.includes(part))

    if (!emailMatchesName && !email.includes('test') && !email.includes('demo')) {
      indicators.push({
        type: 'email_name_mismatch',
        severity: 'medium',
        description: 'Email address does not match borrower name',
        affectedField: 'borrowerEmail',
        score: 10
      })
    }
  }

  // Check phone area code vs state
  if (data.borrowerPhone && data.borrowerState) {
    const phone = data.borrowerPhone.replace(/\D/g, '')
    const state = data.borrowerState.toUpperCase()

    // Example: California area codes
    const caAreaCodes = ['209', '213', '310', '323', '408', '415', '510', '562', '619', '626', '650', '661', '707', '714', '760', '805', '818', '831', '858', '909', '916', '925', '949', '951']

    if (state === 'CA' && phone.length >= 10) {
      const areaCode = phone.substring(0, 3)
      if (!caAreaCodes.includes(areaCode) && !areaCode.startsWith('5')) { // 555 for test numbers
        indicators.push({
          type: 'phone_state_mismatch',
          severity: 'low',
          description: 'Phone area code does not match stated location',
          affectedField: 'borrowerPhone',
          score: 5
        })
      }
    }
  }

  return indicators
}

/**
 * Check for suspicious patterns
 */
function checkSuspiciousPatterns(data: DocumentData): FraudIndicator[] {
  const indicators: FraudIndicator[] = []

  // Sequential/repeated digits in SSN
  if (data.borrowerSSNLast4) {
    const ssn = data.borrowerSSNLast4

    if (/(\d)\1{3}/.test(ssn)) { // 1111, 2222, etc.
      indicators.push({
        type: 'repeated_ssn_digits',
        severity: 'high',
        description: 'SSN contains repeated digits (e.g., 1111, 2222)',
        affectedField: 'borrowerSSNLast4',
        score: 20
      })
    }

    if (/1234|2345|3456|4567|5678|6789/.test(ssn)) {
      indicators.push({
        type: 'sequential_ssn_digits',
        severity: 'high',
        description: 'SSN contains sequential digits',
        affectedField: 'borrowerSSNLast4',
        score: 18
      })
    }
  }

  // Suspicious email domains
  if (data.borrowerEmail) {
    const suspiciousDomains = ['tempmail', 'throwaway', '10minutemail', 'guerrillamail', 'mailinator']
    const email = data.borrowerEmail.toLowerCase()

    if (suspiciousDomains.some(domain => email.includes(domain))) {
      indicators.push({
        type: 'disposable_email',
        severity: 'critical',
        description: 'Using disposable/temporary email service',
        affectedField: 'borrowerEmail',
        score: 25
      })
    }
  }

  // Round numbers (potential fabrication)
  if (data.loanAmount) {
    const amount = Number(data.loanAmount)
    if (amount > 0 && amount % 10000 === 0 && amount >= 100000) {
      // Very round numbers like 100000, 250000, 500000
      indicators.push({
        type: 'suspiciously_round_amount',
        severity: 'low',
        description: 'Loan amount is suspiciously round number',
        affectedField: 'loanAmount',
        score: 3
      })
    }
  }

  if (data.borrowerAnnualIncome) {
    const income = Number(data.borrowerAnnualIncome)
    if (income > 0 && income % 10000 === 0 && income >= 50000) {
      indicators.push({
        type: 'suspiciously_round_income',
        severity: 'low',
        description: 'Annual income is suspiciously round number',
        affectedField: 'borrowerAnnualIncome',
        score: 3
      })
    }
  }

  return indicators
}

/**
 * Check for duplicate identifiers across documents
 */
function checkDuplicateIdentifiers(data: DocumentData): FraudIndicator[] {
  const indicators: FraudIndicator[] = []

  // Check against cached documents
  documentCache.forEach((cachedDoc, cachedId) => {
    // Duplicate SSN with different names
    if (data.borrowerSSNLast4 && cachedDoc.borrowerSSNLast4 &&
        data.borrowerSSNLast4 === cachedDoc.borrowerSSNLast4 &&
        data.borrowerName && cachedDoc.borrowerName &&
        data.borrowerName.toLowerCase() !== cachedDoc.borrowerName.toLowerCase()) {
      indicators.push({
        type: 'duplicate_ssn_different_name',
        severity: 'critical',
        description: `SSN already used with different name in document ${cachedId}`,
        affectedField: 'borrowerSSNLast4',
        score: 30
      })
    }

    // Duplicate email with different names
    if (data.borrowerEmail && cachedDoc.borrowerEmail &&
        data.borrowerEmail.toLowerCase() === cachedDoc.borrowerEmail.toLowerCase() &&
        data.borrowerName && cachedDoc.borrowerName &&
        data.borrowerName.toLowerCase() !== cachedDoc.borrowerName.toLowerCase()) {
      indicators.push({
        type: 'duplicate_email_different_name',
        severity: 'high',
        description: `Email already used with different name in document ${cachedId}`,
        affectedField: 'borrowerEmail',
        score: 22
      })
    }
  })

  return indicators
}

/**
 * Check income-to-loan ratio (debt-to-income)
 */
function checkIncomeToLoanRatio(data: DocumentData): FraudIndicator[] {
  const indicators: FraudIndicator[] = []

  if (data.loanAmount && data.borrowerAnnualIncome) {
    const loanAmount = Number(data.loanAmount)
    const annualIncome = Number(data.borrowerAnnualIncome)

    if (annualIncome > 0) {
      const ratio = loanAmount / annualIncome

      // Loan more than 10x annual income (very risky)
      if (ratio > 10) {
        indicators.push({
          type: 'extreme_loan_to_income_ratio',
          severity: 'critical',
          description: `Loan amount is ${ratio.toFixed(1)}x annual income (extremely high risk)`,
          affectedField: 'loanAmount',
          score: 28
        })
      }
      // Loan more than 5x annual income (risky)
      else if (ratio > 5) {
        indicators.push({
          type: 'high_loan_to_income_ratio',
          severity: 'high',
          description: `Loan amount is ${ratio.toFixed(1)}x annual income (high risk)`,
          affectedField: 'loanAmount',
          score: 15
        })
      }
    }

    // Suspiciously low income for loan amount
    if (loanAmount >= 500000 && annualIncome < 50000) {
      indicators.push({
        type: 'implausible_income_for_loan',
        severity: 'high',
        description: 'Income too low for requested loan amount',
        affectedField: 'borrowerAnnualIncome',
        score: 20
      })
    }
  }

  return indicators
}

/**
 * Check for unusual or out-of-range values
 */
function checkUnusualValues(data: DocumentData): FraudIndicator[] {
  const indicators: FraudIndicator[] = []

  // Unrealistic interest rate
  if (data.interestRate) {
    const rate = Number(data.interestRate)

    if (rate < 0.5 || rate > 30) {
      indicators.push({
        type: 'unusual_interest_rate',
        severity: 'medium',
        description: `Interest rate ${rate}% is outside typical range (0.5-30%)`,
        affectedField: 'interestRate',
        score: 12
      })
    }
  }

  // Unrealistic age (from DOB)
  if (data.borrowerDateOfBirth) {
    const dob = new Date(data.borrowerDateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()

    if (age < 18 || age > 100) {
      indicators.push({
        type: 'invalid_age',
        severity: 'critical',
        description: `Borrower age (${age}) is outside valid range (18-100)`,
        affectedField: 'borrowerDateOfBirth',
        score: 25
      })
    }
  }

  // Suspiciously low or high loan amounts
  if (data.loanAmount) {
    const amount = Number(data.loanAmount)

    if (amount < 1000) {
      indicators.push({
        type: 'unusually_low_loan_amount',
        severity: 'medium',
        description: 'Loan amount is unusually low for a loan document',
        affectedField: 'loanAmount',
        score: 8
      })
    }

    if (amount > 10000000) {
      indicators.push({
        type: 'unusually_high_loan_amount',
        severity: 'medium',
        description: 'Loan amount is unusually high (>$10M)',
        affectedField: 'loanAmount',
        score: 10
      })
    }
  }

  return indicators
}

/**
 * Check for format anomalies
 */
function checkFormatAnomalies(data: DocumentData): FraudIndicator[] {
  const indicators: FraudIndicator[] = []

  // Invalid email format
  if (data.borrowerEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.borrowerEmail)) {
      indicators.push({
        type: 'invalid_email_format',
        severity: 'high',
        description: 'Email address has invalid format',
        affectedField: 'borrowerEmail',
        score: 18
      })
    }
  }

  // Invalid phone format
  if (data.borrowerPhone) {
    const phone = data.borrowerPhone.replace(/\D/g, '')
    if (phone.length < 10 || phone.length > 11) {
      indicators.push({
        type: 'invalid_phone_format',
        severity: 'medium',
        description: 'Phone number has invalid format',
        affectedField: 'borrowerPhone',
        score: 10
      })
    }
  }

  // Invalid ZIP code format
  if (data.borrowerZipCode) {
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(data.borrowerZipCode)) {
      indicators.push({
        type: 'invalid_zip_format',
        severity: 'low',
        description: 'ZIP code has invalid format',
        affectedField: 'borrowerZipCode',
        score: 5
      })
    }
  }

  return indicators
}

/**
 * Calculate overall fraud score from indicators
 */
function calculateFraudScore(indicators: FraudIndicator[]): number {
  if (indicators.length === 0) return 0

  // Sum all indicator scores
  const totalScore = indicators.reduce((sum, indicator) => sum + indicator.score, 0)

  // Cap at 100
  return Math.min(100, totalScore)
}

/**
 * Determine risk level from fraud score
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 70) return 'critical'
  if (score >= 45) return 'high'
  if (score >= 20) return 'medium'
  return 'low'
}

/**
 * Calculate confidence in the fraud assessment
 */
function calculateConfidence(indicators: FraudIndicator[], data: DocumentData): number {
  // Base confidence on number of fields present and indicators found
  const totalFields = Object.keys(data).length
  const criticalFieldsPresent = [
    data.borrowerName, data.borrowerEmail, data.borrowerPhone,
    data.loanAmount, data.borrowerAnnualIncome
  ].filter(f => f).length

  const dataCompleteness = (criticalFieldsPresent / 5) * 100
  const indicatorStrength = indicators.length > 0 ?
    Math.min(100, indicators.length * 15) : 50

  // Weighted average
  const confidence = (dataCompleteness * 0.6 + indicatorStrength * 0.4)

  return Math.round(confidence)
}

/**
 * Get recommendation based on risk level
 */
function getRecommendation(riskLevel: string, indicators: FraudIndicator[]): string {
  switch (riskLevel) {
    case 'critical':
      return '🚨 REJECT - High fraud risk detected. Manual review required before proceeding.'
    case 'high':
      return '⚠️ MANUAL REVIEW REQUIRED - Multiple fraud indicators found. Verify all information.'
    case 'medium':
      return '⚡ REVIEW RECOMMENDED - Some suspicious patterns detected. Additional verification suggested.'
    case 'low':
      if (indicators.length === 0) {
        return '✅ APPROVE - No fraud indicators detected. Document appears legitimate.'
      }
      return '✓ APPROVE WITH CAUTION - Minor issues found. Document likely legitimate.'
    default:
      return 'Unable to determine risk level'
  }
}

/**
 * Clear document cache (for testing or reset)
 */
export function clearFraudCache(): void {
  documentCache.clear()
  console.log('🗑️ Fraud detection cache cleared')
}

/**
 * Get cache statistics
 */
export function getFraudCacheStats() {
  return {
    totalDocuments: documentCache.size,
    documentsById: Array.from(documentCache.keys())
  }
}
