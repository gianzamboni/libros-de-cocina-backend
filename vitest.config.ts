import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Injected before any module (incl. config/env.ts) is imported, so the
    // env validation passes instead of calling process.exit(1) on boot.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_SECRET: "test-secret-0123456789",
      JWT_EXPIRES_IN: "7d",
      ADMIN_EMAIL: "owner@example.com",
      ADMIN_PASSWORD: "test-password",
      // Pin so the Google login path is deterministic regardless of any local
      // .env; google-auth-library is mocked in the auth.service test.
      GOOGLE_CLIENT_ID: "test-google-client-id",
      // Present so the scan service constructs its Anthropic client, which the
      // tests then replace with a mock.
      ANTHROPIC_API_KEY: "test-key",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/app.ts",
        "src/db/prisma.ts",
        "src/config/**",
        "**/*.routes.ts",
        "**/*.controller.ts",
        "src/middleware/upload.ts",
        "src/middleware/rateLimit.ts",
        "src/types/**",
        "prisma/**",
        // Intentionally untested low-signal files (see plan): one-line error
        // factories and plain Zod auth schema.
        "src/utils/httpError.ts",
        "src/schemas/auth.schema.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
