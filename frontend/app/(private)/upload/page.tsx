'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AccessibleDropzone } from '@/components/ui/accessible-dropzone';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Upload, FileText, CheckCircle, ExternalLink, Hash, Shield, ArrowLeft, ChevronDown, ChevronUp, User, HelpCircle, AlertCircle, X, RefreshCw, Mail, Download, UserCheck, FileCheck, AlertTriangle, Info, Sparkles, TrendingUp, Lightbulb, Zap, BarChart3, Layers, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { simpleToast as toast } from '@/components/ui/simple-toast';
import { sealLoanDocument, sealLoanDocumentMaximumSecurity, sealLoanDocumentQuantumSafe, sealDirectory, type LoanData, type BorrowerInfo, type DirectoryFileInfo, type DirectorySealResponse } from '@/lib/api/loanDocuments';
import { DuplicateDetection } from '@/components/DuplicateDetection';
import { DuplicateCheckResponse } from '@/lib/api/duplicateDetection';
import { 
  sanitizeText, 
  sanitizeEmail, 
  sanitizePhone, 
  sanitizeNumber, 
  sanitizeDate, 
  sanitizeSSNLast4, 
  sanitizeZipCode, 
  sanitizeAddress, 
  sanitizeCity, 
  sanitizeState, 
  sanitizeCountry, 
  sanitizeEmploymentStatus, 
  sanitizeGovernmentIdType, 
  sanitizeDocumentType, 
  sanitizeNotes,
  sanitizeFormData,
  sanitizeTextarea
} from '@/utils/dataSanitization';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { buildAutoPopulateMetadata, type AutoPopulateMetadata } from '@/utils/loanAutoPopulate'
import { SuccessCelebration } from '@/components/SuccessCelebration'
import { ProgressSteps, CompactProgressSteps } from '@/components/ui/progress-steps'
import { HelpTooltip, SecurityLevelTooltips, KYCTooltips, BlockchainTooltips } from '@/components/ui/help-tooltip'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { GLOSSARY } from '@/lib/glossary'
import {
  smartExtractDocumentData,
  buildEnhancedAutoPopulateMetadata,
  analyzeBulkFiles,
  type BulkFileAnalysis,
  type EnhancedAutoPopulateMetadata,
  type SmartExtractionResult
} from '@/utils/smartAutoPopulate'
import { BulkAnalysisDashboard } from '@/components/BulkAnalysisDashboard'
import { SmartBatchEditor } from '@/components/SmartBatchEditor'
import { ConfidenceBadge, FieldConfidenceWrapper } from '@/components/ui/confidence-badge'
import { FraudRiskBadge, FraudRiskInlineBadge } from '@/components/FraudRiskBadge'
import { generateDemoDocumentSet, generateDemoKYCData } from '@/utils/demoDataGenerator'

interface UploadResult {
  artifactId: string;
  walacorTxId: string;
  sealedAt: string;
  proofBundle: any;
  quantum_safe_seal?: {
    algorithm: string;
    timestamp: string;
    quantum_resistant_hashes?: string[];
    quantum_safe_signatures?: string[];
    algorithms_used?: string[];
  };
  comprehensive_seal?: {
    timestamp: string;
    algorithm: string;
    security_level?: string;
    tamper_resistance?: string;
    multi_hash_algorithms?: string[];
    pki_signature?: string;
    verification_methods?: string[];
  };
}

type BulkUploadResult = {
  fileName: string;
  result: UploadResult;
};

interface VerifyResult {
  is_valid: boolean;
  status: string;
  artifact_id: string;
  verified_at: string;
  details: {
    stored_hash: string;
    provided_hash: string;
    artifact_type: string;
    created_at: string;
  };
}

interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface KYCData {
  // Personal Information
  fullLegalName: string;
  dateOfBirth: string;
  phoneNumber: string;
  emailAddress: string;
  
  // Address Information
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  stateProvince: string;
  postalZipCode: string;
  country: string;
  
  // Identification Information
  citizenshipCountry: string;
  ssnOrItinType: string; // 'SSN' or 'ITIN'
  ssnOrItinNumber: string; // The actual SSN or ITIN number
  identificationType: string;
  identificationNumber: string;
  idIssuingCountry: string;
  
  // Financial Information
  sourceOfFunds: string;
  purposeOfLoan: string;
  expectedMonthlyTransactionVolume: number;
  expectedNumberOfMonthlyTransactions: number;
  
  // Compliance Screening
  isPEP: string;
  pepDetails: string;
  
  // Document Uploads (removed - collecting from form fields instead)
}

interface KYCErrors {
  [key: string]: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface UploadError {
  type: 'validation' | 'network' | 'server' | 'walacor' | 'file' | 'unknown';
  message: string;
  details?: any;
  retryable?: boolean;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: UploadError | null;
  validationErrors: ValidationError[];
  canRetry: boolean;
  savedData: any;
}


export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileHash, setFileHash] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [metadata, setMetadata] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [etid, setEtid] = useState('100002');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced error handling state
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    validationErrors: [],
    canRetry: false,
    savedData: null
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [maximumSecurityMode, setMaximumSecurityMode] = useState(false); // Default to standard security
  const [quantumSafeMode, setQuantumSafeMode] = useState(false); // Quantum-safe mode
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const skipLoanAutoFillRef = useRef(false);

  // Individual form field states for better reactivity
  const [formData, setFormData] = useState({
    loanId: '',
    loanType: '', // New field: Home Loan, Personal Loan, Auto Loan, etc.
    documentType: 'loan_application',
    loanAmount: '',
    loanTerm: '',
    interestRate: '',
    propertyAddress: '',
    borrowerName: '',
    additionalNotes: '',
    borrowerFullName: '',
    borrowerDateOfBirth: '',
    borrowerEmail: '',
    borrowerPhone: '',
    borrowerStreetAddress: '',
    borrowerCity: '',
    borrowerState: '',
    borrowerZipCode: '',
    borrowerCountry: 'US',
    borrowerSSNLast4: '',
    borrowerGovernmentIdType: 'drivers_license',
    borrowerIdNumberLast4: '',
    borrowerEmploymentStatus: 'employed',
    borrowerAnnualIncome: '',
    borrowerCoBorrowerName: '',
    // Conditional fields based on loan type
    propertyValue: '', // Home Loan
    downPayment: '', // Home Loan
    propertyType: '', // Home Loan
    vehicleMake: '', // Auto Loan
    vehicleModel: '', // Auto Loan
    vehicleYear: '', // Auto Loan
    vehicleVIN: '', // Auto Loan
    purchasePrice: '', // Auto Loan
    businessName: '', // Business Loan
    businessType: '', // Business Loan
    businessRegistrationNumber: '', // Business Loan
    annualRevenue: '', // Business Loan
    schoolName: '', // Student Loan
    degreeProgram: '', // Student Loan
    expectedGraduationDate: '', // Student Loan
    currentLoanNumber: '', // Refinance
    currentLender: '', // Refinance
    refinancePurpose: '', // Refinance
    currentMortgageBalance: '', // Home Equity
    equityAmount: '' // Home Equity
  });

  // Debug: Log formData changes
  useEffect(() => {
    console.log('📊 formData state changed:', formData);
  }, [formData]);

  // Demo Mode: Auto-load demo data if coming from dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDemo = params.get('mode') === 'demo';

    if (isDemo && typeof window !== 'undefined') {
      console.log('🎬 Demo mode detected! Generating demo data...');
      setIsDemoMode(true);

      try {
        // Generate demo data on the fly
        const demoDocuments = generateDemoDocumentSet();
        const demoKYC = generateDemoKYCData();

        console.log('📄 Generated demo documents:', demoDocuments);
        console.log('👤 Generated demo KYC:', demoKYC);

        // Convert first demo document to File and auto-upload
        if (demoDocuments && demoDocuments.length > 0) {
          const firstDoc = demoDocuments[0];
          const jsonContent = JSON.stringify(firstDoc, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const fileName = `demo_loan_${firstDoc.security_level || 'standard'}_1.json`;
          const demoFile = new File([blob], fileName, { type: 'application/json' });

          // Simulate file drop
          setTimeout(async () => {
            console.log('🚀 Auto-uploading demo file...');
            setFile(demoFile);
            setCurrentStep(2);

            // Calculate file hash (required for upload button to be enabled)
            try {
              const hash = await calculateFileHash(demoFile);
              setFileHash(hash);
              console.log('Demo file hash calculated:', hash);
            } catch (error) {
              console.error('Failed to calculate demo file hash:', error);
            }

            // Trigger auto-fill
            autoFillFromJSON(demoFile).then(() => {
              toast.success('✨ Demo loaded! Review the auto-filled form with fraud detection.');
            }).catch(error => {
              console.error('Demo auto-fill error:', error);
              toast.error('Demo loaded but auto-fill failed. Please review form.');
            });
          }, 1000);
        }

        // Pre-fill KYC data
        setTimeout(() => {
          setKycData(prev => ({
            ...prev,
            ...demoKYC
          }));
        }, 1500);

        // Pre-fill Loan Information including loanType and conditional fields
        setTimeout(() => {
          if (demoDocuments && demoDocuments.length > 0) {
            const firstDoc = demoDocuments[0];
            const loanMeta: any = {
              loanId: firstDoc.loan_id,
              loanType: firstDoc.loan_type || 'home_loan',
              documentType: firstDoc.document_type || 'loan_application',
              loanAmount: firstDoc.loan_amount,
              loanTerm: firstDoc.loan_term_months,
              interestRate: firstDoc.interest_rate,
              propertyAddress: firstDoc.property_address || '',
            };

            // Add conditional fields based on loan type
            if (firstDoc.loan_type === 'home_loan' || firstDoc.loan_type === 'home_equity') {
              if (firstDoc.property_value) loanMeta.propertyValue = firstDoc.property_value;
              if (firstDoc.down_payment) loanMeta.downPayment = firstDoc.down_payment;
              if (firstDoc.property_type) loanMeta.propertyType = firstDoc.property_type;
              if (firstDoc.current_mortgage_balance) loanMeta.currentMortgageBalance = firstDoc.current_mortgage_balance;
              if (firstDoc.equity_amount) loanMeta.equityAmount = firstDoc.equity_amount;
            } else if (firstDoc.loan_type === 'auto_loan') {
              if (firstDoc.vehicle_make) loanMeta.vehicleMake = firstDoc.vehicle_make;
              if (firstDoc.vehicle_model) loanMeta.vehicleModel = firstDoc.vehicle_model;
              if (firstDoc.vehicle_year) loanMeta.vehicleYear = firstDoc.vehicle_year;
              if (firstDoc.vehicle_vin) loanMeta.vehicleVIN = firstDoc.vehicle_vin;
              if (firstDoc.purchase_price) loanMeta.purchasePrice = firstDoc.purchase_price;
            } else if (firstDoc.loan_type === 'business_loan') {
              if (firstDoc.business_name) loanMeta.businessName = firstDoc.business_name;
              if (firstDoc.business_type) loanMeta.businessType = firstDoc.business_type;
              if (firstDoc.business_registration_number) loanMeta.businessRegistrationNumber = firstDoc.business_registration_number;
              if (firstDoc.annual_revenue) loanMeta.annualRevenue = firstDoc.annual_revenue;
            } else if (firstDoc.loan_type === 'student_loan') {
              if (firstDoc.school_name) loanMeta.schoolName = firstDoc.school_name;
              if (firstDoc.degree_program) loanMeta.degreeProgram = firstDoc.degree_program;
              if (firstDoc.expected_graduation_date) loanMeta.expectedGraduationDate = firstDoc.expected_graduation_date;
            } else if (firstDoc.loan_type === 'refinance') {
              if (firstDoc.current_loan_number) loanMeta.currentLoanNumber = firstDoc.current_loan_number;
              if (firstDoc.current_lender) loanMeta.currentLender = firstDoc.current_lender;
              if (firstDoc.refinance_purpose) loanMeta.refinancePurpose = firstDoc.refinance_purpose;
            }

            // Update formData
            setFormData(prev => ({
              ...prev,
              loanId: loanMeta.loanId,
              loanType: loanMeta.loanType,
              documentType: loanMeta.documentType,
              loanAmount: String(loanMeta.loanAmount),
              loanTerm: String(loanMeta.loanTerm),
              interestRate: String(loanMeta.interestRate),
              propertyAddress: loanMeta.propertyAddress,
              propertyValue: String(loanMeta.propertyValue || ''),
              downPayment: String(loanMeta.downPayment || ''),
              propertyType: loanMeta.propertyType || '',
              vehicleMake: loanMeta.vehicleMake || '',
              vehicleModel: loanMeta.vehicleModel || '',
              vehicleYear: String(loanMeta.vehicleYear || ''),
              vehicleVIN: loanMeta.vehicleVIN || '',
              purchasePrice: String(loanMeta.purchasePrice || ''),
              businessName: loanMeta.businessName || '',
              businessType: loanMeta.businessType || '',
              businessRegistrationNumber: loanMeta.businessRegistrationNumber || '',
              annualRevenue: String(loanMeta.annualRevenue || ''),
              schoolName: loanMeta.schoolName || '',
              degreeProgram: loanMeta.degreeProgram || '',
              expectedGraduationDate: loanMeta.expectedGraduationDate || '',
              currentLoanNumber: loanMeta.currentLoanNumber || '',
              currentLender: loanMeta.currentLender || '',
              refinancePurpose: loanMeta.refinancePurpose || '',
              currentMortgageBalance: String(loanMeta.currentMortgageBalance || ''),
              equityAmount: String(loanMeta.equityAmount || ''),
            }));

            // Update metadata
            setMetadata(JSON.stringify(loanMeta, null, 2));
          }
        }, 2000);

      } catch (error) {
        console.error('Error generating demo data:', error);
        toast.error('Failed to generate demo data');
      }
    }
  }, []); // Run once on mount

  // Helper function to get current metadata values
  const getMetadataValue = (key: string): string => {
    try {
      const currentMeta = metadata ? JSON.parse(metadata || '{}') : {};
      return currentMeta[key] || '';
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return '';
    }
  };


  // KYC State
  const [kycData, setKycData] = useState<KYCData>({
    fullLegalName: '',
    dateOfBirth: '',
    phoneNumber: '',
    emailAddress: '',
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    stateProvince: '',
    postalZipCode: '',
    country: 'US',
    citizenshipCountry: 'US',
    ssnOrItinType: '',
    ssnOrItinNumber: '',
    identificationType: '',
    identificationNumber: '',
    idIssuingCountry: 'US',
    sourceOfFunds: '',
    purposeOfLoan: '',
    expectedMonthlyTransactionVolume: 0,
    expectedNumberOfMonthlyTransactions: 0,
    isPEP: '',
    pepDetails: '',
    // Document Uploads removed - collecting from form fields instead
  });
  const [kycErrors, setKycErrors] = useState<KYCErrors>({});
  const [isKycExpanded, setIsKycExpanded] = useState(false);
  const [isSavingKyc, setIsSavingKyc] = useState(false);
  const [kycSaved, setKycSaved] = useState(false);
  const [loanFormErrors, setLoanFormErrors] = useState<{
    loanId?: string;
    loanType?: string;
    documentType?: string;
    loanAmount?: string;
    loanTerm?: string;
    interestRate?: string;
    propertyAddress?: string;
    propertyValue?: string;
    downPayment?: string;
    propertyType?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    vehicleVIN?: string;
    purchasePrice?: string;
    businessName?: string;
    businessType?: string;
    businessRegistrationNumber?: string;
    annualRevenue?: string;
    schoolName?: string;
    degreeProgram?: string;
    expectedGraduationDate?: string;
    currentLoanNumber?: string;
    currentLender?: string;
    refinancePurpose?: string;
    currentMortgageBalance?: string;
    equityAmount?: string;
  }>({});
  const [privacyNoticeDismissed, setPrivacyNoticeDismissed] = useState(false);
  const [borrowerErrors, setBorrowerErrors] = useState<Record<string, string>>({});

  // Duplicate detection state
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResponse | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [allowUploadDespiteDuplicates, setAllowUploadDespiteDuplicates] = useState(false);
  
  // Bulk/Directory upload state
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk' | 'directory'>('single');

  // Progress tracking for upload flow
  const [currentStep, setCurrentStep] = useState(1);
  const uploadSteps = [
    { number: 1, label: 'Upload', description: 'Select your document' },
    { number: 2, label: 'Extract', description: 'Auto-fill form data' },
    { number: 3, label: 'Review', description: 'Verify information' },
    { number: 4, label: 'Seal', description: 'Secure on blockchain' }
  ];
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationResults, setValidationResults] = useState<{valid: File[], invalid: File[], reasons: Record<string, string>}>({
    valid: [],
    invalid: [],
    reasons: {}
  });
  const [bulkFileMetadata, setBulkFileMetadata] = useState<Record<string, AutoPopulateMetadata>>({});
  const [allSelectedFiles, setAllSelectedFiles] = useState<Record<string, File>>({});
  const [editingBulkFileName, setEditingBulkFileName] = useState<string | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<AutoPopulateMetadata | null>(null);
