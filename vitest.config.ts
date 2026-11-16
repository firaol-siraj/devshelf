import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/server": path.resolve(__dirname, "./node_modules/next/server.js"),
      "server-only": path.resolve(__dirname, "./node_modules/server-only/empty.js"),
    },
  },

  test: {
    environment: "node",

    server: {
      deps: {
        inline: ["next-auth"],
      },
    },

    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
    ],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/**/*.ts",
        "src/schemas/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
    },
  },
});
