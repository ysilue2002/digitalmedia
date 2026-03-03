const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { Pool } = require("pg");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ADMIN_PSEUDO = (process.env.ADMIN_PSEUDO || "admin").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMeNow_123!";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "dev-insecure-secret-change-me";
const SESSION_COOKIE = "qday_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(__dirname, "data", "store.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const AUDIT_LOG_PATH = path.join(DATA_DIR, "audit.log");
const APP_LOG_PATH = path.join(DATA_DIR, "app.log");
const TRAFFIC_STATS_PATH = path.join(DATA_DIR, "traffic-stats.json");
const AUDIT_MAX_BYTES = Number(process.env.AUDIT_MAX_BYTES || 2 * 1024 * 1024);
const APP_LOG_MAX_BYTES = Number(process.env.APP_LOG_MAX_BYTES || 4 * 1024 * 1024);
const AUDIT_MAX_FILES = Number(process.env.AUDIT_MAX_FILES || 5);
const UPLOAD_ORPHAN_TTL_MS = Number(process.env.UPLOAD_ORPHAN_TTL_MS || 24 * 60 * 60 * 1000);
const UPLOAD_ABSOLUTE_TTL_MS = Number(process.env.UPLOAD_ABSOLUTE_TTL_MS || 90 * 24 * 60 * 60 * 1000);
const ERROR_ALERT_THRESHOLD_PER_MIN = Number(process.env.ERROR_ALERT_THRESHOLD_PER_MIN || 20);
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";
const USE_REMOTE_DB = Boolean(DATABASE_URL) && process.env.NODE_ENV !== "test";
const typingState = new Map();
let appErrorCounter = 0;
const runtimeUniqueVisitors = new Set();
const runtimeUniqueVisitorsByGeo = new Map();
const runtimeAdminUniqueVisitors = new Set();
const runtimeAdminUniqueVisitorsByGeo = new Map();
const runtimeQdayUniqueVisitors = new Set();
const runtimeQdayUniqueVisitorsByGeo = new Map();
const activeAdminSockets = new Set();
const activeQdaySockets = new Set();

const MAX_TEXT = 500;
const MAX_SHORT_TEXT = 80;
const DEFAULT_LANG = "fr";
const SUPPORTED_LANGS = ["fr", "en", "es", "ar"];
const AD_SLOTS = new Set([
  "login-main",
  "live-top",
  "live-bottom-left",
  "live-bottom-right",
  "history-left-top",
  "history-right-bottom",
]);
const ALLOWED_UPLOAD_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".pdf",
  ".txt",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
]);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'"],
        "img-src": ["'self'", "data:", "blob:"],
        "media-src": ["'self'", "blob:"],
        "connect-src": ["'self'", "ws:", "wss:"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
      },
    },
  })
);

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  trackHttpTraffic(req);
  res.on("finish", () => {
    const elapsedMs = Date.now() - start;
    if (req.path.startsWith("/socket.io")) return;
    writeAppLog("INFO", "http.request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: elapsedMs,
      ip: getReqIp(req),
    });
  });
  next();
});

app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    index: false,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  })
);
app.use(express.static(PUBLIC_DIR));

function parseCookies(rawCookie) {
  const cookieHeader = typeof rawCookie === "string" ? rawCookie : "";
  const cookies = {};
  cookieHeader.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx <= 0) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function getReqIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim().slice(0, 80);
  }
  return String(req.socket?.remoteAddress || "").slice(0, 80);
}

function getSocketIp(socket) {
  const forwarded = socket.handshake?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim().slice(0, 80);
  }
  return String(socket.handshake?.address || "").slice(0, 80);
}

function sanitizeAuditDetails(value) {
  if (value == null) return value;
  if (typeof value === "string") return value.slice(0, 240);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitizeAuditDetails(v));
  if (typeof value === "object") {
    const out = {};
    Object.keys(value)
      .slice(0, 30)
      .forEach((k) => {
        out[k.slice(0, 60)] = sanitizeAuditDetails(value[k]);
      });
    return out;
  }
  return String(value).slice(0, 240);
}

function rotateAuditLogsIfNeeded() {
  if (!fs.existsSync(AUDIT_LOG_PATH)) return;
  const size = fs.statSync(AUDIT_LOG_PATH).size;
  if (!Number.isFinite(size) || size < AUDIT_MAX_BYTES) return;

  for (let i = AUDIT_MAX_FILES - 1; i >= 1; i -= 1) {
    const src = `${AUDIT_LOG_PATH}.${i}`;
    const dst = `${AUDIT_LOG_PATH}.${i + 1}`;
    if (fs.existsSync(src)) {
      try {
        if (i + 1 > AUDIT_MAX_FILES) fs.unlinkSync(src);
        else fs.renameSync(src, dst);
      } catch {}
    }
  }
  try {
    fs.renameSync(AUDIT_LOG_PATH, `${AUDIT_LOG_PATH}.1`);
  } catch {}
}

function writeAudit(event, details = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event: sanitizeShortText(event).slice(0, 120),
    details: sanitizeAuditDetails(details),
  });
  try {
    rotateAuditLogsIfNeeded();
    fs.appendFileSync(AUDIT_LOG_PATH, `${line}\n`, "utf8");
  } catch {}
}

