/**
 * INTELLIGENT FIELD EXTRACTOR
 * Works with ANY JSON structure by using semantic understanding
 * instead of hardcoded field paths
 */

// ============================================================================
// SEMANTIC FIELD DEFINITIONS
// ============================================================================

interface FieldPattern {
  keywords: string[]          // Field name variations
  patterns?: RegExp[]         // Value patterns (for validation)
  dataType: 'string' | 'number' | 'date' | 'email' | 'phone' | 'ssn'
  contextClues?: string[]     // Parent object names that indicate this field
  aliases?: string[]          // Synonyms and common variations
}

const FIELD_PATTERNS: Record<string, FieldPattern> = {
  loanId: {
    keywords: ['loan', 'id', 'number', 'application', 'reference', 'loan_id', 'loanid', 'app_id', 'application_id', 'loan_number', 'application_number'],
    dataType: 'string',
    contextClues: ['loan', 'application'],
    aliases: ['loan id', 'loan number', 'application id', 'reference number']
  },

  loanAmount: {
    keywords: ['amount', 'loan_amount', 'loanamount', 'principal', 'requested', 'loan_amount_requested'],
    patterns: [/^\$?[\d,]+\.?\d*$/],
    dataType: 'number',
    contextClues: ['loan', 'amount'],
    aliases: ['loan amount', 'principal amount', 'requested amount']
  },

  interestRate: {
    keywords: ['rate', 'interest', 'apr', 'interest_rate', 'interestrate', 'annual_rate'],
    patterns: [/^\d+\.?\d*%?$/],
    dataType: 'number',
    contextClues: ['loan', 'rate', 'interest'],
    aliases: ['interest rate', 'apr', 'annual percentage rate']
  },

  loanTerm: {
    keywords: ['term', 'duration', 'months', 'period', 'loan_term', 'term_months', 'loan_duration'],
    dataType: 'number',
    contextClues: ['loan', 'term'],
    aliases: ['loan term', 'term months', 'duration']
  },

  borrowerEmail: {
    keywords: ['email', 'mail', 'e-mail', 'email_address', 'emailaddress', 'contact_email'],
    patterns: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/],
    dataType: 'email',
    contextClues: ['borrower', 'contact', 'personal'],
    aliases: ['email address', 'e-mail', 'contact email']
  },

  borrowerPhone: {
    keywords: ['phone', 'telephone', 'mobile', 'cell', 'contact', 'phone_number', 'phonenumber', 'tel'],
    patterns: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/],
    dataType: 'phone',
    contextClues: ['borrower', 'contact', 'personal'],
    aliases: ['phone number', 'telephone', 'mobile number', 'cell phone']
  },

  borrowerName: {
    keywords: ['name', 'full_name', 'fullname', 'borrower_name', 'borrowername', 'applicant_name', 'customer_name'],
    dataType: 'string',
    contextClues: ['borrower', 'applicant', 'customer', 'personal'],
    aliases: ['full name', 'borrower name', 'applicant name']
  },

  borrowerDateOfBirth: {
    keywords: ['dob', 'birth', 'birthdate', 'date_of_birth', 'dateofbirth', 'birth_date'],
    patterns: [/^\d{4}-\d{2}-\d{2}$/, /^\d{2}\/\d{2}\/\d{4}$/],
    dataType: 'date',
    contextClues: ['borrower', 'personal'],
    aliases: ['date of birth', 'birth date', 'dob']
  },

  borrowerSSNLast4: {
    keywords: ['ssn', 'social', 'last4', 'ssn_last4', 'social_security'],
    patterns: [/^\d{4}$/],
    dataType: 'ssn',
    contextClues: ['borrower', 'identification'],
    aliases: ['ssn last 4', 'social security', 'last 4 digits']
  },

  borrowerStreetAddress: {
    keywords: ['address', 'street', 'line1', 'address_line1', 'street_address', 'streetaddress'],
    dataType: 'string',
    contextClues: ['borrower', 'address', 'location'],
    aliases: ['street address', 'address line 1', 'street']
  },

  borrowerCity: {
    keywords: ['city', 'town', 'municipality'],
    dataType: 'string',
    contextClues: ['address', 'location'],
    aliases: ['city', 'town']
  },

  borrowerState: {
    keywords: ['state', 'province', 'region'],
    dataType: 'string',
    contextClues: ['address', 'location'],
    aliases: ['state', 'province', 'region']
  },

  borrowerZipCode: {
    keywords: ['zip', 'postal', 'zipcode', 'postalcode', 'zip_code', 'postal_code'],
    patterns: [/^\d{5}(-\d{4})?$/],
    dataType: 'string',
    contextClues: ['address', 'location'],
    aliases: ['zip code', 'postal code', 'zip']
  },

  borrowerCountry: {
    keywords: ['country', 'nation'],
    dataType: 'string',
    contextClues: ['address', 'location'],
    aliases: ['country']
  },

  borrowerAnnualIncome: {
    keywords: ['income', 'salary', 'annual_income', 'annualincome', 'yearly_income', 'earnings'],
    patterns: [/^\$?[\d,]+\.?\d*$/],
    dataType: 'number',
    contextClues: ['borrower', 'employment', 'financial'],
    aliases: ['annual income', 'yearly income', 'salary']
  },

  borrowerEmploymentStatus: {
    keywords: ['employment', 'status', 'employed', 'employment_status', 'employmentstatus', 'job_status'],
    dataType: 'string',
    contextClues: ['borrower', 'employment'],
    aliases: ['employment status', 'job status']
  },

  propertyAddress: {
    keywords: ['property', 'collateral', 'property_address', 'propertyaddress', 'subject_property'],
    dataType: 'string',
    contextClues: ['property', 'collateral'],
    aliases: ['property address', 'collateral address', 'subject property']
  },

  documentType: {
    keywords: ['document', 'type', 'doc_type', 'documenttype', 'document_type', 'category'],
    dataType: 'string',
    aliases: ['document type', 'doc type', 'category']
  }
}

