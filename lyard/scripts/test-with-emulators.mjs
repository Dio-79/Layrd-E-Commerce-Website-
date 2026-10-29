// npx tsx is not needed: run with `node scripts/test-with-emulators.mjs` (or run-tests.bat)
// Starts throwaway Firebase emulators (firebase.test.json: Firestore 8085,
// Auth 9199), runs Vitest against them, then always shuts them down.
// (`firebase emulators:exec` leaves the Firestore emulator running on Windows.)
import { execSync, spawn } from "node:child_process";

const PORTS = { firestore: 8085, auth: 9199 };
const extraArgs = process.argv.slice(2);

async function isUp(port) {
  try {
    await fetch(`http://127.0.0.1:${port}/`);
    return true;
  } catch {
    return false;
  }
}

function killTree(pid) {
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    else process.kill(-pid, "SIGKILL");
  } catch {
    /* already gone */
  }
}

/** Stops a test emulator left over from an earlier, interrupted run (Windows only). */
function freePorts() {
  if (process.platform !== "win32") return;
  for (const port of Object.values(PORTS)) {
    const lines = execSync(`netstat -ano -p tcp`, { encoding: "utf8" })
      .split(/\r?\n/)
      .filter((l) => l.includes(`127.0.0.1:${port} `) && l.includes("LISTENING"));
    for (const line of lines) {
      const pid = line.trim().split(/\s+/).pop();
      const cmd = execSync(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
        { encoding: "utf8" }
      );
      if (/firebase|emulator/i.test(cmd)) killTree(pid);
    }
  }
}

freePorts();

const emulators = spawn(
  "npx",
  ["firebase", "emulators:start", "--config", "firebase.test.json", "--project", "demo-layrd-test", "--only", "auth,firestore"],
  { shell: true, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" }
);
let log = "";
emulators.stdout.on("data", (d) => (log += d));
emulators.stderr.on("data", (d) => (log += d));

const started = Date.now();
while (!((await isUp(PORTS.firestore)) && (await isUp(PORTS.auth)))) {
  if (Date.now() - started > 120_000 || emulators.exitCode !== null) {
    console.error("The test emulators didn't start:\n" + log);
    killTree(emulators.pid);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 500));
}

const vitest = spawn("npx", ["vitest", "run", ...extraArgs], { shell: true, stdio: "inherit" });
const code = await new Promise((resolve) => vitest.on("exit", resolve));
killTree(emulators.pid);
process.exit(code ?? 1);
