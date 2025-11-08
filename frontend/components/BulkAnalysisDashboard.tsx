'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Edit,
  Eye,
  Download
} from 'lucide-react'
import { ConfidenceIndicator } from '@/components/ui/confidence-badge'
import type { BulkFileAnalysis } from '@/utils/smartAutoPopulate'
import { getAggregatedMissingFields } from '@/utils/smartAutoPopulate'

interface BulkAnalysisDashboardProps {
  analyses: BulkFileAnalysis[]
  onEditFile?: (analysis: BulkFileAnalysis, index: number) => void
  onViewFile?: (analysis: BulkFileAnalysis, index: number) => void
  onSealAll?: () => void
}

export function BulkAnalysisDashboard({
  analyses,
  onEditFile,
  onViewFile,
  onSealAll
}: BulkAnalysisDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'complete' | 'incomplete'>('all')

  // Calculate statistics
  const totalFiles = analyses.length
  const completeFiles = analyses.filter(a => !a.needsReview).length
  const incompleteFiles = analyses.filter(a => a.needsReview).length
  const averageConfidence = Math.round(
    analyses.reduce((sum, a) => sum + a.extractionResult.overallConfidence, 0) / totalFiles
  )
  const averageCompleteness = Math.round(
    analyses.reduce((sum, a) => sum + a.completeness, 0) / totalFiles
  )

  // Get aggregated missing fields
  const missingFieldsMap = getAggregatedMissingFields(analyses)
  const topMissingFields = Object.entries(missingFieldsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Filter analyses based on selected category
  const filteredAnalyses = analyses.filter(a => {
    if (selectedCategory === 'complete') return !a.needsReview
    if (selectedCategory === 'incomplete') return a.needsReview
    return true
  })

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-3xl font-bold text-gray-900">{totalFiles}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Complete</p>
                <p className="text-3xl font-bold text-green-600">{completeFiles}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((completeFiles / totalFiles) * 100)}% ready to seal
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Need Review</p>
                <p className="text-3xl font-bold text-orange-600">{incompleteFiles}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((incompleteFiles / totalFiles) * 100)}% incomplete
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-3xl font-bold text-blue-600">{averageConfidence}%</p>
                <div className="mt-2">
                  <ConfidenceIndicator confidence={averageConfidence} />
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Fields Summary */}
      {topMissingFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Common Missing Fields</CardTitle>
            <CardDescription>
              These fields are missing across multiple files. You can batch-edit them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMissingFields.map(([fieldName, count]) => (
                <div key={fieldName} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {formatFieldName(fieldName)}
                    </p>
                    <Progress
                      value={(count / totalFiles) * 100}
                      className="h-2 mt-1"
                    />
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {count}/{totalFiles} files
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900">File Details</h3>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All ({totalFiles})
          </Button>
          <Button
            variant={selectedCategory === 'complete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('complete')}
          >
            Complete ({completeFiles})
          </Button>
          <Button
            variant={selectedCategory === 'incomplete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('incomplete')}
          >
            Need Review ({incompleteFiles})
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-3">
        {filteredAnalyses.map((analysis, index) => (
          <Card key={index} className={analysis.needsReview ? 'border-orange-300' : 'border-green-300'}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                {/* File Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className={`w-5 h-5 ${analysis.needsReview ? 'text-orange-600' : 'text-green-600'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{analysis.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {(analysis.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-600">Completeness</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={analysis.completeness} className="h-2 flex-1" />
                        <span className="text-xs font-medium text-gray-700">
                          {analysis.completeness}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Confidence</p>
                      <ConfidenceIndicator
                        confidence={analysis.extractionResult.overallConfidence}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Missing Fields</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {analysis.missingFields.length} fields
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Extracted By</p>
                      <Badge
                        variant={analysis.extractionResult.extractedBy === 'backend' ? 'default' : 'outline'}
                        className="mt-1 text-xs"
                      >
                        {analysis.extractionResult.extractedBy === 'backend' ? 'AI' : 'Auto'}
                      </Badge>
                    </div>
                  </div>

                  {/* Missing Fields Preview */}
                  {analysis.missingFields.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1">Missing:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.missingFields.slice(0, 5).map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {formatFieldName(field)}
                          </Badge>
                        ))}
                        {analysis.missingFields.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{analysis.missingFields.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {analysis.extractionResult.warnings && analysis.extractionResult.warnings.length > 0 && (
                    <div className="mt-3 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        {analysis.extractionResult.warnings.map((warning, i) => (
                          <p key={i} className="text-xs text-yellow-800">
                            {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {analysis.needsReview && onEditFile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditFile(analysis, index)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {onViewFile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewFile(analysis, index)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  )}
                  {!analysis.needsReview && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Actions */}
      {completeFiles > 0 && onSealAll && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Ready to Seal</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {completeFiles} {completeFiles === 1 ? 'file is' : 'files are'} complete and ready to be sealed on the blockchain
                </p>
              </div>
              <Button
                size="lg"
                onClick={onSealAll}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Download className="w-5 h-5 mr-2" />
                Seal {completeFiles} {completeFiles === 1 ? 'Document' : 'Documents'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim()
}
