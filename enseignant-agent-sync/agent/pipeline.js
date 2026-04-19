const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { fetchMany } = require("./web-fetch");
const { wikimediaSearch, downloadImage } = require("./wikimedia");
const { generateCoursePlan } = require("./lesson-planner");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function runPowerShell(scriptPath, args, cwd) {
  const pwsh = process.env.PWSH_PATH || "pwsh";
  const res = spawnSync(pwsh, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...args], {
    cwd,
    encoding: "utf8",
  });
  return { code: res.status ?? 1, stdout: res.stdout || "", stderr: res.stderr || "" };
}

function safeBaseName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || `cours-${Date.now()}`;
}

async function buildCourse({
  level,
  language,
  subject,
  topic,
  durationMin,
  methodology,
  urls,
  wantWord,
  wantPdf,
  wantPpt,
  wordTemplatePath,
  pptTemplatePath,
  useImages,
  workDir,
  outDir,
}) {
  ensureDir(workDir);
  ensureDir(outDir);

  const sources = urls?.length ? await fetchMany(urls) : [];
  const course = await generateCoursePlan({
    level,
    language,
    subject,
    topic,
    durationMin,
    methodology,
    sources,
  });

  const coursePath = path.join(workDir, "course.json");
  fs.writeFileSync(coursePath, JSON.stringify(course, null, 2), "utf8");

  // Optional image: pick first idea, search Wikimedia, download first result.
  let imageMeta = null;
  let imagePath = "";
  if (useImages && Array.isArray(course.imageIdeas) && course.imageIdeas.length) {
    const q = course.imageIdeas[0]?.query;
    if (q) {
      const results = await wikimediaSearch(q, { limit: 5 });
      const first = results[0];
      if (first?.url) {
        imagePath = path.join(workDir, "image-1.jpg");
        await downloadImage(first.url, imagePath);
        imageMeta = first;
      }
    }
  }

  const ps = path.join(__dirname, "office.ps1");
  const base = safeBaseName(`${subject}-${topic}-${level}-${language}`);
  const outputs = [];
  const logs = [];

  if (wantWord || wantPdf) {
    const outDocx = path.join(outDir, `${base}.docx`);
    const args = [
      "-Mode",
      "word",
      "-CourseJsonPath",
      coursePath,
      "-OutFile",
      outDocx,
      "-TemplatePath",
      wordTemplatePath || "",
      "-ImagePath",
      imagePath || "",
      ...(wantPdf ? ["-ExportPdf"] : []),
    ];
    const r = runPowerShell(ps, args, outDir);
    logs.push({ step: "word", ...r });
    outputs.push(outDocx);
    if (wantPdf) outputs.push(outDocx.replace(/\.docx$/i, ".pdf"));
  }

  if (wantPpt) {
    const outPptx = path.join(outDir, `${base}.pptx`);
    const args = [
      "-Mode",
      "ppt",
      "-CourseJsonPath",
      coursePath,
      "-OutFile",
      outPptx,
      "-TemplatePath",
      pptTemplatePath || "",
      "-ImagePath",
      imagePath || "",
      ...(wantPdf ? ["-ExportPdf"] : []),
    ];
    const r = runPowerShell(ps, args, outDir);
    logs.push({ step: "ppt", ...r });
    outputs.push(outPptx);
    if (wantPdf) outputs.push(outPptx.replace(/\.pptx$/i, ".pdf"));
  }

  return {
    course,
    coursePath,
    imageMeta,
    outputs,
    logs,
  };
}

module.exports = { buildCourse };

