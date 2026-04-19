const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const { planTaskFromInstruction, resolveInputPaths } = require("../agent/instruction-to-task");

const AGENT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(__dirname, "public");
const OUTPUTS_DIR = path.join(AGENT_ROOT, "outputs");
const TMP_DIR = path.join(OUTPUTS_DIR, ".ui-tmp");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function json(res, status, body) {
  const s = JSON.stringify(body, null, 2);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(s);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 2 * 1024 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serveStatic(req, res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const ct =
    ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".css"
        ? "text/css; charset=utf-8"
        : ext === ".js"
          ? "text/javascript; charset=utf-8"
          : ext === ".svg"
            ? "image/svg+xml"
            : ext === ".png"
              ? "image/png"
              : "application/octet-stream";
  res.writeHead(200, { "content-type": ct });
  fs.createReadStream(filePath).pipe(res);
}

function safeJoin(base, rel) {
  const target = path.resolve(base, rel.replace(/^\/+/, ""));
  const baseAbs = path.resolve(base);
  if (!target.startsWith(baseAbs + path.sep) && target !== baseAbs) throw new Error("Invalid path");
  return target;
}

function listTaskExamples() {
  const dir = path.join(AGENT_ROOT, "agent", "task-examples");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => `agent/task-examples/${f}`);
}

function listOutputs() {
  ensureDir(OUTPUTS_DIR);
  const items = [];
  for (const name of fs.readdirSync(OUTPUTS_DIR)) {
    if (name === ".agent-tmp" || name === ".ui-tmp") continue;
    const p = path.join(OUTPUTS_DIR, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) continue;
    items.push({ name, bytes: st.size, mtimeMs: st.mtimeMs });
  }
  items.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return items;
}

function runAgent(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["agent/run-agent.js", ...args], {
      cwd: AGENT_ROOT,
      windowsHide: true,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));
    child.on("close", (code) => resolve({ code, stdout: out, stderr: err }));
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://localhost");

    if (req.method === "GET" && u.pathname === "/") {
      return serveStatic(req, res, path.join(PUBLIC_DIR, "index.html"));
    }
    if (req.method === "GET" && u.pathname.startsWith("/public/")) {
      const filePath = safeJoin(PUBLIC_DIR, u.pathname.replace("/public/", ""));
      return serveStatic(req, res, filePath);
    }
    if (req.method === "GET" && u.pathname.startsWith("/outputs/")) {
      const filePath = safeJoin(OUTPUTS_DIR, u.pathname.replace("/outputs/", ""));
      res.writeHead(200, { "content-disposition": `attachment; filename="${path.basename(filePath)}"` });
      return fs.createReadStream(filePath).pipe(res);
    }

    if (req.method === "GET" && u.pathname === "/api/examples") {
      return json(res, 200, { examples: listTaskExamples() });
    }
    if (req.method === "GET" && u.pathname === "/api/outputs") {
      return json(res, 200, { outputs: listOutputs() });
    }

    if (req.method === "POST" && (u.pathname === "/api/plan" || u.pathname === "/api/run")) {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};

      const mode = payload?.mode || "instruction"; // instruction | json | taskPath
      const allowAbs = Boolean(payload?.allowAbsoluteInputs);

      if (mode === "instruction") {
        const instruction = String(payload?.instruction || "").trim();
        if (!instruction) return json(res, 400, { error: "instruction manquante" });
        let planned = await planTaskFromInstruction(instruction, { preferAi: true, outputDir: "outputs" });
        planned = resolveInputPaths(planned, { repoRoot: AGENT_ROOT, allowAbsoluteInputs: allowAbs });

        if (u.pathname === "/api/plan") return json(res, 200, { task: planned });
        const r = await runAgent(["--instruction", instruction, ...(allowAbs ? ["--allow-absolute-inputs"] : [])]);
        return json(res, 200, { ...r, outputs: listOutputs() });
      }

      if (mode === "taskPath") {
        const taskPath = String(payload?.taskPath || "").trim();
        if (!taskPath) return json(res, 400, { error: "taskPath manquant" });
        const full = safeJoin(AGENT_ROOT, taskPath);
        if (!full.endsWith(".json")) return json(res, 400, { error: "taskPath doit finir par .json" });
        if (!fs.existsSync(full)) return json(res, 404, { error: "task introuvable" });

        if (u.pathname === "/api/plan") {
          const task = JSON.parse(fs.readFileSync(full, "utf8"));
          return json(res, 200, { task, taskPath });
        }
        const r = await runAgent(["--task", taskPath]);
        return json(res, 200, { ...r, outputs: listOutputs() });
      }

      if (mode === "json") {
        ensureDir(TMP_DIR);
        const task = payload?.task;
        if (!task || typeof task !== "object") return json(res, 400, { error: "task JSON manquant" });
        const fileName = `task-${Date.now()}.json`;
        const relPath = `outputs/.ui-tmp/${fileName}`;
        const absPath = path.join(AGENT_ROOT, relPath);
        fs.writeFileSync(absPath, JSON.stringify(task, null, 2), "utf8");

        if (u.pathname === "/api/plan") return json(res, 200, { task, taskPath: relPath });
        const r = await runAgent(["--task", relPath]);
        return json(res, 200, { ...r, outputs: listOutputs() });
      }

      return json(res, 400, { error: "mode invalide" });
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (e) {
    json(res, 500, { error: e?.message || String(e) });
  }
});

const PORT = Number(process.env.UI_PORT || 3210);
server.listen(PORT, "127.0.0.1", () => {
  console.log(`SYM_AI Agent UI: http://127.0.0.1:${PORT}`);
});

