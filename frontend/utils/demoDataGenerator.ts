/**
 * Demo Data Generator for IntegrityX
 * Generates realistic sample loan documents for demo purposes
 */

export interface DemoLoanDocument {
  loan_id: string;
  loan_amount: number;
  loan_term_months: number;
  interest_rate: number;
  property_address: string;
  borrower: {
    full_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    ssn_last4: string;
    id_type: string;
    id_last4: string;
    employment_status: string;
    annual_income: number;
    address: {
      street: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
  };
  loan_details: {
    loan_term_months: number;
    interest_rate: number;
    loan_amount: number;
    purpose: string;
    notes: string;
  };
  document_type: string;
  security_level?: 'standard' | 'quantum-safe' | 'maximum';
}

const sampleNames = [
  'Sarah Johnson',
  'Michael Chen',
  'Emily Rodriguez',
  'David Thompson',
  'Jessica Williams',
  'James Anderson',
  'Maria Garcia',
  'Robert Taylor'
];

const sampleStreets = [
  '1234 Oak Avenue',
  '5678 Maple Street',
  '9012 Elm Boulevard',
  '3456 Pine Road',
  '7890 Cedar Lane',
  '2345 Birch Drive'
];

const sampleCities = [
  { city: 'San Francisco', state: 'California', zip: '94102' },
  { city: 'Austin', state: 'Texas', zip: '78701' },
  { city: 'Seattle', state: 'Washington', zip: '98101' },
  { city: 'Denver', state: 'Colorado', zip: '80202' },
  { city: 'Portland', state: 'Oregon', zip: '97201' },
  { city: 'Boston', state: 'Massachusetts', zip: '02108' }
];

const loanPurposes = [
  'Primary residence purchase',
  'Investment property',
  'Home refinancing',
  'Construction loan',
  'Commercial property'
];

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  return `+1-${randomNumber(200, 999)}-${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`;
}

function generateEmail(name: string): string {
  const username = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
  return `${username}${randomNumber(1, 99)}@${randomItem(domains)}`;
}

function generateSSNLast4(): string {
  return randomNumber(1000, 9999).toString();
}

function generateDateOfBirth(): string {
  const year = randomNumber(1960, 1995);
  const month = String(randomNumber(1, 12)).padStart(2, '0');
  const day = String(randomNumber(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate a single demo loan document
 */
export function generateDemoLoanDocument(
  securityLevel: 'standard' | 'quantum-safe' | 'maximum' = 'standard'
): DemoLoanDocument {
  const loanId = generateUUID();
  const name = randomItem(sampleNames);
  const location = randomItem(sampleCities);
  const street = randomItem(sampleStreets);
  const loanAmount = randomNumber(100000, 1000000);
  const interestRate = Number((Math.random() * 5 + 3).toFixed(2)); // 3% - 8%
  const loanTerm = randomItem([180, 240, 300, 360]); // 15, 20, 25, 30 years
  const annualIncome = randomNumber(50000, 250000);

  return {
    loan_id: loanId,
    loan_amount: loanAmount,
    loan_term_months: loanTerm,
    interest_rate: interestRate,
    property_address: `${street}, ${location.city}, ${location.state} ${location.zip}, USA`,
    borrower: {
      full_name: name,
      email: generateEmail(name),
      phone: generatePhone(),
      date_of_birth: generateDateOfBirth(),
      ssn_last4: generateSSNLast4(),
      id_type: randomItem(['drivers_license', 'passport', 'state_id']),
      id_last4: generateSSNLast4(),
      employment_status: randomItem(['employed', 'self_employed']),
      annual_income: annualIncome,
      address: {
        street: street,
        city: location.city,
        state: location.state,
        zip_code: location.zip,
        country: 'USA'
      }
    },
    loan_details: {
      loan_term_months: loanTerm,
      interest_rate: interestRate,
      loan_amount: loanAmount,
      purpose: randomItem(loanPurposes),
      notes: `Demo loan document for ${name}. Generated for demonstration purposes.`
    },
    document_type: 'loan_application',
    security_level: securityLevel
  };
}

/**
 * Generate multiple demo documents with different security levels
 */
export function generateDemoDocumentSet(): DemoLoanDocument[] {
  return [
    generateDemoLoanDocument('standard'),
    generateDemoLoanDocument('quantum-safe'),
    generateDemoLoanDocument('maximum')
  ];
}

/**
 * Convert demo document to File object for upload
 */
export function demoDocumentToFile(doc: DemoLoanDocument, index: number = 0): File {
  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `demo_loan_${doc.security_level}_${index + 1}.json`;
  return new File([blob], filename, { type: 'application/json' });
}

/**
 * Generate demo KYC data
 */
export interface DemoKYCData {
  fullLegalName: string;
  dateOfBirth: string;
  phoneNumber: string;
  emailAddress: string;
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  stateProvince: string;
  postalZipCode: string;
  country: string;
  citizenshipCountry: string;
  identificationType: string;
  identificationNumber: string;
  idIssuingCountry: string;
  idExpirationDate: string;
  occupation: string;
  employer: string;
  annualIncome: string;
  sourceOfFunds: string;
}

export function generateDemoKYCData(): DemoKYCData {
  const name = randomItem(sampleNames);
  const location = randomItem(sampleCities);
  const street = randomItem(sampleStreets);

  return {
    fullLegalName: name,
    dateOfBirth: generateDateOfBirth(),
    phoneNumber: generatePhone(),
    emailAddress: generateEmail(name),
    streetAddress1: street,
    streetAddress2: `Apt ${randomNumber(100, 999)}`,
    city: location.city,
    stateProvince: location.state,
    postalZipCode: location.zip,
    country: 'United States',
    citizenshipCountry: 'United States',
    identificationType: randomItem(['Drivers License', 'Passport', 'State ID']),
    identificationNumber: `DL${randomNumber(1000000, 9999999)}`,
    idIssuingCountry: 'United States',
    idExpirationDate: `${randomNumber(2025, 2030)}-${String(randomNumber(1, 12)).padStart(2, '0')}-${String(randomNumber(1, 28)).padStart(2, '0')}`,
    occupation: randomItem(['Software Engineer', 'Financial Analyst', 'Business Owner', 'Manager', 'Consultant']),
    employer: randomItem(['Tech Corp', 'Finance Inc', 'Self-employed', 'Consulting LLC', 'Startup Inc']),
    annualIncome: randomNumber(50000, 250000).toString(),
    sourceOfFunds: randomItem(['Employment Income', 'Business Income', 'Investments', 'Savings'])
  };
}

/**
 * Generate demo statistics for dashboard
 */
export interface DemoStats {
  totalDocuments: number;
  totalVerifications: number;
  fraudDetected: number;
  avgProcessingTime: string;
  successRate: string;
  uploadedToday: number;
  weeklyGrowth: string;
  monthlyGrowth: string;
}

export function generateDemoStats(): DemoStats {
  return {
    totalDocuments: randomNumber(200, 500),
    totalVerifications: randomNumber(150, 400),
    fraudDetected: randomNumber(1, 8),
    avgProcessingTime: `${(Math.random() * 2 + 0.5).toFixed(1)}s`,
    successRate: `${(Math.random() * 1 + 99).toFixed(1)}%`,
    uploadedToday: randomNumber(15, 35),
    weeklyGrowth: `+${randomNumber(8, 15)}%`,
    monthlyGrowth: `+${randomNumber(20, 40)}%`
  };
}
