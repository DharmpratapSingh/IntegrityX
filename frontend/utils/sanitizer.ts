/**
 * Frontend data sanitization utilities
 *
 * Provides client-side sanitization to prevent XSS attacks and ensure
 * data integrity when auto-populating forms from extracted document data.
 */

/**
 * Data Sanitizer class for client-side security
 */
export class DataSanitizer {
  // Maximum field lengths (must match backend limits)
  private static readonly MAX_LENGTHS = {
    loanId: 50,
    borrowerName: 100,
    propertyAddress: 200,
    amount: 20,
    rate: 10,
    term: 10,
    documentType: 50,
    notes: 1000
  };

  /**
   * Remove HTML tags and potentially malicious content
   * Note: For production, use DOMPurify library for more robust XSS protection
   */
  private static stripHTML(value: string): string {
    // Create a temporary div element
    const temp = document.createElement('div');
    temp.textContent = value;
    return temp.innerHTML;
  }

  /**
   * Sanitize string to prevent XSS attacks
   */
  static sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') return '';

    // 1. Trim whitespace
    let clean = value.trim();

    // 2. Remove null bytes and control characters
    clean = clean.replace(/\x00/g, '');
    clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // 3. HTML encode special characters
    clean = clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return clean;
  }

  /**
   * Sanitize number (ensure it's a valid number string)
   */
  static sanitizeNumber(value: string | number): string {
    const numStr = String(value).replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = numStr.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }

    // Validate it's a valid number
    const num = parseFloat(numStr);
    if (isNaN(num)) return '';

    return numStr;
  }

  /**
   * Validate and sanitize loan ID
   * Allows: alphanumeric, underscore, hyphen
   */
  static sanitizeLoanId(value: string): string {
    if (!value) return '';

    const clean = this.sanitizeString(value);

    // Allow only alphanumeric, underscore, hyphen
    const sanitized = clean
      .replace(/[^A-Za-z0-9_-]/g, '')
      .substring(0, this.MAX_LENGTHS.loanId);

    return sanitized;
  }

  /**
   * Validate and sanitize borrower name
   * Allows: letters, spaces, hyphens, apostrophes, periods
   */
  static sanitizeBorrowerName(value: string): string {
    if (!value) return '';

    const clean = this.sanitizeString(value);

    // Allow letters, spaces, hyphens, apostrophes, periods
    const sanitized = clean
      .replace(/[^A-Za-z\s\-'.]/g, '')
      .substring(0, this.MAX_LENGTHS.borrowerName);

    return sanitized;
  }

  /**
   * Validate and sanitize address
   * Allows: alphanumeric, spaces, commas, periods, hyphens, hash
   */
  static sanitizeAddress(value: string): string {
    if (!value) return '';

    const clean = this.sanitizeString(value);

    // Allow alphanumeric, spaces, commas, periods, hyphens, hash
    const sanitized = clean
      .replace(/[^A-Za-z0-9\s,.\-#]/g, '')
      .substring(0, this.MAX_LENGTHS.propertyAddress);

    return sanitized;
  }

  /**
   * Validate and sanitize loan amount
   */
  static sanitizeLoanAmount(value: string | number): string {
    const sanitized = this.sanitizeNumber(value);

    // Limit decimal places to 2
    const parts = sanitized.split('.');
    if (parts.length > 1) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }

    return sanitized.substring(0, this.MAX_LENGTHS.amount);
  }

  /**
   * Validate and sanitize interest rate
   */
  static sanitizeInterestRate(value: string | number): string {
    const sanitized = this.sanitizeNumber(value);

    // Validate range (0-100%)
    const rate = parseFloat(sanitized);
    if (!isNaN(rate) && (rate < 0 || rate > 100)) {
      return '0';
    }

    // Limit decimal places to 4
    const parts = sanitized.split('.');
    if (parts.length > 1) {
      return parts[0] + '.' + parts[1].substring(0, 4);
    }

    return sanitized.substring(0, this.MAX_LENGTHS.rate);
  }

  /**
   * Validate and sanitize loan term (months)
   */
  static sanitizeLoanTerm(value: string | number): string {
    // Remove all non-digits
    const sanitized = String(value).replace(/[^\d]/g, '');

    // Validate range (1-360 months = 30 years)
    const term = parseInt(sanitized, 10);
    if (!isNaN(term) && (term < 0 || term > 360)) {
      return '0';
    }

    return sanitized.substring(0, this.MAX_LENGTHS.term);
  }

  /**
   * Validate and sanitize document type
   */
  static sanitizeDocumentType(value: string): string {
    if (!value) return '';

    const clean = this.sanitizeString(value);

    // Allow only alphanumeric and underscores
    return clean
      .replace(/[^A-Za-z0-9_]/g, '')
      .toLowerCase()
      .substring(0, this.MAX_LENGTHS.documentType);
  }

  /**
   * Sanitize notes/description field
   */
  static sanitizeNotes(value: string): string {
    if (!value) return '';

    const clean = this.sanitizeString(value);
    return clean.substring(0, this.MAX_LENGTHS.notes);
  }

  /**
   * Sanitize extracted data from backend
   * This is the main method to use for auto-populate feature
   */
  static sanitizeExtractedData(data: any): {
    loanId: string;
    documentType: string;
    borrowerName: string;
    propertyAddress: string;
    amount: string;
    rate: string;
    term: string;
  } {
    if (!data || typeof data !== 'object') {
      return {
        loanId: '',
        documentType: '',
        borrowerName: '',
        propertyAddress: '',
        amount: '',
        rate: '',
        term: ''
      };
    }

    return {
      loanId: data.loanId ? this.sanitizeLoanId(data.loanId) : '',
      documentType: data.documentType ? this.sanitizeDocumentType(data.documentType) : '',
      borrowerName: data.borrowerName ? this.sanitizeBorrowerName(data.borrowerName) : '',
      propertyAddress: data.propertyAddress ? this.sanitizeAddress(data.propertyAddress) : '',
      amount: data.amount ? this.sanitizeLoanAmount(data.amount) : '',
      rate: data.rate ? this.sanitizeInterestRate(data.rate) : '',
      term: data.term ? this.sanitizeLoanTerm(data.term) : ''
    };
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 50MB`
      };
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    // Check file name
    if (!file.name || file.name.length > 255) {
      return {
        valid: false,
        error: 'Invalid file name'
      };
    }

    return { valid: true };
  }
}

/**
 * Example usage:
 *
 * import { DataSanitizer } from '@/utils/sanitizer';
 *
 * // Sanitize extracted data before using
 * const extractedData = { ... }; // From backend
 * const sanitized = DataSanitizer.sanitizeExtractedData(extractedData);
 *
 * // Set form data with sanitized values
 * setFormData(sanitized);
 *
 * // Validate file before upload
 * const validation = DataSanitizer.validateFile(file);
 * if (!validation.valid) {
 *   toast.error(validation.error);
 * }
 */