// ============================================================================
// INTELLIGENT SEARCH ENGINE
// ============================================================================

/**
 * Recursively search JSON for values matching field patterns
 */
function deepSearchJSON(
  obj: any,
  fieldName: string,
  pattern: FieldPattern,
  path: string = '',
  results: Array<{ value: any; path: string; confidence: number }> = []
): Array<{ value: any; path: string; confidence: number }> {

  if (!obj || typeof obj !== 'object') return results

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key
    const keyLower = key.toLowerCase().replace(/[_\s-]/g, '')

    // Calculate match confidence
    let confidence = 0

    // 1. Exact keyword match
    if (pattern.keywords.some(kw => keyLower === kw.toLowerCase().replace(/[_\s-]/g, ''))) {
      confidence = 95
    }
    // 2. Partial keyword match
    else if (pattern.keywords.some(kw => keyLower.includes(kw.toLowerCase().replace(/[_\s-]/g, '')))) {
      confidence = 75
    }
    // 3. Alias match
    else if (pattern.aliases?.some(alias => keyLower.includes(alias.toLowerCase().replace(/[_\s-]/g, '')))) {
      confidence = 70
    }
    // 4. Context clue match (parent object names)
    else if (pattern.contextClues?.some(clue => path.toLowerCase().includes(clue.toLowerCase()))) {
      if (pattern.keywords.some(kw => keyLower.includes(kw.toLowerCase().replace(/[_\s-]/g, '')))) {
        confidence = 60
      }
    }

    // If we have a potential match, validate the value
    if (confidence > 0 && value !== null && value !== undefined) {
      const valueStr = String(value).trim()

      // Validate against patterns if provided
      if (pattern.patterns && pattern.patterns.length > 0) {
        const matchesPattern = pattern.patterns.some(p => p.test(valueStr))
        if (matchesPattern) {
          confidence += 10 // Boost confidence for pattern match
        } else {
          confidence -= 20 // Reduce confidence for pattern mismatch
        }
      }

      // Validate against data type
      const typeValid = validateDataType(value, pattern.dataType)
      if (!typeValid) {
        confidence -= 15
      }

      // Only add if confidence is still positive and value is meaningful
      if (confidence > 40 && valueStr !== '' && valueStr !== 'null' && valueStr !== 'undefined') {
        results.push({ value, path: currentPath, confidence })
      }
    }

    // Recursively search nested objects/arrays
    if (typeof value === 'object' && value !== null) {
      deepSearchJSON(value, fieldName, pattern, currentPath, results)
    }
  }

  return results
}

/**
 * Validate value against expected data type
 */
function validateDataType(value: any, dataType: string): boolean {
  const valueStr = String(value).trim()

  switch (dataType) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueStr)

    case 'phone':
      const cleaned = valueStr.replace(/[\s\-\(\)]/g, '')
      return /^[\+]?[1-9][\d]{7,14}$/.test(cleaned)

    case 'ssn':
      return /^\d{4}$/.test(valueStr) || /^\d{3}-\d{2}-\d{4}$/.test(valueStr)

    case 'date':
      const date = new Date(valueStr)
      return !isNaN(date.getTime())

    case 'number':
      const cleaned2 = valueStr.replace(/[$,]/g, '')
      return !isNaN(parseFloat(cleaned2))

    case 'string':
      return typeof value === 'string' || typeof value === 'number'

    default:
      return true
  }
}

