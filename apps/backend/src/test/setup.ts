import "reflect-metadata";

// Global test setup for NestJS
global.beforeEach = () => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
};

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-token-for-testing-only";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/recipt_test";
process.env.REDIS_URL = "redis://localhost:6379/1";

// Mock TypeORM DataSource for unit tests
jest.mock("typeorm", () => {
  const actual = jest.requireActual("typeorm");
  return {
    ...actual,
    DataSource: jest.fn().mockImplementation(() => ({
      initialize: jest.fn(),
      destroy: jest.fn(),
      isInitialized: true,
    })),
  };
});

// Global timeout for tests
jest.setTimeout(10000);
