/**
 * Delete Document Modal Component
 * 
 * This component provides a modal interface for deleting documents while
 * preserving metadata for verification purposes.
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Trash2, AlertTriangle, Info } from 'lucide-react';

interface DeleteDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (reason: string) => Promise<void>;
  documentId: string;
  documentName: string;
  isLoading?: boolean;
}

export const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  documentId,
  documentName,
  isLoading = false
}) => {
  const [deletionReason, setDeletionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setError(null);
      await onDelete(deletionReason);
      setDeletionReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleClose = () => {
    setDeletionReason('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Delete Document</h2>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            You are about to delete the document:
          </p>
          <p className="font-medium text-gray-900">{documentName}</p>
          <p className="text-xs text-gray-500 mt-1">ID: {documentId}</p>
        </div>

        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This document will be deleted but its metadata will be preserved 
            for verification purposes. You can still verify this document using its hash even after deletion.
          </AlertDescription>
        </Alert>

        <div className="mb-4">
          <Label htmlFor="deletionReason" className="text-sm font-medium text-gray-700">
            Reason for deletion (optional)
          </Label>
          <Textarea
            id="deletionReason"
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            placeholder="Enter reason for deletion..."
            className="mt-1"
            rows={3}
          />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Document
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};



