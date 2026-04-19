async function jfetch(url, opts) {
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function setStatus(text, kind = "ok") {
  const el = document.getElementById("status");
  el.textContent = text;
  el.dataset.kind = kind;
}

function pretty(obj) {
  return typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

async function loadExamples() {
  const data = await jfetch("/api/examples");
  const sel = document.getElementById("examples");
  sel.innerHTML = "";
  for (const ex of data.examples || []) {
    const opt = document.createElement("option");
    opt.value = ex;
    opt.textContent = ex.replace("agent/task-examples/", "");
    sel.appendChild(opt);
  }
}

async function refreshOutputs() {
  const data = await jfetch("/api/outputs");
  const list = document.getElementById("outputsList");
  list.innerHTML = "";

  for (const f of data.outputs || []) {
    const a = document.createElement("a");
    a.href = `/outputs/${encodeURIComponent(f.name)}`;
    a.textContent = f.name;
    a.className = "file";

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${Math.round((f.bytes || 0) / 1024)} KB`;

    const row = document.createElement("div");
    row.className = "fileRow";
    row.appendChild(a);
    row.appendChild(meta);
    list.appendChild(row);
  }
}

async function planInstruction(run = false) {
  const instruction = document.getElementById("instruction").value;
  const allowAbsoluteInputs = document.getElementById("allowAbs").checked;
  setStatus(run ? "Exécution…" : "Plan…", "busy");
  const data = await jfetch(run ? "/api/run" : "/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "instruction", instruction, allowAbsoluteInputs }),
  });
  document.getElementById("result").textContent = pretty(data);
  await refreshOutputs();
  setStatus(run ? "Terminé" : "Plan OK", "ok");
}

async function planJson(run = false) {
  const allowAbsoluteInputs = document.getElementById("allowAbs").checked;
  const raw = document.getElementById("taskJson").value.trim();
  if (!raw) throw new Error("Task JSON vide");
  const task = JSON.parse(raw);
  setStatus(run ? "Exécution…" : "Plan…", "busy");
  const data = await jfetch(run ? "/api/run" : "/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "json", task, allowAbsoluteInputs }),
  });
  document.getElementById("result").textContent = pretty(data);
  await refreshOutputs();
  setStatus(run ? "Terminé" : "Plan OK", "ok");
}

async function loadExampleIntoEditor() {
  const taskPath = document.getElementById("examples").value;
  if (!taskPath) return;
  setStatus("Chargement…", "busy");
  const data = await jfetch("/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "taskPath", taskPath }),
  });
  document.getElementById("taskJson").value = JSON.stringify(data.task, null, 2);
  setStatus("Exemple chargé", "ok");
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadExamples();
    await refreshOutputs();
  } catch (e) {
    document.getElementById("result").textContent = e.message || String(e);
    setStatus("Erreur", "err");
  }

  document.getElementById("planBtn").addEventListener("click", () => planInstruction(false).catch((e) => (setStatus("Erreur", "err"), (result.textContent = e.message))));
  document.getElementById("runBtn").addEventListener("click", () => planInstruction(true).catch((e) => (setStatus("Erreur", "err"), (result.textContent = e.message))));

  document.getElementById("planJsonBtn").addEventListener("click", () => planJson(false).catch((e) => (setStatus("Erreur", "err"), (result.textContent = e.message))));
  document.getElementById("runJsonBtn").addEventListener("click", () => planJson(true).catch((e) => (setStatus("Erreur", "err"), (result.textContent = e.message))));

  document.getElementById("loadExample").addEventListener("click", () => loadExampleIntoEditor().catch((e) => (setStatus("Erreur", "err"), (result.textContent = e.message))));
  document.getElementById("refreshOut").addEventListener("click", () => refreshOutputs().catch((e) => (setStatus("Erreur", "err"), (result.textContent = e.message))));
});

