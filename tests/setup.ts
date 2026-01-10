import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock nanoid to return predictable values in tests
vi.mock("nanoid", () => ({
  nanoid: (length: number = 21) => "x".repeat(length),
}));

// Mock bcryptjs for faster test execution
vi.mock("bcryptjs", async () => {
  const actual = await vi.importActual<typeof import("bcryptjs")>("bcryptjs");
  return {
    ...actual,
    // Use a faster hash round for tests
    hash: vi.fn(async (data: string) => `hashed_${data}`),
    compare: vi.fn(
      async (data: string, hash: string) => hash === `hashed_${data}`
    ),
  };
});

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log/error in tests unless debugging
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
