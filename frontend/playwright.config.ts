import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioPath = path.resolve(__dirname, "../data/test_audio.wav");
const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";

const isLive = process.env.BASE_URL && process.env.BASE_URL.includes("run.app");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        `--use-file-for-fake-audio-capture=${audioPath}`,
      ],
    },
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { 
        ...devices["Desktop Chrome"], 
        viewport: { width: 1440, height: 900 } 
      },
    },
    {
      name: "Mobile Chrome",
      use: { 
        ...devices["Pixel 7"], 
        viewport: { width: 390, height: 844 } 
      },
    },
  ],
  ...(isLive ? {} : {
    webServer: [
      {
        command: "cd .. && venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000",
        url: "http://127.0.0.1:8000/healthz",
        reuseExistingServer: true,
        timeout: 30000,
      },
      {
        command: "npm run dev -- --host 127.0.0.1 --port 5173",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: true,
        timeout: 30000,
      }
    ]
  })
});
