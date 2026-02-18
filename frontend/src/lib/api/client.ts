// API client for communicating with the backend
// Uses Next.js rewrite proxy (/backend-api → localhost:4000/api) to avoid CORS issues
const API_URL = '';

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
  async signup(data: { email: string; password: string; name?: string; phone?: string }) {
    return this.request('/backend-api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request('/backend-api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request('/backend-api/auth/logout', {
      method: 'POST',
    });
  }

  async verifyEmail(token: string) {
    return this.request('/backend-api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email: string) {
    return this.request('/backend-api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async refreshToken() {
    return this.request('/backend-api/auth/refresh', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request(`/backend-api/auth/me`, {
      method: 'GET',
    });
  }

  // Password reset
  async requestPasswordReset(email: string) {
    return this.request('/backend-api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: { token: string; password: string }) {
    return this.request('/backend-api/auth/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Profile endpoints
  async updateProfile(data: { name?: string; phone?: string; company?: string; jobTitle?: string; bio?: string }) {
    return this.request('/backend-api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('/backend-api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Team endpoints
  async getTeamMembers() {
    return this.request('/backend-api/teams/members', { method: 'GET' });
  }

  async inviteTeamMember(data: { email: string; role: string }) {
    return this.request('/backend-api/teams/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(memberId: string) {
    return this.request(`/backend-api/teams/members/${memberId}`, { method: 'DELETE' });
  }

  async updateTeamMemberRole(memberId: string, role: string) {
    return this.request(`/backend-api/teams/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Client endpoints
  async getClients() {
    return this.request('/backend-api/clients', { method: 'GET' });
  }

  async createClient(data: { name: string; email?: string; phone?: string; company?: string; address?: string; notes?: string }) {
    return this.request('/backend-api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(clientId: string, data: { name?: string; email?: string; phone?: string; company?: string; address?: string; notes?: string }) {
    return this.request(`/backend-api/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(clientId: string) {
    return this.request(`/backend-api/clients/${clientId}`, { method: 'DELETE' });
  }

  async sendContactMessage(data: { name: string; email: string; message: string }) {
    return this.request('/backend-api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/backend-api/admin/stats', { method: 'GET' });
  }

  async getAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    return this.request(`/backend-api/admin/users?${searchParams.toString()}`, { method: 'GET' });
  }

  async getAllAdminUsers() {
    return this.request('/backend-api/admin/users/all', { method: 'GET' });
  }

  async getAdminUser(userId: string) {
    return this.request(`/backend-api/admin/users/${userId}`, { method: 'GET' });
  }

  // Dashboard & Team Assignments
  async getDashboardStats() {
    return this.request('/backend-api/dashboard/stats', { method: 'GET' });
  }

  async getAssignableUsers(role?: string) {
    const url = role ? `/backend-api/teams/assignable?role=${role}` : '/backend-api/teams/assignable';
    return this.request(url, { method: 'GET' });
  }

  async createAdminUser(data: {
    email: string;
    password: string;
    name?: string;
    role?: string;
    emailVerified?: boolean;
    phone?: string;
    company?: string;
    jobTitle?: string;
    bio?: string;
  }) {
    return this.request('/backend-api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminUser(userId: string, data: {
    email?: string;
    name?: string;
    role?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    bio?: string;
    emailVerified?: boolean;
  }) {
    return this.request(`/backend-api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resetAdminUserPassword(userId: string, password: string) {
    return this.request(`/backend-api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async deleteAdminUser(userId: string) {
    return this.request(`/backend-api/admin/users/${userId}`, { method: 'DELETE' });
  }

  async blockUser(userId: string, reason?: string) {
    return this.request(`/backend-api/admin/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unblockUser(userId: string) {
    return this.request(`/backend-api/admin/users/${userId}/unblock`, { method: 'POST' });
  }

  async getAdminNotifications(params?: { unreadOnly?: boolean; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return this.request(`/backend-api/admin/notifications?${searchParams.toString()}`, { method: 'GET' });
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/backend-api/admin/notifications/${notificationId}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request('/backend-api/admin/notifications/read-all', { method: 'PUT' });
  }

  async clearAllAdminNotifications() {
    return this.request('/backend-api/admin/notifications', { method: 'DELETE' });
  }

  async getLoginAttempts(params?: { page?: number; limit?: number; email?: string; success?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.email) searchParams.set('email', params.email);
    if (params?.success !== undefined) searchParams.set('success', params.success.toString());
    return this.request(`/backend-api/admin/login-attempts?${searchParams.toString()}`, { method: 'GET' });
  }

  // Admin - Roles
  async getRoles() {
    return this.request('/backend-api/admin/roles', {
      method: 'GET',
    });
  }

  // CMS endpoints
  async getPageContent(page: string) {
    return this.request(`/backend-api/cms/content/${page}`, { method: 'GET' });
  }

  async updatePageContent(page: string, sections: any[]) {
    return this.request(`/backend-api/cms/content/${page}`, {
      method: 'PUT',
      body: JSON.stringify({ sections }),
    });
  }

  async addSection(page: string, section: any) {
    return this.request(`/backend-api/cms/content/${page}/sections`, {
      method: 'POST',
      body: JSON.stringify(section),
    });
  }

  async updateSection(page: string, sectionId: string, updates: any) {
    return this.request(`/backend-api/cms/content/${page}/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSection(page: string, sectionId: string) {
    return this.request(`/backend-api/cms/content/${page}/sections/${sectionId}`, { method: 'DELETE' });
  }

  async reorderSections(page: string, sectionIds: string[]) {
    return this.request(`/backend-api/cms/content/${page}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ sectionIds }),
    });
  }

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${this.baseUrl}/backend-api/cms/upload`, {
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
    return this.request(`/backend-api/cms/images?${searchParams.toString()}`, { method: 'GET' });
  }

  async deleteImage(imageId: string) {
    return this.request(`/backend-api/cms/images/${imageId}`, { method: 'DELETE' });
  }
  // Project endpoints
  async getProjects(params?: { status?: string; clientId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.clientId) searchParams.set('clientId', params.clientId);
    return this.request(`/backend-api/projects?${searchParams.toString()}`, { method: 'GET' });
  }

  async getProject(projectId: string) {
    return this.request(`/backend-api/projects/${projectId}`, { method: 'GET' });
  }

  async createProject(data: {
    name: string;
    code?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    clientId?: string;
    managerId?: string;
  }) {
    return this.request('/backend-api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(projectId: string, data: {
    name?: string;
    code?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    clientId?: string;
    managerId?: string;
  }) {
    return this.request(`/backend-api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(projectId: string) {
    return this.request(`/backend-api/projects/${projectId}`, { method: 'DELETE' });
  }

  // Task endpoints
  async getTasks(params: { projectId: string }) {
    const searchParams = new URLSearchParams();
    searchParams.set('projectId', params.projectId);
    return this.request(`/backend-api/tasks?${searchParams.toString()}`, { method: 'GET' });
  }

  async createTask(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    projectId: string;
    assigneeId?: string;
  }) {
    return this.request('/backend-api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(taskId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    assigneeId?: string;
  }) {
    return this.request(`/backend-api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(taskId: string) {
    return this.request(`/backend-api/tasks/${taskId}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);
