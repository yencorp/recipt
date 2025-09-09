// Base Repository exports
export { BaseRepository } from "./base.repository";
export type {
  PaginationOptions,
  PaginationResult,
  SortOptions,
  FilterOptions,
  SearchOptions,
  StatisticsResult,
} from "./base.repository";

// Specialized Repository exports
export { UserRepository } from "./user.repository";
export { EventRepository } from "./event.repository";
export { BudgetRepository } from "./budget.repository";

// Query Optimization exports
export { QueryOptimizer } from "./query-optimizer";
export type {
  QueryOptimizationOptions,
  QueryPerformanceMetrics,
} from "./query-optimizer";

// Transaction Management exports
export { TransactionManager } from "./transaction-manager";
export type {
  TransactionOptions,
  TransactionContext,
  TransactionOperation,
  CompensationAction,
} from "./transaction-manager";

// Repository specific types
export type {
  UserSearchOptions,
  UserStatistics,
  LoginStatistics,
} from "./user.repository";

export type {
  EventSearchOptions,
  EventStatistics,
  EventCalendarItem,
} from "./event.repository";

export type {
  BudgetSearchOptions,
  BudgetStatistics,
  BudgetExecutionTrend,
  ApprovalWorkflowStats,
} from "./budget.repository";
