/**
 * Demo Data Generator for IntegrityX
 * Generates realistic sample loan documents for demo purposes
 */

export interface DemoLoanDocument {
  loan_id: string;
  loan_type: string; // New field: home_loan, personal_loan, auto_loan, etc.
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
  // Conditional fields based on loan type
  property_value?: number;
  down_payment?: number;
  property_type?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_vin?: string;
  purchase_price?: number;
  business_name?: string;
  business_type?: string;
  business_registration_number?: string;
  annual_revenue?: number;
  school_name?: string;
  degree_program?: string;
  expected_graduation_date?: string;
  current_loan_number?: string;
  current_lender?: string;
  refinance_purpose?: string;
  current_mortgage_balance?: number;
  equity_amount?: number;
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
  // Add more randomness with timestamp component
  const timestamp = Date.now().toString().slice(-4);
  return `+1-${randomNumber(200, 999)}-${randomNumber(100, 999)}-${timestamp}`;
}

function generateEmail(name: string): string {
  const username = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com', 'protonmail.com'];
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `${username}${randomNumber(1, 99)}${timestamp}@${randomItem(domains)}`;
}

function generateSSNLast4(): string {
  return randomNumber(1000, 9999).toString();
}

function generateSSN(): string {
  // Generate SSN in format XXX-XX-XXXX
  const part1 = randomNumber(100, 999);
  const part2 = randomNumber(10, 99);
  const part3 = randomNumber(1000, 9999);
  return `${part1}-${part2}-${part3}`;
}

function generateITIN(): string {
  // Generate ITIN in format 9XX-XX-XXXX (must start with 9)
  const part1 = 900 + randomNumber(0, 99); // 900-999
  const part2 = randomNumber(10, 99);
  const part3 = randomNumber(1000, 9999);
  return `${part1}-${part2}-${part3}`;
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
  // Generate unique loan ID with timestamp to ensure uniqueness
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const loanId = `DEMO_${timestamp}_${randomSuffix}`;
  const name = randomItem(sampleNames);
  const location = randomItem(sampleCities);
  const street = randomItem(sampleStreets);

  // DEMO MODE: Generate random loan amounts for variety
  const loanAmount = randomNumber(100000, 2000000); // $100k - $2M
  const interestRate = Number((Math.random() * 5 + 3).toFixed(2)); // 3% - 8%
  const loanTerm = randomItem([180, 240, 300, 360]); // 15, 20, 25, 30 years

  // DEMO MODE: Generate varied income (sometimes triggers fraud detection)
  const annualIncome = randomNumber(30000, 200000); // $30k - $200k

  // Randomly select a loan type for variety
  const loanTypes = ['home_loan', 'personal_loan', 'auto_loan', 'business_loan', 'student_loan', 'refinance', 'home_equity'];
  const loanType = randomItem(loanTypes);

  // Generate conditional fields based on loan type
  const baseDoc: any = {
    loan_id: loanId,
    loan_type: loanType,
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

  // Add conditional fields based on loan type
  if (loanType === 'home_loan' || loanType === 'home_equity') {
    baseDoc.property_value = randomNumber(200000, 1000000);
    baseDoc.down_payment = loanType === 'home_loan' ? randomNumber(20000, 200000) : undefined;
    baseDoc.property_type = randomItem(['single_family', 'condo', 'townhouse', 'multi_family']);
    if (loanType === 'home_equity') {
      baseDoc.current_mortgage_balance = randomNumber(100000, 500000);
      baseDoc.equity_amount = baseDoc.property_value - baseDoc.current_mortgage_balance;
    }
  } else if (loanType === 'auto_loan') {
    const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Tesla'];
    const models = ['Camry', 'Accord', 'F-150', 'Silverado', '3 Series', 'C-Class', 'Model 3'];
    baseDoc.vehicle_make = randomItem(makes);
    baseDoc.vehicle_model = randomItem(models);
    baseDoc.vehicle_year = randomNumber(2020, 2024);
    baseDoc.vehicle_vin = `1HGBH41JXMN${randomNumber(100000, 999999)}`;
    baseDoc.purchase_price = randomNumber(15000, 60000);
  } else if (loanType === 'business_loan') {
    const businessNames = ['ABC Corporation', 'XYZ LLC', 'Tech Solutions Inc', 'Global Services LLC'];
    baseDoc.business_name = randomItem(businessNames);
    baseDoc.business_type = randomItem(['llc', 'corporation', 'partnership', 'sole_proprietorship']);
    baseDoc.business_registration_number = `EIN-${randomNumber(100000000, 999999999)}`;
    baseDoc.annual_revenue = randomNumber(100000, 5000000);
  } else if (loanType === 'student_loan') {
    const schools = ['State University', 'Tech Institute', 'Business School', 'Liberal Arts College'];
    const programs = ['Computer Science', 'Business Administration', 'Engineering', 'Medicine', 'Law'];
    baseDoc.school_name = randomItem(schools);
    baseDoc.degree_program = randomItem(programs);
    const gradYear = new Date().getFullYear() + randomNumber(1, 4);
    const gradMonth = String(randomNumber(1, 12)).padStart(2, '0');
    baseDoc.expected_graduation_date = `${gradYear}-${gradMonth}-01`;
  } else if (loanType === 'refinance') {
    baseDoc.current_loan_number = `LOAN_${randomNumber(2020, 2023)}_${randomNumber(100, 999)}`;
    const lenders = ['ABC Bank', 'XYZ Mortgage', 'First National', 'Community Bank'];
    baseDoc.current_lender = randomItem(lenders);
    baseDoc.refinance_purpose = randomItem(['lower_rate', 'cash_out', 'shorter_term', 'debt_consolidation']);
  }

  return baseDoc as DemoLoanDocument;
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
  ssnOrItinType: string;
  ssnOrItinNumber: string;
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

  // Randomly choose SSN or ITIN (80% SSN, 20% ITIN for demo)
  const useSSN = Math.random() > 0.2;
  const ssnOrItinType = useSSN ? 'SSN' : 'ITIN';
  const ssnOrItinNumber = useSSN ? generateSSN() : generateITIN();

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
    ssnOrItinType: ssnOrItinType,
    ssnOrItinNumber: ssnOrItinNumber,
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
