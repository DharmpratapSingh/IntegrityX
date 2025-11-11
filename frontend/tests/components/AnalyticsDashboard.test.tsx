/**
 * AnalyticsDashboard Tests
 * Tests for the analytics dashboard component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

describe('AnalyticsDashboard', () => {
  const mockData = {
    totalDocuments: 1250,
    verifiedDocuments: 1180,
    flaggedDocuments: 70,
    recentActivity: [
      { id: 1, action: 'Document verified', timestamp: new Date() },
      { id: 2, action: 'Tamper detected', timestamp: new Date() }
    ],
    stats: {
      successRate: 94.4,
      avgProcessingTime: 2.3,
      totalUsers: 45
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard with loading state', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display dashboard statistics', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/1250/)).toBeInTheDocument(); // Total documents
      expect(screen.getByText(/1180/)).toBeInTheDocument(); // Verified
      expect(screen.getByText(/70/)).toBeInTheDocument(); // Flagged
    });
  });

  it('should display success rate', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/94.4%/)).toBeInTheDocument();
    });
  });

  it('should display recent activity', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Document verified/)).toBeInTheDocument();
      expect(screen.getByText(/Tamper detected/)).toBeInTheDocument();
    });
  });

  it('should handle empty data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalDocuments: 0,
        verifiedDocuments: 0,
        flaggedDocuments: 0,
        recentActivity: []
      })
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });
  });

  it('should handle API error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading/i)).toBeInTheDocument();
    });
  });

  it('should refresh data on button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
















