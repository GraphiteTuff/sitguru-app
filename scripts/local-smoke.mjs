// Run only against the loopback fixture server started by dev:fixture.
const port = Number(process.argv[2] || 3100);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Choose a loopback fixture port.");
const origin = `http://127.0.0.1:${port}`;
for (const path of ["/dev/community-studio", "/dev/pack", "/dev/pack?phone=1", "/pack", "/pack/submit", "/manager", "/intern", "/api/community-studio"]) {
  const response = await fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
  console.log(JSON.stringify({ path, status: response.status, location: response.headers.get("location") }));
  const body = await response.text();
  if (path === "/dev/community-studio" && response.status !== 200) process.exitCode = 1;
  if (path === "/pack" && (response.status !== 200 || !body.includes("The SitGuru Pack"))) process.exitCode = 1;
  if (path === "/pack/submit" && (response.status !== 307 || response.headers.get("location") !== "/pack#submit")) process.exitCode = 1;
  if (path.startsWith("/dev/pack") && response.status !== 200) process.exitCode = 1;
  // Existing manager access is a rendered denial; the intern proxy redirects.
  if (path === "/manager" && (response.status !== 200 || !body.includes("Growth portal access required."))) process.exitCode = 1;
  if (path === "/intern" && (response.status !== 307 || !response.headers.get("location")?.startsWith("/intern/login"))) process.exitCode = 1;
  if (path === "/api/community-studio" && response.status !== 401) process.exitCode = 1;
}
