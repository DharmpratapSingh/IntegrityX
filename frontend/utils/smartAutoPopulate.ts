import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeDate,
  sanitizeSSNLast4,
  sanitizeNumber,
  sanitizeAddress,
  sanitizeCity,
  sanitizeState,
  sanitizeZipCode,
  sanitizeCountry,
  sanitizeEmploymentStatus,
  sanitizeGovernmentIdType,
  sanitizeDocumentType,
  sanitizeNotes,
} from '@/utils/dataSanitization'

// ============================================================================
// ENHANCED AUTO-POPULATE WITH BACKEND INTEGRATION
// ============================================================================

export interface FieldConfidence {
  value: any
  confidence: number // 0-100
  source: 'backend_ai' | 'frontend_fallback' | 'user_input'
  extractedFrom?: string // Which field in JSON it came from
}

export interface SmartExtractionResult {
  fields: Record<string, any>
  confidenceScores: Record<string, number>
  overallConfidence: number
  extractedBy: 'backend' | 'frontend'
  warnings?: string[]
}

export interface EnhancedAutoPopulateMetadata {
  // Loan Information
  loanId: FieldConfidence
  documentType: FieldConfidence
  loanAmount: FieldConfidence
  loanTerm: FieldConfidence
  interestRate: FieldConfidence

  // Borrower Personal Info
  borrowerName: FieldConfidence
  borrowerEmail: FieldConfidence
  borrowerPhone: FieldConfidence
  borrowerDateOfBirth: FieldConfidence

  // Borrower Address
  borrowerStreetAddress: FieldConfidence
  borrowerCity: FieldConfidence
  borrowerState: FieldConfidence
  borrowerZipCode: FieldConfidence
  borrowerCountry: FieldConfidence

  // Borrower KYC
  borrowerSSNLast4: FieldConfidence
  borrowerGovernmentIdType: FieldConfidence
  borrowerIdNumberLast4: FieldConfidence

  // Borrower Employment
  borrowerEmploymentStatus: FieldConfidence
  borrowerAnnualIncome: FieldConfidence
  borrowerCoBorrowerName: FieldConfidence

  // Property
  propertyAddress: FieldConfidence

  // Notes
  additionalNotes: FieldConfidence

  // Metadata
  extractionMetadata: {
    overallConfidence: number
    extractedBy: 'backend' | 'frontend'
    timestamp: string
    warnings: string[]
  }
}

// ============================================================================
// BACKEND API INTEGRATION
// ============================================================================

/**
 * Extract document data using backend AI engine
 */
