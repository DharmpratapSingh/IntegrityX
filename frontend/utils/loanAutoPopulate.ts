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

const candidatePaths: Record<string, string[]> = {
  loanId: [
    'loan_id',
    'loanId',
    'application_id',
    'loan_details.loan_id',
    'loanDetails.loanId',
  ],
  documentType: [
    'document_type',
    'documentType',
    'loan_details.document_type',
  ],
  loanAmount: [
    'loan_amount',
    'loanAmount',
    'loan_details.loan_amount',
    'loanDetails.loanAmount',
  ],
  loanTerm: [
    'loan_term',
    'loanTerm',
    'loan_term_months',
    'loan_details.loan_term_months',
  ],
  interestRate: [
    'interest_rate',
    'interestRate',
    'loan_details.interest_rate',
  ],
  propertyStreet: [
    'property_address',
    'propertyAddress',
    'property_information.property_address',
    'property.address',
  ],
  borrowerFullName: [
    'borrower.full_name',
    'borrower.name',
    'borrowerName',
    'borrower_information.personal_details.full_name',
    'borrowerInformation.personalDetails.fullName',
  ],
  borrowerEmail: [
    'borrower.email',
    'borrower_information.personal_details.email',
    'borrowerInformation.personalDetails.email',
  ],
  borrowerPhone: [
    'borrower.phone',
    'borrower_information.personal_details.phone',
    'borrowerInformation.personalDetails.phone',
  ],
  borrowerDob: [
    'borrower.date_of_birth',
    'borrower_information.personal_details.date_of_birth',
    'borrowerInformation.personalDetails.dateOfBirth',
  ],
  borrowerSSN: [
    'borrower.ssn_last4',
    'borrower_information.personal_details.ssn_last4',
  ],
  idType: [
    'borrower.id_type',
    'borrower_information.identification.id_type',
  ],
  idLast4: [
    'borrower.id_last4',
    'borrower_information.identification.id_last4',
  ],
  employmentStatus: [
    'borrower.employment_status',
    'borrower_information.employment.status',
  ],
  annualIncome: [
    'borrower.annual_income',
    'borrower_information.employment.annual_income',
  ],
  coBorrowerName: [
    'borrower.co_borrower_name',
    'borrower_information.co_borrower_name',
  ],
  additionalNotes: [
    'additional_notes',
    'notes',
    'loan_details.notes',
  ],
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

function pickFirst(source: any, paths: string[], fallback?: any) {
  for (const path of paths) {
    const value = getNestedValue(source, path)
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return fallback
}

export interface AutoPopulateMetadata {
  loanId: string
  documentType: string
  loanAmount: string
  loanTerm: string
  interestRate: string
  borrowerName: string
  borrowerEmail: string
  borrowerPhone: string
  borrowerDateOfBirth: string
  borrowerStreetAddress: string
  borrowerCity: string
  borrowerState: string
  borrowerZipCode: string
  borrowerCountry: string
  borrowerSSNLast4: string
  borrowerGovernmentIdType: string
  borrowerIdNumberLast4: string
  borrowerEmploymentStatus: string
  borrowerAnnualIncome: string
  borrowerCoBorrowerName: string
  propertyAddress: string
  additionalNotes: string
}

export function buildAutoPopulateMetadata(
  raw: Record<string, any>,
  current: Record<string, any> = {}
): AutoPopulateMetadata {
  const loanId = pickFirst(raw, candidatePaths.loanId, current.loanId)
  const documentType = pickFirst(raw, candidatePaths.documentType, current.documentType || 'loan_application')
  const loanAmount = pickFirst(raw, candidatePaths.loanAmount, current.loanAmount)
  const loanTerm = pickFirst(raw, candidatePaths.loanTerm, current.loanTerm)
  const interestRate = pickFirst(raw, candidatePaths.interestRate, current.interestRate)
  const borrowerName = pickFirst(raw, candidatePaths.borrowerFullName, current.borrowerFullName)
  const borrowerEmail = pickFirst(raw, candidatePaths.borrowerEmail, current.borrowerEmail)
  const borrowerPhone = pickFirst(raw, candidatePaths.borrowerPhone, current.borrowerPhone)
  const borrowerDateOfBirth = pickFirst(raw, candidatePaths.borrowerDob, current.borrowerDateOfBirth)
  const borrowerSSNLast4 = pickFirst(raw, candidatePaths.borrowerSSN, current.borrowerSSNLast4)
  const borrowerGovernmentIdType = pickFirst(raw, candidatePaths.idType, current.borrowerGovernmentIdType)
  const borrowerIdNumberLast4 = pickFirst(raw, candidatePaths.idLast4, current.borrowerIdNumberLast4)
  const borrowerEmploymentStatus = pickFirst(raw, candidatePaths.employmentStatus, current.borrowerEmploymentStatus)
  const borrowerAnnualIncome = pickFirst(raw, candidatePaths.annualIncome, current.borrowerAnnualIncome)
  const borrowerCoBorrowerName = pickFirst(raw, candidatePaths.coBorrowerName, current.borrowerCoBorrowerName)
  const propertyAddress = pickFirst(raw, candidatePaths.propertyStreet, current.propertyAddress)
  const additionalNotes = pickFirst(raw, candidatePaths.additionalNotes, current.additionalNotes)

  const formatAddress = (value: any): string => {
    if (!value || typeof value === 'string') {
      return value || ''
    }
    const parts = [value.street, value.city, value.state, value.zip_code || value.postal_code, value.country]
    return parts.filter(Boolean).join(', ')
  }

  const addressSource =
    getNestedValue(raw, 'borrower_information.address') ||
    getNestedValue(raw, 'borrowerInformation.address') ||
    getNestedValue(raw, 'borrower.address') ||
    current

  return {
    loanId: sanitizeText(loanId || ''),
    documentType: sanitizeDocumentType(documentType || 'loan_application'),
    loanAmount: sanitizeNumber(String(loanAmount ?? ''), 'loan_amount'),
    loanTerm: sanitizeNumber(String(loanTerm ?? ''), 'loan_term'),
    interestRate: sanitizeNumber(String(interestRate ?? ''), 'interest_rate'),
    borrowerName: sanitizeText(borrowerName || ''),
    borrowerEmail: sanitizeEmail(borrowerEmail || ''),
    borrowerPhone: sanitizePhone(borrowerPhone || ''),
    borrowerDateOfBirth: sanitizeDate(borrowerDateOfBirth || ''),
    borrowerStreetAddress: sanitizeAddress(
      getNestedValue(addressSource, 'street') || getNestedValue(addressSource, 'line1') || current.borrowerStreetAddress || ''
    ),
    borrowerCity: sanitizeCity(
      getNestedValue(addressSource, 'city') || current.borrowerCity || ''
    ),
    borrowerState: sanitizeState(
      getNestedValue(addressSource, 'state') || current.borrowerState || ''
    ),
    borrowerZipCode: sanitizeZipCode(
      getNestedValue(addressSource, 'zip_code') || getNestedValue(addressSource, 'postal_code') || current.borrowerZipCode || ''
    ),
    borrowerCountry: sanitizeCountry(
      getNestedValue(addressSource, 'country') || current.borrowerCountry || 'US'
    ),
    borrowerSSNLast4: sanitizeSSNLast4(borrowerSSNLast4 || ''),
    borrowerGovernmentIdType: sanitizeGovernmentIdType(borrowerGovernmentIdType || 'drivers_license'),
    borrowerIdNumberLast4: sanitizeSSNLast4(borrowerIdNumberLast4 || ''),
    borrowerEmploymentStatus: sanitizeEmploymentStatus(borrowerEmploymentStatus || 'employed'),
    borrowerAnnualIncome: sanitizeNumber(String(borrowerAnnualIncome ?? ''), 'loan_amount'),
    borrowerCoBorrowerName: sanitizeText(borrowerCoBorrowerName || ''),
    propertyAddress: sanitizeAddress(
      formatAddress(propertyAddress)
    ),
    additionalNotes: sanitizeNotes(additionalNotes || ''),
  }
}