function hmac(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function timingSafeEqualStr(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function createAdminSessionToken() {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = hmac(encoded);
  return `${encoded}.${signature}`;
}

function verifyAdminSessionToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  const expectedSig = hmac(encoded);
  if (!timingSafeEqualStr(signature, expectedSig)) return false;

  try {
    const payloadRaw = Buffer.from(encoded, "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw);
    if (!payload || typeof payload.exp !== "number") return false;
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

function rotateAppLogsIfNeeded() {
  if (!fs.existsSync(APP_LOG_PATH)) return;
  const size = fs.statSync(APP_LOG_PATH).size;
  if (!Number.isFinite(size) || size < APP_LOG_MAX_BYTES) return;

  for (let i = AUDIT_MAX_FILES - 1; i >= 1; i -= 1) {
    const src = `${APP_LOG_PATH}.${i}`;
    const dst = `${APP_LOG_PATH}.${i + 1}`;
    if (fs.existsSync(src)) {
      try {
        if (i + 1 > AUDIT_MAX_FILES) fs.unlinkSync(src);
        else fs.renameSync(src, dst);
      } catch {}
    }
  }
  try {
    fs.renameSync(APP_LOG_PATH, `${APP_LOG_PATH}.1`);
  } catch {}
}

function writeAppLog(level, message, details = {}) {
  const safeLevel = sanitizeShortText(level).toUpperCase() || "INFO";
  const safeMessage = sanitizeText(message).slice(0, 240) || "event";
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level: safeLevel,
    msg: safeMessage,
    details: sanitizeAuditDetails(details),
  });
  try {
    rotateAppLogsIfNeeded();
    fs.appendFileSync(APP_LOG_PATH, `${line}\n`, "utf8");
  } catch {}
  if (safeLevel === "ERROR" || safeLevel === "WARN") {
    // Keep visibility in runtime logs for operational alerts.
    // eslint-disable-next-line no-console
    console.error(`[${safeLevel}] ${safeMessage}`);
  }
}

function setAdminCookie(res, token) {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearAdminCookie(res) {
  const secure = process.env.NODE_ENV === "production";
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function isAdminRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifyAdminSessionToken(cookies[SESSION_COOKIE]);
}

function isAdminSocket(socket) {
  const cookies = parseCookies(socket.handshake?.headers?.cookie || "");
  return verifyAdminSessionToken(cookies[SESSION_COOKIE]);
}

function sanitizeText(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_TEXT);
}

function sanitizeShortText(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_SHORT_TEXT);
}

function sanitizeLang(value) {
  const safe = sanitizeShortText(value).toLowerCase();
  return SUPPORTED_LANGS.includes(safe) ? safe : DEFAULT_LANG;
}

function normalizeQuestionTexts(input, legacyText = "") {
  const source = input && typeof input === "object" ? input : {};
  const fallback = sanitizeText(legacyText);
  const out = {};
  SUPPORTED_LANGS.forEach((lang) => {
    const value = sanitizeText(source[lang]);
    out[lang] = value || fallback;
  });
  return out;
}

function questionTextForLang(question, lang = DEFAULT_LANG) {
  if (!question) return "";
  const texts = normalizeQuestionTexts(question.texts, question.text || "");
  const safeLang = sanitizeLang(lang);
  return texts[safeLang] || texts[DEFAULT_LANG] || "";
}

function normalizeISODate(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function parseStoreObject(parsed) {
  return {
    questions: Array.isArray(parsed?.questions) ? parsed.questions : [],
    ads: Array.isArray(parsed?.ads) ? parsed.ads : [],
    reports: Array.isArray(parsed?.reports) ? parsed.reports : [],
  };
}

function loadStoreFromDisk() {
  if (!fs.existsSync(STORE_PATH)) return { questions: [], ads: [], reports: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    return parseStoreObject(parsed);
  } catch {
    return { questions: [], ads: [], reports: [] };
  }
}

function blankTrafficStats() {
  return {
    updatedAt: new Date().toISOString(),
    totals: {
      requests: 0,
      pageViews: 0,
      apiCalls: 0,
      socketConnections: 0,
    },
    pageViewsByPath: {},
    geo: {},
    admin: {
      totals: {
        requests: 0,
        pageViews: 0,
        apiCalls: 0,
        socketConnections: 0,
      },
      pageViewsByPath: {},
      geo: {},
    },
    qday: {
      totals: {
        requests: 0,
        pageViews: 0,
        apiCalls: 0,
        socketConnections: 0,
      },
      pageViewsByPath: {},
      geo: {},
    },
  };
}

function parseTrafficStats(parsedRaw) {
  const parsed = parsedRaw || {};
  return {
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    totals: {
      requests: Number(parsed?.totals?.requests || 0),
      pageViews: Number(parsed?.totals?.pageViews || 0),
      apiCalls: Number(parsed?.totals?.apiCalls || 0),
      socketConnections: Number(parsed?.totals?.socketConnections || 0),
    },
    pageViewsByPath: typeof parsed?.pageViewsByPath === "object" && parsed.pageViewsByPath ? parsed.pageViewsByPath : {},
    geo: typeof parsed?.geo === "object" && parsed.geo ? parsed.geo : {},
    admin: {
      totals: {
        requests: Number(parsed?.admin?.totals?.requests || 0),
        pageViews: Number(parsed?.admin?.totals?.pageViews || 0),
        apiCalls: Number(parsed?.admin?.totals?.apiCalls || 0),
        socketConnections: Number(parsed?.admin?.totals?.socketConnections || 0),
      },
      pageViewsByPath:
        typeof parsed?.admin?.pageViewsByPath === "object" && parsed.admin.pageViewsByPath
          ? parsed.admin.pageViewsByPath
          : {},
      geo: typeof parsed?.admin?.geo === "object" && parsed.admin.geo ? parsed.admin.geo : {},
    },
    qday: {
      totals: {
        requests: Number(parsed?.qday?.totals?.requests || 0),
        pageViews: Number(parsed?.qday?.totals?.pageViews || 0),
        apiCalls: Number(parsed?.qday?.totals?.apiCalls || 0),
        socketConnections: Number(parsed?.qday?.totals?.socketConnections || 0),
      },
      pageViewsByPath:
        typeof parsed?.qday?.pageViewsByPath === "object" && parsed.qday.pageViewsByPath
          ? parsed.qday.pageViewsByPath
          : {},
      geo: typeof parsed?.qday?.geo === "object" && parsed.qday.geo ? parsed.qday.geo : {},
    },
  };
}

function loadTrafficStatsFromDisk() {
  if (!fs.existsSync(TRAFFIC_STATS_PATH)) return blankTrafficStats();
  try {
    const parsed = JSON.parse(fs.readFileSync(TRAFFIC_STATS_PATH, "utf8"));
    return parseTrafficStats(parsed);
  } catch {
    return blankTrafficStats();
  }
}

let dbPool = null;
let dbReady = false;
let dbStoreWriteInFlight = false;
let dbStoreWriteQueued = false;
let dbTrafficWriteInFlight = false;
let dbTrafficWriteQueued = false;
let storeCache = loadStoreFromDisk();
let trafficStats = loadTrafficStatsFromDisk();

function loadStore() {
  return storeCache;
}

function saveTrafficStatsToDisk(stats) {
  try {
    fs.writeFileSync(TRAFFIC_STATS_PATH, JSON.stringify(stats, null, 2), "utf8");
  } catch {}
}

function saveStoreToDisk(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function initRemoteDb() {
  if (!USE_REMOTE_DB) return;
  dbPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DB_SSL === "disable" ? false : { rejectUnauthorized: false },
  });
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS qday_state (
      key text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const storeRes = await dbPool.query("SELECT payload FROM qday_state WHERE key = $1 LIMIT 1", ["store"]);
  if (storeRes.rows[0]?.payload) {
    storeCache = parseStoreObject(storeRes.rows[0].payload);
  } else {
    await dbPool.query(
      "INSERT INTO qday_state (key, payload, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (key) DO NOTHING",
      ["store", JSON.stringify(storeCache)]
    );
  }

  const trafficRes = await dbPool.query("SELECT payload FROM qday_state WHERE key = $1 LIMIT 1", ["traffic"]);
  if (trafficRes.rows[0]?.payload) {
    trafficStats = parseTrafficStats(trafficRes.rows[0].payload);
  } else {
    await dbPool.query(
      "INSERT INTO qday_state (key, payload, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (key) DO NOTHING",
      ["traffic", JSON.stringify(trafficStats)]
    );
  }
  dbReady = true;
  writeAppLog("INFO", "db.remote.ready", { provider: "postgres", source: "supabase" });
}

async function persistStoreToDb() {
  if (!dbReady || !dbPool) return;
  if (dbStoreWriteInFlight) {
    dbStoreWriteQueued = true;
    return;
  }
  dbStoreWriteInFlight = true;
  try {
    await dbPool.query(
      "INSERT INTO qday_state (key, payload, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()",
      ["store", JSON.stringify(storeCache)]
    );
  } catch (err) {
    writeAppLog("ERROR", "db.store.persist_failed", { message: err?.message || "unknown" });
  } finally {
    dbStoreWriteInFlight = false;
    if (dbStoreWriteQueued) {
      dbStoreWriteQueued = false;
      setImmediate(() => {
        persistStoreToDb().catch(() => {});
      });
    }
  }
}

async function persistTrafficToDb() {
  if (!dbReady || !dbPool) return;
  if (dbTrafficWriteInFlight) {
    dbTrafficWriteQueued = true;
    return;
  }
  dbTrafficWriteInFlight = true;
  try {
    await dbPool.query(
      "INSERT INTO qday_state (key, payload, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()",
      ["traffic", JSON.stringify(trafficStats)]
    );
  } catch (err) {
    writeAppLog("ERROR", "db.traffic.persist_failed", { message: err?.message || "unknown" });
  } finally {
    dbTrafficWriteInFlight = false;
    if (dbTrafficWriteQueued) {
      dbTrafficWriteQueued = false;
      setImmediate(() => {
        persistTrafficToDb().catch(() => {});
      });
    }
  }
}

function saveTrafficStats(stats) {
  trafficStats = parseTrafficStats(stats);
  saveTrafficStatsToDisk(trafficStats);
  persistTrafficToDb().catch(() => {});
}

function inferGeoFromHeaders(headers) {
  const rawCountry =
    headers["x-vercel-ip-country"] ||
    headers["cf-ipcountry"] ||
    headers["x-country-code"] ||
    headers["x-appengine-country"] ||
    "";
  const rawRegion =
    headers["x-vercel-ip-country-region"] ||
    headers["x-region-code"] ||
    headers["cf-region"] ||
    headers["x-appengine-region"] ||
    "";

  const country = sanitizeShortText(String(rawCountry || "")).toUpperCase() || "UNK";
  const region = sanitizeShortText(String(rawRegion || "")).toUpperCase() || "UNK";
  return { country, region };
}

function geoKey(country, region) {
  return `${country}|${region}`;
}

function makeVisitorHash(ip) {
  return hmac(String(ip || "").slice(0, 120));
}

function ensureGeoBucket(country, region) {
  const key = geoKey(country, region);
  if (!trafficStats.geo[key]) {
    trafficStats.geo[key] = {
      country,
      region,
      requests: 0,
      pageViews: 0,
      apiCalls: 0,
      socketConnections: 0,
      uniqueVisitors: 0,
      lastSeen: new Date().toISOString(),
    };
  }
  return trafficStats.geo[key];
}

function ensureAdminGeoBucket(country, region) {
  const key = geoKey(country, region);
  if (!trafficStats.admin.geo[key]) {
    trafficStats.admin.geo[key] = {
      country,
      region,
      requests: 0,
      pageViews: 0,
      apiCalls: 0,
      socketConnections: 0,
      uniqueVisitors: 0,
      lastSeen: new Date().toISOString(),
    };
  }
  return trafficStats.admin.geo[key];
}

function ensureQdayGeoBucket(country, region) {
  const key = geoKey(country, region);
  if (!trafficStats.qday.geo[key]) {
    trafficStats.qday.geo[key] = {
      country,
      region,
      requests: 0,
      pageViews: 0,
      apiCalls: 0,
      socketConnections: 0,
      uniqueVisitors: 0,
      lastSeen: new Date().toISOString(),
    };
  }
  return trafficStats.qday.geo[key];
}

function recordUniqueVisitor(ip, country, region) {
  const hash = makeVisitorHash(ip);
  runtimeUniqueVisitors.add(hash);
  const key = geoKey(country, region);
  if (!runtimeUniqueVisitorsByGeo.has(key)) {
    runtimeUniqueVisitorsByGeo.set(key, new Set());
  }
  runtimeUniqueVisitorsByGeo.get(key).add(hash);

  const bucket = ensureGeoBucket(country, region);
  bucket.uniqueVisitors = runtimeUniqueVisitorsByGeo.get(key).size;
}

function recordAdminUniqueVisitor(ip, country, region) {
  const hash = makeVisitorHash(ip);
  runtimeAdminUniqueVisitors.add(hash);
  const key = geoKey(country, region);
  if (!runtimeAdminUniqueVisitorsByGeo.has(key)) {
    runtimeAdminUniqueVisitorsByGeo.set(key, new Set());
  }
  runtimeAdminUniqueVisitorsByGeo.get(key).add(hash);

  const bucket = ensureAdminGeoBucket(country, region);
  bucket.uniqueVisitors = runtimeAdminUniqueVisitorsByGeo.get(key).size;
}

function recordQdayUniqueVisitor(ip, country, region) {
  const hash = makeVisitorHash(ip);
  runtimeQdayUniqueVisitors.add(hash);
  const key = geoKey(country, region);
  if (!runtimeQdayUniqueVisitorsByGeo.has(key)) {
    runtimeQdayUniqueVisitorsByGeo.set(key, new Set());
  }
  runtimeQdayUniqueVisitorsByGeo.get(key).add(hash);

  const bucket = ensureQdayGeoBucket(country, region);
  bucket.uniqueVisitors = runtimeQdayUniqueVisitorsByGeo.get(key).size;
}

function trackHttpTraffic(req) {
  if (req.path.startsWith("/socket.io")) return;
  const ip = getReqIp(req);
  const { country, region } = inferGeoFromHeaders(req.headers);
  const bucket = ensureGeoBucket(country, region);
  const isApi = req.path.startsWith("/api/");
  const isAdminPath = req.path.startsWith("/admin") || req.path.startsWith("/api/admin/");
  const isPage = !isApi && (req.path === "/" || req.path.endsWith(".html"));
  const isAdminPage = !isApi && req.path.endsWith(".html") && req.path.startsWith("/admin");
  const isQdayApi = isApi && !req.path.startsWith("/api/admin/");
  const isQdayPage = isPage && !isAdminPage;
  const adminBucket = isAdminPath || isAdminPage ? ensureAdminGeoBucket(country, region) : null;
  const qdayBucket = isQdayApi || isQdayPage ? ensureQdayGeoBucket(country, region) : null;

  trafficStats.totals.requests += 1;
  bucket.requests += 1;
  if (adminBucket) {
    trafficStats.admin.totals.requests += 1;
    adminBucket.requests += 1;
  }
  if (qdayBucket) {
    trafficStats.qday.totals.requests += 1;
    qdayBucket.requests += 1;
  }
  if (isApi) {
    trafficStats.totals.apiCalls += 1;
    bucket.apiCalls += 1;
    if (req.path.startsWith("/api/admin/") && adminBucket) {
      trafficStats.admin.totals.apiCalls += 1;
      adminBucket.apiCalls += 1;
    }
    if (isQdayApi && qdayBucket) {
      trafficStats.qday.totals.apiCalls += 1;
      qdayBucket.apiCalls += 1;
    }
  }
  if (isPage) {
    trafficStats.totals.pageViews += 1;
    bucket.pageViews += 1;
    trafficStats.pageViewsByPath[req.path] = Number(trafficStats.pageViewsByPath[req.path] || 0) + 1;
    if (isAdminPage && adminBucket) {
      trafficStats.admin.totals.pageViews += 1;
      adminBucket.pageViews += 1;
      trafficStats.admin.pageViewsByPath[req.path] = Number(trafficStats.admin.pageViewsByPath[req.path] || 0) + 1;
    }
    if (isQdayPage && qdayBucket) {
      trafficStats.qday.totals.pageViews += 1;
      qdayBucket.pageViews += 1;
      trafficStats.qday.pageViewsByPath[req.path] = Number(trafficStats.qday.pageViewsByPath[req.path] || 0) + 1;
    }
  }
  bucket.lastSeen = new Date().toISOString();
  if (adminBucket) adminBucket.lastSeen = new Date().toISOString();
  if (qdayBucket) qdayBucket.lastSeen = new Date().toISOString();
  trafficStats.updatedAt = new Date().toISOString();
  recordUniqueVisitor(ip, country, region);
  if (adminBucket) recordAdminUniqueVisitor(ip, country, region);
  if (qdayBucket) recordQdayUniqueVisitor(ip, country, region);
}

function trackSocketConnection(socket, isAdmin) {
  const ip = getSocketIp(socket);
  const { country, region } = inferGeoFromHeaders(socket.handshake?.headers || {});
  const bucket = ensureGeoBucket(country, region);
  const adminBucket = isAdmin ? ensureAdminGeoBucket(country, region) : null;
  const qdayBucket = !isAdmin ? ensureQdayGeoBucket(country, region) : null;
  trafficStats.totals.socketConnections += 1;
  bucket.socketConnections += 1;
  if (adminBucket) {
    trafficStats.admin.totals.socketConnections += 1;
    adminBucket.socketConnections += 1;
  }
  if (qdayBucket) {
    trafficStats.qday.totals.socketConnections += 1;
    qdayBucket.socketConnections += 1;
  }
  bucket.lastSeen = new Date().toISOString();
  if (adminBucket) adminBucket.lastSeen = new Date().toISOString();
  if (qdayBucket) qdayBucket.lastSeen = new Date().toISOString();
  trafficStats.updatedAt = new Date().toISOString();
  recordUniqueVisitor(ip, country, region);
  if (adminBucket) recordAdminUniqueVisitor(ip, country, region);
  if (qdayBucket) recordQdayUniqueVisitor(ip, country, region);
}

function qdayTrafficSnapshot() {
  const geoRows = Object.values(trafficStats.qday.geo || {})
    .map((row) => ({ ...row }))
    .sort((a, b) => b.requests - a.requests);
  const topPages = Object.entries(trafficStats.qday.pageViewsByPath || {})
    .map(([path, views]) => ({ path, views: Number(views || 0) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);
  return {
    updatedAt: trafficStats.updatedAt,
    totals: {
      ...trafficStats.qday.totals,
      uniqueVisitorsApprox: runtimeQdayUniqueVisitors.size,
      activeSockets: activeQdaySockets.size,
    },
    topPages,
    geo: geoRows,
  };
}

function extractUploadFilenameFromUrl(url) {
  const safeUrl = typeof url === "string" ? url : "";
  if (!safeUrl.startsWith("/uploads/")) return null;
  return path.basename(safeUrl);
}

function getReferencedUploadSet(store) {
  const refs = new Set();
  (store.ads || []).forEach((ad) => {
    const filename = extractUploadFilenameFromUrl(ad?.asset?.url);
    if (filename) refs.add(filename);
  });
  return refs;
}

function saveStore(store) {
  storeCache = parseStoreObject(store);
  saveStoreToDisk(storeCache);
  persistStoreToDb().catch(() => {});
}

function getCurrentQuestion(store) {
  return store.questions.find((q) => q.active) || null;
}

function getQuestionById(store, questionId) {
  return store.questions.find((q) => q.id === questionId) || null;
}

function getAnswerById(question, answerId) {
  return (question?.answers || []).find((a) => a.id === answerId) || null;
}

function getCommentById(answer, commentId) {
  return (answer?.comments || []).find((c) => c.id === commentId) || null;
}

function publicQuestion(question) {
  const texts = normalizeQuestionTexts(question.texts, question.text || "");
  return {
    id: question.id,
    text: texts[DEFAULT_LANG],
    texts,
    createdAt: question.createdAt,
    active: question.active,
    answers: (question.answers || []).map((a) => ({
      id: a.id,
      text: a.text,
      author: a.author,
      lang: sanitizeLang(a.lang),
      createdAt: a.createdAt,
      comments: (a.comments || []).map((c) => ({
        id: c.id,
        text: c.text,
        author: c.author,
        lang: sanitizeLang(c.lang),
        createdAt: c.createdAt,
      })),
    })),
  };
}

function publicAds(store) {
  return (store.ads || []).map((ad) => ({
    id: ad.id,
    slot: ad.slot,
    label: ad.label,
    title: ad.title,
    copy: ad.copy,
    asset: ad.asset || null,
    startsAt: ad.startsAt || ad.createdAt,
    endsAt: ad.endsAt || null,
    createdAt: ad.createdAt,
    updatedAt: ad.updatedAt || ad.createdAt,
  }));
}

function buildReportContext(store, report) {
  const question = getQuestionById(store, report.questionId);
  if (!question) return { targetExists: false };
  const answer = report.answerId ? getAnswerById(question, report.answerId) : null;
  const comment = report.commentId && answer ? getCommentById(answer, report.commentId) : null;
  return {
    targetExists: Boolean(question && (!report.answerId || answer) && (!report.commentId || comment)),
    questionText: questionTextForLang(question, "fr"),
    answerText: answer ? sanitizeText(answer.text) : null,
    commentText: comment ? sanitizeText(comment.text) : null,
  };
}

function publicReports(store) {
  return (store.reports || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((r) => ({
      id: r.id,
      questionId: r.questionId,
      answerId: r.answerId || null,
      commentId: r.commentId || null,
      reason: r.reason,
      details: r.details || "",
      author: r.author,
      status: r.status || "open",
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt || null,
      reviewedBy: r.reviewedBy || null,
      context: buildReportContext(store, r),
    }));
}

function isAdExpired(ad, now = Date.now()) {
  if (!ad || !ad.endsAt) return false;
  const end = new Date(ad.endsAt).getTime();
  if (!Number.isFinite(end)) return false;
  return end <= now;
}

function deleteAssetFile(asset) {
  if (!asset || typeof asset.url !== "string") return;
  if (!asset.url.startsWith("/uploads/")) return;
  const filename = path.basename(asset.url);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return;
  try {
    fs.unlinkSync(filePath);
  } catch {}
}

function cleanupOrphanUploads(store) {
  const refs = getReferencedUploadSet(store);
  let removed = 0;
  const now = Date.now();
  if (!fs.existsSync(UPLOADS_DIR)) return removed;
  const entries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });
  entries.forEach((entry) => {
    if (!entry.isFile()) return;
    const name = entry.name;
    const filePath = path.join(UPLOADS_DIR, name);
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch {
      return;
    }
    const age = now - stats.mtimeMs;
    const isReferenced = refs.has(name);
    const shouldDelete = !isReferenced && (age >= UPLOAD_ORPHAN_TTL_MS || age >= UPLOAD_ABSOLUTE_TTL_MS);
    if (!shouldDelete) return;
    try {
      fs.unlinkSync(filePath);
      removed += 1;
    } catch {}
  });
  return removed;
}

function cleanupExpiredAds(store) {
  const ads = Array.isArray(store.ads) ? store.ads : [];
  const now = Date.now();
  const expired = ads.filter((ad) => isAdExpired(ad, now));
  if (!expired.length) return false;
  expired.forEach((ad) => deleteAssetFile(ad.asset));
  store.ads = ads.filter((ad) => !isAdExpired(ad, now));
  return true;
}

function activateDueScheduledQuestion(store) {
  const now = Date.now();
  const due = (store.questions || [])
    .filter((q) => !q.active && q.activateAt && new Date(q.activateAt).getTime() <= now)
    .sort((a, b) => new Date(a.activateAt).getTime() - new Date(b.activateAt).getTime());
  if (!due.length) return false;
  const target = due[due.length - 1];
  (store.questions || []).forEach((q) => {
    q.active = q.id === target.id;
  });
  return true;
}

function broadcastState(store) {
  const current = getCurrentQuestion(store);
  io.emit("current:updated", current ? publicQuestion(current) : null);
  const history = store.questions
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((q) => ({
      id: q.id,
      text: questionTextForLang(q, DEFAULT_LANG),
      texts: normalizeQuestionTexts(q.texts, q.text || ""),
      createdAt: q.createdAt,
      active: q.active,
      answersCount: (q.answers || []).length,
    }));
  io.emit("history:list", history);
  io.emit("ads:list", publicAds(store));
}

function eventLimiter(socket) {
  const buckets = new Map();
  return (key, limit, windowMs) => {
    const now = Date.now();
    const hit = buckets.get(key) || { count: 0, start: now };
    if (now - hit.start > windowMs) {
      hit.count = 0;
      hit.start = now;
    }
    hit.count += 1;
    buckets.set(key, hit);
    if (hit.count > limit) {
      socket.emit("action:error", "Trop de requetes. Reessaie dans quelques secondes.");
      return false;
    }
    return true;
  };
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase().slice(0, 12);
    cb(null, `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const ok = ALLOWED_UPLOAD_MIME.has(file.mimetype || "") && ALLOWED_EXTENSIONS.has(ext);
    if (!ok) return cb(new Error("Type de fichier non autorise."));
    cb(null, true);
  },
});

app.post("/api/admin/login", authLimiter, (req, res) => {
  const pseudo = sanitizeShortText(req.body?.pseudo).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const pseudoOk = timingSafeEqualStr(pseudo, ADMIN_PSEUDO);
  const pwdOk = timingSafeEqualStr(password, ADMIN_PASSWORD);
  if (!pseudoOk || !pwdOk) {
    writeAudit("admin.login.failed", { pseudo, ip: getReqIp(req) });
    clearAdminCookie(res);
    return res.status(401).json({ error: "Identifiants admin invalides." });
  }
  const token = createAdminSessionToken();
  setAdminCookie(res, token);
  writeAudit("admin.login.success", { pseudo, ip: getReqIp(req) });
  return res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  writeAudit("admin.logout", { wasAdmin: isAdminRequest(req), ip: getReqIp(req) });
  clearAdminCookie(res);
  return res.json({ ok: true });
});

app.get("/api/admin/status", (req, res) => {
  return res.json({ isAdmin: isAdminRequest(req) });
});

app.get("/api/admin/reports", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });
  const store = loadStore();
  return res.json(publicReports(store));
});

app.get("/api/admin/stats", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });
  return res.json(qdayTrafficSnapshot());
});

app.get("/api/admin/questions", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });
  const store = loadStore();
  const questions = store.questions
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((q) => ({
      id: q.id,
      text: questionTextForLang(q, DEFAULT_LANG),
      texts: normalizeQuestionTexts(q.texts, q.text || ""),
      createdAt: q.createdAt,
      activateAt: q.activateAt || null,
      active: Boolean(q.active),
      answersCount: (q.answers || []).length,
      commentsCount: (q.answers || []).reduce((sum, a) => sum + ((a.comments || []).length || 0), 0),
    }));
  return res.json(questions);
});

app.post("/api/admin/questions", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });
  const rawTexts = req.body?.texts && typeof req.body.texts === "object" ? req.body.texts : null;
  const texts = normalizeQuestionTexts(rawTexts);
  const safeActivateAt = normalizeISODate(req.body?.activateAt);
  if (req.body?.activateAt && !safeActivateAt) {
    return res.status(400).json({ error: "Date de programmation invalide." });
  }
  const missing = SUPPORTED_LANGS.find((lang) => !texts[lang]);
  if (missing) {
    return res.status(400).json({ error: "Chaque question doit etre renseignee en francais, anglais, espagnol et arabe." });
  }
  const store = loadStore();
  const now = Date.now();
  const isFutureSchedule = safeActivateAt && new Date(safeActivateAt).getTime() > now;
  if (!isFutureSchedule) {
    store.questions.forEach((q) => {
      q.active = false;
    });
  }
  const question = {
    id: makeId("q"),
    text: texts[DEFAULT_LANG],
    texts,
    createdAt: new Date().toISOString(),
    activateAt: safeActivateAt || null,
    active: !isFutureSchedule,
    answers: [],
  };
  store.questions.push(question);
  saveStore(store);
  writeAudit("admin.question_add.success", {
    ip: getReqIp(req),
    textFr: texts.fr,
    activateAt: safeActivateAt || "immediate",
  });
  broadcastState(store);
  return res.json({ ok: true, question: publicQuestion(question) });
});

app.post("/api/admin/questions/:id/activate", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });
  const safeId = sanitizeShortText(req.params.id).slice(0, 120);
  const store = loadStore();
  const target = getQuestionById(store, safeId);
  if (!target) return res.status(404).json({ error: "Question introuvable." });
  store.questions.forEach((q) => {
    q.active = q.id === safeId;
  });
  saveStore(store);
  writeAudit("admin.question_activate.success", { ip: getReqIp(req), questionId: safeId });
  broadcastState(store);
  return res.json({ ok: true });
});

app.delete("/api/admin/questions/:id", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });
  const safeId = sanitizeShortText(req.params.id).slice(0, 120);
  const store = loadStore();
  const before = store.questions.length;
  store.questions = store.questions.filter((q) => q.id !== safeId);
  if (store.questions.length === before) return res.status(404).json({ error: "Question introuvable." });
  if (!store.questions.some((q) => q.active) && store.questions.length > 0) {
    store.questions[0].active = true;
  }
  saveStore(store);
  writeAudit("admin.question_delete.success", { ip: getReqIp(req), questionId: safeId });
  broadcastState(store);
  return res.json({ ok: true });
});

app.get("/api/admin/ads", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });
  const store = loadStore();
  return res.json(publicAds(store));
});

app.post("/api/admin/ads", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });

  const safeSlot = sanitizeShortText(req.body?.slot);
  if (!AD_SLOTS.has(safeSlot)) {
    return res.status(400).json({ error: "Emplacement publicitaire invalide." });
  }
  const safeLabel = sanitizeShortText(req.body?.label) || "Publicite";
  const safeTitle = sanitizeShortText(req.body?.title);
  const safeCopy = sanitizeText(req.body?.copy);
  const safeStartsAt = normalizeISODate(req.body?.startsAt) || new Date().toISOString();
  const safeEndsAt = normalizeISODate(req.body?.endsAt);
  if (!safeTitle || !safeCopy || !safeEndsAt) {
    return res.status(400).json({ error: "Champs pub invalides." });
  }
  if (new Date(safeEndsAt).getTime() <= new Date(safeStartsAt).getTime()) {
    return res.status(400).json({ error: "La date de fin doit etre apres la date de debut." });
  }

  let safeAsset = null;
  const asset = req.body?.asset;
  if (asset && typeof asset === "object") {
    const url = sanitizeText(asset.url).slice(0, 300);
    const name = sanitizeShortText(asset.name);
    const mime = sanitizeShortText(asset.mime).slice(0, 100);
    const kind = sanitizeShortText(asset.kind);
    const size = Number.isFinite(Number(asset.size)) ? Number(asset.size) : 0;
    if (url.startsWith("/uploads/")) {
      safeAsset = {
        url,
        name: name || "fichier",
        mime: mime || "application/octet-stream",
        kind: ["image", "video", "pdf", "file"].includes(kind) ? kind : "file",
        size: size > 0 ? size : 0,
      };
    }
  }

  const store = loadStore();
  store.ads = store.ads || [];
  cleanupExpiredAds(store);

  const existing = store.ads.find((ad) => ad.slot === safeSlot);
  if (existing) {
    if (existing.asset && safeAsset && existing.asset.url !== safeAsset.url) {
      deleteAssetFile(existing.asset);
    }
    existing.label = safeLabel;
    existing.title = safeTitle;
    existing.copy = safeCopy;
    existing.asset = safeAsset;
    existing.startsAt = safeStartsAt;
    existing.endsAt = safeEndsAt;
    existing.updatedAt = new Date().toISOString();
  } else {
    store.ads.push({
      id: makeId("ad"),
      slot: safeSlot,
      label: safeLabel,
      title: safeTitle,
      copy: safeCopy,
      asset: safeAsset,
      startsAt: safeStartsAt,
      endsAt: safeEndsAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveStore(store);
  writeAudit("admin.ad_add.success", {
    ip: getReqIp(req),
    slot: safeSlot,
    title: safeTitle,
    hasAsset: Boolean(safeAsset),
    startsAt: safeStartsAt,
    endsAt: safeEndsAt,
  });
  io.emit("ads:list", publicAds(store));
  return res.json({ ok: true });
});

app.delete("/api/admin/ads/:id", (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Acces admin requis." });
  const safeId = sanitizeShortText(req.params.id).slice(0, 120);
  const store = loadStore();
  const found = (store.ads || []).find((ad) => ad.id === safeId);
  if (!found) return res.status(404).json({ error: "Publicite introuvable." });
  store.ads = (store.ads || []).filter((ad) => ad.id !== safeId);
  deleteAssetFile(found.asset);
  saveStore(store);
  writeAudit("admin.ad_delete.success", { ip: getReqIp(req), adId: safeId, slot: found.slot });
  io.emit("ads:list", publicAds(store));
  return res.json({ ok: true });
});

app.get("/api/health", (_req, res) => {
  return res.json({
    ok: true,
    now: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
  });
});

app.get("/api/history", (_req, res) => {
  const store = loadStore();
  if (cleanupExpiredAds(store)) saveStore(store);
  const history = store.questions
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((q) => ({
      id: q.id,
      text: questionTextForLang(q, DEFAULT_LANG),
      texts: normalizeQuestionTexts(q.texts, q.text || ""),
      createdAt: q.createdAt,
      active: q.active,
      answersCount: (q.answers || []).length,
    }));
  res.json(history);
});

app.get("/api/questions/:id", (req, res) => {
  const store = loadStore();
  if (cleanupExpiredAds(store)) saveStore(store);
  const question = getQuestionById(store, req.params.id);
  if (!question) return res.status(404).json({ error: "Question introuvable." });
  return res.json(publicQuestion(question));
});

app.get("/api/ads", (_req, res) => {
  const store = loadStore();
  if (cleanupExpiredAds(store)) saveStore(store);
  return res.json(publicAds(store));
});

app.post("/api/admin/upload-ad-asset", uploadLimiter, (req, res, next) => {
  if (!isAdminRequest(req)) {
    writeAudit("admin.upload.denied", { ip: getReqIp(req) });
    return res.status(403).json({ error: "Acces admin requis." });
  }
  upload.single("asset")(req, res, next);
});

app.post("/api/admin/upload-ad-asset", (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier recu." });
  const mime = req.file.mimetype || "application/octet-stream";
  const asset = {
    url: `/uploads/${req.file.filename}`,
    name: sanitizeShortText(req.file.originalname || req.file.filename),
    mime,
    kind: mime.startsWith("image/")
      ? "image"
      : mime.startsWith("video/")
      ? "video"
      : mime === "application/pdf"
      ? "pdf"
      : "file",
    size: req.file.size || 0,
  };
  writeAudit("admin.upload.success", {
    ip: getReqIp(req),
    file: asset.name,
    mime: asset.mime,
    size: asset.size,
  });
  return res.json(asset);
});

app.use((err, _req, res, _next) => {
  appErrorCounter += 1;
  writeAppLog("ERROR", "http.error", { message: err?.message || "unknown" });
  if (err instanceof multer.MulterError || err?.message) {
    return res.status(400).json({ error: sanitizeText(err.message || "Requete invalide.") });
  }
  return res.status(500).json({ error: "Erreur serveur." });
});

io.on("connection", (socket) => {
  const allow = eventLimiter(socket);
  const socketIp = getSocketIp(socket);
  const isAdminConn = isAdminSocket(socket);
  if (isAdminConn) activeAdminSockets.add(socket.id);
  else activeQdaySockets.add(socket.id);
  trackSocketConnection(socket, isAdminConn);

  function typingKey(payload) {
    const questionId = sanitizeShortText(payload?.questionId).slice(0, 120);
    const answerId = sanitizeShortText(payload?.answerId).slice(0, 120);
    const target = sanitizeShortText(payload?.target) || "answer";
    return `${socket.id}:${questionId}:${answerId}:${target}`;
  }

  function emitTyping(payload, isTyping) {
    const safeAuthor = sanitizeShortText(payload?.author).slice(0, 40);
    const safeQuestionId = sanitizeShortText(payload?.questionId).slice(0, 120);
    const safeAnswerId = sanitizeShortText(payload?.answerId).slice(0, 120) || null;
    const safeTarget = sanitizeShortText(payload?.target) === "comment" ? "comment" : "answer";
    if (!safeAuthor || !safeQuestionId) return;
    socket.broadcast.emit("typing:update", {
      questionId: safeQuestionId,
      answerId: safeAnswerId,
      author: safeAuthor,
      target: safeTarget,
      isTyping: Boolean(isTyping),
    });
  }

  const store = loadStore();
  if (cleanupExpiredAds(store)) saveStore(store);
  socket.emit("current:updated", getCurrentQuestion(store) ? publicQuestion(getCurrentQuestion(store)) : null);
  socket.emit(
    "history:list",
    store.questions
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((q) => ({
        id: q.id,
        text: questionTextForLang(q, DEFAULT_LANG),
        texts: normalizeQuestionTexts(q.texts, q.text || ""),
        createdAt: q.createdAt,
        active: q.active,
        answersCount: (q.answers || []).length,
      }))
  );
  socket.emit("ads:list", publicAds(store));
  if (isAdminConn) {
    socket.emit("report:list", publicReports(store));
  }

  socket.on("question:add", ({ texts: payloadTexts, activateAt }) => {
    if (!allow("question:add", 20, 60_000)) return;
    if (!isAdminSocket(socket)) {
      writeAudit("admin.question_add.denied", { ip: socketIp });
      socket.emit("action:error", "Acces admin requis.");
      return;
    }
    const texts = normalizeQuestionTexts(payloadTexts);
    const safeActivateAt = normalizeISODate(activateAt);
    if (activateAt && !safeActivateAt) {
      socket.emit("action:error", "Date de programmation invalide.");
      return;
    }
    const missing = SUPPORTED_LANGS.find((lang) => !texts[lang]);
    if (missing) {
      socket.emit("action:error", "Chaque question doit etre renseignee en francais, anglais, espagnol et arabe.");
      return;
    }

    const currentStore = loadStore();
    const now = Date.now();
    const isFutureSchedule = safeActivateAt && new Date(safeActivateAt).getTime() > now;
    if (!isFutureSchedule) {
      currentStore.questions.forEach((q) => {
        q.active = false;
      });
    }
    currentStore.questions.push({
      id: makeId("q"),
      text: texts[DEFAULT_LANG],
      texts,
      createdAt: new Date().toISOString(),
      activateAt: safeActivateAt || null,
      active: !isFutureSchedule,
      answers: [],
    });
    saveStore(currentStore);
    writeAudit("admin.question_add.success", {
      ip: socketIp,
      textFr: texts.fr,
      activateAt: safeActivateAt || "immediate",
    });
    broadcastState(currentStore);
  });

  socket.on("answer:add", ({ questionId, text, author, lang }) => {
    if (!allow("answer:add", 60, 60_000)) return;
    const safeText = sanitizeText(text);
    const safeAuthor = sanitizeText(author).slice(0, 40);
    const safeLang = sanitizeLang(lang);
    if (!safeText || !safeAuthor) return;
    const isRealAdmin = isAdminSocket(socket);
    if (isRealAdmin || safeAuthor.toLowerCase() === ADMIN_PSEUDO) {
      socket.emit("action:error", "L'administrateur ne peut pas repondre aux questions.");
      return;
    }

    const currentStore = loadStore();
    const question = getQuestionById(currentStore, sanitizeShortText(questionId).slice(0, 120));
    if (!question) {
      socket.emit("action:error", "Question introuvable.");
      return;
    }
    question.answers = question.answers || [];
    question.answers.push({
      id: makeId("a"),
      text: safeText,
      author: safeAuthor,
      lang: safeLang,
      createdAt: new Date().toISOString(),
      comments: [],
    });
    saveStore(currentStore);
    io.emit("question:updated", publicQuestion(question));
    broadcastState(currentStore);
  });

  socket.on("comment:add", ({ questionId, answerId, text, author, lang }) => {
    if (!allow("comment:add", 90, 60_000)) return;
    const safeText = sanitizeText(text);
    const safeAuthor = sanitizeText(author).slice(0, 40);
    const safeLang = sanitizeLang(lang);
    if (!safeText || !safeAuthor) return;

    const currentStore = loadStore();
    const question = getQuestionById(currentStore, sanitizeShortText(questionId).slice(0, 120));
    if (!question) {
      socket.emit("action:error", "Question introuvable.");
      return;
    }
    const answer = (question.answers || []).find((a) => a.id === sanitizeShortText(answerId).slice(0, 120));
    if (!answer) {
      socket.emit("action:error", "Reponse introuvable.");
      return;
    }
    answer.comments = answer.comments || [];
    answer.comments.push({
      id: makeId("c"),
      text: safeText,
      author: safeAuthor,
      lang: safeLang,
      createdAt: new Date().toISOString(),
    });
    saveStore(currentStore);
    io.emit("question:updated", publicQuestion(question));
    broadcastState(currentStore);
  });

  socket.on("report:add", ({ questionId, answerId, commentId, reason, details, author }) => {
    if (!allow("report:add", 80, 60_000)) return;
    const safeQuestionId = sanitizeShortText(questionId).slice(0, 120);
    const safeAnswerId = sanitizeShortText(answerId).slice(0, 120) || null;
    const safeCommentId = sanitizeShortText(commentId).slice(0, 120) || null;
    const safeReason = sanitizeShortText(reason) || "Contenu inapproprie";
    const safeDetails = sanitizeText(details || "");
    const safeAuthor = sanitizeShortText(author).slice(0, 40);
    if (!safeQuestionId || !safeAuthor) return;

    const currentStore = loadStore();
    const question = getQuestionById(currentStore, safeQuestionId);
    if (!question) {
      socket.emit("action:error", "Question introuvable.");
      return;
    }
    if (safeAnswerId) {
      const answer = getAnswerById(question, safeAnswerId);
      if (!answer) {
        socket.emit("action:error", "Reponse introuvable.");
        return;
      }
      if (safeCommentId && !getCommentById(answer, safeCommentId)) {
        socket.emit("action:error", "Commentaire introuvable.");
        return;
      }
    }

    currentStore.reports = currentStore.reports || [];
    currentStore.reports.push({
      id: makeId("rep"),
      questionId: safeQuestionId,
      answerId: safeAnswerId,
      commentId: safeCommentId,
      reason: safeReason,
      details: safeDetails,
      author: safeAuthor,
      status: "open",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    });
    saveStore(currentStore);
    writeAudit("report.add", {
      ip: socketIp,
      questionId: safeQuestionId,
      answerId: safeAnswerId,
      commentId: safeCommentId,
      reason: safeReason,
    });
    io.emit("report:created");
  });

  socket.on("report:list", () => {
    if (!allow("report:list", 120, 60_000)) return;
    if (!isAdminSocket(socket)) {
      socket.emit("action:error", "Acces admin requis.");
      return;
    }
    const currentStore = loadStore();
    socket.emit("report:list", publicReports(currentStore));
  });

  socket.on("report:status", ({ reportId, status }) => {
    if (!allow("report:status", 100, 60_000)) return;
    if (!isAdminSocket(socket)) {
      socket.emit("action:error", "Acces admin requis.");
      return;
    }
    const safeReportId = sanitizeShortText(reportId).slice(0, 120);
    const safeStatus = ["open", "resolved", "dismissed"].includes(status) ? status : null;
    if (!safeStatus) return;

    const currentStore = loadStore();
    currentStore.reports = currentStore.reports || [];
    const report = currentStore.reports.find((r) => r.id === safeReportId);
    if (!report) {
      socket.emit("action:error", "Signalement introuvable.");
      return;
    }
    report.status = safeStatus;
    report.reviewedAt = new Date().toISOString();
    report.reviewedBy = ADMIN_PSEUDO;
    saveStore(currentStore);
    writeAudit("admin.report.status", { ip: socketIp, reportId: safeReportId, status: safeStatus });
    io.emit("report:changed");
    socket.emit("report:list", publicReports(currentStore));
  });

  socket.on("question:get", (questionId) => {
    if (!allow("question:get", 120, 60_000)) return;
    const currentStore = loadStore();
    const question = getQuestionById(currentStore, sanitizeShortText(questionId).slice(0, 120));
    if (!question) {
      socket.emit("action:error", "Question introuvable.");
      return;
    }
    socket.emit("question:updated", publicQuestion(question));
  });

  socket.on("ad:add", ({ slot, label, title, copy, asset, startsAt, endsAt }) => {
    if (!allow("ad:add", 40, 60_000)) return;
    if (!isAdminSocket(socket)) {
      writeAudit("admin.ad_add.denied", { ip: socketIp, slot: sanitizeShortText(slot) });
      socket.emit("action:error", "Acces admin requis.");
      return;
    }

    const safeSlot = sanitizeShortText(slot);
    if (!AD_SLOTS.has(safeSlot)) {
      socket.emit("action:error", "Emplacement publicitaire invalide.");
      return;
    }
    const safeLabel = sanitizeShortText(label) || "Publicite";
    const safeTitle = sanitizeShortText(title);
    const safeCopy = sanitizeText(copy);
    const safeStartsAt = normalizeISODate(startsAt) || new Date().toISOString();
    const safeEndsAt = normalizeISODate(endsAt);
    if (!safeTitle || !safeCopy || !safeEndsAt) {
      socket.emit("action:error", "Champs pub invalides.");
      return;
    }
    if (new Date(safeEndsAt).getTime() <= new Date(safeStartsAt).getTime()) {
      socket.emit("action:error", "La date de fin doit etre apres la date de debut.");
      return;
    }

    let safeAsset = null;
    if (asset && typeof asset === "object") {
      const url = sanitizeText(asset.url).slice(0, 300);
      const name = sanitizeShortText(asset.name);
      const mime = sanitizeShortText(asset.mime).slice(0, 100);
      const kind = sanitizeShortText(asset.kind);
      const size = Number.isFinite(Number(asset.size)) ? Number(asset.size) : 0;
      if (url.startsWith("/uploads/")) {
        safeAsset = {
          url,
          name: name || "fichier",
          mime: mime || "application/octet-stream",
          kind: ["image", "video", "pdf", "file"].includes(kind) ? kind : "file",
          size: size > 0 ? size : 0,
        };
      }
    }

    const currentStore = loadStore();
    currentStore.ads = currentStore.ads || [];
    cleanupExpiredAds(currentStore);

    const existing = currentStore.ads.find((ad) => ad.slot === safeSlot);
    if (existing) {
      if (existing.asset && safeAsset && existing.asset.url !== safeAsset.url) deleteAssetFile(existing.asset);
      existing.label = safeLabel;
      existing.title = safeTitle;
      existing.copy = safeCopy;
      existing.asset = safeAsset;
      existing.startsAt = safeStartsAt;
      existing.endsAt = safeEndsAt;
      existing.updatedAt = new Date().toISOString();
    } else {
      currentStore.ads.push({
        id: makeId("ad"),
        slot: safeSlot,
        label: safeLabel,
        title: safeTitle,
        copy: safeCopy,
        asset: safeAsset,
        startsAt: safeStartsAt,
        endsAt: safeEndsAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    saveStore(currentStore);
    writeAudit("admin.ad_add.success", {
      ip: socketIp,
      slot: safeSlot,
      title: safeTitle,
      hasAsset: Boolean(safeAsset),
      startsAt: safeStartsAt,
      endsAt: safeEndsAt,
    });
    io.emit("ads:list", publicAds(currentStore));
  });

  socket.on("ad:delete", ({ adId }) => {
    if (!allow("ad:delete", 40, 60_000)) return;
    if (!isAdminSocket(socket)) {
      writeAudit("admin.ad_delete.denied", { ip: socketIp, adId: sanitizeShortText(adId) });
      socket.emit("action:error", "Acces admin requis.");
      return;
    }
    const safeAdId = sanitizeShortText(adId).slice(0, 120);
    const currentStore = loadStore();
    cleanupExpiredAds(currentStore);
    const found = (currentStore.ads || []).find((ad) => ad.id === safeAdId);
    currentStore.ads = (currentStore.ads || []).filter((ad) => ad.id !== safeAdId);
    if (!found) {
      socket.emit("action:error", "Publicite introuvable.");
      return;
    }
    deleteAssetFile(found.asset);
    saveStore(currentStore);
    writeAudit("admin.ad_delete.success", { ip: socketIp, adId: safeAdId, slot: found.slot });
    io.emit("ads:list", publicAds(currentStore));
  });

  socket.on("answer:delete", ({ questionId, answerId }) => {
    if (!allow("answer:delete", 50, 60_000)) return;
    if (!isAdminSocket(socket)) {
      socket.emit("action:error", "Acces admin requis.");
      return;
    }
    const safeQuestionId = sanitizeShortText(questionId).slice(0, 120);
    const safeAnswerId = sanitizeShortText(answerId).slice(0, 120);
    const currentStore = loadStore();
    const question = getQuestionById(currentStore, safeQuestionId);
    if (!question) {
      socket.emit("action:error", "Question introuvable.");
      return;
    }
    const before = (question.answers || []).length;
    question.answers = (question.answers || []).filter((a) => a.id !== safeAnswerId);
    if (question.answers.length === before) {
      socket.emit("action:error", "Reponse introuvable.");
      return;
    }
    (currentStore.reports || []).forEach((r) => {
      if (r.questionId === safeQuestionId && r.answerId === safeAnswerId && r.status === "open") {
        r.status = "resolved";
        r.reviewedAt = new Date().toISOString();
        r.reviewedBy = ADMIN_PSEUDO;
      }
    });
    saveStore(currentStore);
    writeAudit("admin.answer_delete.success", { ip: socketIp, questionId: safeQuestionId, answerId: safeAnswerId });
    io.emit("question:updated", publicQuestion(question));
    broadcastState(currentStore);
    io.emit("report:changed");
  });

  socket.on("comment:delete", ({ questionId, answerId, commentId }) => {
    if (!allow("comment:delete", 80, 60_000)) return;
    if (!isAdminSocket(socket)) {
      socket.emit("action:error", "Acces admin requis.");
      return;
    }
    const safeQuestionId = sanitizeShortText(questionId).slice(0, 120);
    const safeAnswerId = sanitizeShortText(answerId).slice(0, 120);
    const safeCommentId = sanitizeShortText(commentId).slice(0, 120);
    const currentStore = loadStore();
    const question = getQuestionById(currentStore, safeQuestionId);
    if (!question) {
      socket.emit("action:error", "Question introuvable.");
      return;
    }
    const answer = (question.answers || []).find((a) => a.id === safeAnswerId);
    if (!answer) {
      socket.emit("action:error", "Reponse introuvable.");
      return;
    }
    const before = (answer.comments || []).length;
    answer.comments = (answer.comments || []).filter((c) => c.id !== safeCommentId);
    if (answer.comments.length === before) {
      socket.emit("action:error", "Commentaire introuvable.");
      return;
    }
    (currentStore.reports || []).forEach((r) => {
      if (
        r.questionId === safeQuestionId &&
        r.answerId === safeAnswerId &&
        r.commentId === safeCommentId &&
        r.status === "open"
      ) {
        r.status = "resolved";
        r.reviewedAt = new Date().toISOString();
        r.reviewedBy = ADMIN_PSEUDO;
      }
    });
    saveStore(currentStore);
    writeAudit("admin.comment_delete.success", {
      ip: socketIp,
      questionId: safeQuestionId,
      answerId: safeAnswerId,
      commentId: safeCommentId,
    });
    io.emit("question:updated", publicQuestion(question));
    broadcastState(currentStore);
    io.emit("report:changed");
  });

  socket.on("report:take_action", ({ reportId, action }) => {
    if (!allow("report:take_action", 120, 60_000)) return;
    if (!isAdminSocket(socket)) {
      socket.emit("action:error", "Acces admin requis.");
      return;
    }
    const safeReportId = sanitizeShortText(reportId).slice(0, 120);
    const safeAction = sanitizeShortText(action);
    const currentStore = loadStore();
    currentStore.reports = currentStore.reports || [];
    const report = currentStore.reports.find((r) => r.id === safeReportId);
    if (!report) {
      socket.emit("action:error", "Signalement introuvable.");
      return;
    }

    const question = getQuestionById(currentStore, report.questionId);
    if (!question) {
      report.status = "dismissed";
      report.reviewedAt = new Date().toISOString();
      report.reviewedBy = ADMIN_PSEUDO;
      saveStore(currentStore);
      io.emit("report:changed");
      return;
    }

    if (safeAction === "delete_content") {
      if (report.commentId) {
        const answer = getAnswerById(question, report.answerId);
        if (answer) {
          answer.comments = (answer.comments || []).filter((c) => c.id !== report.commentId);
        }
      } else if (report.answerId) {
        question.answers = (question.answers || []).filter((a) => a.id !== report.answerId);
      }
      report.status = "resolved";
      report.reviewedAt = new Date().toISOString();
      report.reviewedBy = ADMIN_PSEUDO;
      saveStore(currentStore);
      writeAudit("admin.report.take_action", { ip: socketIp, reportId: safeReportId, action: safeAction });
      io.emit("question:updated", publicQuestion(question));
      broadcastState(currentStore);
      io.emit("report:changed");
      return;
    }

    socket.emit("action:error", "Action de moderation invalide.");
  });

  socket.on("typing:start", (payload) => {
    if (!allow("typing:start", 240, 60_000)) return;
    const key = typingKey(payload);
    typingState.set(key, Date.now());
    emitTyping(payload, true);
  });

  socket.on("typing:stop", (payload) => {
    if (!allow("typing:stop", 240, 60_000)) return;
    const key = typingKey(payload);
    typingState.delete(key);
    emitTyping(payload, false);
  });

  socket.on("disconnect", () => {
    const prefix = `${socket.id}:`;
    for (const [key] of typingState.entries()) {
      if (key.startsWith(prefix)) typingState.delete(key);
    }
    activeAdminSockets.delete(socket.id);
    activeQdaySockets.delete(socket.id);
  });
});

setInterval(() => {
  const store = loadStore();
  const expiredRemoved = cleanupExpiredAds(store);
  const scheduledActivated = activateDueScheduledQuestion(store);
  const orphanRemoved = cleanupOrphanUploads(store);
  if (expiredRemoved || scheduledActivated || orphanRemoved > 0) {
    saveStore(store);
    if (scheduledActivated) {
      broadcastState(store);
    } else {
      io.emit("ads:list", publicAds(store));
    }
    writeAudit("maintenance.cleanup", {
      expiredAdsRemoved: Boolean(expiredRemoved),
      scheduledQuestionActivated: Boolean(scheduledActivated),
      orphanUploadsRemoved: orphanRemoved,
    });
  }
}, 30_000);

setInterval(() => {
  saveTrafficStats(trafficStats);
}, 30_000);

setInterval(() => {
  // Remove stale typing indicators older than 12s.
  const now = Date.now();
  for (const [key, ts] of typingState.entries()) {
    if (now - ts > 12_000) typingState.delete(key);
  }
}, 5_000);

setInterval(() => {
  if (appErrorCounter >= ERROR_ALERT_THRESHOLD_PER_MIN) {
    writeAppLog("WARN", "error.alert.threshold_reached", {
      errorsLastMinute: appErrorCounter,
      threshold: ERROR_ALERT_THRESHOLD_PER_MIN,
    });
  }
  appErrorCounter = 0;
}, 60_000);

process.on("unhandledRejection", (reason) => {
  appErrorCounter += 1;
  writeAppLog("ERROR", "process.unhandledRejection", { reason: String(reason) });
});

process.on("uncaughtException", (err) => {
  appErrorCounter += 1;
  writeAppLog("ERROR", "process.uncaughtException", { message: err?.message || "unknown" });
});

async function startServer() {
  if (USE_REMOTE_DB) {
    try {
      await initRemoteDb();
    } catch (err) {
      writeAppLog("WARN", "db.remote.init_failed_using_disk_fallback", { message: err?.message || "unknown" });
    }
  }
  const bootStore = loadStore();
  if (activateDueScheduledQuestion(bootStore) || cleanupExpiredAds(bootStore)) {
    saveStore(bootStore);
  }
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    writeAppLog("INFO", "server.started", { port: PORT, useRemoteDb: dbReady });
    saveStore(storeCache);
    saveTrafficStats(trafficStats);
  });
}

startServer().catch((err) => {
  writeAppLog("ERROR", "server.start_failed", { message: err?.message || "unknown" });
  process.exit(1);
});
