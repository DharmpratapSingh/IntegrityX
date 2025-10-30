/**
 * useAuthenticatedToken Hook Tests
 * Tests for authentication token management
 */

import { renderHook, waitFor } from '@testing-library/react';
import useAuthenticatedToken from '@/hooks/auth/useAuthenticatedToken';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token-123'),
    isLoaded: true,
    isSignedIn: true
  })
}));

describe('useAuthenticatedToken', () => {
  it('should return token when authenticated', async () => {
    const { result } = renderHook(() => useAuthenticatedToken());

    await waitFor(() => {
      expect(result.current.token).toBe('mock-token-123');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should handle unauthenticated state', async () => {
    // Override mock for this test
    jest.mock('@clerk/nextjs', () => ({
      useAuth: () => ({
        getToken: jest.fn().mockResolvedValue(null),
        isLoaded: true,
        isSignedIn: false
      })
    }));

    const { result } = renderHook(() => useAuthenticatedToken());

    await waitFor(() => {
      expect(result.current.token).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should handle loading state', () => {
    jest.mock('@clerk/nextjs', () => ({
      useAuth: () => ({
        getToken: jest.fn(),
        isLoaded: false,
        isSignedIn: false
      })
    }));

    const { result } = renderHook(() => useAuthenticatedToken());

    expect(result.current.isLoading).toBe(true);
  });
});



