const { URL } = require("url");

function allowedDomains() {
  const allow = (process.env.AGENT_ALLOWED_DOMAINS || "").trim();
  if (!allow) return null;
  return allow
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function isHttpUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function enforceAllowedDomains(u) {
  const allowed = allowedDomains();
  if (!allowed) return;
  const host = new URL(u).hostname.toLowerCase();
  const ok = allowed.some((d) => host === d || host.endsWith(`.${d}`));
  if (!ok) throw new Error(`Domaine non autorisé: ${host}`);
}

function stripHtmlToText(html) {
  if (typeof html !== "string") return "";
  let s = html;
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n\n");
  s = s.replace(/<\/h[1-6]>/gi, "\n\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/[ \t]{2,}/g, " ");
  return s.trim();
}

async function fetchUrlText(url, { timeoutMs = 15000, maxBytes = 900_000 } = {}) {
  if (!isHttpUrl(url)) throw new Error(`URL invalide: ${url}`);
  enforceAllowedDomains(url);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const isHtml = ct.includes("text/html");
    const isText = ct.startsWith("text/") || isHtml || ct.includes("json") || ct.includes("xml");
    if (!isText) throw new Error(`Content-Type non supporté: ${ct || "?"}`);

    const buf = await res.arrayBuffer();
    if (buf.byteLength > maxBytes) throw new Error(`Réponse trop grosse (> ${maxBytes} bytes)`);
    const text = new TextDecoder("utf-8").decode(buf);
    return { url, contentType: ct, text: isHtml ? stripHtmlToText(text) : text.trim() };
  } finally {
    clearTimeout(t);
  }
}

async function fetchMany(urls, { perUrlTimeoutMs = 15000 } = {}) {
  const out = [];
  for (const url of urls || []) {
    try {
      out.push(await fetchUrlText(url, { timeoutMs: perUrlTimeoutMs }));
    } catch (e) {
      out.push({ url, contentType: "error", text: `(Impossible de récupérer la source: ${e?.message || String(e)})` });
    }
  }
  return out;
}

module.exports = { fetchUrlText, fetchMany, stripHtmlToText, isHttpUrl };

