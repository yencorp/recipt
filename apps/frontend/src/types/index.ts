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
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location?: string;
  estimatedCost?: number;
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

export enum EventType {
  RETREAT = 'RETREAT',
  WORKSHOP = 'WORKSHOP',
  MEETING = 'MEETING',
  SOCIAL = 'SOCIAL',
  EDUCATION = 'EDUCATION',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export interface CreateEventDto {
  organizationId: string;
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location?: string;
  estimatedCost?: number;
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
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
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

// Dashboard Types
export interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalBudget: number;
  totalExpenditure: number;
  pendingApprovals: number;
}

export interface RecentActivity {
  id: string;
  type: 'event_created' | 'budget_submitted' | 'settlement_approved' | 'user_joined';
  title: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    role: string;
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Blog Types
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  viewCount: number;
}

// Budget Types
export enum BudgetType {
  ANNUAL = 'ANNUAL',
  EVENT = 'EVENT',
  PROJECT = 'PROJECT',
  SPECIAL = 'SPECIAL',
  EMERGENCY = 'EMERGENCY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum BudgetStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export interface BudgetItem {
  id?: string;
  category: string;
  description?: string;
  amount: number;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface Budget {
  id: string;
  organizationId: string;
  eventId?: string;
  title: string;
  description?: string;
  type: BudgetType;
  status: BudgetStatus;
  budgetYear: number;
  budgetPeriod?: number;
  periodStartDate: string;
  periodEndDate: string;
  totalIncomeAmount: number;
  totalExpenseAmount: number;
  incomeItems?: BudgetItem[];
  expenseItems?: BudgetItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  organizationId: string;
  eventId?: string;
  title: string;
  description?: string;
  type: BudgetType;
  budgetYear: number;
  budgetPeriod?: number;
  periodStartDate: string;
  periodEndDate: string;
  totalIncomeAmount?: number;
  totalExpenseAmount?: number;
  incomeItems?: BudgetItem[];
  expenseItems?: BudgetItem[];
  notes?: string;
}
