import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["./tests/**/*.test.ts", "./tests/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "tests/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/generated/**",
      ],
    },
    // Increase timeout for async tests
    testTimeout: 10000,
    // Allow parallel test execution
    pool: "forks",
    // Mock environment variables
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      NEXTAUTH_SECRET: "test-secret-for-vitest",
      NEXTAUTH_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
