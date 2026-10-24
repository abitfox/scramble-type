import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.?(c|m)[jt]s?(x)"],
    setupFiles: ["test/setup.ts"],
  },
});
