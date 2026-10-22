import { defineConfig } from "@playwright/test";

// E2E suite drives the real running app (real LLM calls, real RAG, real Wav2Lip clip
// generation) -- no mocks -- so timeouts are generous compared to a typical frontend suite.
// Both `cd backend && uvicorn app.main:app --port 8000` and `cd frontend && npm run dev`
// must already be running against a seeded database before this suite is run.
export default defineConfig({
  testDir: "./e2e",
  timeout: 150_000,
  expect: { timeout: 15_000 },
  fullyParallel: false, // shared seeded avatars/conversations -- avoid cross-test interference
  // Chat tests trigger real CPU-bound Wav2Lip clip generation on this machine's single backend
  // process; running test files in parallel starves them of CPU and causes spurious timeouts.
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
