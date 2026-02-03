'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// Auth hooks
export function useSignup() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; name?: string }) =>
      apiClient.signup(data),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) => apiClient.login(data),
    onSuccess: () => {
      // Invalidate user query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(['currentUser'], null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => apiClient.verifyEmail(token),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => apiClient.resendVerification(email),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      if (response.error) {
        return null;
      }
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
