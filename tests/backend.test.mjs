import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 4300 + Math.floor(Math.random() * 300);
const baseUrl = `http://127.0.0.1:${port}`;
const adminPassword = "TestAdminStrong_42!";
let serverProc;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await wait(200);
  }
  throw new Error("Server did not start in time");
}

before(async () => {
  serverProc = spawn("node", ["server.js"], {
    env: {
      ...process.env,
      PORT: String(port),
      ADMIN_PASSWORD: adminPassword,
      ADMIN_SESSION_SECRET: "test-secret-very-long-value",
      NODE_ENV: "test",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });

  serverProc.stderr.on("data", () => {});
  await waitForServer(`${baseUrl}/api/health`);
});

after(async () => {
  if (!serverProc) return;
  serverProc.kill("SIGTERM");
  await wait(200);
});

test("health endpoint responds", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test("admin status is false before login", async () => {
  const res = await fetch(`${baseUrl}/api/admin/status`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.isAdmin, false);
});

test("admin login rejects wrong password", async () => {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pseudo: "admin", password: "bad-password" }),
  });
  assert.equal(res.status, 401);
});

test("admin login works and grants session", async () => {
  const login = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pseudo: "admin", password: adminPassword }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie");
  assert.ok(cookie && cookie.includes("qday_admin_session="));

  const status = await fetch(`${baseUrl}/api/admin/status`, {
    headers: { Cookie: cookie },
  });
  assert.equal(status.status, 200);
  const body = await status.json();
  assert.equal(body.isAdmin, true);
});

test("upload endpoint blocks non-admin", async () => {
  const form = new FormData();
  form.append("asset", new Blob(["test"], { type: "text/plain" }), "test.txt");
  const res = await fetch(`${baseUrl}/api/admin/upload-ad-asset`, {
    method: "POST",
    body: form,
  });
  assert.equal(res.status, 403);
});
