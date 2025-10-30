'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchWithTimeout } from '@/utils/api';

// Simple toast replacement
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  alert(`${type.toUpperCase()}: ${message}`);
};

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast('Please select a file first', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchWithTimeout('http://localhost:8000/api/ingest-json', {
        method: 'POST',
        body: formData,
        headers: {
          'loan_id': 'TEST-LOAN-001',
          'created_by': 'test-user'
        },
        timeoutMs: 15000,
        retries: 1
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResult(result);
        showToast('File uploaded successfully!', 'success');
      } else {
        showToast(`Upload failed: ${result.error?.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Upload Page
          </h1>
          <p className="text-gray-600">
            Test the document upload functionality without authentication
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Document
              </CardTitle>
              <CardDescription>
                Select a JSON file to upload and test the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>

              {file && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Upload Results
              </CardTitle>
              <CardDescription>
                View the upload response and transaction details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadResult ? (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Upload Successful</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Response Data</Label>
                    <Textarea
                      value={JSON.stringify(uploadResult, null, 2)}
                      readOnly
                      className="mt-1 font-mono text-xs"
                      rows={15}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No upload results yet</p>
                  <p className="text-sm">Upload a file to see the response</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Backend Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Check if the backend is running and accessible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetchWithTimeout('http://localhost:8000/api/health', { timeoutMs: 5000 });
                    const data = await response.json();
                    if (response.ok) {
                      showToast('Backend is running!', 'success');
                      console.log('Health check:', data);
                    } else {
                      showToast('Backend health check failed', 'error');
                    }
                  } catch (error) {
                    showToast('Cannot connect to backend', 'error');
                    console.error('Health check error:', error);
                  }
                }}
                variant="outline"
              >
                Check Backend Health
              </Button>
              <span className="text-sm text-gray-600">
                Backend should be running on http://localhost:8000
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}