const fs = require("fs");
const path = require("path");

async function wikimediaSearch(query, { limit = 5, timeoutMs = 15000 } = {}) {
  const q = String(query || "").trim();
  if (!q) return [];
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", q);
  url.searchParams.set("gsrlimit", String(Math.max(1, Math.min(10, limit))));
  url.searchParams.set("gsrnamespace", "6"); // File:
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|size|extmetadata");
  url.searchParams.set("iiurlwidth", "900");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    const json = await res.json();
    const pages = json?.query?.pages || {};
    const out = [];
    for (const k of Object.keys(pages)) {
      const p = pages[k];
      const ii = Array.isArray(p?.imageinfo) ? p.imageinfo[0] : null;
      if (!ii?.thumburl && !ii?.url) continue;
      const meta = ii?.extmetadata || {};
      out.push({
        title: p?.title || "",
        pageId: p?.pageid,
        url: ii?.thumburl || ii?.url,
        mime: ii?.mime,
        width: ii?.thumbwidth || ii?.width,
        height: ii?.thumbheight || ii?.height,
        attribution: {
          license: meta?.LicenseShortName?.value || "",
          licenseUrl: meta?.LicenseUrl?.value || "",
          artist: meta?.Artist?.value || "",
          credit: meta?.Credit?.value || "",
          source: meta?.ImageDescription?.value || "",
        },
      });
    }
    return out;
  } finally {
    clearTimeout(t);
  }
}

async function downloadImage(url, destPath, { timeoutMs = 15000, maxBytes = 2_500_000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) throw new Error("Image trop grande");
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buf);
  } finally {
    clearTimeout(t);
  }
}

module.exports = { wikimediaSearch, downloadImage };

