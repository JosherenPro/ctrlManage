import { AuthResponse, User } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...this.getHeaders(), ...options?.headers },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `Error ${res.status}`);
    }
    const data = await res.json();
    return data.data !== undefined ? data.data : data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const options: RequestInit = { method: 'POST' };
    if (body !== undefined) options.body = JSON.stringify(body);
    return this.request<T>(endpoint, options);
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    const options: RequestInit = { method: 'PATCH' };
    if (body !== undefined) options.body = JSON.stringify(body);
    return this.request<T>(endpoint, options);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `Error ${res.status}`);
    }
    const data = await res.json();
    return data.data !== undefined ? data.data : data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.post<AuthResponse>('/auth/login', { email, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    studentNumber: string,
    program: string,
  ): Promise<AuthResponse> {
    const res = await this.post<AuthResponse>('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      studentNumber,
      program,
      fullName: `${firstName} ${lastName}`.trim(),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
}

export const api = new ApiClient(API_URL);
export default api;
