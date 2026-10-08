import { defineConfig } from "vitest/config";

// Unit and integration tests for business logic (no DOM needed)
export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        setupFiles: ["src/test/setup.ts"],
    },
});
