'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DuplicateCheckResponse, 
  ExistingArtifact, 
  checkForDuplicates 
} from '@/lib/api/duplicateDetection';

interface DuplicateDetectionProps {
  fileHash?: string;
  loanId?: string;
  borrowerEmail?: string;
  borrowerSsnLast4?: string;
  contentHash?: string;
  onDuplicateFound?: (response: DuplicateCheckResponse) => void;
  onNoDuplicates?: () => void;
  autoCheck?: boolean;
}

export function DuplicateDetection({
  fileHash,
  loanId,
  borrowerEmail,
  borrowerSsnLast4,
  contentHash,
  onDuplicateFound,
  onNoDuplicates,
  autoCheck = true
}: DuplicateDetectionProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateResponse, setDuplicateResponse] = useState<DuplicateCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDuplicates = async () => {
    if (!fileHash && !loanId && !borrowerEmail && !borrowerSsnLast4 && !contentHash) {
      setError('No data provided for duplicate check');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await checkForDuplicates({
        file_hash: fileHash,
        loan_id: loanId,
        borrower_email: borrowerEmail,
        borrower_ssn_last4: borrowerSsnLast4,
        content_hash: contentHash
      });

      setDuplicateResponse(response);

      if (response.is_duplicate) {
        onDuplicateFound?.(response);
      } else {
        onNoDuplicates?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for duplicates');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (autoCheck && (fileHash || loanId || borrowerEmail || borrowerSsnLast4 || contentHash)) {
      checkDuplicates();
    }
  }, [fileHash, loanId, borrowerEmail, borrowerSsnLast4, contentHash, autoCheck]);

  const getDuplicateTypeIcon = (type: string) => {
    switch (type) {
      case 'exact_file_match':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'loan_id_match':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'borrower_email_match':
      case 'borrower_ssn_match':
      case 'borrower_match':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'content_match':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDuplicateTypeLabel = (type: string) => {
    switch (type) {
      case 'exact_file_match':
        return 'Exact File Match';
      case 'loan_id_match':
        return 'Same Loan ID';
      case 'borrower_email_match':
        return 'Borrower Email Match';
      case 'borrower_ssn_match':
        return 'Borrower SSN Match';
      case 'borrower_match':
        return 'Borrower Information Match';
      case 'content_match':
        return 'Content Similarity';
      default:
        return 'Duplicate Found';
    }
  };

  const getDuplicateTypeColor = (type: string) => {
    switch (type) {
      case 'exact_file_match':
        return 'destructive';
      case 'loan_id_match':
        return 'secondary';
      case 'borrower_email_match':
      case 'borrower_ssn_match':
      case 'borrower_match':
        return 'default';
      case 'content_match':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isChecking) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Checking for duplicates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Duplicate Check Failed</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkDuplicates}
            className="mt-3"
          >
            Retry Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!duplicateResponse) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Ready to check for duplicates</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkDuplicates}
              disabled={!fileHash && !loanId && !borrowerEmail && !borrowerSsnLast4 && !contentHash}
            >
              Check Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${duplicateResponse.is_duplicate ? 'border-yellow-200' : 'border-green-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {duplicateResponse.is_duplicate ? (
            <>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Duplicates Found
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              No Duplicates
            </>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="flex items-center gap-2">
          <Badge variant={duplicateResponse.is_duplicate ? 'destructive' : 'default'}>
            {duplicateResponse.is_duplicate ? 'Duplicates Detected' : 'Safe to Upload'}
          </Badge>
          {duplicateResponse.duplicate_type && (
            <Badge variant={getDuplicateTypeColor(duplicateResponse.duplicate_type)}>
              {getDuplicateTypeLabel(duplicateResponse.duplicate_type)}
            </Badge>
          )}
        </div>

        {/* Warnings */}
        {duplicateResponse.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-yellow-700">Warnings:</h4>
            <ul className="space-y-1">
              {duplicateResponse.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Existing Artifacts */}
        {duplicateResponse.existing_artifacts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Existing Documents:</h4>
            <div className="space-y-2">
              {duplicateResponse.existing_artifacts.map((artifact, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getDuplicateTypeIcon(artifact.type)}
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
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Loan ID: {artifact.loan_id}</p>
                    <p>Transaction: {artifact.walacor_tx_id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {duplicateResponse.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-blue-700">Recommendations:</h4>
            <ul className="space-y-1">
              {duplicateResponse.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-600">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkDuplicates}
          >
            <Clock className="h-4 w-4 mr-2" />
            Recheck
          </Button>
          {duplicateResponse.is_duplicate && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                // This would typically open a modal or navigate to duplicate resolution
                console.log('Handle duplicate resolution');
              }}
            >
              Resolve Duplicates
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DuplicateDetection;



