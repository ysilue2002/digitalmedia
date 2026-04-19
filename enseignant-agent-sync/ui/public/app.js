async function jget(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

function setStatus(t) {
  document.getElementById("status").textContent = t;
}

async function refreshOutputs() {
  const data = await jget("/api/outputs");
  const el = document.getElementById("outputs");
  el.innerHTML = "";
  for (const f of data.outputs || []) {
    const row = document.createElement("div");
    row.className = "fileRow";
    const a = document.createElement("a");
    a.href = `/outputs/${encodeURIComponent(f.name)}`;
    a.textContent = f.name;
    a.className = "file";
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${Math.round((f.bytes || 0) / 1024)} KB`;
    row.appendChild(a);
    row.appendChild(meta);
    el.appendChild(row);
  }
}

async function generate() {
  const fd = new FormData();
  fd.set("level", document.getElementById("level").value);
  fd.set("language", document.getElementById("language").value);
  fd.set("durationMin", document.getElementById("durationMin").value);
  fd.set("methodology", document.getElementById("methodology").value);
  fd.set("subject", document.getElementById("subject").value);
  fd.set("topic", document.getElementById("topic").value);
  fd.set("urls", document.getElementById("urls").value);

  fd.set("wantWord", String(document.getElementById("wantWord").checked));
  fd.set("wantPdf", String(document.getElementById("wantPdf").checked));
  fd.set("wantPpt", String(document.getElementById("wantPpt").checked));
  fd.set("useImages", String(document.getElementById("useImages").checked));

  const wt = document.getElementById("wordTemplate").files?.[0];
  const pt = document.getElementById("pptTemplate").files?.[0];
  if (wt) fd.set("wordTemplate", wt);
  if (pt) fd.set("pptTemplate", pt);

  setStatus("Génération…");
  const res = await fetch("/api/generate", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  document.getElementById("result").textContent = JSON.stringify(json, null, 2);
  setStatus("Terminé");
  await refreshOutputs();
}

window.addEventListener("DOMContentLoaded", () => {
  refreshOutputs().catch(() => {});
  document.getElementById("refresh").addEventListener("click", () => refreshOutputs().catch((e) => alert(e.message)));
  document.getElementById("generate").addEventListener("click", () => generate().catch((e) => (setStatus("Erreur"), alert(e.message))));
});

