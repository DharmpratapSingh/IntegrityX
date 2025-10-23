'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  Folder,
  Hash,
  Activity,
  DollarSign,
  Users,
  Target
} from 'lucide-react'

interface BulkOperationsAnalytics {
  timestamp: string
  bulk_operations_metrics: {
    total_bulk_operations: number
    bulk_operations_by_type: {
      bulk_delete: number
      bulk_verify: number
      bulk_export: number
    }
    success_rate: number
    average_operation_size: number
    bulk_operations_trend: {
      daily: number[]
      weekly: number[]
      monthly: number[]
    }
  }
  object_validator_usage: {
    usage_count: number
    directory_hash_generations: number
    verification_count: number
    performance_metrics: {
      average_hash_generation_time: number
      average_verification_time: number
      hash_generation_success_rate: number
      verification_success_rate: number
    }
    adoption_rate: number
  }
  directory_verification_stats: {
    total_directory_verifications: number
    success_rate: number
    average_directory_size: number
    performance_metrics: {
      average_verification_time: number
      average_directory_size_mb: number
      verification_success_rate: number
      error_rate: number
    }
    verification_trend: {
      daily: number[]
      weekly: number[]
      monthly: number[]
    }
  }
  time_savings_analysis: {
    time_saved_by_bulk_operations: number
    time_saved_by_object_validator: number
    total_time_saved_hours: number
    efficiency_gains: {
      bulk_operations_efficiency: number
      object_validator_efficiency: number
      overall_efficiency: number
    }
  }
  cost_analysis: {
    cost_savings_from_bulk_operations: number
    cost_savings_from_object_validator: number
    total_cost_savings: number
    roi_percentage: number
  }
  performance_metrics: {
    average_bulk_operation_time: number
    average_object_validator_time: number
    system_performance_impact: {
      cpu_usage_reduction: number
      memory_usage_reduction: number
      storage_optimization: number
    }
    scalability_metrics: {
      max_concurrent_operations: number
      throughput_improvement: number
      performance_degradation_threshold: number
    }
  }
}

