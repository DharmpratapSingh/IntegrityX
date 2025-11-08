'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Copy,
  Lightbulb,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { ConfidenceBadge, FieldConfidenceWrapper } from '@/components/ui/confidence-badge'
import type { BulkFileAnalysis, FieldConfidence } from '@/utils/smartAutoPopulate'
import {
  generateSmartSuggestions,
  detectSameBorrower
} from '@/utils/smartAutoPopulate'

interface SmartBatchEditorProps {
  analyses: BulkFileAnalysis[]
  currentIndex: number
  onPrevious: () => void
  onNext: () => void
  onSave: (index: number, updatedMetadata: any) => void
  onClose: () => void
}

export function SmartBatchEditor({
  analyses,
  currentIndex,
  onPrevious,
  onNext,
  onSave,
  onClose
}: SmartBatchEditorProps) {
  const currentAnalysis = analyses[currentIndex]
  const [editedValues, setEditedValues] = useState<Record<string, any>>({})
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({})

  // Detect same borrower in other files
  const sameBorrowerDetection = useMemo(() => {
    const detections = analyses
      .map((otherAnalysis, idx) => {
        if (idx === currentIndex) return null
        const result = detectSameBorrower(currentAnalysis, otherAnalysis)
        return result.isSame ? { ...result, fileName: otherAnalysis.fileName, index: idx } : null
      })
      .filter(Boolean)

    return detections.length > 0 ? detections[0] : null
  }, [currentAnalysis, analyses, currentIndex])

  // Get value for a field (edited value or original)
  const getFieldValue = (fieldName: string): any => {
    if (editedValues[fieldName] !== undefined) {
      return editedValues[fieldName]
    }
    const field = currentAnalysis.metadata[fieldName as keyof typeof currentAnalysis.metadata] as FieldConfidence
    return field?.value || ''
  }

  // Get confidence for a field
  const getFieldConfidence = (fieldName: string): number => {
    const field = currentAnalysis.metadata[fieldName as keyof typeof currentAnalysis.metadata] as FieldConfidence
    return field?.confidence || 0
  }

  // Update field value
  const updateField = (fieldName: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [fieldName]: value }))
  }

  // Apply suggestion
  const applySuggestion = (fieldName: string, value: any) => {
    updateField(fieldName, value)
    setShowSuggestions(prev => ({ ...prev, [fieldName]: false }))
  }

  // Copy all KYC data from same borrower
  const copyFromSameBorrower = () => {
    if (!sameBorrowerDetection) return

    const sourceAnalysis = analyses[sameBorrowerDetection.index]
    const kycFields = [
      'borrowerName',
      'borrowerEmail',
      'borrowerPhone',
      'borrowerDateOfBirth',
      'borrowerStreetAddress',
      'borrowerCity',
      'borrowerState',
      'borrowerZipCode',
      'borrowerCountry',
      'borrowerSSNLast4',
      'borrowerGovernmentIdType',
      'borrowerIdNumberLast4',
      'borrowerEmploymentStatus',
      'borrowerAnnualIncome',
    ]

    const updates: Record<string, any> = {}
    for (const field of kycFields) {
      const sourceField = sourceAnalysis.metadata[field as keyof typeof sourceAnalysis.metadata] as FieldConfidence
      if (sourceField && sourceField.value && sourceField.confidence >= 60) {
        updates[field] = sourceField.value
      }
    }

    setEditedValues(prev => ({ ...prev, ...updates }))
  }

  // Save and move to next
  const handleSaveAndNext = () => {
    handleSave()
    if (currentIndex < analyses.length - 1) {
      onNext()
    }
  }

  // Save changes
  const handleSave = () => {
    const updatedMetadata = { ...currentAnalysis.metadata }

    // Apply all edited values
    for (const [fieldName, value] of Object.entries(editedValues)) {
      const field = updatedMetadata[fieldName as keyof typeof updatedMetadata] as FieldConfidence
      if (field) {
        field.value = value
        field.confidence = 100 // User input = 100% confidence
        field.source = 'user_input'
      }
    }

    onSave(currentIndex, updatedMetadata)
    setEditedValues({}) // Clear edits after save
  }

  // Only show incomplete files
  const incompleteFiles = analyses.filter(a => a.needsReview)
  const currentIncompleteIndex = incompleteFiles.findIndex(a => a.fileName === currentAnalysis.fileName)
  const isLastIncomplete = currentIncompleteIndex === incompleteFiles.length - 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Batch Editor: {currentAnalysis.fileName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                File {currentIndex + 1} of {analyses.length} •{' '}
                {currentAnalysis.missingFields.length} missing fields
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={currentIndex === analyses.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Same Borrower Detection */}
      {sameBorrowerDetection && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Same Borrower Detected!</h4>
                <p className="text-sm text-gray-700 mt-1">
                  This appears to be the same borrower as in{' '}
                  <span className="font-medium">{sameBorrowerDetection.fileName}</span>
                  {' '}({sameBorrowerDetection.confidence}% match on {sameBorrowerDetection.matchedFields.join(', ')})
                </p>
                <Button
                  size="sm"
                  onClick={copyFromSameBorrower}
                  className="mt-3 bg-green-600 hover:bg-green-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy KYC Data from {sameBorrowerDetection.fileName}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loan Information</CardTitle>
            <CardDescription>Review and complete loan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SmartField
              label="Loan ID"
              fieldName="loanId"
              value={getFieldValue('loanId')}
              confidence={getFieldConfidence('loanId')}
              onChange={(val) => updateField('loanId', val)}
              suggestions={generateSmartSuggestions(currentAnalysis, analyses, 'loanId')}
              onApplySuggestion={applySuggestion}
            />

            <SmartField
              label="Document Type"
              fieldName="documentType"
              value={getFieldValue('documentType')}
              confidence={getFieldConfidence('documentType')}
              onChange={(val) => updateField('documentType', val)}
              type="select"
              options={[
                { value: 'loan_application', label: 'Loan Application' },
                { value: 'mortgage', label: 'Mortgage' },
                { value: 'refinance', label: 'Refinance' },
                { value: 'home_equity', label: 'Home Equity' },
              ]}
            />

            <SmartField
              label="Loan Amount"
              fieldName="loanAmount"
              value={getFieldValue('loanAmount')}
              confidence={getFieldConfidence('loanAmount')}
              onChange={(val) => updateField('loanAmount', val)}
              type="number"
              suggestions={generateSmartSuggestions(currentAnalysis, analyses, 'loanAmount')}
              onApplySuggestion={applySuggestion}
            />

            <SmartField
              label="Loan Term (months)"
              fieldName="loanTerm"
              value={getFieldValue('loanTerm')}
              confidence={getFieldConfidence('loanTerm')}
              onChange={(val) => updateField('loanTerm', val)}
              type="number"
            />

            <SmartField
              label="Interest Rate (%)"
              fieldName="interestRate"
              value={getFieldValue('interestRate')}
              confidence={getFieldConfidence('interestRate')}
              onChange={(val) => updateField('interestRate', val)}
              type="number"
              step="0.01"
            />
          </CardContent>
        </Card>

        {/* Borrower Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Borrower Information</CardTitle>
            <CardDescription>Review and complete borrower details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SmartField
              label="Full Name"
              fieldName="borrowerName"
              value={getFieldValue('borrowerName')}
              confidence={getFieldConfidence('borrowerName')}
              onChange={(val) => updateField('borrowerName', val)}
              suggestions={generateSmartSuggestions(currentAnalysis, analyses, 'borrowerName')}
              onApplySuggestion={applySuggestion}
            />

            <SmartField
              label="Email"
              fieldName="borrowerEmail"
              value={getFieldValue('borrowerEmail')}
              confidence={getFieldConfidence('borrowerEmail')}
              onChange={(val) => updateField('borrowerEmail', val)}
              type="email"
              suggestions={generateSmartSuggestions(currentAnalysis, analyses, 'borrowerEmail')}
              onApplySuggestion={applySuggestion}
            />

            <SmartField
              label="Phone"
              fieldName="borrowerPhone"
              value={getFieldValue('borrowerPhone')}
              confidence={getFieldConfidence('borrowerPhone')}
              onChange={(val) => updateField('borrowerPhone', val)}
              type="tel"
              suggestions={generateSmartSuggestions(currentAnalysis, analyses, 'borrowerPhone')}
              onApplySuggestion={applySuggestion}
            />

            <SmartField
              label="Date of Birth"
              fieldName="borrowerDateOfBirth"
              value={getFieldValue('borrowerDateOfBirth')}
              confidence={getFieldConfidence('borrowerDateOfBirth')}
              onChange={(val) => updateField('borrowerDateOfBirth', val)}
              type="date"
            />

            <SmartField
              label="Employment Status"
              fieldName="borrowerEmploymentStatus"
              value={getFieldValue('borrowerEmploymentStatus')}
              confidence={getFieldConfidence('borrowerEmploymentStatus')}
              onChange={(val) => updateField('borrowerEmploymentStatus', val)}
              type="select"
              options={[
                { value: 'employed', label: 'Employed' },
                { value: 'self_employed', label: 'Self Employed' },
                { value: 'unemployed', label: 'Unemployed' },
                { value: 'retired', label: 'Retired' },
              ]}
            />

            <SmartField
              label="Annual Income"
              fieldName="borrowerAnnualIncome"
              value={getFieldValue('borrowerAnnualIncome')}
              confidence={getFieldConfidence('borrowerAnnualIncome')}
              onChange={(val) => updateField('borrowerAnnualIncome', val)}
              type="number"
              suggestions={generateSmartSuggestions(currentAnalysis, analyses, 'borrowerAnnualIncome')}
              onApplySuggestion={applySuggestion}
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Borrower Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SmartField
              label="Street Address"
              fieldName="borrowerStreetAddress"
              value={getFieldValue('borrowerStreetAddress')}
              confidence={getFieldConfidence('borrowerStreetAddress')}
              onChange={(val) => updateField('borrowerStreetAddress', val)}
            />

            <div className="grid grid-cols-2 gap-3">
              <SmartField
                label="City"
                fieldName="borrowerCity"
                value={getFieldValue('borrowerCity')}
                confidence={getFieldConfidence('borrowerCity')}
                onChange={(val) => updateField('borrowerCity', val)}
              />

              <SmartField
                label="State"
                fieldName="borrowerState"
                value={getFieldValue('borrowerState')}
                confidence={getFieldConfidence('borrowerState')}
                onChange={(val) => updateField('borrowerState', val)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SmartField
                label="ZIP Code"
                fieldName="borrowerZipCode"
                value={getFieldValue('borrowerZipCode')}
                confidence={getFieldConfidence('borrowerZipCode')}
                onChange={(val) => updateField('borrowerZipCode', val)}
              />

              <SmartField
                label="Country"
                fieldName="borrowerCountry"
                value={getFieldValue('borrowerCountry')}
                confidence={getFieldConfidence('borrowerCountry')}
                onChange={(val) => updateField('borrowerCountry', val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* KYC & Additional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">KYC & Additional Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SmartField
              label="SSN Last 4"
              fieldName="borrowerSSNLast4"
              value={getFieldValue('borrowerSSNLast4')}
              confidence={getFieldConfidence('borrowerSSNLast4')}
              onChange={(val) => updateField('borrowerSSNLast4', val)}
              maxLength={4}
            />

            <SmartField
              label="ID Type"
              fieldName="borrowerGovernmentIdType"
              value={getFieldValue('borrowerGovernmentIdType')}
              confidence={getFieldConfidence('borrowerGovernmentIdType')}
              onChange={(val) => updateField('borrowerGovernmentIdType', val)}
              type="select"
              options={[
                { value: 'drivers_license', label: "Driver's License" },
                { value: 'passport', label: 'Passport' },
                { value: 'state_id', label: 'State ID' },
                { value: 'military_id', label: 'Military ID' },
              ]}
            />

            <SmartField
              label="ID Last 4"
              fieldName="borrowerIdNumberLast4"
              value={getFieldValue('borrowerIdNumberLast4')}
              confidence={getFieldConfidence('borrowerIdNumberLast4')}
              onChange={(val) => updateField('borrowerIdNumberLast4', val)}
              maxLength={4}
            />

            <SmartField
              label="Additional Notes"
              fieldName="additionalNotes"
              value={getFieldValue('additionalNotes')}
              confidence={getFieldConfidence('additionalNotes')}
              onChange={(val) => updateField('additionalNotes', val)}
              type="textarea"
            />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="border-blue-300 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {Object.keys(editedValues).length > 0 ? (
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    You have {Object.keys(editedValues).length} unsaved changes
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    No unsaved changes
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={handleSaveAndNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLastIncomplete}
              >
                Save & Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SMART FIELD COMPONENT
// ============================================================================

interface SmartFieldProps {
  label: string
  fieldName: string
  value: any
  confidence: number
  onChange: (value: any) => void
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea'
  options?: Array<{ value: string; label: string }>
  suggestions?: Array<{ value: any; frequency: number; source: string }>
  onApplySuggestion?: (fieldName: string, value: any) => void
  step?: string
  maxLength?: number
}

function SmartField({
  label,
  fieldName,
  value,
  confidence,
  onChange,
  type = 'text',
  options,
  suggestions = [],
  onApplySuggestion,
  step,
  maxLength
}: SmartFieldProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const shouldHighlight = confidence < 60 && confidence > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldName} className="text-sm font-medium">
          {label}
        </Label>
        {confidence > 0 && (
          <ConfidenceBadge confidence={confidence} compact showIcon={false} />
        )}
      </div>

      <div className="relative">
        {type === 'select' ? (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={shouldHighlight ? 'border-yellow-400 border-2' : ''}>
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'textarea' ? (
          <Textarea
            id={fieldName}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={shouldHighlight ? 'border-yellow-400 border-2' : ''}
            rows={3}
          />
        ) : (
          <Input
            id={fieldName}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={shouldHighlight ? 'border-yellow-400 border-2' : ''}
            step={step}
            maxLength={maxLength}
          />
        )}

        {suggestions.length > 0 && onApplySuggestion && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute -right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Lightbulb className={`w-4 h-4 ${showSuggestions ? 'text-yellow-600' : 'text-gray-400'}`} />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && onApplySuggestion && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Smart Suggestions from other files:
            </p>
            <div className="space-y-1">
              {suggestions.slice(0, 3).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onApplySuggestion(fieldName, suggestion.value)}
                  className="w-full text-left px-3 py-2 rounded-md bg-white hover:bg-yellow-100 border border-yellow-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {suggestion.value}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.frequency}x from {suggestion.source}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
