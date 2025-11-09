'use client';

import { Shield, AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { FraudDetectionResult } from '@/utils/fraudDetectionEngine';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FraudRiskBadgeProps {
  fraudDetection?: FraudDetectionResult;
  compact?: boolean;
}

export function FraudRiskBadge({ fraudDetection, compact = false }: FraudRiskBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!fraudDetection) {
    return null;
  }

  const { fraudRiskScore, riskLevel, fraudIndicators, recommendation, confidence } = fraudDetection;

  // Get color and icon based on risk level
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'critical':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          badgeText: 'CRITICAL RISK',
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: AlertTriangle,
          iconColor: 'text-orange-600',
          badgeText: 'HIGH RISK',
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: Shield,
          iconColor: 'text-yellow-600',
          badgeText: 'MEDIUM RISK',
        };
      case 'low':
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          badgeText: 'LOW RISK',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: Info,
          iconColor: 'text-gray-600',
          badgeText: 'UNKNOWN',
        };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <button
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color} cursor-pointer hover:opacity-80 transition-opacity`}
          >
            <Icon className={`h-3 w-3 ${config.iconColor}`} />
            <span>{fraudRiskScore}/100</span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
              Fraud Detection Analysis
            </DialogTitle>
            <DialogDescription>
              Detailed fraud risk assessment and indicators
            </DialogDescription>
          </DialogHeader>
          <FraudDetailsContent fraudDetection={fraudDetection} config={config} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${config.color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
          <div>
            <h3 className="font-semibold">{config.badgeText}</h3>
            <p className="text-sm opacity-80">
              Fraud Risk Score: {fraudRiskScore}/100 ({confidence}% confidence)
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm mb-3">{recommendation}</p>

      {fraudIndicators.length > 0 && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              View {fraudIndicators.length} Fraud Indicator{fraudIndicators.length !== 1 ? 's' : ''}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
                Fraud Detection Analysis
              </DialogTitle>
              <DialogDescription>
                Detailed fraud risk assessment and indicators
              </DialogDescription>
            </DialogHeader>
            <FraudDetailsContent fraudDetection={fraudDetection} config={config} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function FraudDetailsContent({ fraudDetection, config }: { fraudDetection: FraudDetectionResult; config: any }) {
  const { fraudRiskScore, riskLevel, fraudIndicators, recommendation, confidence } = fraudDetection;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className={`p-4 rounded-lg border ${config.color}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Risk Score</span>
          <span className="text-2xl font-bold">{fraudRiskScore}/100</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Risk Level</span>
          <span className="text-sm font-bold uppercase">{riskLevel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Detection Confidence</span>
          <span className="text-sm font-bold">{confidence}%</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Recommendation
        </h4>
        <p className="text-sm text-gray-700">{recommendation}</p>
      </div>

      {/* Fraud Indicators */}
      {fraudIndicators.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">
            Fraud Indicators ({fraudIndicators.length})
          </h4>
          <div className="space-y-2">
            {fraudIndicators.map((indicator, index) => {
              const severityConfig = {
                critical: { color: 'bg-red-100 border-red-300 text-red-800', label: 'CRITICAL' },
                high: { color: 'bg-orange-100 border-orange-300 text-orange-800', label: 'HIGH' },
                medium: { color: 'bg-yellow-100 border-yellow-300 text-yellow-800', label: 'MEDIUM' },
                low: { color: 'bg-blue-100 border-blue-300 text-blue-800', label: 'LOW' },
              }[indicator.severity];

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${severityConfig.color}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-bold uppercase">{severityConfig.label}</span>
                    <span className="text-xs font-medium">+{indicator.score} risk points</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{indicator.description}</p>
                  {indicator.affectedField && (
                    <p className="text-xs opacity-70">
                      Affected field: <code className="bg-black/10 px-1 py-0.5 rounded">{indicator.affectedField}</code>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Indicators */}
      {fraudIndicators.length === 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-800 font-medium">
            No fraud indicators detected
          </p>
          <p className="text-xs text-green-700 mt-1">
            Document appears legitimate
          </p>
        </div>
      )}
    </div>
  );
}

// Compact inline badge for forms
export function FraudRiskInlineBadge({ fraudDetection }: { fraudDetection?: FraudDetectionResult }) {
  if (!fraudDetection || fraudDetection.riskLevel === 'low') {
    return null;
  }

  const Icon = fraudDetection.riskLevel === 'critical' ? AlertCircle :
               fraudDetection.riskLevel === 'high' ? AlertTriangle : Shield;

  const colorClass = fraudDetection.riskLevel === 'critical' ? 'text-red-600' :
                     fraudDetection.riskLevel === 'high' ? 'text-orange-600' : 'text-yellow-600';

  return (
    <div className={`flex items-center gap-1.5 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      <span className="font-medium">{fraudDetection.fraudRiskScore}/ 100 fraud risk</span>
    </div>
  );
}
