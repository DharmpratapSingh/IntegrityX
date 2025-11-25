// Data sanitization utilities for GENIUS ACT 2025 compliance

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text.trim().replace(/[<>]/g, '');
}

export function sanitizeTextarea(text: string): string {
  if (!text) return '';
  // For textarea fields, preserve spaces but remove only dangerous characters
  // Don't trim during typing - only remove < and > for security
  return text.replace(/[<>]/g, '');
}

export function sanitizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase().replace(/[<>]/g, '');
}

export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
}

export function sanitizeNumber(value: string): string {
  if (!value) return '';
  return value.replace(/[^\d.]/g, '');
}

export function sanitizeDate(date: string): string {
  if (!date) return '';
  return date.trim();
}

export function sanitizeSSNLast4(ssn: string): string {
  if (!ssn) return '';
  return ssn.replace(/[^\d]/g, '').slice(-4);
}

export function sanitizeZipCode(zip: string): string {
  if (!zip) return '';
  return zip.replace(/[^\d\-]/g, '').trim();
}

export function sanitizeAddress(address: string): string {
  if (!address) return '';
  // Preserve spaces in addresses, only remove dangerous characters
  return address.replace(/[<>]/g, '');
}

export function sanitizeCity(city: string): string {
  if (!city) return '';
  // Preserve spaces in city names (e.g., "New York", "Los Angeles")
  return city.replace(/[<>]/g, '');
}

export function sanitizeState(state: string): string {
  if (!state) return '';
  // Preserve spaces in state names (e.g., "New York", "North Carolina")
  return state.replace(/[<>]/g, '');
}

export function sanitizeCountry(country: string): string {
  if (!country) return '';
  return country.trim().replace(/[<>]/g, '');
}

export function sanitizeEmploymentStatus(status: string): string {
  if (!status) return '';
  return status.trim().replace(/[<>]/g, '');
}

export function sanitizeGovernmentIdType(type: string): string {
  if (!type) return '';
  return type.trim().replace(/[<>]/g, '');
}

export function sanitizeDocumentType(type: string): string {
  if (!type) return '';
  return type.trim().replace(/[<>]/g, '');
}

export function sanitizeNotes(notes: string): string {
  if (!notes) return '';
  return notes.trim().replace(/[<>]/g, '');
}

export function sanitizeFormData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      switch (key.toLowerCase()) {
        case 'email':
        case 'emailaddress':
          sanitized[key] = sanitizeEmail(value);
          break;
        case 'phone':
        case 'phonenumber':
          sanitized[key] = sanitizePhone(value);
          break;
        case 'ssn':
        case 'ssnlast4':
          sanitized[key] = sanitizeSSNLast4(value);
          break;
        case 'zip':
        case 'zipcode':
        case 'postalzipcode':
          sanitized[key] = sanitizeZipCode(value);
          break;
        case 'address':
        case 'streetaddress':
        case 'streetaddress1':
          sanitized[key] = sanitizeAddress(value);
          break;
        case 'city':
          sanitized[key] = sanitizeCity(value);
          break;
        case 'state':
        case 'stateprovince':
          sanitized[key] = sanitizeState(value);
          break;
        case 'country':
          sanitized[key] = sanitizeCountry(value);
          break;
        case 'employmentstatus':
          sanitized[key] = sanitizeEmploymentStatus(value);
          break;
        case 'governmentidtype':
        case 'identificationtype':
          sanitized[key] = sanitizeGovernmentIdType(value);
          break;
        case 'documenttype':
          sanitized[key] = sanitizeDocumentType(value);
          break;
        case 'notes':
        case 'additionalnotes':
          sanitized[key] = sanitizeNotes(value);
          break;
        default:
          sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}