export default function BulkOperationsAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<BulkOperationsAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchBulkOperationsAnalytics()
  }, [])

  const fetchBulkOperationsAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('http://localhost:8000/api/analytics/bulk-operations', {
        headers: { 'Accept': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.ok) {
        setAnalytics(data.data.analytics)
      } else {
        throw new Error(data.message || 'Failed to fetch bulk operations analytics')
      }

    } catch (err) {
      setError(`Failed to load bulk operations analytics: ${err}`)
      console.error('Error fetching bulk operations analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatTime = (time: number) => {
    return `${time.toFixed(2)}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bulk operations analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBulkOperationsAnalytics} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bulk Operations Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics for bulk operations, ObjectValidator usage, and performance metrics
          </p>
        </div>
        <Button onClick={fetchBulkOperationsAnalytics} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="object-validator">ObjectValidator</TabsTrigger>
          <TabsTrigger value="directory-verification">Directory Verification</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roi">ROI & Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bulk Operations</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.bulk_operations_metrics.total_bulk_operations)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.bulk_operations_metrics.success_rate.toFixed(1)}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ObjectValidator Usage</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.object_validator_usage.usage_count)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.object_validator_usage.adoption_rate.toFixed(1)}% adoption rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Directory Verifications</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.directory_verification_stats.total_directory_verifications)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.directory_verification_stats.success_rate.toFixed(1)}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.time_savings_analysis.total_time_saved_hours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">
                  Total time saved
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Bulk Operations by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bulk Delete</span>
                    <Badge variant="outline">{analytics.bulk_operations_metrics.bulk_operations_by_type.bulk_delete}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bulk Verify</span>
                    <Badge variant="outline">{analytics.bulk_operations_metrics.bulk_operations_by_type.bulk_verify}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bulk Export</span>
                    <Badge variant="outline">{analytics.bulk_operations_metrics.bulk_operations_by_type.bulk_export}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Savings</span>
                    <span className="font-bold text-green-600">{formatCurrency(analytics.cost_analysis.total_cost_savings)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ROI</span>
                    <span className="font-bold text-blue-600">{analytics.cost_analysis.roi_percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="object-validator" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  ObjectValidator Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Directory Hash Generations</span>
                    <span className="font-bold">{analytics.object_validator_usage.directory_hash_generations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Verification Count</span>
                    <span className="font-bold">{analytics.object_validator_usage.verification_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Adoption Rate</span>
                    <Badge className="bg-green-100 text-green-800">{analytics.object_validator_usage.adoption_rate.toFixed(1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Hash Generation Time</span>
                    <span className="font-bold">{formatTime(analytics.object_validator_usage.performance_metrics.average_hash_generation_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Verification Time</span>
                    <span className="font-bold">{formatTime(analytics.object_validator_usage.performance_metrics.average_verification_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hash Generation Success Rate</span>
                    <Badge className="bg-blue-100 text-blue-800">{analytics.object_validator_usage.performance_metrics.hash_generation_success_rate.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Verification Success Rate</span>
                    <Badge className="bg-green-100 text-green-800">{analytics.object_validator_usage.performance_metrics.verification_success_rate.toFixed(1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="directory-verification" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Directory Verification Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Verifications</span>
                    <span className="font-bold">{analytics.directory_verification_stats.total_directory_verifications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge className="bg-green-100 text-green-800">{analytics.directory_verification_stats.success_rate.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Directory Size</span>
                    <span className="font-bold">{analytics.directory_verification_stats.average_directory_size} files</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Verification Time</span>
                    <span className="font-bold">{formatTime(analytics.directory_verification_stats.performance_metrics.average_verification_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Directory Size</span>
                    <span className="font-bold">{analytics.directory_verification_stats.performance_metrics.average_directory_size_mb.toFixed(1)} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Verification Success Rate</span>
                    <Badge className="bg-green-100 text-green-800">{analytics.directory_verification_stats.performance_metrics.verification_success_rate.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Rate</span>
                    <Badge className="bg-red-100 text-red-800">{analytics.directory_verification_stats.performance_metrics.error_rate.toFixed(1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Bulk Operation Time</span>
                    <span className="font-bold">{formatTime(analytics.performance_metrics.average_bulk_operation_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg ObjectValidator Time</span>
                    <span className="font-bold">{formatTime(analytics.performance_metrics.average_object_validator_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Max Concurrent Operations</span>
                    <span className="font-bold">{analytics.performance_metrics.scalability_metrics.max_concurrent_operations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Throughput Improvement</span>
                    <Badge className="bg-green-100 text-green-800">{analytics.performance_metrics.scalability_metrics.throughput_improvement.toFixed(1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Performance Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage Reduction</span>
                    <Badge className="bg-blue-100 text-blue-800">{analytics.performance_metrics.system_performance_impact.cpu_usage_reduction.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage Reduction</span>
                    <Badge className="bg-blue-100 text-blue-800">{analytics.performance_metrics.system_performance_impact.memory_usage_reduction.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Optimization</span>
                    <Badge className="bg-blue-100 text-blue-800">{analytics.performance_metrics.system_performance_impact.storage_optimization.toFixed(1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bulk Operations Savings</span>
                    <span className="font-bold text-green-600">{formatCurrency(analytics.cost_analysis.cost_savings_from_bulk_operations)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ObjectValidator Savings</span>
                    <span className="font-bold text-green-600">{formatCurrency(analytics.cost_analysis.cost_savings_from_object_validator)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Cost Savings</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(analytics.cost_analysis.total_cost_savings)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ROI Percentage</span>
                    <Badge className="bg-green-100 text-green-800 text-lg">{analytics.cost_analysis.roi_percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Savings Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bulk Operations Time Saved</span>
                    <span className="font-bold text-blue-600">{analytics.time_savings_analysis.time_saved_by_bulk_operations.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ObjectValidator Time Saved</span>
                    <span className="font-bold text-blue-600">{analytics.time_savings_analysis.time_saved_by_object_validator.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Time Saved</span>
                    <span className="font-bold text-blue-600 text-lg">{analytics.time_savings_analysis.total_time_saved_hours.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Efficiency</span>
                    <Badge className="bg-blue-100 text-blue-800 text-lg">{analytics.time_savings_analysis.efficiency_gains.overall_efficiency.toFixed(1)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}