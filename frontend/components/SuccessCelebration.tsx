'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, ExternalLink, Upload, X, FileText, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SuccessCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDocument?: () => void;
  onUploadAnother?: () => void;
  artifactId?: string;
  walacorTxId?: string;
  documentType?: string;
  securityLevel?: 'standard' | 'quantum-safe' | 'maximum';
}

export function SuccessCelebration({
  isOpen,
  onClose,
  onViewDocument,
  onUploadAnother,
  artifactId,
  walacorTxId,
  documentType = 'Document',
  securityLevel = 'standard'
}: SuccessCelebrationProps) {
  const [animate, setAnimate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setAnimate(true);
      // Auto-close after 10 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const securityLevelInfo = {
    standard: {
      label: 'Standard Security',
      color: 'blue',
      icon: Shield
    },
    'quantum-safe': {
      label: 'Quantum-Safe',
      color: 'purple',
      icon: Shield
    },
    maximum: {
      label: 'Maximum Security',
      color: 'red',
      icon: Shield
    }
  };

  const securityInfo = securityLevelInfo[securityLevel];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Animated Background Effects */}
      {animate && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Success Modal */}
      <Card
        className={cn(
          'max-w-lg w-full relative',
          animate && 'animate-bounce-in'
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <CardHeader className="text-center pt-8">
          {/* Animated Success Icon */}
          <div className="mx-auto mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600 animate-scale" />
              </div>
              {animate && (
                <>
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20" />
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse opacity-30" />
                </>
              )}
            </div>
          </div>

          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Document Sealed! 🎉
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Your document is now secured on the blockchain
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {/* Security Level Badge */}
          <div className="flex justify-center">
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                securityLevel === 'standard' && 'bg-blue-100 text-blue-800',
                securityLevel === 'quantum-safe' && 'bg-purple-100 text-purple-800',
                securityLevel === 'maximum' && 'bg-red-100 text-red-800'
              )}
            >
              <Shield className="w-4 h-4" />
              <span className="font-semibold text-sm">{securityInfo.label}</span>
            </div>
          </div>

          {/* Document Details */}
          {artifactId && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Artifact ID</p>
                <p className="text-sm font-mono text-gray-900 break-all">{artifactId}</p>
              </div>
              {walacorTxId && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Blockchain Transaction</p>
                  <p className="text-sm font-mono text-gray-900 break-all">{walacorTxId}</p>
                </div>
              )}
            </div>
          )}

          {/* Features Unlocked */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">✨ Features Enabled:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Tamper-proof verification</li>
              <li>✓ Immutable audit trail</li>
              <li>✓ Forensic timeline analysis</li>
              <li>✓ Public verification portal</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {/* Primary Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {onViewDocument && (
                <Button
                  onClick={onViewDocument}
                  className="flex-1"
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Document
                </Button>
              )}
              {artifactId && (
                <Button
                  onClick={() => {
                    onClose(); // Close modal first for clean transition
                    router.push(`/zkp-verify?artifact=${artifactId}`);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Generate ZKP Proof
                </Button>
              )}
            </div>

            {/* Secondary Action */}
            {onUploadAnother && (
              <Button
                onClick={onUploadAnother}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Another
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              Share Link
            </button>
            <span className="text-gray-300">•</span>
            <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              Download Proof
            </button>
          </div>
        </CardContent>
      </Card>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3) translateY(-100px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-scale {
          animation: scale 1s ease-in-out infinite;
        }

        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}
