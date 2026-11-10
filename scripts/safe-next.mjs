import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
const mode = process.argv[2];
if (!["dev", "build", "start"].includes(mode)) throw new Error("Use safe-next.mjs dev, build or start.");
const port = Number(process.argv[3] || 3100);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a valid local fixture port.');
// Next loads .env files itself; refuse them rather than risk importing live credentials.
if (readdirSync(process.cwd()).some((name) => /^\.env(?:\.|$)/.test(name))) {
  throw new Error("Fixture mode requires a checkout without .env files. Use an isolated backend for authenticated development.");
}
const env = {};
for (const key of ["PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "ComSpec", "COMSPEC", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "NUMBER_OF_PROCESSORS"]) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, {
  NODE_ENV: mode === "dev" ? "development" : "production",
  NEXT_TELEMETRY_DISABLED: "1",
  SITGURU_LOCAL_PREVIEW: "true",
  ...(mode === 'dev' && port !== 3100 ? {SITGURU_LOCAL_PREVIEW_DIST: `.next-fixture-${port}`} : {}),
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-fixture-no-credentials",
  SUPABASE_SERVICE_ROLE_KEY: "local-fixture-no-credentials",
});
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", mode, ...(mode !== "build" ? ["--hostname", "127.0.0.1", "--port", String(port)] : [])], { stdio: "inherit", env });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