/**
 * Extract best match for a field
 */
function extractBestMatch(
  obj: any,
  fieldName: string,
  pattern: FieldPattern
): { value: any; confidence: number; path: string } | null {

  const matches = deepSearchJSON(obj, fieldName, pattern)

  if (matches.length === 0) {
    return null
  }

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence)

  // Return the best match
  return matches[0]
}

// ============================================================================
// INTELLIGENT EXTRACTION API
// ============================================================================

export interface IntelligentExtractionResult {
  [fieldName: string]: {
    value: any
    confidence: number
    extractedFrom: string
    alternativeMatches?: Array<{ value: any; path: string; confidence: number }>
  }
}

/**
 * Extract all fields from ANY JSON structure using intelligent matching
 */
export function intelligentExtract(jsonData: any): IntelligentExtractionResult {
  console.log('🧠 Starting intelligent extraction...')

  const results: IntelligentExtractionResult = {}

  // Extract each field using semantic matching
  for (const [fieldName, pattern] of Object.entries(FIELD_PATTERNS)) {
    const allMatches = deepSearchJSON(jsonData, fieldName, pattern)

    if (allMatches.length > 0) {
      // Sort by confidence
      allMatches.sort((a, b) => b.confidence - a.confidence)

      const bestMatch = allMatches[0]

      results[fieldName] = {
        value: bestMatch.value,
        confidence: bestMatch.confidence,
        extractedFrom: bestMatch.path,
        alternativeMatches: allMatches.slice(1, 3) // Keep top 2 alternatives
      }

      console.log(`✅ Found ${fieldName}: "${bestMatch.value}" at ${bestMatch.path} (${bestMatch.confidence}% confidence)`)
    } else {
      results[fieldName] = {
        value: '',
        confidence: 0,
        extractedFrom: 'not_found'
      }

      console.log(`❌ Could not find ${fieldName}`)
    }
  }

  // Calculate overall confidence
  const totalFields = Object.keys(FIELD_PATTERNS).length
  const foundFields = Object.values(results).filter(r => r.confidence > 0).length
  const avgConfidence = Object.values(results).reduce((sum, r) => sum + r.confidence, 0) / totalFields

  console.log(`📊 Extraction complete: ${foundFields}/${totalFields} fields found (${Math.round(avgConfidence)}% avg confidence)`)

  return results
}

/**
 * Test the intelligent extractor with sample data
 */
export function testIntelligentExtractor() {
  // Test with various JSON structures
  const testCases = [
    {
      name: 'Standard structure',
      data: {
        loan_id: 'LOAN_123',
        loan_amount: 250000,
        borrower: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234'
        }
      }
    },
    {
      name: 'Deeply nested',
      data: {
        application: {
          details: {
            loanInformation: {
              id: 'APP_456',
              requestedAmount: 350000
            },
            applicantInfo: {
              personalDetails: {
                fullName: 'Jane Smith',
                contactEmail: 'jane@example.com'
              }
            }
          }
        }
      }
    },
    {
      name: 'Flat structure',
      data: {
        LoanID: 'LOAN_789',
        Amount: 150000,
        BorrowerName: 'Bob Johnson',
        Email: 'bob@test.com',
        Phone: '555-9876',
        DateOfBirth: '1980-05-15'
      }
    },
    {
      name: 'Mixed casing and separators',
      data: {
        'Loan-ID': 'L_001',
        'Loan Amount': 450000,
        'borrower_full_name': 'Alice Williams',
        'EMAIL_ADDRESS': 'alice@demo.com',
        Phone_Number: '555-4321'
      }
    }
  ]

  console.log('🧪 Testing intelligent extractor...\n')

  testCases.forEach(testCase => {
    console.log(`\n📋 Test: ${testCase.name}`)
    console.log('Input:', JSON.stringify(testCase.data, null, 2))
    console.log('\nExtracted fields:')

    const results = intelligentExtract(testCase.data)

    Object.entries(results).forEach(([field, result]) => {
      if (result.confidence > 0) {
        console.log(`  ✓ ${field}: "${result.value}" (${result.confidence}% from ${result.extractedFrom})`)
      }
    })
  })
}

// ============================================================================
// EXPORT FOR INTEGRATION
// ============================================================================

export { FIELD_PATTERNS, deepSearchJSON, extractBestMatch }
