/**
 * Frees port 3000, removes stale Next.js dev lock, then starts dev server for phone testing.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3000;

function freePort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const pids = new Set();
      for (const line of out.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`Stopped previous process on port ${port} (PID ${pid})`);
        } catch {
          /* already gone */
        }
      }
    } else {
      execSync(`lsof -ti :${port} | xargs -r kill -9`, { stdio: "ignore" });
    }
  } catch {
    /* port already free */
  }
}

const lockPath = path.join(frontendRoot, ".next", "dev", "lock");
if (fs.existsSync(lockPath)) {
  try {
    fs.unlinkSync(lockPath);
    console.log("Removed stale Next.js dev lock");
  } catch {
    /* ignore */
  }
}

freePort(PORT);

const child = spawn("npx", ["next", "dev", "--hostname", "0.0.0.0", "-p", String(PORT)], {
  cwd: frontendRoot,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
