'use client';

import Link from 'next/link';
import { Shield, AlertCircle, Lock, Upload, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Simple Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4">
            <Shield className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold">Security Tools</h1>
              <p className="text-blue-100 mt-1">Fraud detection, blockchain verification, and privacy-safe auditing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 3 Main Security Tools */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* 1. Fraud Detection */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Detection Rate</p>
                  <p className="text-2xl font-bold text-red-600">94%</p>
                </div>
              </div>
              <CardTitle>Fraud Detection</CardTitle>
              <CardDescription>
                AI-powered fraud risk scoring on loan applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Income-to-loan ratio analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Duplicate SSN/email detection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Missing field validation</span>
                </div>
              </div>
              <Link href="/upload">
                <Button className="w-full">
                  Upload & Analyze
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 2. Blockchain Verification */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Documents Sealed</p>
                  <p className="text-2xl font-bold text-green-600">1,247</p>
                </div>
              </div>
              <CardTitle>Blockchain Sealing</CardTitle>
              <CardDescription>
                Immutable blockchain records on Walacor network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Tamper-proof integrity</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Cryptographic timestamping</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Permanent audit trail</span>
                </div>
              </div>
              <Link href="/documents">
                <Button className="w-full" variant="outline">
                  View Documents
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 3. ZKP Verification */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Privacy Level</p>
                  <p className="text-2xl font-bold text-purple-600">100%</p>
                </div>
              </div>
              <CardTitle>ZK Proof Verify</CardTitle>
              <CardDescription>
                Verify documents without revealing private data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>Zero data exposure</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>Third-party verification</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>Exportable proof JSON</span>
                </div>
              </div>
              <Link href="/zkp-verify">
                <Button className="w-full" variant="outline">
                  Generate Proof
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid md:grid-cols-4 gap-4 mt-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">24</p>
              <p className="text-sm text-muted-foreground">Uploads Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">99.8%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-600">&lt;2s</p>
              <p className="text-sm text-muted-foreground">Avg Processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">94%</p>
              <p className="text-sm text-muted-foreground">Fraud Caught</p>
            </CardContent>
          </Card>
        </div>

        {/* Simple How It Works */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Three-layer security from upload to verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  1
                </div>
                <h3 className="font-semibold mb-1">Upload & Detect</h3>
                <p className="text-sm text-muted-foreground">
                  AI analyzes loan application for fraud risks
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  2
                </div>
                <h3 className="font-semibold mb-1">Blockchain Seal</h3>
                <p className="text-sm text-muted-foreground">
                  Document hash locked on Walacor blockchain
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 text-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  3
                </div>
                <h3 className="font-semibold mb-1">Verify Anytime</h3>
                <p className="text-sm text-muted-foreground">
                  Generate ZK proofs for privacy-safe auditing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
