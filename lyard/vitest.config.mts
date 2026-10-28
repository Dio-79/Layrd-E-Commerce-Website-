import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// `npm test` runs these inside `firebase emulators:exec --config firebase.test.json`,
// i.e. against throwaway emulators on ports 8085 / 9199 (never the real project).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false, // the files share one emulator
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      GCLOUD_PROJECT: "demo-layrd-test",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-layrd-test",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8085",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9199",
      EVENT_ADMIN_KEY: "test-admin-key",
      BUNDLE_ADMIN_KEY: "test-admin-key",
      NEXT_PUBLIC_ETRANSFER_EMAIL: "pay@layrd.test",
    },
  },
});
