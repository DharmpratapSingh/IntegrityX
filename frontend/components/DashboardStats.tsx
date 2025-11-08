'use client';

import { FileText, Shield, AlertTriangle, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface Stat {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  description?: string;
}

interface DashboardStatsProps {
  stats: Stat[];
  className?: string;
}

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    red: 'bg-red-500/10 text-red-600',
    purple: 'bg-purple-500/10 text-purple-600',
    orange: 'bg-orange-500/10 text-orange-600'
  };

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const color = stat.color || 'blue';

        return (
          <Card
            key={index}
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-3 rounded-xl', colorClasses[color])}>
                  <Icon className="w-6 h-6" />
                </div>
                {stat.trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      stat.trendDirection === 'up' && 'text-green-600',
                      stat.trendDirection === 'down' && 'text-red-600',
                      stat.trendDirection === 'neutral' && 'text-gray-600'
                    )}
                  >
                    {stat.trendDirection === 'up' && (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    <span>{stat.trend}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Preset stat configurations
export function getDefaultStats(customStats?: Partial<Record<string, any>>) {
  const defaults = {
    totalDocuments: 247,
    totalVerifications: 189,
    fraudDetected: 3,
    avgProcessingTime: '1.8s',
    successRate: '99.8%',
    uploadedToday: 24,
    ...customStats
  };

  return [
    {
      icon: FileText,
      label: 'Documents Sealed',
      value: defaults.totalDocuments,
      trend: '+12%',
      trendDirection: 'up' as const,
      color: 'blue' as const,
      description: 'Total blockchain-secured documents'
    },
    {
      icon: Shield,
      label: 'Verifications',
      value: defaults.totalVerifications,
      trend: '+8%',
      trendDirection: 'up' as const,
      color: 'green' as const,
      description: 'Successful verification checks'
    },
    {
      icon: AlertTriangle,
      label: 'Fraud Detected',
      value: defaults.fraudDetected,
      trend: '-15%',
      trendDirection: 'down' as const,
      color: 'red' as const,
      description: 'Detected tampering attempts'
    },
    {
      icon: Clock,
      label: 'Avg Process Time',
      value: defaults.avgProcessingTime,
      color: 'purple' as const,
      description: 'Average sealing duration'
    }
  ];
}

// Compact version for smaller sections
interface CompactStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}

export function CompactStat({ icon: Icon, label, value, color = 'blue' }: CompactStatProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    red: 'bg-red-500/10 text-red-600',
    purple: 'bg-purple-500/10 text-purple-600',
    orange: 'bg-orange-500/10 text-orange-600'
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
      <div className={cn('p-2 rounded-lg', colorClasses[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