const [showMetadataEditor, setShowMetadataEditor] = useState(false);
const [bulkUploadResults, setBulkUploadResults] = useState<BulkUploadResult[]>([]);

  // Smart bulk upload state
  const [bulkAnalyses, setBulkAnalyses] = useState<BulkFileAnalysis[]>([])
  const [isAnalyzingBulk, setIsAnalyzingBulk] = useState(false)
  const [showBulkEditor, setShowBulkEditor] = useState(false)
  const [bulkEditorIndex, setBulkEditorIndex] = useState(0)

  // Enhanced auto-populate for single file
  const [enhancedMetadata, setEnhancedMetadata] = useState<EnhancedAutoPopulateMetadata | null>(null)
  const [extractionResult, setExtractionResult] = useState<SmartExtractionResult | null>(null)

  // Duplicate detection handlers
  const handleDuplicateFound = (response: DuplicateCheckResponse) => {
    setDuplicateCheckResult(response);
    setShowDuplicateWarning(true);
    toast.warning('Duplicates detected! Please review before proceeding.');
  };

  const handleNoDuplicates = () => {
    setDuplicateCheckResult(null);
    setShowDuplicateWarning(false);
    setAllowUploadDespiteDuplicates(false);
  };

  const handleAllowUploadDespiteDuplicates = () => {
    setAllowUploadDespiteDuplicates(true);
    setShowDuplicateWarning(false);
    toast.info('Upload allowed despite duplicates. Proceed with caution.');
  };

  // Check localStorage for privacy notice dismissal on component mount
  useEffect(() => {
    const dismissed = localStorage.getItem('privacy-notice-dismissed');
    if (dismissed === 'true') {
      setPrivacyNoticeDismissed(true);
    }
  }, []);

  // Handle privacy notice dismissal
  const handleDismissPrivacyNotice = () => {
    setPrivacyNoticeDismissed(true);
    localStorage.setItem('privacy-notice-dismissed', 'true');
  };

  // Borrower field validation
  const validateBorrowerField = (field: string, value: string): string => {
    switch (field) {
      case 'borrowerFullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        return '';
      
      case 'borrowerDateOfBirth':
        if (!value) return 'Date of birth is required';
        const birthDate = new Date(value);
        const today = new Date();
        if (isNaN(birthDate.getTime())) return 'Please enter a valid date';
        if (birthDate > today) return 'Date of birth cannot be in the future';
        return '';
      
      case 'borrowerEmail':
        if (!value.trim()) return 'Email address is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'borrowerPhone':
        if (!value.trim()) return 'Phone number is required';
        // Accept any phone format (US or international)
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) return 'Please enter a valid phone number';
        return '';
      
      case 'borrowerSSNLast4':
        if (!value.trim()) return 'SSN last 4 digits is required';
        if (!/^\d{4}$/.test(value)) return 'SSN must be exactly 4 digits';
        return '';
      
      case 'borrowerIdNumberLast4':
        if (!value.trim()) return 'ID number last 4 digits is required';
        if (!/^\d{4}$/.test(value)) return 'ID number must be exactly 4 digits';
        return '';
      
      case 'borrowerAnnualIncome':
        if (!value.trim()) return 'Annual income is required';
        const income = parseFloat(value);
        if (isNaN(income) || income <= 0) return 'Annual income must be a positive number';
        return '';
      
      case 'borrowerStreetAddress':
        if (!value.trim()) return 'Street address is required';
        return '';
      
      case 'borrowerCity':
        if (!value.trim()) return 'City is required';
        return '';
      
      case 'borrowerState':
        if (!value.trim()) return 'State is required';
        return '';
      
      case 'borrowerZipCode':
        if (!value.trim()) return 'ZIP code is required';
        return '';
      
      case 'borrowerCountry':
        if (!value.trim()) return 'Country is required';
        return '';
      
      case 'borrowerEmploymentStatus':
        if (!value.trim()) return 'Employment status is required';
        return '';
      
      default:
        return '';
    }
  };

  // Handle borrower field changes with validation and sanitization
  const handleBorrowerFieldChange = (field: string, value: string) => {
    // Sanitize the input based on field type
    let sanitizedValue = value;
    
    switch (field) {
      case 'borrowerFullName':
      case 'borrowerCoBorrowerName':
        sanitizedValue = sanitizeText(value);
        break;
      case 'borrowerEmail':
        sanitizedValue = sanitizeEmail(value);
        break;
      case 'borrowerPhone':
        sanitizedValue = sanitizePhone(value);
        break;
      case 'borrowerDateOfBirth':
        sanitizedValue = sanitizeDate(value);
        break;
      case 'borrowerStreetAddress':
        sanitizedValue = sanitizeAddress(value);
        break;
      case 'borrowerCity':
        sanitizedValue = sanitizeCity(value);
        break;
      case 'borrowerState':
        sanitizedValue = sanitizeState(value);
        break;
      case 'borrowerZipCode':
        sanitizedValue = sanitizeZipCode(value);
        break;
      case 'borrowerCountry':
        sanitizedValue = sanitizeCountry(value);
        break;
      case 'borrowerSSNLast4':
      case 'borrowerIdNumberLast4':
        sanitizedValue = sanitizeSSNLast4(value);
        break;
      case 'borrowerGovernmentIdType':
        sanitizedValue = sanitizeGovernmentIdType(value);
        break;
      case 'borrowerEmploymentStatus':
        sanitizedValue = sanitizeEmploymentStatus(value);
        break;
      case 'borrowerAnnualIncome':
        sanitizedValue = sanitizeNumber(value);
        break;
      default:
        sanitizedValue = sanitizeText(value);
    }

    // Update formData with sanitized value for consistency
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));

    const currentMeta = metadata ? JSON.parse(metadata || '{}') : {};
    const updatedMeta = { ...currentMeta, [field]: sanitizedValue };
    setMetadata(JSON.stringify(updatedMeta, null, 2));

    // Validate the sanitized field
    const error = validateBorrowerField(field, sanitizedValue);
    setBorrowerErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Auto-fill form data from JSON file - ENHANCED WITH AI
  const autoFillFromJSON = async (file: File): Promise<void> => {
    if (skipLoanAutoFillRef.current) {
      console.log('⏭️ Skipping auto-fill (already processed)');
      return;
    }

    setIsAutoFilling(true);
    try {
      console.log('🤖 Starting ENHANCED auto-fill with AI intelligence...');

      // Read file content
      const text = await file.text();
      const parsedContent = JSON.parse(text);

      // Use smart extraction with AI backend + frontend fallback
      const extractionResult = await smartExtractDocumentData(file, parsedContent);
      console.log('✅ Smart extraction result:', extractionResult);

      // Build enhanced metadata with confidence scoring
      const enhanced = buildEnhancedAutoPopulateMetadata(extractionResult);
      setEnhancedMetadata(enhanced);
      setExtractionResult(extractionResult);

      // Update metadata JSON
      const currentMeta = metadata ? JSON.parse(metadata || '{}') : {};
      const updatedMeta = {
        ...currentMeta,
        loanId: enhanced.loanId.value || currentMeta.loanId,
        documentType: enhanced.documentType.value || currentMeta.documentType,
        loanAmount: enhanced.loanAmount.value || currentMeta.loanAmount,
        loanTerm: enhanced.loanTerm.value || currentMeta.loanTerm,
        interestRate: enhanced.interestRate.value || currentMeta.interestRate,
        borrowerFullName: enhanced.borrowerName.value || currentMeta.borrowerFullName,
        borrowerEmail: enhanced.borrowerEmail.value || currentMeta.borrowerEmail,
        borrowerPhone: enhanced.borrowerPhone.value || currentMeta.borrowerPhone,
        borrowerDateOfBirth: enhanced.borrowerDateOfBirth.value || currentMeta.borrowerDateOfBirth,
        borrowerStreetAddress: enhanced.borrowerStreetAddress.value || currentMeta.borrowerStreetAddress,
        borrowerCity: enhanced.borrowerCity.value || currentMeta.borrowerCity,
        borrowerState: enhanced.borrowerState.value || currentMeta.borrowerState,
        borrowerZipCode: enhanced.borrowerZipCode.value || currentMeta.borrowerZipCode,
        borrowerCountry: enhanced.borrowerCountry.value || currentMeta.borrowerCountry,
        borrowerSSNLast4: enhanced.borrowerSSNLast4.value || currentMeta.borrowerSSNLast4,
        borrowerGovernmentIdType: enhanced.borrowerGovernmentIdType.value || currentMeta.borrowerGovernmentIdType,
        borrowerIdNumberLast4: enhanced.borrowerIdNumberLast4.value || currentMeta.borrowerIdNumberLast4,
        borrowerEmploymentStatus: enhanced.borrowerEmploymentStatus.value || currentMeta.borrowerEmploymentStatus,
        borrowerAnnualIncome: enhanced.borrowerAnnualIncome.value || currentMeta.borrowerAnnualIncome,
        borrowerCoBorrowerName: enhanced.borrowerCoBorrowerName.value || currentMeta.borrowerCoBorrowerName,
        propertyAddress: enhanced.propertyAddress.value || currentMeta.propertyAddress,
        additionalNotes: enhanced.additionalNotes.value || currentMeta.additionalNotes,
      };

      setMetadata(JSON.stringify(updatedMeta, null, 2));

      // Update form fields with extracted values
      setFormData(prev => ({
        ...prev,
        loanId: enhanced.loanId.value || prev.loanId,
        documentType: enhanced.documentType.value || prev.documentType,
        loanAmount: enhanced.loanAmount.value || prev.loanAmount,
        loanTerm: enhanced.loanTerm.value || prev.loanTerm,
        interestRate: enhanced.interestRate.value || prev.interestRate,
        borrowerFullName: enhanced.borrowerName.value || prev.borrowerFullName,
        borrowerEmail: enhanced.borrowerEmail.value || prev.borrowerEmail,
        borrowerPhone: enhanced.borrowerPhone.value || prev.borrowerPhone,
        borrowerDateOfBirth: enhanced.borrowerDateOfBirth.value || prev.borrowerDateOfBirth,
        borrowerStreetAddress: enhanced.borrowerStreetAddress.value || prev.borrowerStreetAddress,
        borrowerCity: enhanced.borrowerCity.value || prev.borrowerCity,
        borrowerState: enhanced.borrowerState.value || prev.borrowerState,
        borrowerZipCode: enhanced.borrowerZipCode.value || prev.borrowerZipCode,
        borrowerCountry: enhanced.borrowerCountry.value || prev.borrowerCountry,
        borrowerSSNLast4: enhanced.borrowerSSNLast4.value || prev.borrowerSSNLast4,
        borrowerGovernmentIdType: enhanced.borrowerGovernmentIdType.value || prev.borrowerGovernmentIdType,
        borrowerIdNumberLast4: enhanced.borrowerIdNumberLast4.value || prev.borrowerIdNumberLast4,
        borrowerEmploymentStatus: enhanced.borrowerEmploymentStatus.value || prev.borrowerEmploymentStatus,
        borrowerAnnualIncome: enhanced.borrowerAnnualIncome.value || prev.borrowerAnnualIncome,
        borrowerCoBorrowerName: enhanced.borrowerCoBorrowerName.value || prev.borrowerCoBorrowerName,
        propertyAddress: enhanced.propertyAddress.value || prev.propertyAddress,
        additionalNotes: enhanced.additionalNotes.value || prev.additionalNotes,
      }));

      // Auto-populate KYC data
      setKycData(prev => ({
        ...prev,
        fullLegalName: enhanced.borrowerName.value || prev.fullLegalName,
        dateOfBirth: enhanced.borrowerDateOfBirth.value || prev.dateOfBirth,
        phoneNumber: enhanced.borrowerPhone.value || prev.phoneNumber,
        emailAddress: enhanced.borrowerEmail.value || prev.emailAddress,
        streetAddress1: enhanced.borrowerStreetAddress.value || prev.streetAddress1,
        city: enhanced.borrowerCity.value || prev.city,
        stateProvince: enhanced.borrowerState.value || prev.stateProvince,
        postalZipCode: enhanced.borrowerZipCode.value || prev.postalZipCode,
        country: enhanced.borrowerCountry.value || prev.country,
        citizenshipCountry: enhanced.borrowerCountry.value || prev.citizenshipCountry,
        identificationType: enhanced.borrowerGovernmentIdType.value || prev.identificationType,
        identificationNumber: enhanced.borrowerIdNumberLast4.value || prev.identificationNumber,
        idIssuingCountry: enhanced.borrowerCountry.value || prev.idIssuingCountry,
        purposeOfLoan: enhanced.additionalNotes.value || prev.purposeOfLoan,
      }));

      // Progress to step 3 (Review)
      setCurrentStep(3);

      // Check if KYC is incomplete and auto-expand
      const kycFieldsFilled = [
        enhanced.borrowerName.value,
        enhanced.borrowerEmail.value,
        enhanced.borrowerPhone.value,
        enhanced.borrowerDateOfBirth.value,
        enhanced.borrowerStreetAddress.value,
        enhanced.borrowerCity.value,
        enhanced.borrowerState.value,
        enhanced.borrowerZipCode.value,
      ].filter(v => v && v !== '').length;

      if (kycFieldsFilled < 6) {
        setIsKycExpanded(true);
        toast.info('Please review and complete KYC information');
      }

      // Show success message with confidence and source
      const confidence = extractionResult.overallConfidence;
      const source = extractionResult.extractedBy === 'backend' ? 'AI engine' : 'auto-detection';

      if (confidence >= 80) {
        toast.success(
          `✅ Form auto-filled with ${confidence}% confidence using ${source}! Ready for review.`
        );
      } else if (confidence >= 60) {
        toast.success(
          `✅ Form auto-filled with ${confidence}% confidence using ${source}. Please review highlighted fields.`
        );
      } else {
        toast.warning(
          `⚠️ Form auto-filled with ${confidence}% confidence using ${source}. Please carefully review all fields.`
        );
      }

      skipLoanAutoFillRef.current = true;

    } catch (error: any) {
      console.error('❌ Enhanced auto-fill error:', error);

      // Provide helpful error messages based on error type
      if (error.name === 'SyntaxError' || error.message?.includes('JSON')) {
        toast.error('Invalid JSON format. Please ensure your file contains valid JSON data.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.warning('AI extraction unavailable. Using fallback extraction. Some fields may have lower confidence.');
      } else if (error.message?.includes('timeout')) {
        toast.error('AI extraction timed out. Please try again or use a smaller file.');
      } else {
        toast.error('Could not auto-fill form. Please enter data manually or check the file format.');
      }

      // Even on error, try to expand KYC section for manual entry
      setIsKycExpanded(true);
    } finally {
      setIsAutoFilling(false);
      skipLoanAutoFillRef.current = false;
      setCurrentStep(3); // Move to Review step after extraction
    }
  };

  // Calculate file hash on client side
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Ensure the hash is exactly 64 characters (SHA-256)
    if (hash.length !== 64) {
      console.warn(`Hash length is ${hash.length}, expected 64. Hash: ${hash}`);
      // If it's longer, truncate to 64; if shorter, pad with zeros
      return hash.length > 64 ? hash.substring(0, 64) : hash.padEnd(64, '0');
    }
    
    return hash;
  };

  // Create comprehensive document object for sealing
  const createComprehensiveDocument = (): any => {
    const currentMeta = metadata ? JSON.parse(metadata || '{}') : {};
    
    // Extract loan information including loanType and conditional fields
    const loanData = {
      loan_id: currentMeta.loanId || `loan-${Date.now()}`,
      loan_type: currentMeta.loanType || '',
      document_type: currentMeta.documentType || 'unknown',
      loan_amount: currentMeta.loanAmount || 0,
      borrower_name: currentMeta.borrowerName || '',
      notes: currentMeta.notes || '',
      etid: etid,
      // Include conditional fields based on loan type
      ...(currentMeta.loanType === 'home_loan' || currentMeta.loanType === 'home_equity' ? {
        property_value: currentMeta.propertyValue,
        down_payment: currentMeta.downPayment,
        property_type: currentMeta.propertyType,
        current_mortgage_balance: currentMeta.currentMortgageBalance,
        equity_amount: currentMeta.equityAmount
      } : {}),
      ...(currentMeta.loanType === 'auto_loan' ? {
        vehicle_make: currentMeta.vehicleMake,
        vehicle_model: currentMeta.vehicleModel,
        vehicle_year: currentMeta.vehicleYear,
        vehicle_vin: currentMeta.vehicleVIN,
        purchase_price: currentMeta.purchasePrice
      } : {}),
      ...(currentMeta.loanType === 'business_loan' ? {
        business_name: currentMeta.businessName,
        business_type: currentMeta.businessType,
        business_registration_number: currentMeta.businessRegistrationNumber,
        annual_revenue: currentMeta.annualRevenue
      } : {}),
      ...(currentMeta.loanType === 'student_loan' ? {
        school_name: currentMeta.schoolName,
        degree_program: currentMeta.degreeProgram,
        expected_graduation_date: currentMeta.expectedGraduationDate
      } : {}),
      ...(currentMeta.loanType === 'refinance' ? {
        current_loan_number: currentMeta.currentLoanNumber,
        current_lender: currentMeta.currentLender,
        refinance_purpose: currentMeta.refinancePurpose
      } : {})
    };

    // Extract borrower information - prioritize KYC data
    const borrowerData = {
      full_name: kycData.fullLegalName || currentMeta.borrowerFullName || '',
      dob: kycData.dateOfBirth || currentMeta.borrowerDateOfBirth || '',
      email: kycData.emailAddress || currentMeta.borrowerEmail || '',
      phone: kycData.phoneNumber || currentMeta.borrowerPhone || '',
      address: {
        street: kycData.streetAddress1 || currentMeta.borrowerStreetAddress || '',
        city: kycData.city || currentMeta.borrowerCity || '',
        state: kycData.stateProvince || currentMeta.borrowerState || '',
        zip_code: kycData.postalZipCode || currentMeta.borrowerZipCode || '',
        country: kycData.country || currentMeta.borrowerCountry || 'US'
      },
      // SSN/ITIN from KYC
      ssn_or_itin_type: kycData.ssnOrItinType || '',
      ssn_or_itin_number: kycData.ssnOrItinNumber || '',
      ssn_last4: kycData.ssnOrItinNumber ? kycData.ssnOrItinNumber.slice(-4).replace(/-/g, '') : (currentMeta.borrowerSSNLast4 || ''),
      id_type: kycData.identificationType || currentMeta.borrowerGovernmentIdType || '',
      id_last4: kycData.identificationNumber ? kycData.identificationNumber.slice(-4) : (currentMeta.borrowerIdNumberLast4 || ''),
      employment_status: currentMeta.borrowerEmploymentStatus || '',
      annual_income: currentMeta.borrowerAnnualIncome || 0,
      co_borrower_name: currentMeta.borrowerCoBorrowerName || ''
    };

    // Create comprehensive document object
    const comprehensiveDocument = {
      ...loanData,
      borrower: borrowerData,
      uploaded_files: file ? [{
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        file_hash: fileHash
      }] : [],
      metadata: {
        source: 'frontend_upload',
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };

    return comprehensiveDocument;
  };

  // Calculate comprehensive hash including borrower information
  const calculateComprehensiveHash = async (): Promise<string> => {
    const comprehensiveDoc = createComprehensiveDocument();
    const jsonString = JSON.stringify(comprehensiveDoc, null, 2);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Check if document is already sealed
  const checkIfAlreadySealed = async (hash: string, etid: string): Promise<VerifyResult | null> => {
    try {
      const response = await fetch('http://localhost:8000/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          etid: parseInt(etid),
          payloadHash: hash
        })
      });

      if (!response.ok) {
        // If verification fails (document not found), return null
        return null;
      }

      const apiResponse: ApiResponse<VerifyResult> = await response.json();
      
      if (apiResponse.ok && apiResponse.data) {
        return apiResponse.data;
      }
      
      return null;
    } catch (error) {
      console.error('Verification check error:', error);
      return null;
    }
  };

  // File validation function for loan documents
  const createEmptyMetadata = (): AutoPopulateMetadata => ({
    loanId: '',
    documentType: 'loan_application',
    loanAmount: '',
    loanTerm: '',
    interestRate: '',
    borrowerName: '',
    borrowerEmail: '',
    borrowerPhone: '',
    borrowerDateOfBirth: '',
    borrowerStreetAddress: '',
    borrowerCity: '',
    borrowerState: '',
    borrowerZipCode: '',
    borrowerCountry: 'US',
    borrowerSSNLast4: '',
    borrowerGovernmentIdType: 'drivers_license',
    borrowerIdNumberLast4: '',
    borrowerEmploymentStatus: '',
    borrowerAnnualIncome: '',
    borrowerCoBorrowerName: '',
    propertyAddress: '',
    additionalNotes: ''
  });

  const requiredMetadataFields: Array<{ field: keyof AutoPopulateMetadata; label: string }> = [
    { field: 'loanId', label: 'Loan ID' },
    { field: 'documentType', label: 'Document Type' },
    { field: 'loanAmount', label: 'Loan Amount' },
    { field: 'loanTerm', label: 'Loan Term' },
    { field: 'interestRate', label: 'Interest Rate' },
    { field: 'borrowerName', label: 'Borrower Name' },
    { field: 'propertyAddress', label: 'Property Address' }
  ];

  const findMissingMetadata = (metadata: AutoPopulateMetadata): string[] => {
    return requiredMetadataFields
      .filter(({ field }) => !metadata[field] || String(metadata[field]).trim() === '')
      .map(({ label }) => label);
  };

  const sanitizeMetadataForSave = (metadata: AutoPopulateMetadata): AutoPopulateMetadata => ({
    loanId: sanitizeText(metadata.loanId),
    documentType: sanitizeDocumentType(metadata.documentType),
    loanAmount: sanitizeNumber(metadata.loanAmount),
    loanTerm: sanitizeNumber(metadata.loanTerm),
    interestRate: sanitizeNumber(metadata.interestRate),
    borrowerName: sanitizeText(metadata.borrowerName),
    borrowerEmail: sanitizeEmail(metadata.borrowerEmail),
    borrowerPhone: sanitizePhone(metadata.borrowerPhone),
    borrowerDateOfBirth: sanitizeDate(metadata.borrowerDateOfBirth),
    borrowerStreetAddress: sanitizeAddress(metadata.borrowerStreetAddress),
    borrowerCity: sanitizeCity(metadata.borrowerCity),
    borrowerState: sanitizeState(metadata.borrowerState),
    borrowerZipCode: sanitizeZipCode(metadata.borrowerZipCode),
    borrowerCountry: sanitizeCountry(metadata.borrowerCountry || 'US'),
    borrowerSSNLast4: sanitizeSSNLast4(metadata.borrowerSSNLast4),
    borrowerGovernmentIdType: sanitizeGovernmentIdType(metadata.borrowerGovernmentIdType || 'drivers_license'),
    borrowerIdNumberLast4: sanitizeSSNLast4(metadata.borrowerIdNumberLast4),
    borrowerEmploymentStatus: sanitizeEmploymentStatus(metadata.borrowerEmploymentStatus),
    borrowerAnnualIncome: sanitizeNumber(metadata.borrowerAnnualIncome),
    borrowerCoBorrowerName: sanitizeText(metadata.borrowerCoBorrowerName),
    propertyAddress: sanitizeAddress(metadata.propertyAddress),
    additionalNotes: sanitizeNotes(metadata.additionalNotes),
  });

  const handleOpenMetadataEditor = (fileName: string) => {
    const existing = bulkFileMetadata[fileName] || createEmptyMetadata();
    setEditingBulkFileName(fileName);
    setEditingMetadata(existing);
    setShowMetadataEditor(true);
  };

  const handleCloseMetadataEditor = () => {
    setShowMetadataEditor(false);
    setEditingBulkFileName(null);
    setEditingMetadata(null);
  };

  const handleMetadataFieldChange = (field: keyof AutoPopulateMetadata, value: string) => {
    setEditingMetadata(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleRemoveInvalidFile = (fileName: string) => {
    const newInvalid = validationResults.invalid.filter(file => file.name !== fileName);
    const newValid = validationResults.valid.filter(file => file.name !== fileName);
    const newReasons = { ...validationResults.reasons };
    delete newReasons[fileName];

    const updatedAllFiles = { ...allSelectedFiles };
    delete updatedAllFiles[fileName];
    setAllSelectedFiles(updatedAllFiles);

    const updatedMetadata = { ...bulkFileMetadata };
    delete updatedMetadata[fileName];
    setBulkFileMetadata(updatedMetadata);

    setValidationResults({ valid: newValid, invalid: newInvalid, reasons: newReasons });
    setSelectedFiles(newValid);
    toast.info(`${fileName} removed from the upload batch`);
  };

  const handleSaveMetadata = () => {
    if (!editingBulkFileName || !editingMetadata) {
      return;
    }

    const sanitized = sanitizeMetadataForSave(editingMetadata);
    const missingFields = findMissingMetadata(sanitized);
    const fileObject = allSelectedFiles[editingBulkFileName] || null;

    setBulkFileMetadata(prev => ({ ...prev, [editingBulkFileName]: sanitized }));

    if (missingFields.length === 0 && fileObject) {
      const newValid = [
        ...validationResults.valid.filter(file => file.name !== editingBulkFileName),
        fileObject,
      ];
      const newInvalid = validationResults.invalid.filter(file => file.name !== editingBulkFileName);
      const newReasons = { ...validationResults.reasons };
      delete newReasons[editingBulkFileName];

      setValidationResults({ valid: newValid, invalid: newInvalid, reasons: newReasons });
      setSelectedFiles(newValid);
      toast.success('Metadata updated successfully');
    } else {
      const reason =
        missingFields.length > 0
          ? `Missing fields: ${missingFields.join(', ')}`
          : validationResults.reasons[editingBulkFileName] || 'Metadata incomplete';

      const filteredValid = validationResults.valid.filter(file => file.name !== editingBulkFileName);
      const filteredInvalid = validationResults.invalid.filter(file => file.name !== editingBulkFileName);
      const newInvalid = fileObject && !filteredInvalid.find(file => file.name === editingBulkFileName)
        ? [...filteredInvalid, fileObject]
        : filteredInvalid;
      const newReasons = { ...validationResults.reasons, [editingBulkFileName]: reason };

      setValidationResults({ valid: filteredValid, invalid: newInvalid, reasons: newReasons });
      setSelectedFiles(filteredValid);
      toast.error('Please complete all required fields');
    }

    handleCloseMetadataEditor();
  };

  const handleApplyDocumentTypeToAll = (documentType: string) => {
    const updates: Record<string, AutoPopulateMetadata> = {};

    Object.entries(bulkFileMetadata).forEach(([name, metadata]) => {
      if (!metadata.documentType || metadata.documentType.trim() === '') {
        updates[name] = sanitizeMetadataForSave({ ...metadata, documentType });
      }
    });

    if (Object.keys(updates).length === 0) {
      toast.info('All files already have a document type specified');
      return;
    }

    const updatedMetadata = { ...bulkFileMetadata, ...updates };
    setBulkFileMetadata(updatedMetadata);

    const newValid: File[] = [...validationResults.valid];
    const newInvalid: File[] = [...validationResults.invalid];
    const newReasons: Record<string, string> = { ...validationResults.reasons };

    Object.keys(updates).forEach(name => {
      const sanitized = sanitizeMetadataForSave(updatedMetadata[name]);
      const missing = findMissingMetadata(sanitized);
      const fileObject = allSelectedFiles[name];

      if (missing.length === 0 && fileObject) {
        if (!newValid.find(file => file.name === name)) {
          newValid.push(fileObject);
        }
        const idx = newInvalid.findIndex(file => file.name === name);
        if (idx !== -1) {
          newInvalid.splice(idx, 1);
        }
        delete newReasons[name];
      } else if (missing.length > 0) {
        newReasons[name] = `Missing fields: ${missing.join(', ')}`;
      }
    });

    setValidationResults({ valid: newValid, invalid: newInvalid, reasons: newReasons });
    setSelectedFiles(newValid);
    toast.success(`Applied document type to ${Object.keys(updates).length} file(s)`);
  };

  const isSingleMode = uploadMode === 'single';
  const hasPrimaryFile = isSingleMode ? Boolean(file && fileHash) : selectedFiles.length > 0;
  
  // Check if KYC validation would pass (without setting errors)
  const isKycValid = useMemo(() => {
    if (!kycData.fullLegalName?.trim()) return false;
    if (!kycData.dateOfBirth) return false;
    if (!kycData.phoneNumber?.trim()) return false;
    if (!kycData.emailAddress?.trim()) return false;
    if (!kycData.streetAddress1?.trim()) return false;
    if (!kycData.city?.trim()) return false;
    if (!kycData.stateProvince) return false;
    if (!kycData.postalZipCode?.trim()) return false;
    if (!kycData.country) return false;
    if (!kycData.citizenshipCountry) return false;
    if (!kycData.ssnOrItinType) return false;
    if (!kycData.ssnOrItinNumber?.trim()) return false;
    // Only require Identification Type, Number, and ID Issuing Country when ITIN is selected
    // SSN can serve both identification and SSN criteria, so these fields are not needed for SSN
    if (kycData.ssnOrItinType === 'ITIN') {
      if (!kycData.identificationType) return false;
      if (!kycData.identificationNumber?.trim()) return false;
      if (!kycData.idIssuingCountry) return false;
    }
    if (!kycData.sourceOfFunds) return false;
    if (!kycData.purposeOfLoan?.trim() || kycData.purposeOfLoan.trim().length < 20) return false;
    if (!kycData.expectedMonthlyTransactionVolume || kycData.expectedMonthlyTransactionVolume <= 0) return false;
    if (!kycData.expectedNumberOfMonthlyTransactions || kycData.expectedNumberOfMonthlyTransactions <= 0) return false;
    if (!kycData.isPEP) return false;
    if (kycData.isPEP === 'Yes' && !kycData.pepDetails?.trim()) return false;
    // governmentIdFile validation removed - collecting from form fields instead
    return true;
  }, [kycData]);
  
  // Helper function to get required fields for each loan type
  const getRequiredFieldsForLoanType = (loanType: string): string[] => {
    switch (loanType) {
      case 'home_loan':
        return ['propertyAddress', 'propertyValue', 'downPayment', 'propertyType'];
      case 'personal_loan':
        return []; // Personal loans typically don't need additional fields beyond standard ones
      case 'auto_loan':
        return ['vehicleMake', 'vehicleModel', 'vehicleYear', 'vehicleVIN', 'purchasePrice'];
      case 'business_loan':
        return ['businessName', 'businessType', 'businessRegistrationNumber', 'annualRevenue'];
      case 'student_loan':
        return ['schoolName', 'degreeProgram', 'expectedGraduationDate'];
      case 'refinance':
        return ['currentLoanNumber', 'currentLender', 'refinancePurpose'];
      case 'home_equity':
        return ['propertyAddress', 'propertyValue', 'currentMortgageBalance', 'equityAmount'];
      default:
        return [];
    }
  };

  // Check if Loan Information fields are valid (required fields)
  const isFormValid = useMemo(() => {
    if (!hasPrimaryFile) return false;
    let currentMeta = {};
    try {
      currentMeta = metadata ? JSON.parse(metadata || '{}') : {};
    } catch (e) {
      return false; // Invalid JSON means form is invalid
    }
    // Required Loan Information fields (always required)
    if (!currentMeta.loanId?.trim()) return false;
    if (!currentMeta.loanType?.trim()) return false; // Loan Type is now required
    if (!currentMeta.documentType?.trim()) return false;
    if (!currentMeta.loanAmount || currentMeta.loanAmount <= 0) return false;
    if (!currentMeta.loanTerm || currentMeta.loanTerm <= 0) return false;
    if (!currentMeta.interestRate || currentMeta.interestRate <= 0) return false;
    
    // Check conditional required fields based on loan type
    const requiredFields = getRequiredFieldsForLoanType(currentMeta.loanType || '');
    for (const field of requiredFields) {
      const value = currentMeta[field];
      if (!value || (typeof value === 'string' && !value.trim()) || (typeof value === 'number' && value <= 0)) {
        return false;
      }
    }
    
    return true;
  }, [metadata, hasPrimaryFile]);

  // Compute loan form errors
  useEffect(() => {
    if (!hasPrimaryFile) {
      setLoanFormErrors({});
      return;
    }
    let currentMeta = {};
    try {
      currentMeta = metadata ? JSON.parse(metadata || '{}') : {};
    } catch (e) {
      setLoanFormErrors({});
      return;
    }
    const errors: typeof loanFormErrors = {};
    if (!currentMeta.loanId?.trim()) errors.loanId = 'Loan ID is required';
    if (!currentMeta.loanType?.trim()) errors.loanType = 'Loan Type is required';
    if (!currentMeta.documentType?.trim()) errors.documentType = 'Document Type is required';
    if (!currentMeta.loanAmount || currentMeta.loanAmount <= 0) errors.loanAmount = 'Loan Amount is required and must be greater than 0';
    if (!currentMeta.loanTerm || currentMeta.loanTerm <= 0) errors.loanTerm = 'Loan Term is required and must be greater than 0';
    if (!currentMeta.interestRate || currentMeta.interestRate <= 0) errors.interestRate = 'Interest Rate is required and must be greater than 0';
    
    // Check conditional required fields based on loan type
    const requiredFields = getRequiredFieldsForLoanType(currentMeta.loanType || '');
    for (const field of requiredFields) {
      const value = currentMeta[field];
      if (!value || (typeof value === 'string' && !value.trim()) || (typeof value === 'number' && value <= 0)) {
        const fieldLabels: Record<string, string> = {
          propertyAddress: 'Property Address',
          propertyValue: 'Property Value',
          downPayment: 'Down Payment',
          propertyType: 'Property Type',
          vehicleMake: 'Vehicle Make',
          vehicleModel: 'Vehicle Model',
          vehicleYear: 'Vehicle Year',
          vehicleVIN: 'Vehicle VIN',
          purchasePrice: 'Purchase Price',
          businessName: 'Business Name',
          businessType: 'Business Type',
          businessRegistrationNumber: 'Business Registration Number',
          annualRevenue: 'Annual Revenue',
          schoolName: 'School Name',
          degreeProgram: 'Degree Program',
          expectedGraduationDate: 'Expected Graduation Date',
          currentLoanNumber: 'Current Loan Number',
          currentLender: 'Current Lender',
          refinancePurpose: 'Refinance Purpose',
          currentMortgageBalance: 'Current Mortgage Balance',
          equityAmount: 'Equity Amount'
        };
        errors[field as keyof typeof errors] = `${fieldLabels[field] || field} is required`;
      }
    }
    
    setLoanFormErrors(errors);
  }, [metadata, hasPrimaryFile]);
  
  // Check if file is already sealed (blocks upload)
  const isFileAlreadySealed = Boolean(verifyResult && verifyResult.is_valid);
  
  // Check required fields (marked with red stars):
  // - File must be selected
  // - All required KYC fields must be filled
  // - All required Loan Information fields must be filled
  // - File must not be already sealed
  const isUploadDisabled =
    isUploading ||
    isVerifying ||
    Boolean(uploadResult) ||
    isFileAlreadySealed ||
    !hasPrimaryFile ||
    !isKycValid ||
    !isFormValid;

  const validateLoanFile = (file: File): { isValid: boolean; reason?: string } => {
    const validExtensions = ['.pdf', '.json', '.docx', '.xlsx', '.txt', '.jpg', '.jpeg', '.png'];
    const invalidPatterns = [
      /\.(exe|dll|bat|cmd|sh|ps1|app|dmg)$/i, // Executables
      /\.(zip|rar|7z|tar|gz)$/i, // Archives (should be unpacked first)
      /\.(mp3|mp4|avi|mov|mkv|wav|flac)$/i, // Media files
      /^(\.|~)/, // Hidden or temp files
      /node_modules|\.git|\.vscode|__pycache__|\.DS_Store/i // System/IDE files
    ];

    const fileName = file.name.toLowerCase();
    const fileExt = fileName.substring(fileName.lastIndexOf('.'));

    // Check if file extension is valid
    if (!validExtensions.includes(fileExt)) {
      return { isValid: false, reason: `Invalid file type: ${fileExt}. Only loan documents are allowed.` };
    }

    // Check for invalid patterns
    for (const pattern of invalidPatterns) {
      if (pattern.test(fileName)) {
        return { isValid: false, reason: `File type not allowed for loan processing: ${fileName}` };
      }
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return { isValid: false, reason: 'File size exceeds 50MB limit' };
    }

    return { isValid: true };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles.length);
    
    // Handle different upload modes
    if (uploadMode === 'single') {
      // Single file mode
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        // Validate the file
        const validation = validateLoanFile(selectedFile);
        if (!validation.isValid) {
          toast.error(validation.reason || 'Invalid file');
          return;
        }

        console.log('Selected file:', selectedFile.name, selectedFile.type, selectedFile.size);
        setFile(selectedFile);
        setUploadResult(null);
        setVerifyResult(null);
        setCurrentStep(2); // Move to Extract step

        // Calculate hash
        try {
          const hash = await calculateFileHash(selectedFile);
          setFileHash(hash);
          console.log('File hash calculated:', hash);
          toast.success('File hash calculated successfully');
        
        // Auto-fill form data from JSON file if it's a JSON file
        if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
          console.log('🔍 JSON file detected, calling autoFillFromJSON...');
          await autoFillFromJSON(selectedFile);
        } else {
          console.log('🔍 Not a JSON file, skipping auto-fill. File type:', selectedFile.type, 'File name:', selectedFile.name);
        }
        
        // Check if document is already sealed
        setIsVerifying(true);
        const existingVerify = await checkIfAlreadySealed(hash, etid);
        setIsVerifying(false);
        
        if (existingVerify && existingVerify.is_valid) {
          setVerifyResult(existingVerify);
          toast.error('⚠️ This document is already sealed! Upload is blocked to prevent duplicates.');
        }
      } catch (error) {
        toast.error('Failed to calculate file hash');
        console.error('Hash calculation error:', error);
      }
      }
    } else if (uploadMode === 'bulk' || uploadMode === 'directory') {
      // Bulk or Directory mode - validate all files
      const valid: File[] = [];
      const invalid: File[] = [];
      const reasons: Record<string, string> = {};
      const metadataUpdates: Record<string, AutoPopulateMetadata> = {};
      const filesMap: Record<string, File> = { ...allSelectedFiles };

      for (const file of acceptedFiles) {
        filesMap[file.name] = file;
        const validation = validateLoanFile(file);
        let reason = validation.reason;
        let metadata: AutoPopulateMetadata | null = null;

        const isJsonFile = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
        if (!reason && isJsonFile) {
          try {
            const text = await file.text();
            const jsonData = JSON.parse(text);
            metadata = buildAutoPopulateMetadata(jsonData);
          } catch (error) {
            console.error('Failed to parse JSON for bulk upload:', error);
            reason = 'Invalid JSON structure';
          }
        }

        if (metadata) {
          metadataUpdates[file.name] = metadata;
          const missingFields = findMissingMetadata(metadata);
          if (!reason && missingFields.length > 0) {
            reason = `Missing fields: ${missingFields.join(', ')}`;
          }
        }

        if (!reason && validation.isValid) {
          valid.push(file);
        } else {
          invalid.push(file);
          reasons[file.name] = reason || 'Unknown validation error';
        }
      }

      setAllSelectedFiles(filesMap);
      setBulkFileMetadata(prev => ({ ...prev, ...metadataUpdates }));
      setSelectedFiles(valid);
      setValidationResults({ valid, invalid, reasons });

      // Show validation summary
      if (invalid.length > 0) {
        toast.warning(`${valid.length} valid files, ${invalid.length} filtered out`);
      } else {
        toast.success(`All ${valid.length} files validated successfully`);
      }

      // For directory mode, also mention ObjectValidator
      if (uploadMode === 'directory') {
        toast.info(`Directory verified using ObjectValidator - ${valid.length} loan documents found`);
      }

      console.log(`Validated ${valid.length} files, filtered ${invalid.length} files`);

      // Trigger smart AI analysis for bulk/directory uploads
      if (valid.length > 0) {
        analyzeBulkFilesHandler(valid);
      }
    }
  }, [etid, uploadMode, calculateFileHash, autoFillFromJSON, checkIfAlreadySealed, validateLoanFile]);

  // Smart bulk file analysis handler - AI-powered extraction
  const analyzeBulkFilesHandler = useCallback(async (files: File[]) => {
    setIsAnalyzingBulk(true);
    try {
      console.log(`📊 Analyzing ${files.length} files with AI intelligence...`);

      // Analyze all files in parallel with smart extraction
      const analyses = await analyzeBulkFiles(files);
      setBulkAnalyses(analyses);

      // Calculate statistics
      const completeCount = analyses.filter(a => !a.needsReview).length;
      const incompleteCount = analyses.filter(a => a.needsReview).length;
      const avgConfidence = Math.round(
        analyses.reduce((sum, a) => sum + (a.overallConfidence || 0), 0) / analyses.length
      );

      // Show results
      if (completeCount === files.length) {
        toast.success(
          `🎉 All ${files.length} files analyzed! ${avgConfidence}% avg confidence. Ready to seal!`
        );
      } else if (completeCount > 0) {
        toast.success(
          `✅ Analysis complete! ${completeCount} ready, ${incompleteCount} need review (${avgConfidence}% avg confidence)`
        );
      } else {
        toast.warning(
          `⚠️ Analysis complete! All ${files.length} files need review (${avgConfidence}% avg confidence)`
        );
      }
    } catch (error) {
      console.error('Bulk analysis error:', error);
      toast.error('Failed to analyze files. Please try again.');
    } finally {
      setIsAnalyzingBulk(false);
    }
  }, []);

  // Helper function to copy KYC data from one file to all same borrower files
  const copyKycToSameBorrower = useCallback((sourceIndex: number) => {
    const sourceAnalysis = bulkAnalyses[sourceIndex];
    if (!sourceAnalysis) return;

    const sourceBorrowerName = sourceAnalysis.metadata.borrowerName?.value;
    if (!sourceBorrowerName) {
      toast.error('Source file must have a borrower name');
      return;
    }

    // Find all files with the same borrower
    const updated = bulkAnalyses.map((analysis, idx) => {
      if (idx === sourceIndex) return analysis;

      const targetBorrowerName = analysis.metadata.borrowerName?.value;
      if (targetBorrowerName && targetBorrowerName.toLowerCase() === sourceBorrowerName.toLowerCase()) {
        // Copy KYC fields
        return {
          ...analysis,
          metadata: {
            ...analysis.metadata,
            borrowerEmail: sourceAnalysis.metadata.borrowerEmail,
            borrowerPhone: sourceAnalysis.metadata.borrowerPhone,
            borrowerDateOfBirth: sourceAnalysis.metadata.borrowerDateOfBirth,
            borrowerStreetAddress: sourceAnalysis.metadata.borrowerStreetAddress,
            borrowerCity: sourceAnalysis.metadata.borrowerCity,
            borrowerState: sourceAnalysis.metadata.borrowerState,
            borrowerZipCode: sourceAnalysis.metadata.borrowerZipCode,
            borrowerCountry: sourceAnalysis.metadata.borrowerCountry,
            borrowerSSNLast4: sourceAnalysis.metadata.borrowerSSNLast4,
            borrowerGovernmentIdType: sourceAnalysis.metadata.borrowerGovernmentIdType,
            borrowerIdNumberLast4: sourceAnalysis.metadata.borrowerIdNumberLast4,
            borrowerEmploymentStatus: sourceAnalysis.metadata.borrowerEmploymentStatus,
            borrowerAnnualIncome: sourceAnalysis.metadata.borrowerAnnualIncome,
          },
          sameBorrowerDetected: true,
        };
      }
      return analysis;
    });

    setBulkAnalyses(updated);
    const copiedCount = updated.filter(a => a.sameBorrowerDetected).length - 1;
    toast.success(`✅ Copied KYC data to ${copiedCount} file(s) with same borrower`);
  }, [bulkAnalyses]);

  // File acceptance configuration
  const fileAccept = {
    'application/pdf': ['.pdf'],
    'application/json': ['.json'],
    'text/plain': ['.txt'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    alert('handleFileSelect function called!');
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      alert('File selected: ' + selectedFile.name + ', Type: ' + selectedFile.type);
      setFile(selectedFile);
      setUploadResult(null);
      setVerifyResult(null);
      
      // Calculate hash
      try {
        const hash = await calculateFileHash(selectedFile);
        setFileHash(hash);
        toast.success('File hash calculated successfully');
        
        // Auto-fill form data from JSON file if it's a JSON file
        if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
          console.log('🔍 JSON file detected, calling autoFillFromJSON...');
          await autoFillFromJSON(selectedFile);
        } else {
          console.log('🔍 Not a JSON file, skipping auto-fill. File type:', selectedFile.type, 'File name:', selectedFile.name);
        }
        
        // Check if document is already sealed
        setIsVerifying(true);
        const existingVerify = await checkIfAlreadySealed(hash, etid);
        setIsVerifying(false);
        
        if (existingVerify && existingVerify.is_valid) {
          setVerifyResult(existingVerify);
          toast.error('⚠️ This document is already sealed! Upload is blocked to prevent duplicates.');
        }
      } catch (error) {
        toast.error('Failed to calculate file hash');
        console.error('Hash calculation error:', error);
      }
    }
  };

  // Handle Demo Mode Loading - Single File
  const handleSingleFileDemo = () => {
    console.log('🎬 Loading single file demo mode...');
    setIsDemoMode(true);
    setUploadMode('single');

    try {
      // Generate demo data
      const demoDocuments = generateDemoDocumentSet();
      const demoKYC = generateDemoKYCData();

      console.log('📄 Generated demo documents:', demoDocuments);
      console.log('👤 Generated demo KYC:', demoKYC);

      // Convert first demo document to File and auto-upload
      if (demoDocuments && demoDocuments.length > 0) {
        const firstDoc = demoDocuments[0];
        const jsonContent = JSON.stringify(firstDoc, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const fileName = `demo_loan_${firstDoc.security_level || 'standard'}_1.json`;
        const demoFile = new File([blob], fileName, { type: 'application/json' });

        // Simulate file drop
        setTimeout(async () => {
          console.log('🚀 Auto-uploading demo file...');
          setFile(demoFile);
          setCurrentStep(2);

          // Calculate file hash (required for upload button to be enabled)
          try {
            const hash = await calculateFileHash(demoFile);
            setFileHash(hash);
            console.log('Demo file hash calculated:', hash);
          } catch (error) {
            console.error('Failed to calculate demo file hash:', error);
          }

          // Trigger auto-fill
          autoFillFromJSON(demoFile).then(() => {
            toast.success('✨ Single file demo loaded! Review the auto-filled form.');
          }).catch(error => {
            console.error('Demo auto-fill error:', error);
            toast.error('Demo loaded but auto-fill failed. Please review form.');
          });
        }, 500);
      }

      // Pre-fill KYC data
      setTimeout(() => {
        setKycData(prev => ({
          ...prev,
          ...demoKYC
        }));
      }, 800);

      // Pre-fill Loan Information including loanType and conditional fields
      setTimeout(() => {
        if (demoDocuments && demoDocuments.length > 0) {
          const firstDoc = demoDocuments[0];
          const loanMeta: any = {
            loanId: firstDoc.loan_id,
            loanType: firstDoc.loan_type || 'home_loan',
            documentType: firstDoc.document_type || 'loan_application',
            loanAmount: firstDoc.loan_amount,
            loanTerm: firstDoc.loan_term_months,
            interestRate: firstDoc.interest_rate,
            propertyAddress: firstDoc.property_address || '',
          };

          // Add conditional fields based on loan type
          if (firstDoc.loan_type === 'home_loan' || firstDoc.loan_type === 'home_equity') {
            if (firstDoc.property_value) loanMeta.propertyValue = firstDoc.property_value;
            if (firstDoc.down_payment) loanMeta.downPayment = firstDoc.down_payment;
            if (firstDoc.property_type) loanMeta.propertyType = firstDoc.property_type;
            if (firstDoc.current_mortgage_balance) loanMeta.currentMortgageBalance = firstDoc.current_mortgage_balance;
            if (firstDoc.equity_amount) loanMeta.equityAmount = firstDoc.equity_amount;
          } else if (firstDoc.loan_type === 'auto_loan') {
            if (firstDoc.vehicle_make) loanMeta.vehicleMake = firstDoc.vehicle_make;
            if (firstDoc.vehicle_model) loanMeta.vehicleModel = firstDoc.vehicle_model;
            if (firstDoc.vehicle_year) loanMeta.vehicleYear = firstDoc.vehicle_year;
            if (firstDoc.vehicle_vin) loanMeta.vehicleVIN = firstDoc.vehicle_vin;
            if (firstDoc.purchase_price) loanMeta.purchasePrice = firstDoc.purchase_price;
          } else if (firstDoc.loan_type === 'business_loan') {
            if (firstDoc.business_name) loanMeta.businessName = firstDoc.business_name;
            if (firstDoc.business_type) loanMeta.businessType = firstDoc.business_type;
            if (firstDoc.business_registration_number) loanMeta.businessRegistrationNumber = firstDoc.business_registration_number;
            if (firstDoc.annual_revenue) loanMeta.annualRevenue = firstDoc.annual_revenue;
          } else if (firstDoc.loan_type === 'student_loan') {
            if (firstDoc.school_name) loanMeta.schoolName = firstDoc.school_name;
            if (firstDoc.degree_program) loanMeta.degreeProgram = firstDoc.degree_program;
            if (firstDoc.expected_graduation_date) loanMeta.expectedGraduationDate = firstDoc.expected_graduation_date;
          } else if (firstDoc.loan_type === 'refinance') {
            if (firstDoc.current_loan_number) loanMeta.currentLoanNumber = firstDoc.current_loan_number;
            if (firstDoc.current_lender) loanMeta.currentLender = firstDoc.current_lender;
            if (firstDoc.refinance_purpose) loanMeta.refinancePurpose = firstDoc.refinance_purpose;
          }

          // Update formData
          setFormData(prev => ({
            ...prev,
            loanId: loanMeta.loanId,
            loanType: loanMeta.loanType,
            documentType: loanMeta.documentType,
            loanAmount: String(loanMeta.loanAmount),
            loanTerm: String(loanMeta.loanTerm),
            interestRate: String(loanMeta.interestRate),
            propertyAddress: loanMeta.propertyAddress,
            propertyValue: String(loanMeta.propertyValue || ''),
            downPayment: String(loanMeta.downPayment || ''),
            propertyType: loanMeta.propertyType || '',
            vehicleMake: loanMeta.vehicleMake || '',
            vehicleModel: loanMeta.vehicleModel || '',
            vehicleYear: String(loanMeta.vehicleYear || ''),
            vehicleVIN: loanMeta.vehicleVIN || '',
            purchasePrice: String(loanMeta.purchasePrice || ''),
            businessName: loanMeta.businessName || '',
            businessType: loanMeta.businessType || '',
            businessRegistrationNumber: loanMeta.businessRegistrationNumber || '',
            annualRevenue: String(loanMeta.annualRevenue || ''),
            schoolName: loanMeta.schoolName || '',
            degreeProgram: loanMeta.degreeProgram || '',
            expectedGraduationDate: loanMeta.expectedGraduationDate || '',
            currentLoanNumber: loanMeta.currentLoanNumber || '',
            currentLender: loanMeta.currentLender || '',
            refinancePurpose: loanMeta.refinancePurpose || '',
            currentMortgageBalance: String(loanMeta.currentMortgageBalance || ''),
            equityAmount: String(loanMeta.equityAmount || ''),
          }));

          // Update metadata
          setMetadata(JSON.stringify(loanMeta, null, 2));
        }
      }, 1000);

    } catch (error) {
      console.error('Error generating demo data:', error);
      toast.error('Failed to load demo data');
    }
  };

  // Handle Demo Mode Loading - Multiple Files
  const handleMultipleFilesDemo = () => {
    console.log('🎬 Loading multiple files demo mode...');
    setIsDemoMode(true);
    setUploadMode('bulk');

    try {
      // Generate multiple demo documents
      const demoDocuments = generateDemoDocumentSet();

      if (demoDocuments && demoDocuments.length > 0) {
        // Create multiple demo files
        const demoFiles: File[] = demoDocuments.slice(0, 3).map((doc, index) => {
          const jsonContent = JSON.stringify(doc, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const fileName = `demo_loan_${doc.security_level || 'standard'}_${index + 1}.json`;
          return new File([blob], fileName, { type: 'application/json' });
        });

        setTimeout(() => {
          console.log('🚀 Loading multiple demo files...');
          setSelectedFiles(demoFiles);

          // Pre-fill metadata for each file
          const metadata: Record<string, any> = {};
          demoFiles.forEach((file, index) => {
            const doc = demoDocuments[index];
            const fileMeta: any = {
              documentType: doc.document_type || 'loan_application',
              loanId: doc.loan_id,
              loanType: doc.loan_type || 'home_loan',
              borrowerName: doc.borrower?.full_name || '',
              loanAmount: doc.loan_amount || 0,
              loanTerm: doc.loan_term_months || 360,
              interestRate: doc.interest_rate || 4.5,
              propertyAddress: doc.property_address || '',
            };

            // Add conditional fields based on loan type
            if (doc.loan_type === 'home_loan' || doc.loan_type === 'home_equity') {
              if (doc.property_value) fileMeta.propertyValue = doc.property_value;
              if (doc.down_payment) fileMeta.downPayment = doc.down_payment;
              if (doc.property_type) fileMeta.propertyType = doc.property_type;
              if (doc.current_mortgage_balance) fileMeta.currentMortgageBalance = doc.current_mortgage_balance;
              if (doc.equity_amount) fileMeta.equityAmount = doc.equity_amount;
            } else if (doc.loan_type === 'auto_loan') {
              if (doc.vehicle_make) fileMeta.vehicleMake = doc.vehicle_make;
              if (doc.vehicle_model) fileMeta.vehicleModel = doc.vehicle_model;
              if (doc.vehicle_year) fileMeta.vehicleYear = doc.vehicle_year;
              if (doc.vehicle_vin) fileMeta.vehicleVIN = doc.vehicle_vin;
              if (doc.purchase_price) fileMeta.purchasePrice = doc.purchase_price;
            } else if (doc.loan_type === 'business_loan') {
              if (doc.business_name) fileMeta.businessName = doc.business_name;
              if (doc.business_type) fileMeta.businessType = doc.business_type;
              if (doc.business_registration_number) fileMeta.businessRegistrationNumber = doc.business_registration_number;
              if (doc.annual_revenue) fileMeta.annualRevenue = doc.annual_revenue;
            } else if (doc.loan_type === 'student_loan') {
              if (doc.school_name) fileMeta.schoolName = doc.school_name;
              if (doc.degree_program) fileMeta.degreeProgram = doc.degree_program;
              if (doc.expected_graduation_date) fileMeta.expectedGraduationDate = doc.expected_graduation_date;
            } else if (doc.loan_type === 'refinance') {
              if (doc.current_loan_number) fileMeta.currentLoanNumber = doc.current_loan_number;
              if (doc.current_lender) fileMeta.currentLender = doc.current_lender;
              if (doc.refinance_purpose) fileMeta.refinancePurpose = doc.refinance_purpose;
            }

            metadata[file.name] = fileMeta;
          });
          setBulkFileMetadata(metadata);

          toast.success(`✨ Multiple files demo loaded! ${demoFiles.length} files ready to upload.`);
        }, 500);
      }

    } catch (error) {
      console.error('Error generating multiple files demo:', error);
      toast.error('Failed to load multiple files demo');
    }
  };

  // Handle Demo Mode Loading - Directory
  const handleDirectoryDemo = () => {
    console.log('🎬 Loading directory demo mode...');
    setIsDemoMode(true);
    setUploadMode('directory');

    try {
      // Generate demo documents for directory structure
      const demoDocuments = generateDemoDocumentSet();

      if (demoDocuments && demoDocuments.length > 0) {
        // Simulate directory structure with multiple files
        const directoryFiles: File[] = demoDocuments.map((doc, index) => {
          const jsonContent = JSON.stringify(doc, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          // Create file paths that simulate directory structure
          const fileName = `loan_documents/demo_${doc.document_type}_${index + 1}.json`;
          return new File([blob], fileName, { type: 'application/json' });
        });

        setTimeout(() => {
          console.log('🚀 Loading directory demo...');
          setSelectedFiles(directoryFiles);

          toast.success(`✨ Directory demo loaded! ${directoryFiles.length} files in directory structure.`);
        }, 500);
      }

    } catch (error) {
      console.error('Error generating directory demo:', error);
      toast.error('Failed to load directory demo');
    }
  };

  // Wrapper function for backward compatibility
  const handleDemoLoad = handleSingleFileDemo;

  useEffect(() => {
    if (uploadMode === 'single') {
      setSelectedFiles([]);
      setValidationResults({ valid: [], invalid: [], reasons: {} });
      setBulkFileMetadata({});
      setAllSelectedFiles({});
    } else {
      setFile(null);
      setFileHash('');
      setUploadResult(null);
      setVerifyResult(null);
    }
  }, [uploadMode]);

  const renderSingleUploadTab = () => (
    <>
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-sm text-blue-900">
          <p className="font-medium">Upload one loan document to auto-fill all borrower and loan fields.</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Supports JSON, PDF, DOCX, XLSX, TXT, JPG, PNG</li>
            <li>JSON files auto-populate the entire form instantly</li>
            <li>Any missing fields can be edited directly in the form before sealing</li>
          </ul>
        </div>
      </div>

      <AccessibleDropzone
        onDrop={onDrop}
        accept={fileAccept}
        maxFiles={1}
        directoryMode={false}
        maxSize={50 * 1024 * 1024}
        description="Drag and drop a loan document (JSON, PDF, DOCX, etc.) or click to select. We'll auto-fill the form for you."
        aria-label="single upload area for document sealing"
        id="file-upload-dropzone-single"
      />

      {file && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">{file.name}</span>
              <span className="text-sm text-muted-foreground">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              {isAutoFilling && (
                <div className="flex items-center space-x-1 text-sm text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Auto-filling form...</span>
                </div>
              )}
            </div>
          </div>

          {fileHash && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Hash className="h-4 w-4" />
              <span className="text-sm font-mono break-all">{fileHash}</span>
            </div>
          )}

          <DuplicateDetection
            fileHash={fileHash}
            loanId={formData.loanId}
            borrowerEmail={formData.borrowerEmail}
            borrowerSsnLast4={formData.borrowerSSNLast4}
            onDuplicateFound={handleDuplicateFound}
            onNoDuplicates={handleNoDuplicates}
            autoCheck={true}
          />

          {isVerifying && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">Checking if document is already sealed...</span>
            </div>
          )}

          {verifyResult && verifyResult.is_valid && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <div className="font-medium">❌ Document Already Sealed - Upload Blocked</div>
                  <div className="text-sm">
                    This document was already sealed on{' '}
                    <span className="font-medium">
                      {new Date(verifyResult.details.created_at).toLocaleString()}
                    </span>
                    . You cannot upload the same file again. Please use a different file.
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button asChild size="sm">
                      <a href={`http://localhost:8000/api/verify?hash=${fileHash}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Proof
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={`http://localhost:8000/api/proof?id=${verifyResult.artifact_id}`} target="_blank" rel="noopener noreferrer">
                        <Shield className="h-3 w-3 mr-1" />
                        Download Proof Bundle
                      </a>
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderBulkUploadTab = () => (
    <>
      <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-sm text-purple-900">
          <p className="font-medium">🚀 Smart Bulk Upload - AI-Powered Analysis & Batch Editing</p>
          <ul className="list-disc list-inside space-y-1 text-purple-800">
            <li>Parallel AI extraction of all files with confidence scoring</li>
            <li>Smart detection of same borrower across files for KYC auto-copy</li>
            <li>Intelligent suggestions based on data from other files</li>
            <li>One-click batch editing for missing fields</li>
          </ul>
        </div>
      </div>

      <AccessibleDropzone
        onDrop={onDrop}
        accept={fileAccept}
        directoryMode={false}
        maxSize={50 * 1024 * 1024}
        description="Drop multiple loan documents. We'll analyze them with AI and show you what needs attention."
        aria-label="smart bulk upload area"
        id="file-upload-dropzone-bulk"
      />

      {/* AI Analysis Loading State */}
      {isAnalyzingBulk && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Analyzing files with AI...</p>
                <p className="text-sm text-gray-600">
                  Extracting data, calculating confidence, detecting patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Guidance - Show smart insights */}
      {bulkAnalyses.length > 0 && !isAnalyzingBulk && !showBulkEditor && (
        <Alert className={
          bulkAnalyses.filter(a => !a.needsReview).length === bulkAnalyses.length
            ? "bg-green-50 border-green-200"
            : bulkAnalyses.filter(a => !a.needsReview).length > 0
            ? "bg-blue-50 border-blue-200"
            : "bg-yellow-50 border-yellow-200"
        }>
          {bulkAnalyses.filter(a => !a.needsReview).length === bulkAnalyses.length ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">All Files Ready! 🎉</AlertTitle>
              <AlertDescription className="text-green-700">
                All {bulkAnalyses.length} files have been analyzed and are ready to seal immediately.
                You can proceed directly to sealing or review individual files first.
              </AlertDescription>
            </>
          ) : bulkAnalyses.filter(a => !a.needsReview).length > 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Analysis Complete!</AlertTitle>
              <AlertDescription className="text-blue-700">
                <div className="space-y-2">
                  <div>
                    ✅ {bulkAnalyses.filter(a => !a.needsReview).length} files ready to seal
                    {' · '}
                    ⚠️ {bulkAnalyses.filter(a => a.needsReview).length} files need your review
                  </div>
                  {bulkAnalyses.some(a => a.sameBorrowerDetected) && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-purple-700 font-medium">
                        💡 Same borrower detected across files
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          // Find first file with borrower data
                          const sourceIdx = bulkAnalyses.findIndex(a => a.metadata.borrowerName?.value);
                          if (sourceIdx >= 0) {
                            copyKycToSameBorrower(sourceIdx);
                          }
                        }}
                      >
                        Copy KYC to All
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Review Needed</AlertTitle>
              <AlertDescription className="text-yellow-700">
                All {bulkAnalyses.length} files need additional information before sealing.
                Use the batch editor below to quickly fill in missing data.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Smart Analysis Dashboard */}
      {bulkAnalyses.length > 0 && !showBulkEditor && (
        <BulkAnalysisDashboard
          analyses={bulkAnalyses}
          onEditFile={(analysis, index) => {
            setBulkEditorIndex(index);
            setShowBulkEditor(true);
          }}
          onViewFile={(analysis, index) => {
            console.log('View file:', analysis.fileName);
          }}
          onSealAll={() => {
            // Seal all complete files
            const completeAnalyses = bulkAnalyses.filter(a => !a.needsReview);
            if (completeAnalyses.length > 0) {
              toast.info(`Ready to seal ${completeAnalyses.length} documents...`);
              // TODO: Implement actual bulk sealing
            } else {
              toast.warning('No files are ready to seal. Please complete missing data.');
            }
          }}
        />
      )}

      {/* Smart Batch Editor */}
      {bulkAnalyses.length > 0 && showBulkEditor && (
        <SmartBatchEditor
          analyses={bulkAnalyses}
          currentIndex={bulkEditorIndex}
          onPrevious={() => setBulkEditorIndex(Math.max(0, bulkEditorIndex - 1))}
          onNext={() => setBulkEditorIndex(Math.min(bulkAnalyses.length - 1, bulkEditorIndex + 1))}
          onSave={(index, updatedMetadata) => {
            // Update the analysis with new metadata
            const updated = [...bulkAnalyses];
            updated[index].metadata = updatedMetadata;

            // Recalculate completeness
            const allFields = Object.keys(updatedMetadata).filter(k => k !== 'extractionMetadata');
            const filledFields = allFields.filter(k => {
              const field = updatedMetadata[k];
              return field && field.value && field.value !== '' && field.confidence > 0;
            });
            updated[index].completeness = Math.round((filledFields.length / allFields.length) * 100);
            updated[index].needsReview = updated[index].completeness < 70;

            setBulkAnalyses(updated);
            toast.success('Changes saved!');
          }}
          onClose={() => setShowBulkEditor(false)}
        />
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  {selectedFiles.length} Valid File{selectedFiles.length > 1 ? 's' : ''} Ready
                </div>
                {validationResults.invalid.length > 0 && (
                  <div className="text-sm text-amber-700">
                    {validationResults.invalid.length} file{validationResults.invalid.length > 1 ? 's' : ''} need attention
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFiles([]);
                setValidationResults({ valid: [], invalid: [], reasons: {} });
                setBulkFileMetadata({});
                setAllSelectedFiles({});
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {validationResults.invalid.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="font-medium mb-2">Files Requiring Fixes:</div>
                <ul className="text-sm space-y-2">
                  {validationResults.invalid.slice(0, 5).map((fileItem, idx) => (
                    <li key={idx} className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        <div>
                          <span className="font-medium">{fileItem.name}</span>
                          <div className="text-xs text-amber-700">
                            {validationResults.reasons[fileItem.name]}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-4">
                        <Button size="sm" variant="outline" onClick={() => handleOpenMetadataEditor(fileItem.name)}>
                          Fix now
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveInvalidFile(fileItem.name)}>
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                  {validationResults.invalid.length > 5 && (
                    <li className="text-xs text-amber-600">
                      ...and {validationResults.invalid.length - 5} more
                    </li>
                  )}
                </ul>
                {validationResults.invalid.some(fileItem => (bulkFileMetadata[fileItem.name]?.documentType ?? '') === '') && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="secondary" onClick={() => handleApplyDocumentTypeToAll('loan_application')}>
                      Fill document type for missing files
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="max-h-60 overflow-y-auto space-y-2">
            {selectedFiles.map((fileItem, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{fileItem.name}</span>
                  <span className="text-muted-foreground">
                    ({(fileItem.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenMetadataEditor(fileItem.name)}>
                    Edit
                  </Button>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading batch...</span>
            <span>{uploadState.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        </div>
      )}
    </>
  );

  const renderDirectoryUploadTab = () => (
    <>
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-sm text-amber-900">
          <p className="font-medium">Upload an entire folder. We filter non-loan files, auto-fill metadata, and flag what's missing.</p>
          <ul className="list-disc list-inside space-y-1 text-amber-800">
            <li>Only supported document types are processed; others are excluded automatically</li>
            <li>Missing fields are highlighted with "Fix now" actions</li>
            <li>ObjectValidator generates a single directory hash for downstream verification</li>
          </ul>
        </div>
      </div>

      <AccessibleDropzone
        onDrop={onDrop}
        accept={fileAccept}
        directoryMode={true}
        maxSize={50 * 1024 * 1024}
        description="Select a directory containing loan documents. We'll inspect each file, filter non-loan content, and auto-fill metadata."
        aria-label="directory upload area for document sealing"
        id="file-upload-dropzone-directory"
      />

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  {selectedFiles.length} Loan Document{selectedFiles.length > 1 ? 's' : ''} Detected
                </div>
                {validationResults.invalid.length > 0 && (
                  <div className="text-sm text-amber-700">
                    {validationResults.invalid.length} file{validationResults.invalid.length > 1 ? 's' : ''} filtered out
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFiles([]);
                setValidationResults({ valid: [], invalid: [], reasons: {} });
                setBulkFileMetadata({});
                setAllSelectedFiles({});
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {validationResults.invalid.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="font-medium mb-2">Excluded Files:</div>
                <ul className="text-sm space-y-2">
                  {validationResults.invalid.slice(0, 5).map((fileItem, idx) => (
                    <li key={idx} className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        <div>
                          <span className="font-medium">{fileItem.name}</span>
                          <div className="text-xs text-amber-700">
                            {validationResults.reasons[fileItem.name]}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-centered gap-2 pl-4">
                        <Button size="sm" variant="outline" onClick={() => handleOpenMetadataEditor(fileItem.name)}>
                          Fix now
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveInvalidFile(fileItem.name)}>
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                  {validationResults.invalid.length > 5 && (
                    <li className="text-xs text-amber-600">
                      ...and {validationResults.invalid.length - 5} more
                    </li>
                  )}
                </ul>
                {validationResults.invalid.some(fileItem => (bulkFileMetadata[fileItem.name]?.documentType ?? '') === '') && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="secondary" onClick={() => handleApplyDocumentTypeToAll('loan_application')}>
                      Fill document type for missing files
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="max-h-60 overflow-y-auto space-y-2">
            {selectedFiles.map((fileItem, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{fileItem.name}</span>
                  <span className="text-muted-foreground">
                    ({(fileItem.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenMetadataEditor(fileItem.name)}>
                    Edit
                  </Button>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>ObjectValidator:</strong> Directory contents verified. A single directory hash will be generated for efficient sealing and later verification.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing directory...</span>
            <span>{uploadState.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        </div>
      )}
    </>
  );

  const handleUpload = async () => {
    console.log('Upload button clicked');

    // Clear previous errors
    setUploadState(prev => ({ ...prev, error: null, validationErrors: [] }));
    
    // Block upload if file is already sealed
    if (isFileAlreadySealed) {
      toast.error('❌ Cannot upload: This document is already sealed on the blockchain. Please use a different file.');
      return;
    }
    
  // If potential duplicates are detected, block unless explicitly allowed
  if (duplicateCheckResult?.is_duplicate && !allowUploadDespiteDuplicates) {
    setShowDuplicateWarning(true);
    toast.error('Duplicates detected! Please review and confirm before proceeding.');
    return;
  }

  // Enforce KYC completeness before allowing upload
  if (!validateKYC()) {
    toast.error('KYC information is required. Please complete all required fields.');
    return;
  }
    
    // Validate form first
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setUploadState(prev => ({ 
        ...prev, 
        validationErrors,
        error: {
          type: 'validation',
          message: `Please fix ${validationErrors.length} error${validationErrors.length > 1 ? 's' : ''} before submitting`,
          retryable: false
        }
      }));
      setShowValidationSummary(true);
      return;
    }

    if (isSingleMode) {
      if (!file || !fileHash) {
        console.log('No file or hash available');
        toast.error('Please select a file first');
        return;
      }

      console.log('Starting upload for file:', file.name);
      
      // Save form data before upload
      saveFormData();
      setBulkUploadResults([]);
      
      // Update upload state
      setUploadState(prev => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
        canRetry: false
      }));
      
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Get raw metadata and sanitize it
        const currentMeta = metadata ? JSON.parse(metadata || '{}') : {};
        
        // Prepare raw data for sanitization
        const rawLoanData = {
          loanId: currentMeta.loanId || `loan-${Date.now()}`,
          documentType: currentMeta.documentType || 'loan_application',
          loanAmount: currentMeta.loanAmount || 0,
          borrowerName: currentMeta.borrowerFullName || currentMeta.borrowerName || '',
          additionalNotes: currentMeta.notes || '',
          createdBy: 'user@example.com' // TODO: Get from auth context
        };

        // Get borrower data from KYC section (preferred) or metadata (fallback)
        const rawBorrowerData = {
          fullName: kycData.fullLegalName || currentMeta.borrowerFullName || '',
          dateOfBirth: kycData.dateOfBirth || currentMeta.borrowerDateOfBirth || '',
          email: kycData.emailAddress || currentMeta.borrowerEmail || '',
          phone: kycData.phoneNumber || currentMeta.borrowerPhone || '',
          streetAddress: kycData.streetAddress1 || currentMeta.borrowerStreetAddress || '',
          city: kycData.city || currentMeta.borrowerCity || '',
          state: kycData.stateProvince || currentMeta.borrowerState || '',
          zipCode: kycData.postalZipCode || currentMeta.borrowerZipCode || '',
          country: kycData.country || currentMeta.borrowerCountry || 'US',
          // Extract last 4 digits from SSN/ITIN number
          ssnLast4: kycData.ssnOrItinNumber ? kycData.ssnOrItinNumber.slice(-4).replace(/-/g, '') : (currentMeta.borrowerSSNLast4 || ''),
          ssnOrItinType: kycData.ssnOrItinType || '',
          ssnOrItinNumber: kycData.ssnOrItinNumber || '',
          governmentIdType: kycData.identificationType || currentMeta.borrowerGovernmentIdType || 'drivers_license',
          idNumberLast4: kycData.identificationNumber ? kycData.identificationNumber.slice(-4) : (currentMeta.borrowerIdNumberLast4 || ''),
          employmentStatus: currentMeta.borrowerEmploymentStatus || 'employed',
          annualIncome: currentMeta.borrowerAnnualIncome || 0,
          coBorrowerName: currentMeta.borrowerCoBorrowerName || ''
        };

        // Sanitize all form data
        const sanitizedLoanData = sanitizeFormData(rawLoanData);
        const sanitizedBorrowerData = sanitizeFormData(rawBorrowerData);
        
        // Convert annual income to number and then to income range string
        const annualIncomeNumber = typeof sanitizedBorrowerData.annualIncome === 'string' 
          ? parseFloat(sanitizedBorrowerData.annualIncome) || 0
          : Number(sanitizedBorrowerData.annualIncome) || 0;
        const annualIncomeRange = getIncomeRange(annualIncomeNumber);
        
        // Get loanType and conditional fields from metadata
        const loanType = currentMeta.loanType || '';
        const conditionalFields: any = {};
        if (loanType === 'home_loan' || loanType === 'home_equity') {
          if (currentMeta.propertyValue) conditionalFields.propertyValue = currentMeta.propertyValue;
          if (currentMeta.downPayment) conditionalFields.downPayment = currentMeta.downPayment;
          if (currentMeta.propertyType) conditionalFields.propertyType = currentMeta.propertyType;
          if (currentMeta.currentMortgageBalance) conditionalFields.currentMortgageBalance = currentMeta.currentMortgageBalance;
          if (currentMeta.equityAmount) conditionalFields.equityAmount = currentMeta.equityAmount;
        } else if (loanType === 'auto_loan') {
          if (currentMeta.vehicleMake) conditionalFields.vehicleMake = currentMeta.vehicleMake;
          if (currentMeta.vehicleModel) conditionalFields.vehicleModel = currentMeta.vehicleModel;
          if (currentMeta.vehicleYear) conditionalFields.vehicleYear = currentMeta.vehicleYear;
          if (currentMeta.vehicleVIN) conditionalFields.vehicleVIN = currentMeta.vehicleVIN;
          if (currentMeta.purchasePrice) conditionalFields.purchasePrice = currentMeta.purchasePrice;
        } else if (loanType === 'business_loan') {
          if (currentMeta.businessName) conditionalFields.businessName = currentMeta.businessName;
          if (currentMeta.businessType) conditionalFields.businessType = currentMeta.businessType;
          if (currentMeta.businessRegistrationNumber) conditionalFields.businessRegistrationNumber = currentMeta.businessRegistrationNumber;
          if (currentMeta.annualRevenue) conditionalFields.annualRevenue = currentMeta.annualRevenue;
        } else if (loanType === 'student_loan') {
          if (currentMeta.schoolName) conditionalFields.schoolName = currentMeta.schoolName;
          if (currentMeta.degreeProgram) conditionalFields.degreeProgram = currentMeta.degreeProgram;
          if (currentMeta.expectedGraduationDate) conditionalFields.expectedGraduationDate = currentMeta.expectedGraduationDate;
        } else if (loanType === 'refinance') {
          if (currentMeta.currentLoanNumber) conditionalFields.currentLoanNumber = currentMeta.currentLoanNumber;
          if (currentMeta.currentLender) conditionalFields.currentLender = currentMeta.currentLender;
          if (currentMeta.refinancePurpose) conditionalFields.refinancePurpose = currentMeta.refinancePurpose;
        }

        // Create final loan data object with loanType and conditional fields
        const loanData: any = {
          loan_id: sanitizedLoanData.loanId,
          document_type: sanitizedLoanData.documentType,
          borrower_name: sanitizedLoanData.borrowerName,
          property_address: sanitizedLoanData.propertyAddress || '',
          loan_amount: sanitizedLoanData.loanAmount,
          interest_rate: sanitizedLoanData.interestRate ? parseFloat(sanitizedLoanData.interestRate) : undefined,
          loan_term: sanitizedLoanData.loanTerm ? parseInt(sanitizedLoanData.loanTerm) : undefined,
          additional_notes: sanitizedLoanData.additionalNotes,
          loanType: loanType, // Include loan type
          ...conditionalFields // Spread conditional fields
        };

        // Create final borrower data object - prioritize KYC data over metadata
        const borrowerInfo: any = {
          full_name: kycData.fullLegalName || sanitizedBorrowerData.fullName,
          date_of_birth: kycData.dateOfBirth || sanitizedBorrowerData.dateOfBirth,
          email: kycData.emailAddress || sanitizedBorrowerData.email,
          phone: kycData.phoneNumber || sanitizedBorrowerData.phone,
          address_line1: kycData.streetAddress1 || sanitizedBorrowerData.streetAddress,
          address_line2: kycData.streetAddress2 || '',
          city: kycData.city || sanitizedBorrowerData.city,
          state: kycData.stateProvince || sanitizedBorrowerData.state,
          zip_code: kycData.postalZipCode || sanitizedBorrowerData.zipCode,
          country: kycData.country || sanitizedBorrowerData.country,
          // Extract last 4 digits from SSN/ITIN number
          ssn_last4: kycData.ssnOrItinNumber ? kycData.ssnOrItinNumber.slice(-4).replace(/-/g, '') : (sanitizedBorrowerData.ssnLast4 || ''),
          id_type: kycData.identificationType || sanitizedBorrowerData.governmentIdType,
          id_last4: kycData.identificationNumber ? kycData.identificationNumber.slice(-4) : (sanitizedBorrowerData.idNumberLast4 || ''),
          employment_status: sanitizedBorrowerData.employmentStatus,
          annual_income_range: annualIncomeRange, // Now a string like "$30,000 - $49,999"
          is_sealed: false,
          // Include SSN/ITIN fields
          ssn_or_itin_type: kycData.ssnOrItinType || '',
          ssn_or_itin_number: kycData.ssnOrItinNumber || ''
        };

        console.log('Loan data:', loanData);
        console.log('Borrower info:', borrowerInfo);

        toast.loading('Sealing loan document with borrower information...');

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadState(prev => {
            const newProgress = Math.min(prev.progress + 10, 90);
            return { ...prev, progress: newProgress };
          });
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

          // Use the appropriate API client based on security mode
          console.log('🔐 Security Mode Selection:', { quantumSafeMode, maximumSecurityMode });
          let sealResponse;
          if (quantumSafeMode) {
            console.log('🔬 Using QUANTUM-SAFE endpoint');
            sealResponse = await sealLoanDocumentQuantumSafe(loanData, borrowerInfo, [file]);
          } else if (maximumSecurityMode) {
            console.log('🛡️ Using MAXIMUM SECURITY endpoint');
            sealResponse = await sealLoanDocumentMaximumSecurity(loanData, borrowerInfo, [file]);
          } else {
            console.log('📄 Using STANDARD endpoint');
            sealResponse = await sealLoanDocument(loanData, borrowerInfo, [file]);
          }
          console.log('✅ Seal Response received:', { artifact_id: sealResponse.artifact_id, security_level: sealResponse.quantum_safe_seal?.security_level || sealResponse.comprehensive_seal?.security_level || 'standard' });
        
        clearInterval(progressInterval);
        
        console.log('Seal response:', sealResponse);

        // Complete progress
        setUploadState(prev => ({ ...prev, progress: 100 }));
        setUploadProgress(100);

        // Create UploadResult for compatibility with existing UI
        const uploadResult: UploadResult = {
          artifactId: sealResponse.artifact_id,
          walacorTxId: sealResponse.walacor_tx_id,
          sealedAt: sealResponse.sealed_at,
          proofBundle: sealResponse.blockchain_proof || {}
        };

        setUploadResult(uploadResult);
        setBulkUploadResults([]);
        setCurrentStep(4); // Move to Seal complete step

        // Clear saved data on success
        clearSavedData();

        // Show success modal with confetti effect
        setShowSuccessModal(true);
        toast.success('Loan document sealed successfully with borrower information!');

      } catch (error) {
        console.error('Upload error:', error);
        
        const uploadError = handleError(error, 'sealLoanDocument');
        
        setUploadState(prev => ({
          ...prev,
          error: uploadError,
          canRetry: uploadError.retryable || false
        }));
        
        // Show error modal for serious errors
        if (uploadError.type === 'server' || uploadError.type === 'network') {
          setShowErrorModal(true);
        }
        
        toast.error(uploadError.message);
        
      } finally {
        setUploadState(prev => ({ ...prev, isUploading: false }));
        setIsUploading(false);
        setUploadProgress(0);
      }
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please add at least one file to upload');
      return;
    }

    const sanitizedMetadataByFile: Record<string, AutoPopulateMetadata> = {};
    const filesMissingMetadata: Record<string, string[]> = {};

    selectedFiles.forEach(fileItem => {
      const baseMetadata = bulkFileMetadata[fileItem.name] || createEmptyMetadata();
      const sanitizedMetadata = sanitizeMetadataForSave(baseMetadata);
      sanitizedMetadataByFile[fileItem.name] = sanitizedMetadata;
      const missing = findMissingMetadata(sanitizedMetadata);
      if (missing.length > 0) {
        filesMissingMetadata[fileItem.name] = missing;
      }
    });

    if (Object.keys(filesMissingMetadata).length > 0) {
      const reasons = { ...validationResults.reasons };
      Object.entries(filesMissingMetadata).forEach(([fileName, missing]) => {
        reasons[fileName] = `Missing fields: ${missing.join(', ')}`;
      });
      setValidationResults(prev => ({
        ...prev,
        invalid: [
          ...prev.invalid,
          ...selectedFiles.filter(fileItem => filesMissingMetadata[fileItem.name] && !prev.invalid.find(f => f.name === fileItem.name))
        ],
        reasons
      }));
      toast.error('Some files are missing required information. Please fix them before uploading.');
      setShowValidationSummary(true);
      return;
    }

    saveFormData();
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
      canRetry: false
    }));
    setIsUploading(true);
    setUploadProgress(0);
    setBulkUploadResults([]);

    try {
      // Directory mode: Seal all files as a single directory container
      if (uploadMode === 'directory') {
        setUploadProgress(10);
        toast.loading('Calculating file hashes...');

        // Calculate hashes for all files
        const fileInfoPromises = selectedFiles.map(async (fileItem) => {
          const hash = await calculateFileHash(fileItem);
          return {
            filename: fileItem.name,
            file_hash: hash,
            file_size: fileItem.size
          } as DirectoryFileInfo;
        });

        const fileInfos = await Promise.all(fileInfoPromises);
        setUploadProgress(30);

        // Generate directory hash (combining all file hashes)
        // Note: In production, ObjectValidator would generate this
        const combinedHash = await calculateFileHash(
          new Blob([fileInfos.map(f => f.file_hash).join('')])
        );

        setUploadProgress(40);
        toast.loading('Sealing directory...');

        // Use metadata from first file for loan/borrower info
        const meta = sanitizedMetadataByFile[selectedFiles[0].name];
        const loanAmountNumber = parseFloat(meta.loanAmount || '0');
        const annualIncomeNumber = parseFloat(meta.borrowerAnnualIncome || '0');

        const loanData: LoanData = {
          loan_id: meta.loanId || `loan-${Date.now()}`,
          document_type: (meta.documentType || 'loan_application') as LoanData['document_type'],
          borrower_name: meta.borrowerName || '',
          property_address: meta.propertyAddress || '',
          loan_amount: Number.isNaN(loanAmountNumber) ? 0 : loanAmountNumber,
          interest_rate: meta.interestRate ? parseFloat(meta.interestRate) : undefined,
          loan_term: meta.loanTerm ? parseInt(meta.loanTerm) : undefined,
          additional_notes: meta.additional_notes || ''
        };

        const borrowerInfo: BorrowerInfo = {
          full_name: meta.borrowerName || '',
          date_of_birth: meta.borrowerDateOfBirth || '',
          email: meta.borrowerEmail || '',
          phone: meta.borrowerPhone || '',
          address_line1: meta.borrowerStreetAddress || '',
          address_line2: '',
          city: meta.borrowerCity || '',
          state: meta.borrowerState || '',
          zip_code: meta.borrowerZipCode || '',
          country: meta.borrowerCountry || 'US',
          ssn_last4: meta.borrowerSSNLast4 || '',
          id_type: (meta.borrowerGovernmentIdType || 'drivers_license') as BorrowerInfo['id_type'],
          id_last4: meta.borrowerIdNumberLast4 || '',
          employment_status: (meta.borrowerEmploymentStatus || 'employed') as BorrowerInfo['employment_status'],
          annual_income_range: getIncomeRange(Number.isNaN(annualIncomeNumber) ? 0 : annualIncomeNumber),
          is_sealed: false
        };

        setUploadProgress(60);

        // Seal directory with all files
        const directoryName = `loan_docs_${loanData.loan_id}`;
        const directorySealResponse = await sealDirectory(
          directoryName,
          combinedHash,
          fileInfos,
          loanData,
          borrowerInfo
        );

        setUploadProgress(100);

        // Create result for UI display
        const uploadResult: UploadResult = {
          artifactId: directorySealResponse.container_id,
          walacorTxId: directorySealResponse.walacor_tx_id,
          sealedAt: directorySealResponse.sealed_at,
          proofBundle: {}
        };

        setUploadResult(uploadResult);
        setBulkUploadResults([]);
        setCurrentStep(4);

        clearSavedData();
        setSelectedFiles([]);
        setValidationResults({ valid: [], invalid: [], reasons: {} });
        setBulkFileMetadata({});
        setAllSelectedFiles({});
        setMetadata('');
        setShowMetadataEditor(false);
        setShowSuccessModal(true);
        toast.success(`Directory sealed successfully with ${fileInfos.length} files!`);

      } else {
        // Bulk mode: Seal each file individually
        const results: BulkUploadResult[] = [];
        for (let index = 0; index < selectedFiles.length; index += 1) {
        const fileItem = selectedFiles[index];
        const meta = sanitizedMetadataByFile[fileItem.name];

        const loanAmountNumber = parseFloat(meta.loanAmount || '0');
        const annualIncomeNumber = parseFloat(meta.borrowerAnnualIncome || '0');

        const loanData: LoanData = {
          loan_id: meta.loanId || `loan-${Date.now()}-${index}`,
          document_type: (meta.documentType || 'loan_application') as LoanData['document_type'],
          borrower_name: meta.borrowerName || '',
          property_address: meta.propertyAddress || '',
          loan_amount: Number.isNaN(loanAmountNumber) ? 0 : loanAmountNumber,
          interest_rate: meta.interestRate ? parseFloat(meta.interestRate) : undefined,
          loan_term: meta.loanTerm ? parseInt(meta.loanTerm) : undefined,
          additional_notes: meta.additionalNotes
        };

        const borrowerFullName = meta.borrowerName || '';
        const borrowerInfo: BorrowerInfo = {
          full_name: borrowerFullName,
          date_of_birth: meta.borrowerDateOfBirth || '',
          email: meta.borrowerEmail || '',
          phone: meta.borrowerPhone || '',
          address_line1: meta.borrowerStreetAddress || '',
          address_line2: '',
          city: meta.borrowerCity || '',
          state: meta.borrowerState || '',
          zip_code: meta.borrowerZipCode || '',
          country: meta.borrowerCountry || 'US',
          ssn_last4: meta.borrowerSSNLast4 || '',
          id_type: (meta.borrowerGovernmentIdType || 'drivers_license') as BorrowerInfo['id_type'],
          id_last4: meta.borrowerIdNumberLast4 || '',
          employment_status: (meta.borrowerEmploymentStatus || 'employed') as BorrowerInfo['employment_status'],
          annual_income_range: String(Number.isNaN(annualIncomeNumber) ? 0 : annualIncomeNumber),
          is_sealed: false
        };

        const progressValue = Math.round((index / selectedFiles.length) * 100);
        setUploadState(prev => ({ ...prev, progress: progressValue }));
        setUploadProgress(progressValue);

        let sealResponse;
        if (quantumSafeMode) {
          sealResponse = await sealLoanDocumentQuantumSafe(loanData, borrowerInfo, [fileItem]);
        } else if (maximumSecurityMode) {
          sealResponse = await sealLoanDocumentMaximumSecurity(loanData, borrowerInfo, [fileItem]);
        } else {
          sealResponse = await sealLoanDocument(loanData, borrowerInfo, [fileItem]);
        }

        results.push({
          fileName: fileItem.name,
          result: {
            artifactId: sealResponse.artifact_id,
            walacorTxId: sealResponse.walacor_tx_id,
            sealedAt: sealResponse.sealed_at,
            proofBundle: sealResponse.blockchain_proof || {}
          }
        });

        const nextProgress = Math.round(((index + 1) / selectedFiles.length) * 100);
        setUploadState(prev => ({ ...prev, progress: nextProgress }));
        setUploadProgress(nextProgress);
      }

      setBulkUploadResults(results);
      if (results.length > 0) {
        setUploadResult(results[results.length - 1].result);
      }

      clearSavedData();
      setSelectedFiles([]);
      setValidationResults({ valid: [], invalid: [], reasons: {} });
      setBulkFileMetadata({});
      setAllSelectedFiles({});
      setMetadata('');
      setShowMetadataEditor(false);
      setShowSuccessModal(true);
      toast.success(`Sealed ${results.length} document${results.length > 1 ? 's' : ''} successfully!`);
      } // End of bulk mode else block

    } catch (error) {
      console.error('Bulk upload error:', error);
      const uploadError = handleError(error, 'bulkSealLoanDocument');

      setUploadState(prev => ({
        ...prev,
        error: uploadError,
        canRetry: uploadError.retryable || false
      }));

      if (uploadError.type === 'server' || uploadError.type === 'network') {
        setShowErrorModal(true);
      }

      toast.error(uploadError.message);
    } finally {
      setUploadState(prev => ({ ...prev, isUploading: false }));
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Retry upload function
  const handleRetry = async () => {
    setUploadState(prev => ({ ...prev, error: null, canRetry: false }));
    await handleUpload();
  };

  // Helper function to get income range
  const getIncomeRange = (annualIncome: number): string => {
    if (annualIncome < 25000) return "Under $25,000";
    if (annualIncome < 50000) return "$25,000 - $49,999";
    if (annualIncome < 75000) return "$50,000 - $74,999";
    if (annualIncome < 100000) return "$75,000 - $99,999";
    if (annualIncome < 150000) return "$100,000 - $149,999";
    if (annualIncome < 200000) return "$150,000 - $199,999";
    if (annualIncome < 300000) return "$200,000 - $299,999";
    if (annualIncome < 500000) return "$300,000 - $499,999";
    return "$500,000+";
  };

  // Enhanced validation function - only checks Loan Information fields
  // KYC fields are validated separately via validateKYC()
  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    let currentMeta = {};
    try {
      currentMeta = metadata ? JSON.parse(metadata || '{}') : {};
    } catch (e) {
      // Invalid JSON means form is invalid
      errors.push({ field: 'metadata', message: 'Invalid form data. Please refresh and try again.' });
      return errors;
    }

    // File validation
    if (isSingleMode) {
      if (!file) {
        errors.push({ field: 'file', message: 'Please select a file to upload' });
      } else if (file.size > 50 * 1024 * 1024) { // 50MB limit
        errors.push({ field: 'file', message: 'File size must be less than 50MB' });
      }
    } else {
      if (selectedFiles.length === 0) {
        errors.push({ field: 'selectedFiles', message: 'Please select at least one document to upload' });
      } else {
        selectedFiles.forEach(fileItem => {
          const meta = sanitizeMetadataForSave(bulkFileMetadata[fileItem.name] || createEmptyMetadata());
          const missing = findMissingMetadata(meta);
          if (missing.length > 0) {
            errors.push({
              field: `metadata-${fileItem.name}`,
              message: `${fileItem.name} is missing: ${missing.join(', ')}`
            });
          }
        });
      }
    }

    // Loan Information validation (required fields with red stars)
  if (!currentMeta.loanId?.trim()) {
    errors.push({ field: 'loanId', message: 'Loan ID is required' });
  }
    if (!currentMeta.documentType?.trim()) {
      errors.push({ field: 'documentType', message: 'Document Type is required' });
    }
  if (!currentMeta.loanAmount || currentMeta.loanAmount <= 0) {
    errors.push({ field: 'loanAmount', message: 'Valid loan amount is required' });
  }
    if (!currentMeta.loanTerm || currentMeta.loanTerm <= 0) {
      errors.push({ field: 'loanTerm', message: 'Loan Term is required and must be greater than 0' });
    }
    if (!currentMeta.interestRate || currentMeta.interestRate <= 0) {
      errors.push({ field: 'interestRate', message: 'Interest Rate is required and must be greater than 0' });
  }

    // Check conditional required fields based on loan type
    const requiredFields = getRequiredFieldsForLoanType(currentMeta.loanType || '');
    for (const field of requiredFields) {
      const value = currentMeta[field];
      if (!value || (typeof value === 'string' && !value.trim()) || (typeof value === 'number' && value <= 0)) {
        const fieldLabels: Record<string, string> = {
          propertyAddress: 'Property Address',
          propertyValue: 'Property Value',
          downPayment: 'Down Payment',
          propertyType: 'Property Type',
          vehicleMake: 'Vehicle Make',
          vehicleModel: 'Vehicle Model',
          vehicleYear: 'Vehicle Year',
          vehicleVIN: 'Vehicle VIN',
          purchasePrice: 'Purchase Price',
          businessName: 'Business Name',
          businessType: 'Business Type',
          businessRegistrationNumber: 'Business Registration Number',
          annualRevenue: 'Annual Revenue',
          schoolName: 'School Name',
          degreeProgram: 'Degree Program',
          expectedGraduationDate: 'Expected Graduation Date',
          currentLoanNumber: 'Current Loan Number',
          currentLender: 'Current Lender',
          refinancePurpose: 'Refinance Purpose',
          currentMortgageBalance: 'Current Mortgage Balance',
          equityAmount: 'Equity Amount'
        };
        errors.push({ 
          field: field, 
          message: `${fieldLabels[field] || field} is required` 
        });
  }
    }

    // Note: Borrower information is now in KYC section and validated via validateKYC()

    return errors;
  };

  // Error handling utilities
  const handleError = (error: any, context: string = 'upload'): UploadError => {
    console.error(`Error in ${context}:`, error);

    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        details: error,
        retryable: true
      };
    }

    if (error.response?.status >= 500) {
      return {
        type: 'server',
        message: 'Something went wrong on our end. Please try again or contact support.',
        details: error.response?.data,
        retryable: true
      };
    }

    if (error.response?.status === 400) {
      return {
        type: 'validation',
        message: error.response?.data?.error || 'Please check your input and try again.',
        details: error.response?.data,
        retryable: false
      };
    }

    if (error.message?.includes('walacor') || error.message?.includes('blockchain')) {
      return {
        type: 'walacor',
        message: 'Blockchain sealing failed. Document saved locally with pending seal status.',
        details: error,
        retryable: true
      };
    }

    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred. Please try again.',
      details: error,
      retryable: true
    };
  };

  // Save form data to localStorage
  const saveFormData = () => {
    const formData = {
      file: file ? { name: file.name, size: file.size, type: file.type } : null,
      metadata,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('uploadFormData', JSON.stringify(formData));
  };

  // Load form data from localStorage
  const loadFormData = () => {
    const saved = localStorage.getItem('uploadFormData');
    if (saved) {
      try {
        const formData = JSON.parse(saved);
        setMetadata(formData.metadata || '');
        return formData;
      } catch (e) {
        console.error('Failed to load saved form data:', e);
      }
    }
    return null;
  };

  // Clear saved form data
  const clearSavedData = () => {
    localStorage.removeItem('uploadFormData');
  };

  // Get field error message
  const getFieldError = (fieldName: string): string => {
    const error = uploadState.validationErrors.find(e => e.field === fieldName);
    return error ? error.message : '';
  };

  // Check if field has error
  const hasFieldError = (fieldName: string): boolean => {
    return uploadState.validationErrors.some(e => e.field === fieldName);
  };

  const handleReset = () => {
    setFile(null);
    setFileHash('');
    setUploadResult(null);
    setVerifyResult(null);
    setMetadata('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // KYC Functions
  const validateKYC = (): boolean => {
    const errors: KYCErrors = {};
    
    // Personal Information validation
    if (!kycData.fullLegalName.trim()) errors.fullLegalName = 'Full legal name is required';
    if (!kycData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (kycData.dateOfBirth) {
      // Handle both YYYY-MM-DD (stored) and MM/DD/YYYY (user input) formats
      let dateStr = kycData.dateOfBirth;
      const mmddyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = dateStr.match(mmddyyyyRegex);
      if (match) {
        // Convert MM/DD/YYYY to YYYY-MM-DD for Date parsing
        const [, month, day, year] = match;
        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      const birthDate = new Date(dateStr);
      const today = new Date();
      if (isNaN(birthDate.getTime())) {
        errors.dateOfBirth = 'Please enter a valid date (MM/DD/YYYY)';
      } else {
        if (birthDate > today) {
          errors.dateOfBirth = 'Date of birth cannot be in the future';
        } else {
      const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();
          const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
          if (actualAge < 18) {
            errors.dateOfBirth = 'Must be 18 years or older';
          }
        }
      }
    }
    if (!kycData.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (kycData.phoneNumber && !/^\+1-\d{3}-\d{3}-\d{4}$/.test(kycData.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be in format +1-XXX-XXX-XXXX';
    }
    if (!kycData.emailAddress.trim()) errors.emailAddress = 'Email address is required';
    if (kycData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kycData.emailAddress)) {
      errors.emailAddress = 'Please enter a valid email address';
    }
    
    // Address Information validation
    if (!kycData.streetAddress1.trim()) errors.streetAddress1 = 'Street address is required';
    if (!kycData.city.trim()) errors.city = 'City is required';
    if (!kycData.stateProvince) errors.stateProvince = 'State/Province is required';
    if (!kycData.postalZipCode.trim()) errors.postalZipCode = 'Postal/ZIP code is required';
    if (!kycData.country) errors.country = 'Country is required';
    
    // Identification Information validation
    if (!kycData.citizenshipCountry) errors.citizenshipCountry = 'Citizenship country is required';
    if (!kycData.ssnOrItinType) errors.ssnOrItinType = 'SSN or ITIN type is required';
    if (!kycData.ssnOrItinNumber.trim()) {
      errors.ssnOrItinNumber = `${kycData.ssnOrItinType || 'SSN/ITIN'} number is required`;
    } else {
      // Validate SSN format (XXX-XX-XXXX) or ITIN format (9XX-XX-XXXX)
      if (kycData.ssnOrItinType === 'SSN') {
        if (!/^\d{3}-\d{2}-\d{4}$/.test(kycData.ssnOrItinNumber)) {
          errors.ssnOrItinNumber = 'SSN must be in format XXX-XX-XXXX';
        }
      } else if (kycData.ssnOrItinType === 'ITIN') {
        if (!/^9\d{2}-\d{2}-\d{4}$/.test(kycData.ssnOrItinNumber)) {
          errors.ssnOrItinNumber = 'ITIN must be in format 9XX-XX-XXXX (starts with 9)';
        }
      }
    }
    // Only require Identification Type, Number, and ID Issuing Country when ITIN is selected
    // SSN can serve both identification and SSN criteria, so these fields are not needed for SSN
    if (kycData.ssnOrItinType === 'ITIN') {
    if (!kycData.identificationType) errors.identificationType = 'Identification type is required';
    if (!kycData.identificationNumber.trim()) errors.identificationNumber = 'Identification number is required';
    if (!kycData.idIssuingCountry) errors.idIssuingCountry = 'ID issuing country is required';
    }
    
    // Financial Information validation
    if (!kycData.sourceOfFunds) errors.sourceOfFunds = 'Source of funds is required';
    if (!kycData.purposeOfLoan.trim()) errors.purposeOfLoan = 'Purpose of loan is required';
    if (kycData.purposeOfLoan.trim().length < 20) errors.purposeOfLoan = 'Purpose must be at least 20 characters';
    if (!kycData.expectedMonthlyTransactionVolume || kycData.expectedMonthlyTransactionVolume <= 0) {
      errors.expectedMonthlyTransactionVolume = 'Expected monthly transaction volume is required';
    }
    if (!kycData.expectedNumberOfMonthlyTransactions || kycData.expectedNumberOfMonthlyTransactions <= 0) {
      errors.expectedNumberOfMonthlyTransactions = 'Expected number of monthly transactions is required';
    }
    
    // Compliance Screening validation
    if (!kycData.isPEP) errors.isPEP = 'Please indicate if you are a Politically Exposed Person';
    if (kycData.isPEP === 'Yes' && !kycData.pepDetails.trim()) {
      errors.pepDetails = 'Please provide details about your PEP status';
    }
    
    // Document Upload validation
    // governmentIdFile validation removed - collecting from form fields instead
    
    setKycErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleKycFieldChange = (field: keyof KYCData, value: any) => {
    // Sanitize the input based on field type
    let sanitizedValue = value;
    
    if (typeof value === 'string') {
      switch (field) {
        case 'fullLegalName':
          // Use sanitizeTextarea to preserve spaces in names (e.g., "John Michael Smith")
          sanitizedValue = sanitizeTextarea(value);
          break;
        case 'streetAddress1':
        case 'streetAddress2':
        case 'city':
        case 'stateProvince':
          // Use sanitizeTextarea to preserve spaces in address fields
          sanitizedValue = sanitizeTextarea(value);
          break;
        case 'purposeOfLoan':
        case 'pepDetails':
          // Use sanitizeTextarea to preserve spaces in textarea fields
          sanitizedValue = sanitizeTextarea(value);
          break;
        case 'emailAddress':
          sanitizedValue = sanitizeEmail(value);
          break;
        case 'phoneNumber':
          sanitizedValue = sanitizePhone(value);
          break;
        case 'dateOfBirth':
          // Handle MM/DD/YYYY format - allow user to type it, but convert to YYYY-MM-DD for storage
          // Allow digits and slashes only
          let dateValue = value.replace(/[^\d/]/g, '');
          
          // Auto-format as user types: MM/DD/YYYY
          // Remove extra slashes
          dateValue = dateValue.replace(/\/+/g, '/');
          
          // Limit to MM/DD/YYYY format (10 chars: MM/DD/YYYY)
          if (dateValue.length > 10) {
            dateValue = dateValue.substring(0, 10);
          }
          
          // If it's a valid MM/DD/YYYY format, convert to YYYY-MM-DD for storage
          // Otherwise, store as-is (user is still typing)
          const mmddyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
          const match = dateValue.match(mmddyyyyRegex);
          if (match) {
            const [, month, day, year] = match;
            const monthNum = parseInt(month, 10);
            const dayNum = parseInt(day, 10);
            const yearNum = parseInt(year, 10);
            
            // Validate month and day ranges
            if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 1900 && yearNum <= new Date().getFullYear()) {
              // Convert to YYYY-MM-DD for storage
              const paddedMonth = month.padStart(2, '0');
              const paddedDay = day.padStart(2, '0');
              sanitizedValue = `${year}-${paddedMonth}-${paddedDay}`;
            } else {
              // Invalid date, keep as-is for now (user might still be typing)
              sanitizedValue = dateValue;
            }
          } else {
            // Not complete yet, store as-is
            sanitizedValue = dateValue;
          }
          break;
        case 'postalZipCode':
          sanitizedValue = sanitizeZipCode(value);
          break;
        case 'identificationNumber':
          sanitizedValue = sanitizeSSNLast4(value);
          break;
        case 'ssnOrItinNumber':
          // Allow digits and dashes only, format XXX-XX-XXXX
          sanitizedValue = value.replace(/[^\d-]/g, '');
          break;
        case 'ssnOrItinType':
          // No sanitization needed, it's a select value
          sanitizedValue = value;
          break;
        case 'expectedMonthlyTransactionVolume':
        case 'expectedNumberOfMonthlyTransactions':
          sanitizedValue = sanitizeNumber(value.toString());
          break;
        default:
          sanitizedValue = sanitizeText(value);
      }
    }
    
    setKycData(prev => ({ ...prev, [field]: sanitizedValue }));
    // Clear error when user starts typing
    if (kycErrors[field]) {
      setKycErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSaveKyc = async () => {
    if (!validateKYC()) {
      toast.error('Please fix all validation errors before saving');
      return;
    }

    setIsSavingKyc(true);
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add all KYC data
      Object.entries(kycData).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });

      // For now, we'll simulate the API call since the endpoint doesn't exist yet
      // In a real implementation, this would call: POST /api/kyc/users/{user_id}/submit
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setKycSaved(true);
      toast.success('KYC information saved successfully!');
    } catch (error) {
      console.error('KYC save error:', error);
      toast.error('Failed to save KYC information');
    } finally {
      setIsSavingKyc(false);
    }
  };

  // Helper function to check if KYC is complete (currently unused but available for future use)
  // const isKycComplete = () => {
  //   return Object.values(kycData).every(value => 
  //     value !== null && value !== undefined && value !== '' && 
  //     (typeof value !== 'number' || value > 0)
  //   );
  // };

  // US States data
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const countries = ['US', 'CA', 'MX', 'GB', 'FR', 'DE', 'IT', 'ES', 'AU', 'JP', 'CN', 'IN', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'Other'];

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = loadFormData();
    if (savedData) {
      toast.info('Previous form data restored from local storage');
    }
  }, []);

  return (
    <DashboardLayout
      rightSidebar={
        <div className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
            Upload Guide
          </h2>

          {/* Quick Tips */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Quick Tips
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>AI Auto-fill:</strong> Upload a document and watch as AI extracts loan and borrower data automatically.
                </p>
              </div>
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Demo Mode:</strong> Try the demo to see sample data and fraud detection in action.
                </p>
              </div>
              <div className="flex gap-2">
                <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Blockchain:</strong> All documents are sealed on Walacor blockchain for immutable audit trails.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Supported Files
            </h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div>• PDF Documents</div>
              <div>• Images (JPG, PNG)</div>
              <div>• JSON Metadata</div>
            </div>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Security Levels
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Standard
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Maximum
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Quantum-Safe
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Need help?
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
              View documentation and guides
            </p>
            <div className="space-y-2">
              <Link href="/docs/upload-guide" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline block">
                📚 Upload Guide
              </Link>
              <Link href="/docs/security-levels" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline block">
                🔒 Security Levels
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Try Demo Mode:</p>
              <div className="space-y-2">
                <button
                  onClick={handleSingleFileDemo}
                  className="w-full text-xs text-left px-3 py-2 rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 transition-colors"
                >
                  📄 Single File Demo
                </button>
                <button
                  onClick={handleMultipleFilesDemo}
                  className="w-full text-xs text-left px-3 py-2 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-colors"
                >
                  📚 Multiple Files Demo
                </button>
                <button
                  onClick={handleDirectoryDemo}
                  className="w-full text-xs text-left px-3 py-2 rounded bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 transition-colors"
                >
                  📁 Directory Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <>
      {/* Bulk Metadata Editor */}
      <Dialog open={showMetadataEditor} onOpenChange={(open) => {
        setShowMetadataEditor(open);
        if (!open) {
          setEditingBulkFileName(null);
          setEditingMetadata(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit File Metadata</DialogTitle>
            <DialogDescription>
              Update missing information so this file can be included in the upload batch.
            </DialogDescription>
          </DialogHeader>
          {editingMetadata && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loan ID</Label>
                <Input
                  value={editingMetadata.loanId}
                  onChange={(e) => handleMetadataFieldChange('loanId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Input
                  value={editingMetadata.documentType}
                  onChange={(e) => handleMetadataFieldChange('documentType', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Loan Amount</Label>
                <Input
                  value={editingMetadata.loanAmount}
                  onChange={(e) => handleMetadataFieldChange('loanAmount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input
                  value={editingMetadata.interestRate}
                  onChange={(e) => handleMetadataFieldChange('interestRate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Loan Term (months)</Label>
                <Input
                  value={editingMetadata.loanTerm}
                  onChange={(e) => handleMetadataFieldChange('loanTerm', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Property Address</Label>
                <Input
                  value={editingMetadata.propertyAddress}
                  onChange={(e) => handleMetadataFieldChange('propertyAddress', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrower Name</Label>
                <Input
                  value={editingMetadata.borrowerName}
                  onChange={(e) => handleMetadataFieldChange('borrowerName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrower Email</Label>
                <Input
                  value={editingMetadata.borrowerEmail}
                  onChange={(e) => handleMetadataFieldChange('borrowerEmail', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrower Phone</Label>
                <Input
                  value={editingMetadata.borrowerPhone}
                  onChange={(e) => handleMetadataFieldChange('borrowerPhone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrower Address</Label>
                <Input
                  value={editingMetadata.borrowerStreetAddress}
                  onChange={(e) => handleMetadataFieldChange('borrowerStreetAddress', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrower City</Label>
                <Input
                  value={editingMetadata.borrowerCity}
                  onChange={(e) => handleMetadataFieldChange('borrowerCity', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrower State</Label>
                <Input
                  value={editingMetadata.borrowerState}
                  onChange={(e) => handleMetadataFieldChange('borrowerState', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrower ZIP Code</Label>
                <Input
                  value={editingMetadata.borrowerZipCode}
                  onChange={(e) => handleMetadataFieldChange('borrowerZipCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrower Country</Label>
                <Input
                  value={editingMetadata.borrowerCountry}
                  onChange={(e) => handleMetadataFieldChange('borrowerCountry', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={editingMetadata.additionalNotes}
                  onChange={(e) => handleMetadataFieldChange('additionalNotes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseMetadataEditor}>
              Cancel
            </Button>
            <Button onClick={handleSaveMetadata}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Summary Modal */}
      <Dialog open={showValidationSummary} onOpenChange={setShowValidationSummary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Validation Errors
            </DialogTitle>
            <DialogDescription>
              Please fix the following errors before submitting your document:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {uploadState.validationErrors.map((error, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800 capitalize">
                    {error.field.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-sm text-red-600">{error.message}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationSummary(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Upload Error
            </DialogTitle>
            <DialogDescription>
              {uploadState.error?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {uploadState.error?.details && (
              <div className="p-3 bg-gray-50 border rounded-lg">
                <p className="text-sm font-medium mb-2">Technical Details:</p>
                <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                  {JSON.stringify(uploadState.error.details, null, 2)}
                </pre>
              </div>
            )}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your form data has been saved locally. You can retry the upload or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowErrorModal(false)}>
              Close
            </Button>
            {uploadState.canRetry && (
              <Button onClick={handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry Upload
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              const errorDetails = {
                error: uploadState.error,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
              };
              const mailtoLink = `mailto:support@example.com?subject=Upload Error Report&body=${encodeURIComponent(JSON.stringify(errorDetails, null, 2))}`;
              window.open(mailtoLink);
            }} className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Support
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Modal */}
      <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Duplicates Detected
            </DialogTitle>
            <DialogDescription>
              The system has detected potential duplicates. Please review the information below before proceeding.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {duplicateCheckResult && (
              <>
                {/* Warnings */}
                {duplicateCheckResult.warnings && duplicateCheckResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-yellow-700">Warnings:</h4>
                    <ul className="space-y-1">
                      {duplicateCheckResult.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-yellow-600">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Existing Artifacts */}
                {duplicateCheckResult.existing_artifacts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Existing Documents:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {duplicateCheckResult.existing_artifacts.map((artifact, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{artifact.details}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {artifact.artifact_type || 'Document'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(artifact.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                <p>Loan ID: {artifact.loan_id}</p>
                                <p>Transaction: {artifact.walacor_tx_id}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/documents/${artifact.artifact_id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {duplicateCheckResult.recommendations && duplicateCheckResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-700">Recommendations:</h4>
                    <ul className="space-y-1">
                      {duplicateCheckResult.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-blue-600">
                          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDuplicateWarning(false)}
            >
              Cancel Upload
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleAllowUploadDespiteDuplicates}
            >
              Upload Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                {quantumSafeMode ? 'Document Sealed with Quantum-Safe Cryptography!' : 
                                 maximumSecurityMode ? 'Document Sealed with Maximum Security!' : 'Document Sealed Successfully!'}
                              </DialogTitle>
                              <DialogDescription>
                                {quantumSafeMode 
                                  ? 'Your loan document has been sealed with QUANTUM-SAFE CRYPTOGRAPHY, providing protection against future quantum computing attacks.'
                                  : maximumSecurityMode 
                                  ? 'Your loan document has been sealed with MAXIMUM SECURITY and MINIMAL TAMPERING in the blockchain with comprehensive protection.'
                                  : 'Your loan document has been successfully sealed in the blockchain with borrower information.'
                                }
                              </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bulkUploadResults.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    {bulkUploadResults.length} document{bulkUploadResults.length > 1 ? 's' : ''} sealed successfully!
                  </p>
                  <p className="text-xs text-green-700">
                    {quantumSafeMode
                      ? 'Each file has been processed with quantum-safe cryptography.'
                      : maximumSecurityMode
                      ? 'Each file has been sealed with maximum security controls.'
                      : 'Standard security sealing completed for each document.'}
                  </p>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bulkUploadResults.map(({ fileName, result }) => (
                    <div key={`${fileName}-${result.artifactId}`} className="p-3 bg-white border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{fileName}</p>
                          <p className="text-xs text-gray-600">
                            Sealed at {new Date(result.sealedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.walacorTxId ? `TX: ${result.walacorTxId}` : 'Pending TX'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <p className="font-medium text-gray-800">Artifact ID</p>
                          <p className="font-mono break-all">{result.artifactId}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Blockchain Network</p>
                          <p>{result.proofBundle?.blockchain_network || 'walacor'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              uploadResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-green-800">Artifact ID</p>
                        <InfoTooltip
                          term={GLOSSARY.ARTIFACT_ID.term}
                          definition={GLOSSARY.ARTIFACT_ID.definition}
                          example={GLOSSARY.ARTIFACT_ID.example}
                          className="text-green-600"
                        />
                      </div>
                      <p className="text-sm text-green-600 font-mono">{uploadResult.artifactId}</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-green-800">Transaction ID</p>
                        <InfoTooltip
                          term={GLOSSARY.WALACOR_TX_ID.term}
                          definition={GLOSSARY.WALACOR_TX_ID.definition}
                          example={GLOSSARY.WALACOR_TX_ID.example}
                          className="text-green-600"
                        />
                      </div>
                      <p className="text-sm text-green-600 font-mono">{uploadResult.walacorTxId}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Sealed At</p>
                    <p className="text-sm text-blue-600">{new Date(uploadResult.sealedAt).toLocaleString()}</p>
                  </div>
                  {uploadResult.proofBundle && (
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <p className="text-sm font-medium mb-2">Blockchain Proof</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {uploadResult.proofBundle.blockchain_network || 'walacor'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ETID: {uploadResult.proofBundle.etid}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {uploadResult.proofBundle.integrity_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {quantumSafeMode && uploadResult.quantum_safe_seal && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-medium mb-2 text-purple-800">🔬 Quantum-Safe Features</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                            🛡️ Quantum-Resistant
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                            🔒 Post-Quantum Secure
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                            ⚡ SHA3-512 Protected
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                            ⭐ Future-Proof Security
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-800">
                            ✅ NIST PQC Compliant
                          </Badge>
                        </div>
                        <div className="text-xs text-purple-700">
                          <p><strong>Quantum-Resistant Hashes:</strong> {Object.keys(uploadResult.quantum_safe_seal.quantum_resistant_hashes || {}).join(', ')}</p>
                          <p><strong>Quantum-Safe Signatures:</strong> {Object.keys(uploadResult.quantum_safe_seal.quantum_safe_signatures || {}).join(', ')}</p>
                          <p><strong>Algorithms Used:</strong> {uploadResult.quantum_safe_seal.algorithms_used?.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {maximumSecurityMode && uploadResult.comprehensive_seal && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium mb-2 text-blue-800">Maximum Security Features</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                            {uploadResult.comprehensive_seal.security_level}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                            {uploadResult.comprehensive_seal.tamper_resistance}
                          </Badge>
                        </div>
                        <div className="text-xs text-blue-700">
                          <p><strong>Multi-Hash Algorithms:</strong> {uploadResult.comprehensive_seal.multi_hash_algorithms?.join(', ')}</p>
                          <p><strong>PKI Signature:</strong> {typeof uploadResult.comprehensive_seal.pki_signature === 'string' ? uploadResult.comprehensive_seal.pki_signature : `${(uploadResult.comprehensive_seal.pki_signature as any)?.algorithm} (${(uploadResult.comprehensive_seal.pki_signature as any)?.key_size} bits)`}</p>
                          <p><strong>Verification Methods:</strong> {uploadResult.comprehensive_seal.verification_methods?.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSuccessModal(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => {
              setShowSuccessModal(false);
              handleReset();
            }}>
              Upload Another
            </Button>
            {uploadResult && (
              <Button onClick={() => {
                window.location.href = `/documents/${uploadResult.artifactId}`;
              }} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View Document
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Upload Page */}
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="relative z-20 bg-elite-dark dark:bg-gray-900 text-white py-3 border-b border-elite-blue">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <div>
                  <p className="font-semibold">✨ Interactive Demo Mode Active</p>
                  <p className="text-xs text-purple-100">Sample loan document loaded with AI-powered auto-fill. Explore the features!</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsDemoMode(false);
                  window.history.replaceState({}, '', '/upload');
                }}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4 mr-1" />
                Exit Demo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-elite-dark dark:bg-black text-white border-b border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/integrated-dashboard"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Upload Documents
                  </h1>
                  <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
                    Secure blockchain verification in seconds
                  </p>
                </div>
              </div>
              {!isDemoMode && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-blue-200 text-right">Try Demo:</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSingleFileDemo}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/30 gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      Single File
                    </Button>
                    <Button
                      onClick={handleMultipleFilesDemo}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/30 gap-1"
                    >
                      <Layers className="h-3 w-3" />
                      Multiple Files
                    </Button>
                    <Button
                      onClick={handleDirectoryDemo}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/30 gap-1"
                    >
                      <Lightbulb className="h-3 w-3" />
                      Directory
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Uploaded Today</p>
                    <p className="text-3xl font-bold">24</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 text-white rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Success Rate</p>
                    <p className="text-3xl font-bold">99.8%</p>
                  </div>
                  <div className="p-3 bg-green-500/20 text-white rounded-xl">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-100">Avg Processing</p>
                    <p className="text-3xl font-bold">&lt; 2s</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 text-white rounded-xl">
                    <Upload className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-elite-green dark:bg-elite-green/20 rounded-2xl p-4 shadow-xl border-2 border-elite-green dark:border-elite-green/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
                <div>
                  <h3 className="text-white font-bold text-lg">🎬 Demo Mode Active</h3>
                  <p className="text-white/90 text-sm">You're viewing pre-filled sample data for demonstration purposes</p>
                </div>
              </div>
              <Link href="/upload">
                <Button
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/40"
                >
                  Exit Demo
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">KYC:</span>
            <span className={`text-sm ${kycSaved ? 'text-green-600' : 'text-orange-600'}`}>
              {kycSaved ? 'Complete ✓' : 'Incomplete'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">Document:</span>
            <span className={`text-sm ${uploadResult ? 'text-green-600' : 'text-orange-600'}`}>
              {uploadResult ? 'Sealed ✓' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16">
        {/* Main Content - Full width, sidebar already in DashboardLayout */}
        <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>
              Drag and drop a file or click to select. Maximum file size: 50MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Steps - Only show in single file mode */}
            {uploadMode === 'single' && (
              <div className="mb-6">
                <div className="hidden md:block">
                  <ProgressSteps steps={uploadSteps} currentStep={currentStep} />
                </div>
                <div className="md:hidden">
                  <CompactProgressSteps steps={uploadSteps} currentStep={currentStep} />
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <div className="font-medium text-blue-900">💡 Tips & Features:</div>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li><strong>Single File:</strong> Upload a JSON file with loan data to auto-fill form fields</li>
                  <li><strong>Bulk Upload:</strong> Select multiple files at once for batch processing</li>
                  <li><strong>Directory Upload:</strong> Upload entire folders containing loan documents</li>
                  <li><strong>Smart Validation:</strong> Powered by ObjectValidator - ensures only loan-related files are processed</li>
                </ul>
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900">
                  <strong>⚠️ Important:</strong> Directories will be validated to contain only loan documents (PDF, JSON, DOCX, XLSX, TXT). Non-loan files will be automatically filtered out.
                </div>
              </div>
            </div>

            <Tabs
              value={uploadMode}
              onValueChange={(value) => setUploadMode(value as 'single' | 'bulk' | 'directory')}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single">Single File</TabsTrigger>
                <TabsTrigger value="bulk">Multiple Files</TabsTrigger>
                <TabsTrigger value="directory">Directory Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
                {renderSingleUploadTab()}
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4">
                {renderBulkUploadTab()}
              </TabsContent>

              <TabsContent value="directory" className="space-y-4">
                {renderDirectoryUploadTab()}
              </TabsContent>
            </Tabs>

            {/* Only show KYC and Loan Information for Single File mode */}
            {uploadMode === 'single' && (
              <>
                {/* Borrower KYC Information */}
                <Card>
                  <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Borrower KYC Information (GENIUS ACT 2025 Required)
                    </CardTitle>
                    <CardDescription>
                      Complete your Know Your Customer information as required by GENIUS ACT 2025
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsKycExpanded(!isKycExpanded)}
                  >
                    {isKycExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {isKycExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </CardHeader>
              {isKycExpanded && (
                <CardContent className="space-y-6">
                  <TooltipProvider>
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullLegalName" className="flex items-center gap-1">
                            Full Legal Name <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enter your full legal name as it appears on official documents</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="fullLegalName"
                            value={kycData.fullLegalName}
                            onChange={(e) => handleKycFieldChange('fullLegalName', e.target.value)}
                            placeholder="John Doe"
                            className={kycErrors.fullLegalName ? 'border-red-500' : ''}
                          />
                          {kycErrors.fullLegalName && <p className="text-sm text-red-500">{kycErrors.fullLegalName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth" className="flex items-center gap-1">
                            Date of Birth <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Format: MM/DD/YYYY (e.g., 01/15/1990)</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="dateOfBirth"
                            type="text"
                            value={(() => {
                              // Display as MM/DD/YYYY if stored as YYYY-MM-DD, otherwise show as-is
                              if (kycData.dateOfBirth) {
                                const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
                                const match = kycData.dateOfBirth.match(yyyymmddRegex);
                                if (match) {
                                  const [, year, month, day] = match;
                                  return `${month}/${day}/${year}`;
                                }
                                // If it's already in MM/DD/YYYY format, show as-is
                                return kycData.dateOfBirth;
                              }
                              return '';
                            })()}
                            onChange={(e) => handleKycFieldChange('dateOfBirth', e.target.value)}
                            placeholder="MM/DD/YYYY (e.g., 01/15/1990)"
                            className={kycErrors.dateOfBirth ? 'border-red-500' : ''}
                          />
                          {kycErrors.dateOfBirth && <p className="text-sm text-red-500">{kycErrors.dateOfBirth}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                            Phone Number <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Format: +1-XXX-XXX-XXXX</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="phoneNumber"
                            value={kycData.phoneNumber}
                            onChange={(e) => handleKycFieldChange('phoneNumber', e.target.value)}
                            placeholder="+1-555-123-4567"
                            className={kycErrors.phoneNumber ? 'border-red-500' : ''}
                          />
                          {kycErrors.phoneNumber && <p className="text-sm text-red-500">{kycErrors.phoneNumber}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emailAddress" className="flex items-center gap-1">
                            Email Address <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enter a valid email address</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="emailAddress"
                            type="email"
                            value={kycData.emailAddress}
                            onChange={(e) => handleKycFieldChange('emailAddress', e.target.value)}
                            placeholder="john.doe@example.com"
                            className={kycErrors.emailAddress ? 'border-red-500' : ''}
                          />
                          {kycErrors.emailAddress && <p className="text-sm text-red-500">{kycErrors.emailAddress}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Address Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="streetAddress1" className="flex items-center gap-1">
                            Street Address Line 1 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="streetAddress1"
                            value={kycData.streetAddress1}
                            onChange={(e) => handleKycFieldChange('streetAddress1', e.target.value)}
                            placeholder="123 Main Street"
                            className={kycErrors.streetAddress1 ? 'border-red-500' : ''}
                          />
                          {kycErrors.streetAddress1 && <p className="text-sm text-red-500">{kycErrors.streetAddress1}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="streetAddress2">Street Address Line 2</Label>
                          <Input
                            id="streetAddress2"
                            value={kycData.streetAddress2}
                            onChange={(e) => handleKycFieldChange('streetAddress2', e.target.value)}
                            placeholder="Apt 4B, Suite 200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city" className="flex items-center gap-1">
                            City <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="city"
                            value={kycData.city}
                            onChange={(e) => handleKycFieldChange('city', e.target.value)}
                            placeholder="New York"
                            className={kycErrors.city ? 'border-red-500' : ''}
                          />
                          {kycErrors.city && <p className="text-sm text-red-500">{kycErrors.city}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stateProvince" className="flex items-center gap-1">
                            State/Province <span className="text-red-500">*</span>
                          </Label>
                          <Select value={kycData.stateProvince} onValueChange={(value) => handleKycFieldChange('stateProvince', value)}>
                            <SelectTrigger className={kycErrors.stateProvince ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {usStates.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {kycErrors.stateProvince && <p className="text-sm text-red-500">{kycErrors.stateProvince}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postalZipCode" className="flex items-center gap-1">
                            Postal/ZIP Code <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="postalZipCode"
                            value={kycData.postalZipCode}
                            onChange={(e) => handleKycFieldChange('postalZipCode', e.target.value)}
                            placeholder="10001"
                            className={kycErrors.postalZipCode ? 'border-red-500' : ''}
                          />
                          {kycErrors.postalZipCode && <p className="text-sm text-red-500">{kycErrors.postalZipCode}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country" className="flex items-center gap-1">
                            Country <span className="text-red-500">*</span>
                          </Label>
                          <Select value={kycData.country} onValueChange={(value) => handleKycFieldChange('country', value)}>
                            <SelectTrigger className={kycErrors.country ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {kycErrors.country && <p className="text-sm text-red-500">{kycErrors.country}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Identification Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Identification Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="citizenshipCountry" className="flex items-center gap-1">
                            Citizenship Country <span className="text-red-500">*</span>
                          </Label>
                          <Select value={kycData.citizenshipCountry} onValueChange={(value) => handleKycFieldChange('citizenshipCountry', value)}>
                            <SelectTrigger className={kycErrors.citizenshipCountry ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {kycErrors.citizenshipCountry && <p className="text-sm text-red-500">{kycErrors.citizenshipCountry}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ssnOrItinType" className="flex items-center gap-1">
                            SSN or ITIN <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Select whether you have a Social Security Number (SSN) or Individual Taxpayer Identification Number (ITIN)</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Select value={kycData.ssnOrItinType} onValueChange={(value) => {
                            handleKycFieldChange('ssnOrItinType', value);
                            // Clear the number when type changes
                            if (value !== kycData.ssnOrItinType) {
                              handleKycFieldChange('ssnOrItinNumber', '');
                            }
                          }}>
                            <SelectTrigger className={kycErrors.ssnOrItinType ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select SSN or ITIN" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SSN">SSN (Social Security Number)</SelectItem>
                              <SelectItem value="ITIN">ITIN (Individual Taxpayer Identification Number)</SelectItem>
                            </SelectContent>
                          </Select>
                          {kycErrors.ssnOrItinType && <p className="text-sm text-red-500">{kycErrors.ssnOrItinType}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ssnOrItinNumber" className="flex items-center gap-1">
                            {kycData.ssnOrItinType ? `${kycData.ssnOrItinType} Number` : 'SSN/ITIN Number'} <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {kycData.ssnOrItinType === 'SSN' 
                                    ? 'Enter your SSN in format XXX-XX-XXXX'
                                    : kycData.ssnOrItinType === 'ITIN'
                                    ? 'Enter your ITIN in format 9XX-XX-XXXX (must start with 9)'
                                    : 'Enter your SSN or ITIN number'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="ssnOrItinNumber"
                            type="text"
                            value={kycData.ssnOrItinNumber}
                            onChange={(e) => {
                              let value = e.target.value;
                              // Auto-format: XXX-XX-XXXX
                              value = value.replace(/\D/g, ''); // Remove non-digits
                              if (value.length > 3) {
                                value = value.slice(0, 3) + '-' + value.slice(3);
                              }
                              if (value.length > 6) {
                                value = value.slice(0, 6) + '-' + value.slice(6, 10);
                              }
                              handleKycFieldChange('ssnOrItinNumber', value);
                            }}
                            placeholder={kycData.ssnOrItinType === 'SSN' ? 'XXX-XX-XXXX' : kycData.ssnOrItinType === 'ITIN' ? '9XX-XX-XXXX' : 'Enter number'}
                            maxLength={11}
                            disabled={!kycData.ssnOrItinType}
                            className={kycErrors.ssnOrItinNumber ? 'border-red-500' : ''}
                          />
                          {kycErrors.ssnOrItinNumber && <p className="text-sm text-red-500">{kycErrors.ssnOrItinNumber}</p>}
                          {!kycData.ssnOrItinType && (
                            <p className="text-xs text-gray-500">Please select SSN or ITIN first</p>
                          )}
                        </div>

                        {/* Only show Identification Type, Identification Number, and ID Issuing Country when ITIN is selected */}
                        {kycData.ssnOrItinType === 'ITIN' && (
                          <>
                        <div className="space-y-2">
                          <Label htmlFor="identificationType" className="flex items-center gap-1">
                            Identification Type <span className="text-red-500">*</span>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="h-3 w-3 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Required additional identification when using ITIN</p>
                                  </TooltipContent>
                                </Tooltip>
                          </Label>
                          <Select value={kycData.identificationType} onValueChange={(value) => handleKycFieldChange('identificationType', value)}>
                            <SelectTrigger className={kycErrors.identificationType ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Driver's License">Driver's License</SelectItem>
                                  <SelectItem value="Passport">Passport</SelectItem>
                            </SelectContent>
                          </Select>
                          {kycErrors.identificationType && <p className="text-sm text-red-500">{kycErrors.identificationType}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="identificationNumber" className="flex items-center gap-1">
                            Identification Number <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This will be masked after typing for security</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="identificationNumber"
                            type="password"
                            value={kycData.identificationNumber}
                            onChange={(e) => handleKycFieldChange('identificationNumber', e.target.value)}
                            placeholder="Enter ID number"
                            className={kycErrors.identificationNumber ? 'border-red-500' : ''}
                          />
                          {kycErrors.identificationNumber && <p className="text-sm text-red-500">{kycErrors.identificationNumber}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="idIssuingCountry" className="flex items-center gap-1">
                            ID Issuing Country <span className="text-red-500">*</span>
                          </Label>
                          <Select value={kycData.idIssuingCountry} onValueChange={(value) => handleKycFieldChange('idIssuingCountry', value)}>
                            <SelectTrigger className={kycErrors.idIssuingCountry ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {kycErrors.idIssuingCountry && <p className="text-sm text-red-500">{kycErrors.idIssuingCountry}</p>}
                        </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Financial Information (GENIUS ACT Required)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="sourceOfFunds" className="flex items-center gap-1">
                            Source of Funds <span className="text-red-500">*</span>
                          </Label>
                          <Select value={kycData.sourceOfFunds} onValueChange={(value) => handleKycFieldChange('sourceOfFunds', value)}>
                            <SelectTrigger className={kycErrors.sourceOfFunds ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Employment Income">Employment Income</SelectItem>
                              <SelectItem value="Business Income">Business Income</SelectItem>
                              <SelectItem value="Investment Returns">Investment Returns</SelectItem>
                              <SelectItem value="Inheritance">Inheritance</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {kycErrors.sourceOfFunds && <p className="text-sm text-red-500">{kycErrors.sourceOfFunds}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expectedMonthlyTransactionVolume" className="flex items-center gap-1">
                            Expected Monthly Transaction Volume (USD) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="expectedMonthlyTransactionVolume"
                            type="number"
                            value={kycData.expectedMonthlyTransactionVolume || ''}
                            onChange={(e) => handleKycFieldChange('expectedMonthlyTransactionVolume', Number(e.target.value))}
                            placeholder="50000"
                            className={kycErrors.expectedMonthlyTransactionVolume ? 'border-red-500' : ''}
                          />
                          {kycErrors.expectedMonthlyTransactionVolume && <p className="text-sm text-red-500">{kycErrors.expectedMonthlyTransactionVolume}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="purposeOfLoan" className="flex items-center gap-1">
                            Purpose of Loan <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Minimum 20 characters required</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Textarea
                            id="purposeOfLoan"
                            value={kycData.purposeOfLoan}
                            onChange={(e) => handleKycFieldChange('purposeOfLoan', e.target.value)}
                            placeholder="Please provide a detailed explanation of how you intend to use the loan funds..."
                            rows={3}
                            className={kycErrors.purposeOfLoan ? 'border-red-500' : ''}
                          />
                          {kycErrors.purposeOfLoan && <p className="text-sm text-red-500">{kycErrors.purposeOfLoan}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expectedNumberOfMonthlyTransactions" className="flex items-center gap-1">
                            Expected Number of Monthly Transactions <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="expectedNumberOfMonthlyTransactions"
                            type="number"
                            value={kycData.expectedNumberOfMonthlyTransactions || ''}
                            onChange={(e) => handleKycFieldChange('expectedNumberOfMonthlyTransactions', Number(e.target.value))}
                            placeholder="10"
                            className={kycErrors.expectedNumberOfMonthlyTransactions ? 'border-red-500' : ''}
                          />
                          {kycErrors.expectedNumberOfMonthlyTransactions && <p className="text-sm text-red-500">{kycErrors.expectedNumberOfMonthlyTransactions}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Compliance Screening */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Compliance Screening</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            Are you a Politically Exposed Person (PEP)? <span className="text-red-500">*</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>A PEP is someone who holds a prominent public position or has close associations with such individuals</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <RadioGroup value={kycData.isPEP} onValueChange={(value) => handleKycFieldChange('isPEP', value)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="No" id="pep-no" />
                              <Label htmlFor="pep-no">No</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Yes" id="pep-yes" />
                              <Label htmlFor="pep-yes">Yes</Label>
                            </div>
                          </RadioGroup>
                          {kycErrors.isPEP && <p className="text-sm text-red-500">{kycErrors.isPEP}</p>}
                        </div>

                        {kycData.isPEP === 'Yes' && (
                          <div className="space-y-2">
                            <Label htmlFor="pepDetails" className="flex items-center gap-1">
                              Please provide details <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="pepDetails"
                              value={kycData.pepDetails}
                              onChange={(e) => handleKycFieldChange('pepDetails', e.target.value)}
                              placeholder="Please provide details about your PEP status..."
                              rows={3}
                              className={kycErrors.pepDetails ? 'border-red-500' : ''}
                            />
                            {kycErrors.pepDetails && <p className="text-sm text-red-500">{kycErrors.pepDetails}</p>}
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Save KYC Button */}
                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={handleSaveKyc}
                        disabled={isSavingKyc}
                        className="min-w-[150px]"
                      >
                        {isSavingKyc ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save KYC Data'
                        )}
                      </Button>
                    </div>
                  </TooltipProvider>
                </CardContent>
              )}
            </Card>

                {/* Fraud Risk Alert */}
                {enhancedMetadata?.extractionMetadata?.fraudDetection && (
                  <FraudRiskBadge
                    fraudDetection={enhancedMetadata.extractionMetadata.fraudDetection}
                  />
                )}

                {/* Loan Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Loan Information</CardTitle>
                    <CardDescription>
                      Loan-specific transaction details (borrower information collected in KYC section above)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Row 1: Loan ID and Loan Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" key={`loan-info-${forceUpdate}`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="loanId">Loan ID <span className="text-red-500">*</span></Label>
                          {enhancedMetadata?.loanId && (
                            <ConfidenceBadge
                              confidence={enhancedMetadata.loanId.confidence}
                              source={enhancedMetadata.loanId.source}
                              extractedFrom={enhancedMetadata.loanId.extractedFrom}
                              compact
                            />
                          )}
                        </div>
                        <Input
                          id="loanId"
                          value={formData.loanId}
                          onChange={(e) => {
                            console.log('🔍 Loan ID field changed to:', e.target.value);
                            setFormData(prev => ({ ...prev, loanId: e.target.value }));
                            try {
                            const currentMeta = JSON.parse(metadata || '{}')
                            setMetadata(JSON.stringify({ ...currentMeta, loanId: e.target.value }, null, 2))
                            } catch (error) {
                              // If metadata is invalid, create new object
                              setMetadata(JSON.stringify({ loanId: e.target.value }, null, 2))
                            }
                          }}
                          placeholder="e.g., LOAN_2024_001"
                          className={
                            loanFormErrors.loanId
                              ? 'border-red-500'
                              : enhancedMetadata?.loanId && enhancedMetadata.loanId.confidence < 60 && enhancedMetadata.loanId.confidence > 0
                              ? 'border-yellow-400 border-2'
                              : ''
                          }
                        />
                        {loanFormErrors.loanId && <p className="text-sm text-red-500">{loanFormErrors.loanId}</p>}
                        {enhancedMetadata?.loanId && enhancedMetadata.loanId.confidence < 60 && enhancedMetadata.loanId.confidence > 0 && !loanFormErrors.loanId && (
                          <p className="text-xs text-yellow-600">⚠️ Low confidence - please verify this value</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Unique identifier for the loan
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="loanType">Loan Type <span className="text-red-500">*</span></Label>
                        <select
                          id="loanType"
                          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            loanFormErrors.loanType ? 'border-red-500' : 'border-input'
                          }`}
                          value={formData.loanType}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, loanType: e.target.value }));
                            try {
                              const currentMeta = JSON.parse(metadata || '{}')
                              setMetadata(JSON.stringify({ ...currentMeta, loanType: e.target.value }, null, 2))
                            } catch (error) {
                              setMetadata(JSON.stringify({ loanType: e.target.value }, null, 2))
                            }
                          }}
                        >
                          <option value="">Select loan type</option>
                          <option value="home_loan">Home Loan / Mortgage</option>
                          <option value="personal_loan">Personal Loan</option>
                          <option value="auto_loan">Auto Loan</option>
                          <option value="business_loan">Business Loan</option>
                          <option value="student_loan">Student Loan</option>
                          <option value="refinance">Refinance Loan</option>
                          <option value="home_equity">Home Equity Loan</option>
                          <option value="other">Other</option>
                        </select>
                        {loanFormErrors.loanType && <p className="text-sm text-red-500">{loanFormErrors.loanType}</p>}
                        <p className="text-xs text-muted-foreground">
                          Type of loan being applied for
                        </p>
                      </div>
                    </div>

                    {/* Row 2: Document Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="documentType">Document Type <span className="text-red-500">*</span></Label>
                          {enhancedMetadata?.documentType && (
                            <ConfidenceBadge
                              confidence={enhancedMetadata.documentType.confidence}
                              source={enhancedMetadata.documentType.source}
                              compact
                            />
                          )}
                        </div>
                        <select
                          id="documentType"
                          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            loanFormErrors.documentType ? 'border-red-500' : 'border-input'
                          }`}
                          value={formData.documentType}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, documentType: e.target.value }));
                            try {
                            const currentMeta = JSON.parse(metadata || '{}')
                            setMetadata(JSON.stringify({ ...currentMeta, documentType: e.target.value }, null, 2))
                            } catch (error) {
                              // If metadata is invalid, create new object
                              setMetadata(JSON.stringify({ documentType: e.target.value }, null, 2))
                            }
                          }}
                        >
                          <option value="">Select document type</option>
                          <option value="loan_application">Loan Application</option>
                          <option value="credit_report">Credit Report</option>
                          <option value="property_appraisal">Property Appraisal</option>
                          <option value="income_verification">Income Verification</option>
                          <option value="bank_statements">Bank Statements</option>
                          <option value="tax_returns">Tax Returns</option>
                          <option value="employment_verification">Employment Verification</option>
                          <option value="underwriting_decision">Underwriting Decision</option>
                          <option value="closing_disclosure">Closing Disclosure</option>
                          <option value="title_insurance">Title Insurance</option>
                          <option value="homeowners_insurance">Homeowners Insurance</option>
                          <option value="flood_certificate">Flood Certificate</option>
                          <option value="compliance_document">Compliance Document</option>
                          <option value="other">Other</option>
                        </select>
                        {loanFormErrors.documentType && <p className="text-sm text-red-500">{loanFormErrors.documentType}</p>}
                        <p className="text-xs text-muted-foreground">
                          Type of document being uploaded
                        </p>
                      </div>
                    </div>

                    {/* Row 2: Loan Amount, Term, and Interest Rate */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="loanAmount">Loan Amount <span className="text-red-500">*</span></Label>
                          {enhancedMetadata?.loanAmount && (
                            <ConfidenceBadge
                              confidence={enhancedMetadata.loanAmount.confidence}
                              source={enhancedMetadata.loanAmount.source}
                              compact
                            />
                          )}
                        </div>
                        <Input
                          id="loanAmount"
                          type="number"
                          value={formData.loanAmount}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, loanAmount: e.target.value }));
                            try {
                            const currentMeta = JSON.parse(metadata || '{}')
                            setMetadata(JSON.stringify({ ...currentMeta, loanAmount: e.target.value }, null, 2))
                            } catch (error) {
                              // If metadata is invalid, create new object
                              setMetadata(JSON.stringify({ loanAmount: e.target.value }, null, 2))
                            }
                          }}
                          placeholder="e.g., 250000"
                          className={
                            loanFormErrors.loanAmount
                              ? 'border-red-500'
                              : enhancedMetadata?.loanAmount && enhancedMetadata.loanAmount.confidence < 60 && enhancedMetadata.loanAmount.confidence > 0
                              ? 'border-yellow-400 border-2'
                              : ''
                          }
                        />
                        {loanFormErrors.loanAmount && <p className="text-sm text-red-500">{loanFormErrors.loanAmount}</p>}
                        <p className="text-xs text-muted-foreground">
                          Loan amount in USD
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="loanTerm">Loan Term <span className="text-red-500">*</span></Label>
                          {enhancedMetadata?.loanTerm && (
                            <ConfidenceBadge
                              confidence={enhancedMetadata.loanTerm.confidence}
                              source={enhancedMetadata.loanTerm.source}
                              compact
                            />
                          )}
                        </div>
                        <Input
                          id="loanTerm"
                          type="number"
                          value={formData.loanTerm}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, loanTerm: e.target.value }));
                            try {
                            const currentMeta = JSON.parse(metadata || '{}')
                            setMetadata(JSON.stringify({ ...currentMeta, loanTerm: e.target.value }, null, 2))
                            } catch (error) {
                              // If metadata is invalid, create new object
                              setMetadata(JSON.stringify({ loanTerm: e.target.value }, null, 2))
                            }
                          }}
                          placeholder="e.g., 360"
                          className={
                            loanFormErrors.loanTerm
                              ? 'border-red-500'
                              : enhancedMetadata?.loanTerm && enhancedMetadata.loanTerm.confidence < 60 && enhancedMetadata.loanTerm.confidence > 0
                              ? 'border-yellow-400 border-2'
                              : ''
                          }
                        />
                        {loanFormErrors.loanTerm && <p className="text-sm text-red-500">{loanFormErrors.loanTerm}</p>}
                        <p className="text-xs text-muted-foreground">
                          Loan term in months
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="interestRate">Interest Rate <span className="text-red-500">*</span></Label>
                          {enhancedMetadata?.interestRate && (
                            <ConfidenceBadge
                              confidence={enhancedMetadata.interestRate.confidence}
                              source={enhancedMetadata.interestRate.source}
                              compact
                            />
                          )}
                        </div>
                        <Input
                          id="interestRate"
                          type="number"
                          step="0.01"
                          value={formData.interestRate}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, interestRate: e.target.value }));
                            try {
                            const currentMeta = JSON.parse(metadata || '{}')
                            setMetadata(JSON.stringify({ ...currentMeta, interestRate: e.target.value }, null, 2))
                            } catch (error) {
                              // If metadata is invalid, create new object
                              setMetadata(JSON.stringify({ interestRate: e.target.value }, null, 2))
                            }
                          }}
                          placeholder="e.g., 4.5"
                          className={
                            loanFormErrors.interestRate
                              ? 'border-red-500'
                              : enhancedMetadata?.interestRate && enhancedMetadata.interestRate.confidence < 60 && enhancedMetadata.interestRate.confidence > 0
                              ? 'border-yellow-400 border-2'
                              : ''
                          }
                        />
                        {loanFormErrors.interestRate && <p className="text-sm text-red-500">{loanFormErrors.interestRate}</p>}
                        <p className="text-xs text-muted-foreground">
                          Annual interest rate (%)
                        </p>
                      </div>
                    </div>

                    {/* Row 3: Property Address (conditional - only for home_loan and home_equity) */}
                    {(formData.loanType === 'home_loan' || formData.loanType === 'home_equity') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                          <Label htmlFor="propertyAddress">Property Address <span className="text-red-500">*</span></Label>
                        {enhancedMetadata?.propertyAddress && (
                          <ConfidenceBadge
                            confidence={enhancedMetadata.propertyAddress.confidence}
                            source={enhancedMetadata.propertyAddress.source}
                            compact
                          />
                        )}
                      </div>
                      <Input
                        id="propertyAddress"
                        value={formData.propertyAddress}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, propertyAddress: e.target.value }));
                          try {
                          const currentMeta = JSON.parse(metadata || '{}')
                          setMetadata(JSON.stringify({ ...currentMeta, propertyAddress: e.target.value }, null, 2))
                          } catch (error) {
                            // If metadata is invalid, create new object
                            setMetadata(JSON.stringify({ propertyAddress: e.target.value }, null, 2))
                          }
                        }}
                        placeholder="e.g., 123 Main St, Anytown, CA 12345"
                        className={
                          loanFormErrors.propertyAddress
                            ? 'border-red-500'
                            : enhancedMetadata?.propertyAddress && enhancedMetadata.propertyAddress.confidence < 60 && enhancedMetadata.propertyAddress.confidence > 0
                            ? 'border-yellow-400 border-2'
                            : ''
                        }
                      />
                      {loanFormErrors.propertyAddress && <p className="text-sm text-red-500">{loanFormErrors.propertyAddress}</p>}
                      <p className="text-xs text-muted-foreground">
                        Full address of the property being financed
                      </p>
                    </div>
                    )}

                    {/* Conditional Fields Based on Loan Type */}
                    {formData.loanType === 'home_loan' && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-md font-semibold">Home Loan Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="propertyValue">Property Value <span className="text-red-500">*</span></Label>
                            <Input
                              id="propertyValue"
                              type="number"
                              value={formData.propertyValue}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, propertyValue: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, propertyValue: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ propertyValue: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 500000"
                              className={loanFormErrors.propertyValue ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.propertyValue && <p className="text-sm text-red-500">{loanFormErrors.propertyValue}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="downPayment">Down Payment <span className="text-red-500">*</span></Label>
                            <Input
                              id="downPayment"
                              type="number"
                              value={formData.downPayment}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, downPayment: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, downPayment: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ downPayment: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 100000"
                              className={loanFormErrors.downPayment ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.downPayment && <p className="text-sm text-red-500">{loanFormErrors.downPayment}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="propertyType">Property Type <span className="text-red-500">*</span></Label>
                            <select
                              id="propertyType"
                              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${loanFormErrors.propertyType ? 'border-red-500' : 'border-input'}`}
                              value={formData.propertyType}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, propertyType: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, propertyType: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ propertyType: e.target.value }, null, 2))
                                }
                              }}
                            >
                              <option value="">Select property type</option>
                              <option value="single_family">Single Family</option>
                              <option value="condo">Condo</option>
                              <option value="townhouse">Townhouse</option>
                              <option value="multi_family">Multi-Family</option>
                              <option value="commercial">Commercial</option>
                            </select>
                            {loanFormErrors.propertyType && <p className="text-sm text-red-500">{loanFormErrors.propertyType}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.loanType === 'auto_loan' && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-md font-semibold">Vehicle Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vehicleMake">Vehicle Make <span className="text-red-500">*</span></Label>
                            <Input
                              id="vehicleMake"
                              value={formData.vehicleMake}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, vehicleMake: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, vehicleMake: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ vehicleMake: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., Toyota"
                              className={loanFormErrors.vehicleMake ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.vehicleMake && <p className="text-sm text-red-500">{loanFormErrors.vehicleMake}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vehicleModel">Vehicle Model <span className="text-red-500">*</span></Label>
                            <Input
                              id="vehicleModel"
                              value={formData.vehicleModel}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, vehicleModel: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, vehicleModel: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ vehicleModel: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., Camry"
                              className={loanFormErrors.vehicleModel ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.vehicleModel && <p className="text-sm text-red-500">{loanFormErrors.vehicleModel}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vehicleYear">Vehicle Year <span className="text-red-500">*</span></Label>
                            <Input
                              id="vehicleYear"
                              type="number"
                              value={formData.vehicleYear}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, vehicleYear: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, vehicleYear: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ vehicleYear: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 2024"
                              className={loanFormErrors.vehicleYear ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.vehicleYear && <p className="text-sm text-red-500">{loanFormErrors.vehicleYear}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vehicleVIN">Vehicle VIN <span className="text-red-500">*</span></Label>
                            <Input
                              id="vehicleVIN"
                              value={formData.vehicleVIN}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, vehicleVIN: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, vehicleVIN: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ vehicleVIN: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 1HGBH41JXMN109186"
                              className={loanFormErrors.vehicleVIN ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.vehicleVIN && <p className="text-sm text-red-500">{loanFormErrors.vehicleVIN}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="purchasePrice">Purchase Price <span className="text-red-500">*</span></Label>
                            <Input
                              id="purchasePrice"
                              type="number"
                              value={formData.purchasePrice}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, purchasePrice: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, purchasePrice: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ purchasePrice: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 35000"
                              className={loanFormErrors.purchasePrice ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.purchasePrice && <p className="text-sm text-red-500">{loanFormErrors.purchasePrice}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.loanType === 'business_loan' && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-md font-semibold">Business Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="businessName">Business Name <span className="text-red-500">*</span></Label>
                            <Input
                              id="businessName"
                              value={formData.businessName}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, businessName: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, businessName: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ businessName: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., ABC Corporation"
                              className={loanFormErrors.businessName ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.businessName && <p className="text-sm text-red-500">{loanFormErrors.businessName}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessType">Business Type <span className="text-red-500">*</span></Label>
                            <select
                              id="businessType"
                              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${loanFormErrors.businessType ? 'border-red-500' : 'border-input'}`}
                              value={formData.businessType}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, businessType: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, businessType: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ businessType: e.target.value }, null, 2))
                                }
                              }}
                            >
                              <option value="">Select business type</option>
                              <option value="llc">LLC</option>
                              <option value="corporation">Corporation</option>
                              <option value="partnership">Partnership</option>
                              <option value="sole_proprietorship">Sole Proprietorship</option>
                            </select>
                            {loanFormErrors.businessType && <p className="text-sm text-red-500">{loanFormErrors.businessType}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessRegistrationNumber">Business Registration Number <span className="text-red-500">*</span></Label>
                            <Input
                              id="businessRegistrationNumber"
                              value={formData.businessRegistrationNumber}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, businessRegistrationNumber: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, businessRegistrationNumber: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ businessRegistrationNumber: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., EIN or Registration Number"
                              className={loanFormErrors.businessRegistrationNumber ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.businessRegistrationNumber && <p className="text-sm text-red-500">{loanFormErrors.businessRegistrationNumber}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="annualRevenue">Annual Revenue <span className="text-red-500">*</span></Label>
                            <Input
                              id="annualRevenue"
                              type="number"
                              value={formData.annualRevenue}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, annualRevenue: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, annualRevenue: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ annualRevenue: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 500000"
                              className={loanFormErrors.annualRevenue ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.annualRevenue && <p className="text-sm text-red-500">{loanFormErrors.annualRevenue}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.loanType === 'student_loan' && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-md font-semibold">Education Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="schoolName">School Name <span className="text-red-500">*</span></Label>
                            <Input
                              id="schoolName"
                              value={formData.schoolName}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, schoolName: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, schoolName: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ schoolName: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., State University"
                              className={loanFormErrors.schoolName ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.schoolName && <p className="text-sm text-red-500">{loanFormErrors.schoolName}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="degreeProgram">Degree Program <span className="text-red-500">*</span></Label>
                            <Input
                              id="degreeProgram"
                              value={formData.degreeProgram}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, degreeProgram: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, degreeProgram: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ degreeProgram: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., Computer Science"
                              className={loanFormErrors.degreeProgram ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.degreeProgram && <p className="text-sm text-red-500">{loanFormErrors.degreeProgram}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expectedGraduationDate">Expected Graduation Date <span className="text-red-500">*</span></Label>
                            <Input
                              id="expectedGraduationDate"
                              type="date"
                              value={formData.expectedGraduationDate}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, expectedGraduationDate: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, expectedGraduationDate: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ expectedGraduationDate: e.target.value }, null, 2))
                                }
                              }}
                              className={loanFormErrors.expectedGraduationDate ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.expectedGraduationDate && <p className="text-sm text-red-500">{loanFormErrors.expectedGraduationDate}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.loanType === 'refinance' && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-md font-semibold">Refinance Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentLoanNumber">Current Loan Number <span className="text-red-500">*</span></Label>
                            <Input
                              id="currentLoanNumber"
                              value={formData.currentLoanNumber}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, currentLoanNumber: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, currentLoanNumber: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ currentLoanNumber: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., LOAN_2020_001"
                              className={loanFormErrors.currentLoanNumber ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.currentLoanNumber && <p className="text-sm text-red-500">{loanFormErrors.currentLoanNumber}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currentLender">Current Lender <span className="text-red-500">*</span></Label>
                            <Input
                              id="currentLender"
                              value={formData.currentLender}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, currentLender: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, currentLender: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ currentLender: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., ABC Bank"
                              className={loanFormErrors.currentLender ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.currentLender && <p className="text-sm text-red-500">{loanFormErrors.currentLender}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="refinancePurpose">Refinance Purpose <span className="text-red-500">*</span></Label>
                            <select
                              id="refinancePurpose"
                              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${loanFormErrors.refinancePurpose ? 'border-red-500' : 'border-input'}`}
                              value={formData.refinancePurpose}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, refinancePurpose: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, refinancePurpose: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ refinancePurpose: e.target.value }, null, 2))
                                }
                              }}
                            >
                              <option value="">Select purpose</option>
                              <option value="lower_rate">Lower Interest Rate</option>
                              <option value="cash_out">Cash Out</option>
                              <option value="shorter_term">Shorter Term</option>
                              <option value="debt_consolidation">Debt Consolidation</option>
                            </select>
                            {loanFormErrors.refinancePurpose && <p className="text-sm text-red-500">{loanFormErrors.refinancePurpose}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.loanType === 'home_equity' && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-md font-semibold">Home Equity Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="propertyValue">Property Value <span className="text-red-500">*</span></Label>
                            <Input
                              id="propertyValue"
                              type="number"
                              value={formData.propertyValue}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, propertyValue: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, propertyValue: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ propertyValue: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 500000"
                              className={loanFormErrors.propertyValue ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.propertyValue && <p className="text-sm text-red-500">{loanFormErrors.propertyValue}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currentMortgageBalance">Current Mortgage Balance <span className="text-red-500">*</span></Label>
                            <Input
                              id="currentMortgageBalance"
                              type="number"
                              value={formData.currentMortgageBalance}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, currentMortgageBalance: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, currentMortgageBalance: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ currentMortgageBalance: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 300000"
                              className={loanFormErrors.currentMortgageBalance ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.currentMortgageBalance && <p className="text-sm text-red-500">{loanFormErrors.currentMortgageBalance}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="equityAmount">Equity Amount <span className="text-red-500">*</span></Label>
                            <Input
                              id="equityAmount"
                              type="number"
                              value={formData.equityAmount}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, equityAmount: e.target.value }));
                                try {
                                  const currentMeta = JSON.parse(metadata || '{}')
                                  setMetadata(JSON.stringify({ ...currentMeta, equityAmount: e.target.value }, null, 2))
                                } catch (error) {
                                  setMetadata(JSON.stringify({ equityAmount: e.target.value }, null, 2))
                                }
                              }}
                              placeholder="e.g., 200000"
                              className={loanFormErrors.equityAmount ? 'border-red-500' : ''}
                            />
                            {loanFormErrors.equityAmount && <p className="text-sm text-red-500">{loanFormErrors.equityAmount}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Row 4: Additional Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="additionalNotes">Additional Notes</Label>
                      {enhancedMetadata?.additionalNotes && enhancedMetadata.additionalNotes.confidence > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <span className={`px-2 py-0.5 rounded-full ${
                            enhancedMetadata.additionalNotes.confidence >= 80
                              ? 'bg-green-100 text-green-700'
                              : enhancedMetadata.additionalNotes.confidence >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {enhancedMetadata.additionalNotes.confidence}% confidence
                          </span>
                          <span>Auto-populated from file</span>
                        </div>
                      )}
                      <Textarea
                        id="additionalNotes"
                        value={formData.additionalNotes}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, additionalNotes: e.target.value }));
                          try {
                          const currentMeta = JSON.parse(metadata || '{}')
                          setMetadata(JSON.stringify({ ...currentMeta, additionalNotes: e.target.value }, null, 2))
                          } catch (error) {
                            // If metadata is invalid, create new object
                            setMetadata(JSON.stringify({ additionalNotes: e.target.value }, null, 2))
                          }
                        }}
                        placeholder="Any additional information about this loan document..."
                        rows={3}
                        className={
                          enhancedMetadata?.additionalNotes && enhancedMetadata.additionalNotes.confidence < 60 && enhancedMetadata.additionalNotes.confidence > 0
                            ? 'border-yellow-400 border-2'
                            : ''
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional notes or comments about the loan document
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Options (Collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Advanced Options
                  </summary>
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="etid">Entity Type ID (ETID)</Label>
                        <InfoTooltip
                          term={GLOSSARY.ETID.term}
                          definition={GLOSSARY.ETID.definition}
                          example={GLOSSARY.ETID.example}
                          whenToUse={GLOSSARY.ETID.whenToUse}
                        />
                      </div>
                      <Input
                        id="etid"
                        value={etid}
                        onChange={(e) => setEtid(e.target.value)}
                        placeholder="100001"
                      />
                      <p className="text-xs text-muted-foreground">
                        100001 for loan packets, 100002 for JSON documents. Leave as default unless you know what you're doing.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rawMetadata">Raw Metadata (JSON)</Label>
                      <Textarea
                        id="rawMetadata"
                        value={metadata}
                        onChange={(e) => setMetadata(e.target.value)}
                        placeholder='{"source": "api", "department": "finance"}'
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Advanced: Raw JSON metadata for technical users
                      </p>
                    </div>
                  </div>
                </details>
              </>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Document Sealed Successfully
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1">
                        <Label className="text-sm font-medium">Artifact ID</Label>
                        <InfoTooltip
                          term={GLOSSARY.ARTIFACT_ID.term}
                          definition={GLOSSARY.ARTIFACT_ID.definition}
                          example={GLOSSARY.ARTIFACT_ID.example}
                          whenToUse={GLOSSARY.ARTIFACT_ID.whenToUse}
                        />
                      </div>
                      <p className="text-sm font-mono bg-muted p-2 rounded">{uploadResult.artifactId}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Label className="text-sm font-medium">Walacor Transaction ID</Label>
                        <InfoTooltip
                          term={GLOSSARY.WALACOR_TX_ID.term}
                          definition={GLOSSARY.WALACOR_TX_ID.definition}
                          example={GLOSSARY.WALACOR_TX_ID.example}
                          whenToUse={GLOSSARY.WALACOR_TX_ID.whenToUse}
                        />
                      </div>
                      <p className="text-sm font-mono bg-muted p-2 rounded">{uploadResult.walacorTxId}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1">
                        <Label className="text-sm font-medium">Document Hash</Label>
                        <InfoTooltip
                          term={GLOSSARY.DOCUMENT_HASH.term}
                          definition={GLOSSARY.DOCUMENT_HASH.definition}
                          example={GLOSSARY.DOCUMENT_HASH.example}
                          whenToUse={GLOSSARY.DOCUMENT_HASH.whenToUse}
                        />
                      </div>
                      <p className="text-sm font-mono bg-muted p-2 rounded break-all">{fileHash}</p>
                    </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Label className="text-sm font-medium">Sealed At</Label>
                      <InfoTooltip
                        term={GLOSSARY.BLOCKCHAIN_SEAL.term}
                        definition={GLOSSARY.BLOCKCHAIN_SEAL.definition}
                        example={GLOSSARY.BLOCKCHAIN_SEAL.example}
                        whenToUse={GLOSSARY.BLOCKCHAIN_SEAL.whenToUse}
                      />
                    </div>
                    <p className="text-sm">{new Date(uploadResult.sealedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {uploadResult.proofBundle && (
                    <div>
                      <Label className="text-sm font-medium">Proof Bundle</Label>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(uploadResult.proofBundle, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button asChild>
                      <Link href={`/documents/${uploadResult.artifactId}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Document Details
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Upload Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {uploadState.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                  <div className="flex items-center justify-between">
                    <span>{uploadState.error.message}</span>
                    {uploadState.canRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Progress Indicator */}
            {uploadState.isUploading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Uploading and Sealing Document...</span>
                      <span className="text-sm text-gray-500">{uploadState.progress}%</span>
                    </div>
                    <Progress value={uploadState.progress} className="w-full" />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Processing borrower information and sealing in blockchain...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Size Warning */}
            {file && file.size > 10 * 1024 * 1024 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-700">
                  Large file detected ({Math.round(file.size / 1024 / 1024)}MB). Upload may take longer than usual.
                </AlertDescription>
              </Alert>
            )}

                {/* Security Configuration */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" /> Security Configuration
                    </CardTitle>
                    <CardDescription>
                      Choose the security level for document sealing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="quantumSafe"
                          checked={quantumSafeMode}
                          onChange={(e) => {
                            setQuantumSafeMode(e.target.checked);
                            if (e.target.checked) {
                              setMaximumSecurityMode(false); // Disable maximum security when quantum-safe is enabled
                            }
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="quantumSafe" className="text-sm font-medium">
                          🔬 Quantum-Safe Mode (Future-Proof)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="maximumSecurity"
                          checked={maximumSecurityMode}
                          onChange={(e) => {
                            setMaximumSecurityMode(e.target.checked);
                            if (e.target.checked) {
                              setQuantumSafeMode(false); // Disable quantum-safe when maximum security is enabled
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="maximumSecurity" className="text-sm font-medium">
                          Maximum Security Mode (Recommended)
                        </Label>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-2">
                        {quantumSafeMode && (
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="font-medium text-purple-800 mb-2">🔬 Quantum-Safe Security includes:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4 text-purple-700">
                              <li>SHAKE256 hashing (quantum-resistant)</li>
                              <li>BLAKE3 hashing (quantum-resistant)</li>
                              <li>Dilithium digital signatures (NIST PQC Standard)</li>
                              <li>Hybrid classical-quantum approach</li>
                              <li>Protection against future quantum attacks</li>
                              <li>Blockchain sealing for immutability</li>
                            </ul>
                            <div className="flex items-center gap-1 flex-wrap mt-2">
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                                🛡️ Quantum-Resistant
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                🔒 Post-Quantum Secure
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                ⚡ SHA3-512 Protected
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                ⭐ Future-Proof Security
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-800">
                                ✅ NIST PQC Compliant
                              </Badge>
                            </div>
                            <p className="text-xs text-purple-600 mt-2">
                              This provides protection against future quantum computing attacks while maintaining current security.
                            </p>
                          </div>
                        )}
                        
                        {maximumSecurityMode && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="font-medium text-blue-800 mb-2">Maximum Security includes:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4 text-blue-700">
                              <li>Multi-algorithm hashing (SHA-256, SHA-512, BLAKE3, SHA3-256)</li>
                              <li>PKI-based digital signatures</li>
                              <li>Content-based integrity verification</li>
                              <li>Cross-verification systems</li>
                              <li>Advanced tamper detection</li>
                              <li>Blockchain sealing for immutability</li>
                            </ul>
                            <p className="text-xs text-blue-600 mt-2">
                              This provides the highest level of current security and minimal tampering risk for your loan documents.
                            </p>
                          </div>
                        )}
                        
                        {!quantumSafeMode && !maximumSecurityMode && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="font-medium text-gray-800 mb-2">Standard Security includes:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                              <li>SHA-256 hashing</li>
                              <li>Basic digital signatures</li>
                              <li>Blockchain sealing for immutability</li>
                            </ul>
                            <p className="text-xs text-gray-600 mt-2">
                              Standard security suitable for most loan documents.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploadDisabled}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {quantumSafeMode
                      ? 'Sealing with Quantum-Safe Cryptography...'
                      : maximumSecurityMode
                      ? 'Sealing with Maximum Security...'
                      : 'Sealing Document...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {!hasPrimaryFile
                      ? isSingleMode
                        ? 'Select File to Upload'
                        : 'Select Files to Upload'
                      : quantumSafeMode
                      ? 'Upload & Seal (Quantum-Safe)'
                      : maximumSecurityMode
                      ? 'Upload & Seal (Maximum Security)'
                      : 'Upload & Seal'}
                  </>
                )}
              </Button>
              {file && !uploadResult && !verifyResult && (
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>

            {/* Action Buttons for Already Sealed Documents */}
            {file && verifyResult && verifyResult.is_valid && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Upload Different File
                </Button>
                <Button asChild>
                  <a href={`http://localhost:8000/api/verify?hash=${fileHash}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Verification
                  </a>
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
        </div>
      </div>

  {/* Success Celebration Modal */}
  <SuccessCelebration
    isOpen={!!uploadResult && showSuccessModal}
    onClose={() => {
      setShowSuccessModal(false);
    }}
    onViewDocument={() => {
      if (uploadResult?.artifactId) {
        window.location.href = `/documents/${uploadResult.artifactId}`;
      }
    }}
    onUploadAnother={() => {
      setShowSuccessModal(false);
      setUploadResult(null);
      setFile(null);
      setFileHash('');
      setCurrentStep(1);
    }}
    artifactId={uploadResult?.artifactId}
    walacorTxId={uploadResult?.walacorTxId}
    securityLevel={
      maximumSecurityMode ? 'maximum' :
      quantumSafeMode ? 'quantum-safe' :
      'standard'
    }
  />
</div>
</>
    </DashboardLayout>
);
}

