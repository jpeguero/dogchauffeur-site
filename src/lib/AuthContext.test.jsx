import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// ── Mocks ─────────────────────────────────────────────────────────────────────
// vi.mock factories are hoisted, so mock functions must be declared with vi.hoisted

const { mockAuthMe, mockAuthLogout, mockAuthRedirectToLogin, mockAxiosGet } = vi.hoisted(() => ({
  mockAuthMe: vi.fn(),
  mockAuthLogout: vi.fn(),
  mockAuthRedirectToLogin: vi.fn(),
  mockAxiosGet: vi.fn(),
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: mockAuthMe,
      logout: mockAuthLogout,
      redirectToLogin: mockAuthRedirectToLogin,
    },
  },
}));

vi.mock('@/lib/app-params', () => ({
  appParams: {
    appId: 'test-app-id',
    token: 'test-token',
  },
}));

vi.mock('@base44/sdk/dist/utils/axios-client', () => ({
  createAxiosClient: vi.fn(() => ({ get: mockAxiosGet })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const publicSettingsResponse = { id: 'test-app-id', public_settings: {} };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  it('throws when used outside of AuthProvider', () => {
    // Suppress the expected React error boundary output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    spy.mockRestore();
  });
});

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading states true and no user', () => {
    mockAxiosGet.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoadingAuth).toBe(true);
    expect(result.current.isLoadingPublicSettings).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('authenticates user when public settings and auth both succeed', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com', role: 'admin' };
    mockAxiosGet.mockResolvedValue(publicSettingsResponse);
    mockAuthMe.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.authError).toBeNull();
  });

  it('sets authError to auth_required when public settings returns 403 auth_required', async () => {
    mockAxiosGet.mockRejectedValue({
      status: 403,
      data: { extra_data: { reason: 'auth_required' } },
      message: 'Authentication required',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoadingPublicSettings).toBe(false));

    expect(result.current.authError).toMatchObject({ type: 'auth_required' });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets authError to user_not_registered when public settings returns 403 user_not_registered', async () => {
    mockAxiosGet.mockRejectedValue({
      status: 403,
      data: { extra_data: { reason: 'user_not_registered' } },
      message: 'Not registered',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoadingPublicSettings).toBe(false));

    expect(result.current.authError).toMatchObject({ type: 'user_not_registered' });
  });

  it('sets authError to auth_required when auth.me() returns 401', async () => {
    mockAxiosGet.mockResolvedValue(publicSettingsResponse);
    mockAuthMe.mockRejectedValue({ status: 401, message: 'Unauthorized' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

    expect(result.current.authError).toMatchObject({ type: 'auth_required' });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets a generic unknown error when public settings fails without a recognised reason', async () => {
    mockAxiosGet.mockRejectedValue({ status: 500, message: 'Internal server error' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoadingPublicSettings).toBe(false));

    expect(result.current.authError).toMatchObject({ type: 'unknown' });
  });

  describe('logout', () => {
    it('clears user and isAuthenticated', async () => {
      mockAxiosGet.mockResolvedValue(publicSettingsResponse);
      mockAuthMe.mockResolvedValue({ id: 'user1', email: 'test@example.com' });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      act(() => {
        result.current.logout(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('calls the SDK logout without redirect when shouldRedirect=false', async () => {
      mockAxiosGet.mockResolvedValue(publicSettingsResponse);
      mockAuthMe.mockResolvedValue({ id: 'user1' });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      act(() => {
        result.current.logout(false);
      });

      expect(mockAuthLogout).toHaveBeenCalledWith();
    });
  });

  describe('navigateToLogin', () => {
    it('delegates to the SDK redirectToLogin method', async () => {
      mockAxiosGet.mockResolvedValue(publicSettingsResponse);
      mockAuthMe.mockResolvedValue({ id: 'user1' });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      act(() => {
        result.current.navigateToLogin();
      });

      expect(mockAuthRedirectToLogin).toHaveBeenCalled();
    });
  });
});