export async function extractWithBackendAI(file: File): Promise<SmartExtractionResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('http://localhost:8000/api/extract-document-data', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Backend extraction failed: ${response.statusText}`)
    }

    const result = await response.json()

    return {
      fields: result.data?.extracted_fields || {},
      confidenceScores: result.data?.confidence_scores || {},
      overallConfidence: result.data?.confidence || 0,
      extractedBy: 'backend',
      warnings: result.warnings || []
    }
  } catch (error) {
    console.error('Backend extraction error:', error)
    throw error
  }
}

/**
 * Fallback to frontend extraction if backend fails
 */
export async function extractWithFrontendFallback(
  fileContent: Record<string, any>
): Promise<SmartExtractionResult> {
  // Use existing frontend logic as fallback
  const candidatePaths: Record<string, string[]> = {
    loanId: ['loan_id', 'loanId', 'application_id', 'loan_details.loan_id', 'loanDetails.loanId', 'id', 'loan_number'],
    documentType: ['document_type', 'documentType', 'loan_details.document_type', 'type', 'doc_type'],
    loanAmount: ['loan_amount', 'loanAmount', 'loan_details.loan_amount', 'loanDetails.loanAmount', 'amount', 'principal'],
    loanTerm: ['loan_term', 'loanTerm', 'loan_term_months', 'loan_details.loan_term_months', 'term', 'term_months'],
    interestRate: ['interest_rate', 'interestRate', 'loan_details.interest_rate', 'rate', 'apr'],
    propertyStreet: ['property_address', 'propertyAddress', 'property_information.property_address', 'property.address', 'property.street'],
    borrowerFullName: ['borrower.full_name', 'borrower.name', 'borrowerName', 'borrower_information.personal_details.full_name', 'name', 'full_name'],
    borrowerEmail: ['borrower.email', 'borrower_information.personal_details.email', 'email', 'contact.email'],
    borrowerPhone: ['borrower.phone', 'borrower_information.personal_details.phone', 'phone', 'contact.phone', 'phone_number'],
    borrowerDob: ['borrower.date_of_birth', 'borrower_information.personal_details.date_of_birth', 'dob', 'date_of_birth', 'birth_date'],
    borrowerSSN: ['borrower.ssn_last4', 'borrower_information.personal_details.ssn_last4', 'ssn_last4', 'ssn'],
    idType: ['borrower.id_type', 'borrower_information.identification.id_type', 'id_type', 'government_id_type'],
    idLast4: ['borrower.id_last4', 'borrower_information.identification.id_last4', 'id_last4', 'id_number'],
    employmentStatus: ['borrower.employment_status', 'borrower_information.employment.status', 'employment_status', 'employment'],
    annualIncome: ['borrower.annual_income', 'borrower_information.employment.annual_income', 'annual_income', 'income'],
    coBorrowerName: ['borrower.co_borrower_name', 'borrower_information.co_borrower_name', 'co_borrower', 'co_borrower_name'],
    additionalNotes: ['additional_notes', 'notes', 'loan_details.notes', 'comments', 'remarks'],
  }

  const fields: Record<string, any> = {}
  const confidenceScores: Record<string, number> = {}

  // Extract each field with confidence based on match quality
  for (const [fieldName, paths] of Object.entries(candidatePaths)) {
    for (let i = 0; i < paths.length; i++) {
      const value = getNestedValue(fileContent, paths[i])
      if (value !== undefined && value !== null && value !== '') {
        fields[fieldName] = value
        // Earlier paths in array = higher confidence
        // First path: 90%, second: 75%, third: 60%, rest: 50%
        confidenceScores[fieldName] = i === 0 ? 90 : i === 1 ? 75 : i === 2 ? 60 : 50
        break
      }
    }
  }

  const totalFields = Object.keys(candidatePaths).length
  const extractedFields = Object.keys(fields).length
  const overallConfidence = Math.round((extractedFields / totalFields) * 100)

  return {
    fields,
    confidenceScores,
    overallConfidence,
    extractedBy: 'frontend',
    warnings: extractedFields < totalFields / 2 ? ['Many fields could not be extracted. Manual review recommended.'] : []
  }
}

function getNestedValue(source: any, path: string): any {
  if (!source) return undefined
  const keys = path.split('.').filter(Boolean)
  let current: any = source
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }
  return current
}

/**
 * Smart extraction with backend AI + frontend fallback
 */
export async function smartExtractDocumentData(
  file: File,
  fileContent?: Record<string, any>
): Promise<SmartExtractionResult> {
  try {
    // Try backend AI first
    console.log('🤖 Attempting backend AI extraction...')
    const backendResult = await extractWithBackendAI(file)
    console.log('✅ Backend extraction successful:', backendResult)
    return backendResult
  } catch (error) {
    console.warn('⚠️ Backend extraction failed, using frontend fallback:', error)

    // Fallback to frontend extraction
    if (fileContent) {
      return extractWithFrontendFallback(fileContent)
    }

    // If no file content provided, try to read the file
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      return extractWithFrontendFallback(parsed)
    } catch (parseError) {
      console.error('Failed to parse file for frontend fallback:', parseError)
      throw new Error('Could not extract data from file')
    }
  }
}

// ============================================================================
// BUILD ENHANCED METADATA WITH CONFIDENCE SCORES
// ============================================================================

export function buildEnhancedAutoPopulateMetadata(
  extractionResult: SmartExtractionResult
): EnhancedAutoPopulateMetadata {
  const { fields, confidenceScores, extractedBy } = extractionResult

  // Helper to create FieldConfidence objects
  const createField = (
    fieldName: string,
    sanitizer: (val: any) => any,
    defaultValue: any = ''
  ): FieldConfidence => {
    const rawValue = fields[fieldName]
    const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== ''
    const confidence = confidenceScores[fieldName] || (hasValue ? 50 : 0)

    return {
      value: sanitizer(rawValue || defaultValue),
      confidence,
      source: extractedBy === 'backend' ? 'backend_ai' : 'frontend_fallback',
      extractedFrom: hasValue ? fieldName : undefined
    }
  }

  // Handle address extraction (might be nested object)
  const addressSource = fields.borrowerAddress || fields['borrower.address'] || fields.address || {}

  return {
    // Loan Information
    loanId: createField('loanId', sanitizeText),
    documentType: createField('documentType', sanitizeDocumentType, 'loan_application'),
    loanAmount: createField('loanAmount', (v) => sanitizeNumber(String(v || ''), 'loan_amount')),
    loanTerm: createField('loanTerm', (v) => sanitizeNumber(String(v || ''), 'loan_term')),
    interestRate: createField('interestRate', (v) => sanitizeNumber(String(v || ''), 'interest_rate')),

    // Borrower Personal Info
    borrowerName: createField('borrowerFullName', sanitizeText),
    borrowerEmail: createField('borrowerEmail', sanitizeEmail),
    borrowerPhone: createField('borrowerPhone', sanitizePhone),
    borrowerDateOfBirth: createField('borrowerDob', sanitizeDate),

    // Borrower Address
    borrowerStreetAddress: {
      value: sanitizeAddress(addressSource.street || addressSource.line1 || ''),
      confidence: addressSource.street ? 80 : 0,
      source: extractedBy === 'backend' ? 'backend_ai' : 'frontend_fallback',
      extractedFrom: 'borrower.address.street'
    },
    borrowerCity: {
      value: sanitizeCity(addressSource.city || ''),
      confidence: addressSource.city ? 80 : 0,
      source: extractedBy === 'backend' ? 'backend_ai' : 'frontend_fallback',
      extractedFrom: 'borrower.address.city'
    },
    borrowerState: {
      value: sanitizeState(addressSource.state || ''),
      confidence: addressSource.state ? 80 : 0,
      source: extractedBy === 'backend' ? 'backend_ai' : 'frontend_fallback',
      extractedFrom: 'borrower.address.state'
    },
    borrowerZipCode: {
      value: sanitizeZipCode(addressSource.zip_code || addressSource.postal_code || ''),
      confidence: addressSource.zip_code || addressSource.postal_code ? 80 : 0,
      source: extractedBy === 'backend' ? 'backend_ai' : 'frontend_fallback',
      extractedFrom: 'borrower.address.zip_code'
    },
    borrowerCountry: {
      value: sanitizeCountry(addressSource.country || 'US'),
      confidence: addressSource.country ? 90 : 50, // Default US = medium confidence
      source: extractedBy === 'backend' ? 'backend_ai' : 'frontend_fallback',
      extractedFrom: 'borrower.address.country'
    },

    // Borrower KYC
    borrowerSSNLast4: createField('borrowerSSN', sanitizeSSNLast4),
    borrowerGovernmentIdType: createField('idType', sanitizeGovernmentIdType, 'drivers_license'),
    borrowerIdNumberLast4: createField('idLast4', sanitizeSSNLast4),

    // Borrower Employment
    borrowerEmploymentStatus: createField('employmentStatus', sanitizeEmploymentStatus, 'employed'),
    borrowerAnnualIncome: createField('annualIncome', (v) => sanitizeNumber(String(v || ''), 'loan_amount')),
    borrowerCoBorrowerName: createField('coBorrowerName', sanitizeText),

    // Property
    propertyAddress: createField('propertyStreet', sanitizeAddress),

    // Notes
    additionalNotes: createField('additionalNotes', sanitizeNotes),

    // Metadata
    extractionMetadata: {
      overallConfidence: extractionResult.overallConfidence,
      extractedBy: extractionResult.extractedBy,
      timestamp: new Date().toISOString(),
      warnings: extractionResult.warnings || []
    }
  }
}

// ============================================================================
// CONFIDENCE BADGE HELPERS
// ============================================================================

export function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 80) return 'green'
  if (confidence >= 60) return 'yellow'
  if (confidence >= 40) return 'orange'
  return 'red'
}

export function getConfidenceBadgeText(confidence: number): string {
  if (confidence >= 80) return 'High'
  if (confidence >= 60) return 'Medium'
  if (confidence >= 40) return 'Low'
  return 'Very Low'
}

export function shouldHighlightField(confidence: number): boolean {
  return confidence < 60 // Highlight for manual review if confidence < 60%
}

// ============================================================================
// BULK FILE ANALYSIS
// ============================================================================

export interface BulkFileAnalysis {
  fileName: string
  fileSize: number
  extractionResult: SmartExtractionResult
  metadata: EnhancedAutoPopulateMetadata
  completeness: number // Percentage of fields filled
  needsReview: boolean // True if confidence < 60% or completeness < 70%
  missingFields: string[]
}

/**
 * Analyze multiple files in parallel
 */
export async function analyzeBulkFiles(files: File[]): Promise<BulkFileAnalysis[]> {
  console.log(`📊 Analyzing ${files.length} files in parallel...`)

  const analysisPromises = files.map(async (file) => {
    try {
      // Read file content
      const text = await file.text()
      const fileContent = JSON.parse(text)

      // Extract with smart extraction
      const extractionResult = await smartExtractDocumentData(file, fileContent)

      // Build metadata
      const metadata = buildEnhancedAutoPopulateMetadata(extractionResult)

      // Calculate completeness
      const allFields = Object.keys(metadata).filter(k => k !== 'extractionMetadata')
      const filledFields = allFields.filter(k => {
        const field = metadata[k as keyof EnhancedAutoPopulateMetadata] as FieldConfidence
        return field.value && field.value !== '' && field.confidence > 0
      })
      const completeness = Math.round((filledFields.length / allFields.length) * 100)

      // Find missing fields
      const missingFields = allFields.filter(k => {
        const field = metadata[k as keyof EnhancedAutoPopulateMetadata] as FieldConfidence
        return !field.value || field.value === '' || field.confidence === 0
      })

      // Determine if needs review
      const needsReview = extractionResult.overallConfidence < 60 || completeness < 70

      return {
        fileName: file.name,
        fileSize: file.size,
        extractionResult,
        metadata,
        completeness,
        needsReview,
        missingFields
      }
    } catch (error) {
      console.error(`Error analyzing ${file.name}:`, error)
      // Return failed analysis
      return {
        fileName: file.name,
        fileSize: file.size,
        extractionResult: {
          fields: {},
          confidenceScores: {},
          overallConfidence: 0,
          extractedBy: 'frontend' as const,
          warnings: [`Failed to analyze: ${error}`]
        },
        metadata: {} as any,
        completeness: 0,
        needsReview: true,
        missingFields: []
      }
    }
  })

  const results = await Promise.all(analysisPromises)
  console.log(`✅ Bulk analysis complete. ${results.filter(r => !r.needsReview).length}/${files.length} files complete`)

  return results
}

/**
 * Get aggregated missing fields across all files
 */
export function getAggregatedMissingFields(analyses: BulkFileAnalysis[]): Record<string, number> {
  const fieldCounts: Record<string, number> = {}

  for (const analysis of analyses) {
    for (const field of analysis.missingFields) {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1
    }
  }

  return fieldCounts
}

/**
 * Generate smart suggestions from other files
 */
export function generateSmartSuggestions(
  currentFile: BulkFileAnalysis,
  allFiles: BulkFileAnalysis[],
  fieldName: string
): Array<{ value: any; frequency: number; source: string }> {
  const suggestions: Record<string, { value: any; count: number; sources: string[] }> = {}

  for (const file of allFiles) {
    if (file.fileName === currentFile.fileName) continue

    const field = file.metadata[fieldName as keyof EnhancedAutoPopulateMetadata] as FieldConfidence
    if (field && field.value && field.value !== '' && field.confidence >= 60) {
      const key = String(field.value)
      if (!suggestions[key]) {
        suggestions[key] = { value: field.value, count: 0, sources: [] }
      }
      suggestions[key].count++
      suggestions[key].sources.push(file.fileName)
    }
  }

  // Convert to array and sort by frequency
  return Object.values(suggestions)
    .map(s => ({
      value: s.value,
      frequency: s.count,
      source: s.sources[0] // First file that had this value
    }))
    .sort((a, b) => b.frequency - a.frequency)
}

/**
 * Detect if same borrower across files (for auto-copy KYC data)
 */
export function detectSameBorrower(
  file1: BulkFileAnalysis,
  file2: BulkFileAnalysis
): { isSame: boolean; confidence: number; matchedFields: string[] } {
  const matchedFields: string[] = []
  let matchScore = 0
  const totalChecks = 3 // Name, Email, Phone

  // Check name
  if (
    file1.metadata.borrowerName.value &&
    file2.metadata.borrowerName.value &&
    file1.metadata.borrowerName.value.toLowerCase() === file2.metadata.borrowerName.value.toLowerCase()
  ) {
    matchedFields.push('name')
    matchScore++
  }

  // Check email
  if (
    file1.metadata.borrowerEmail.value &&
    file2.metadata.borrowerEmail.value &&
    file1.metadata.borrowerEmail.value.toLowerCase() === file2.metadata.borrowerEmail.value.toLowerCase()
  ) {
    matchedFields.push('email')
    matchScore++
  }

  // Check phone
  if (
    file1.metadata.borrowerPhone.value &&
    file2.metadata.borrowerPhone.value &&
    normalizePhone(file1.metadata.borrowerPhone.value) === normalizePhone(file2.metadata.borrowerPhone.value)
  ) {
    matchedFields.push('phone')
    matchScore++
  }

  const confidence = Math.round((matchScore / totalChecks) * 100)
  const isSame = matchScore >= 2 // At least 2 of 3 fields match

  return { isSame, confidence, matchedFields }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '') // Remove all non-digits
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  FieldConfidence,
  SmartExtractionResult,
  EnhancedAutoPopulateMetadata,
  BulkFileAnalysis,
}
