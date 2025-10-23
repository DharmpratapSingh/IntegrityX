/**
 * Deleted Document Info Component
 * 
 * This component displays information about a deleted document,
 * including when it was uploaded, when it was deleted, and verification details.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Calendar, 
  User, 
  FileText, 
  Hash, 
  Trash2, 
  Clock, 
  Shield,
  Info
} from 'lucide-react';

interface DeletedDocumentInfoProps {
  documentInfo: {
    id: string;
    original_artifact_id: string;
    loan_id: string;
    artifact_type: string;
    payload_sha256: string;
    walacor_tx_id: string;
    original_created_at: string;
    original_created_by: string;
    deleted_at: string;
    deleted_by: string;
    deletion_reason?: string;
    verification_message: string;
  };
  onVerify?: () => void;
  onViewDetails?: () => void;
}

export const DeletedDocumentInfo: React.FC<DeletedDocumentInfoProps> = ({
  documentInfo,
  onVerify,
  onViewDetails
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Deleted Document
          </CardTitle>
          <Badge variant="destructive">Deleted</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {documentInfo.verification_message}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Document ID:</span>
            </div>
            <p className="text-sm text-gray-600 font-mono">{documentInfo.original_artifact_id}</p>

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Loan ID:</span>
            </div>
            <p className="text-sm text-gray-600">{documentInfo.loan_id}</p>

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Type:</span>
            </div>
            <p className="text-sm text-gray-600 capitalize">{documentInfo.artifact_type}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Document Hash:</span>
            </div>
            <p className="text-sm text-gray-600 font-mono break-all">
              {documentInfo.payload_sha256}
            </p>

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Blockchain TX:</span>
            </div>
            <p className="text-sm text-gray-600 font-mono break-all">
              {documentInfo.walacor_tx_id}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded-full">
                <Calendar className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Uploaded</p>
                <p className="text-xs text-gray-600">{formatDate(documentInfo.original_created_at)}</p>
                <p className="text-xs text-gray-500">by {documentInfo.original_created_by}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 bg-red-100 rounded-full">
                <Trash2 className="h-3 w-3 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Deleted</p>
                <p className="text-xs text-gray-600">{formatDate(documentInfo.deleted_at)}</p>
                <p className="text-xs text-gray-500">by {documentInfo.deleted_by}</p>
                {documentInfo.deletion_reason && (
                  <p className="text-xs text-gray-500 mt-1">
                    Reason: {documentInfo.deletion_reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {onVerify && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onVerify}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Verify Document
            </Button>
          )}
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewDetails}
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
