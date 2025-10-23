/**
 * Verify Deleted Document Component
 * 
 * This component allows users to verify deleted documents by entering
 * the document hash and displays the verification results.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Search, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Info
} from 'lucide-react';
import { DeletedDocumentInfo } from './DeletedDocumentInfo';

interface VerifyDeletedDocumentProps {
  onVerify: (hash: string) => Promise<any>;
  isLoading?: boolean;
}

export const VerifyDeletedDocument: React.FC<VerifyDeletedDocumentProps> = ({
  onVerify,
  isLoading = false
}) => {
  const [documentHash, setDocumentHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!documentHash.trim()) {
      setError('Please enter a document hash');
      return;
    }

    if (documentHash.length !== 64) {
      setError('Document hash must be 64 characters long (SHA-256)');
      return;
    }

    try {
      setError(null);
      const result = await onVerify(documentHash);
      setVerificationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify document');
      setVerificationResult(null);
    }
  };

  const handleClear = () => {
    setDocumentHash('');
    setVerificationResult(null);
    setError(null);
  };

  const getVerificationStatus = () => {
    if (!verificationResult) return null;
    
    if (verificationResult.is_deleted) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
        text: "Deleted Document",
        variant: "secondary" as const,
        description: "Document was found but has been deleted"
      };
    } else if (verificationResult.document_info) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        text: "Active Document",
        variant: "default" as const,
        description: "Document is currently active and not deleted"
      };
    } else {
      return {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        text: "Not Found",
        variant: "destructive" as const,
        description: "Document not found in the system"
      };
    }
  };

  const status = getVerificationStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verify Deleted Document
        </CardTitle>
        <p className="text-sm text-gray-600">
          Enter a document hash to check if it was deleted and view its information
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="documentHash">Document Hash (SHA-256)</Label>
          <div className="flex gap-2">
            <Input
              id="documentHash"
              value={documentHash}
              onChange={(e) => setDocumentHash(e.target.value)}
              placeholder="Enter 64-character SHA-256 hash..."
              className="font-mono text-sm"
              maxLength={64}
            />
            <Button
              onClick={handleVerify}
              disabled={isLoading || !documentHash.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Verify
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status && (
          <Alert>
            <div className="flex items-center gap-2">
              {status.icon}
              <div>
                <Badge variant={status.variant} className="mb-1">
                  {status.text}
                </Badge>
                <AlertDescription>{status.description}</AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {verificationResult?.is_deleted && verificationResult.document_info && (
          <div className="mt-4">
            <DeletedDocumentInfo 
              documentInfo={verificationResult.document_info}
              onVerify={() => console.log('Verify clicked')}
              onViewDetails={() => console.log('View details clicked')}
            />
          </div>
        )}

        {verificationResult && !verificationResult.is_deleted && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {verificationResult.verification_message}
            </AlertDescription>
          </Alert>
        )}

        {verificationResult && (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={handleClear}>
              Clear Results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
