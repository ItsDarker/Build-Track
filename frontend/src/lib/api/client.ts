// API client for communicating with the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async signup(data: { email: string; password: string; name?: string }) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async verifyEmail(token: string) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email: string) {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async refreshToken() {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request(`/api/auth/me`, {
      method: 'GET',
    });
  }

  async sendContactMessage(data: { name: string; email: string; message: string }) {
    return this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/api/admin/stats', { method: 'GET' });
  }

  async getAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    return this.request(`/api/admin/users?${searchParams.toString()}`, { method: 'GET' });
  }

  async getAllAdminUsers() {
    return this.request('/api/admin/users/all', { method: 'GET' });
  }

  async getAdminUser(userId: string) {
    return this.request(`/api/admin/users/${userId}`, { method: 'GET' });
  }

  async createAdminUser(data: { email: string; password: string; name?: string; role?: string; emailVerified?: boolean }) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminUser(userId: string, data: { email?: string; name?: string; role?: string }) {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(userId: string) {
    return this.request(`/api/admin/users/${userId}`, { method: 'DELETE' });
  }

  async blockUser(userId: string, reason?: string) {
    return this.request(`/api/admin/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unblockUser(userId: string) {
    return this.request(`/api/admin/users/${userId}/unblock`, { method: 'POST' });
  }

  async getAdminNotifications(params?: { unreadOnly?: boolean; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return this.request(`/api/admin/notifications?${searchParams.toString()}`, { method: 'GET' });
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/api/admin/notifications/${notificationId}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request('/api/admin/notifications/read-all', { method: 'PUT' });
  }

  async clearAllAdminNotifications() {
    return this.request('/api/admin/notifications', { method: 'DELETE' });
  }

  async getLoginAttempts(params?: { page?: number; limit?: number; email?: string; success?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.email) searchParams.set('email', params.email);
    if (params?.success !== undefined) searchParams.set('success', params.success.toString());
    return this.request(`/api/admin/login-attempts?${searchParams.toString()}`, { method: 'GET' });
  }

  // CMS endpoints
  async getPageContent(page: string) {
    return this.request(`/api/cms/content/${page}`, { method: 'GET' });
  }

  async updatePageContent(page: string, sections: any[]) {
    return this.request(`/api/cms/content/${page}`, {
      method: 'PUT',
      body: JSON.stringify({ sections }),
    });
  }

  async addSection(page: string, section: any) {
    return this.request(`/api/cms/content/${page}/sections`, {
      method: 'POST',
      body: JSON.stringify(section),
    });
  }

  async updateSection(page: string, sectionId: string, updates: any) {
    return this.request(`/api/cms/content/${page}/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSection(page: string, sectionId: string) {
    return this.request(`/api/cms/content/${page}/sections/${sectionId}`, { method: 'DELETE' });
  }

  async reorderSections(page: string, sectionIds: string[]) {
    return this.request(`/api/cms/content/${page}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ sectionIds }),
    });
  }

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${this.baseUrl}/api/cms/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return { data };
    } catch (error) {
      return { error: 'Network error' };
    }
  }

  async getImages(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return this.request(`/api/cms/images?${searchParams.toString()}`, { method: 'GET' });
  }

  async deleteImage(imageId: string) {
    return this.request(`/api/cms/images/${imageId}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);
