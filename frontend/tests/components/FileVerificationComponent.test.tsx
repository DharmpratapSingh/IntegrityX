/**
 * FileVerificationComponent Tests
 * Tests for the main file verification functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileVerificationComponent from '@/components/FileVerificationComponent';

describe('FileVerificationComponent', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render the component', () => {
    render(<FileVerificationComponent />);
    expect(screen.getByText(/verify/i)).toBeInTheDocument();
  });

  it('should handle file upload', async () => {
    render(<FileVerificationComponent />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(input.files![0]).toBe(file);
      expect(input.files).toHaveLength(1);
    });
  });

  it('should show loading state during verification', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ status: 'verified' })
      }), 100))
    );

    render(<FileVerificationComponent />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/verifying/i)).toBeInTheDocument();
    });
  });

  it('should display verification results', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'verified',
        integrity: 'valid',
        tamper_detected: false
      })
    });

    render(<FileVerificationComponent />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    });
  });

  it('should handle verification error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<FileVerificationComponent />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should validate file type', () => {
    render(<FileVerificationComponent />);
    
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [invalidFile] } });
    
    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
  });

  it('should validate file size', () => {
    render(<FileVerificationComponent />);
    
    // Create a file larger than max size (50MB)
    const largeContent = new Array(51 * 1024 * 1024).fill('a').join('');
    const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });
});



