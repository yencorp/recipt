// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  baptismalName?: string;
  phone: string;
  position: string;
  role: UserRole;
  organizations: UserOrganization[];
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  MEMBER = 'MEMBER',
  USER = 'USER',
  QA = 'QA',
}

export interface UserOrganization {
  id: string;
  name: string;
  role: OrganizationRole;
}

export enum OrganizationRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Event Types
export interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  allocatedBudget?: number;
  status: EventStatus;
  organization: Organization;
  hasBudget: boolean;
  hasSettlement: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export enum EventStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface CreateEventDto {
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  allocatedBudget?: number;
  organizationId: string;
  description?: string;
}

// Auth Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  baptismalName?: string;
  phone: string;
  position: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode: number;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string[] | string;
  error: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
