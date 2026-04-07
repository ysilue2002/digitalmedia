(() => {
  const questionsEl = document.getElementById("dashboard-questions");
  const adsEl = document.getElementById("dashboard-ads");
  const moderationSummaryEl = document.getElementById("dashboard-moderation-summary");
  const reportsList = document.getElementById("reports-list");
  const searchInput = document.getElementById("report-search");
  const statusSelect = document.getElementById("report-filter-status");
  const typeSelect = document.getElementById("report-filter-type");
  const authorSelect = document.getElementById("report-filter-author");
  const sortSelect = document.getElementById("report-sort");
  const refreshReportsBtn = document.getElementById("refresh-reports");
  const totalsEl = document.getElementById("dashboard-stats-totals");
  const pagesEl = document.getElementById("dashboard-stats-pages");
  const geoEl = document.getElementById("dashboard-stats-geo");
  const questionForm = document.getElementById("dashboard-question-form");
  const questionTextFr = document.getElementById("dashboard-question-text-fr");
  const questionTextEn = document.getElementById("dashboard-question-text-en");
  const questionTextEs = document.getElementById("dashboard-question-text-es");
  const questionTextAr = document.getElementById("dashboard-question-text-ar");
  const questionActivateAt = document.getElementById("dashboard-question-activate-at");
  const questionKindFr = document.getElementById("dashboard-question-kind-fr");
  const questionKindEn = document.getElementById("dashboard-question-kind-en");
  const questionKindEs = document.getElementById("dashboard-question-kind-es");
  const questionKindAr = document.getElementById("dashboard-question-kind-ar");
  const questionMediaRowFr = document.getElementById("dashboard-question-media-row-fr");
  const questionMediaRowEn = document.getElementById("dashboard-question-media-row-en");
  const questionMediaRowEs = document.getElementById("dashboard-question-media-row-es");
  const questionMediaRowAr = document.getElementById("dashboard-question-media-row-ar");
  const questionMediaFr = document.getElementById("dashboard-question-media-fr");
  const questionMediaEn = document.getElementById("dashboard-question-media-en");
  const questionMediaEs = document.getElementById("dashboard-question-media-es");
  const questionMediaAr = document.getElementById("dashboard-question-media-ar");
  const questionMediaMetaFr = document.getElementById("dashboard-question-media-meta-fr");
  const questionMediaMetaEn = document.getElementById("dashboard-question-media-meta-en");
  const questionMediaMetaEs = document.getElementById("dashboard-question-media-meta-es");
  const questionMediaMetaAr = document.getElementById("dashboard-question-media-meta-ar");
  const adForm = document.getElementById("dashboard-ad-form");
  const adSlot = document.getElementById("dashboard-ad-slot");
  const adLabel = document.getElementById("dashboard-ad-label");
  const adTitle = document.getElementById("dashboard-ad-title");
  const adCopy = document.getElementById("dashboard-ad-copy");
  const adStart = document.getElementById("dashboard-ad-start");
  const adEnd = document.getElementById("dashboard-ad-end");
  const adAssetInput = document.getElementById("dashboard-ad-asset");
  const adCurrentAsset = document.getElementById("dashboard-ad-current-asset");
  const socket = window.io ? window.io() : null;
  let reportsCache = [];
  let adminAdsCache = [];
  let currentAdAsset = null;
  const questionMediaAssetByLang = { fr: null, en: null, es: null, ar: null };
  const moderationState = {
    search: "",
    status: "open",
    type: "all",
    author: "all",
    sort: "date_desc",
  };

  async function api(path, options = {}) {
    const res = await fetch(path, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur API" }));
      throw new Error(err.error || "Erreur API");
    }
    return res.json();
  }

  function articleLine(label, value) {
    const row = document.createElement("article");
    row.className = "answer";
    const strong = document.createElement("strong");
    strong.textContent = label;
    const p = document.createElement("p");
    p.textContent = value;
    row.appendChild(strong);
    row.appendChild(p);
    return row;
  }

  async function renderQuestions() {
    if (!questionsEl) return;
    const questions = await api("/api/admin/questions");
    questionsEl.textContent = "";
    if (!questions.length) {
      questionsEl.appendChild(articleLine("Questions", "Aucune question."));
      return;
    }
    questions.forEach((q) => {
      const row = document.createElement("article");
      row.className = "answer";
      const top = document.createElement("div");
      top.className = "answer-head";
      const strong = document.createElement("strong");
      strong.textContent = `FR: ${q?.texts?.fr || q.text || ""}`;
      const sub = document.createElement("div");
      sub.className = "meta";
      sub.textContent = `EN: ${q?.texts?.en || "-"} | ES: ${q?.texts?.es || "-"} | AR: ${q?.texts?.ar || "-"}`;
      const meta = document.createElement("span");
      meta.className = "meta";
      const isScheduled = !q.active && q.activateAt && new Date(q.activateAt).getTime() > Date.now();
      const status = q.active
        ? "ACTIVE"
        : isScheduled
        ? `PROGRAMMEE ${new Date(q.activateAt).toLocaleString("fr-FR")}`
        : "ARCHIVEE";
      meta.textContent = `${new Date(q.createdAt).toLocaleString("fr-FR")} | ${q.answersCount} reponses | ${
        q.commentsCount
      } commentaires | ${status}`;
      top.appendChild(strong);
      top.appendChild(sub);
      top.appendChild(meta);
      row.appendChild(top);

      const actions = document.createElement("div");
      actions.className = "emoji-bar";
      const activate = document.createElement("button");
      activate.type = "button";
      activate.textContent = "Activer";
      activate.disabled = q.active;
      activate.addEventListener("click", async () => {
        await api(`/api/admin/questions/${q.id}/activate`, { method: "POST" });
        await refreshAll();
      });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "danger-btn";
      del.textContent = "Supprimer";
      del.addEventListener("click", async () => {
        if (!confirm("Supprimer cette question ?")) return;
        await api(`/api/admin/questions/${q.id}`, { method: "DELETE" });
        await refreshAll();
      });
      actions.appendChild(activate);
      actions.appendChild(del);
      row.appendChild(actions);
      questionsEl.appendChild(row);
    });
  }

  async function renderAds() {
    if (!adsEl) return;
    const ads = await api("/api/admin/ads");
    adminAdsCache = Array.isArray(ads) ? ads : [];
    adsEl.textContent = "";
    if (!ads.length) {
      adsEl.appendChild(articleLine("Publicites", "Aucune publicite active."));
      return;
    }
    ads.forEach((ad) => {
      const row = document.createElement("article");
      row.className = "answer";
      const strong = document.createElement("strong");
      strong.textContent = `${ad.title} (${ad.slot})`;
      const p = document.createElement("p");
      p.textContent = ad.copy;
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `Du ${new Date(ad.startsAt || ad.createdAt).toLocaleString("fr-FR")} au ${new Date(
        ad.endsAt
      ).toLocaleString("fr-FR")}`;
      const actions = document.createElement("div");
      actions.className = "emoji-bar";
      const del = document.createElement("button");
      del.type = "button";
      del.className = "danger-btn";
      del.textContent = "Supprimer";
      del.addEventListener("click", async () => {
        if (!confirm("Supprimer cette pub ?")) return;
        await api(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
        await refreshAll();
      });
      actions.appendChild(del);
      row.appendChild(strong);
      row.appendChild(p);
      row.appendChild(meta);
      row.appendChild(actions);
      adsEl.appendChild(row);
    });
  }

  function toLocalInputValue(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const offsetMs = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  function toISOFromLocalInput(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  function setCurrentAssetMeta(asset) {
    currentAdAsset = asset || null;
    if (!adCurrentAsset) return;
    if (!currentAdAsset) {
      adCurrentAsset.textContent = "Aucun media selectionne.";
      return;
    }
    adCurrentAsset.textContent = `Media actuel: ${currentAdAsset.name} (${currentAdAsset.mime}, ${currentAdAsset.size} octets)`;
  }

  function fillAdFormForSlot(slot) {
    if (!adSlot || !adTitle || !adCopy || !adStart || !adEnd || !adLabel) return;
    const ad = (adminAdsCache || []).find((item) => item.slot === slot);
    if (!ad) {
      adLabel.value = "Publicite";
      adTitle.value = "";
      adCopy.value = "";
      adStart.value = "";
      adEnd.value = "";
      if (adAssetInput) adAssetInput.value = "";
      setCurrentAssetMeta(null);
      return;
    }
    adLabel.value = ad.label || "Publicite";
    adTitle.value = ad.title || "";
    adCopy.value = ad.copy || "";
    adStart.value = toLocalInputValue(ad.startsAt || ad.createdAt);
    adEnd.value = toLocalInputValue(ad.endsAt);
    if (adAssetInput) adAssetInput.value = "";
    setCurrentAssetMeta(ad.asset || null);
  }

  async function uploadAdAsset(file) {
    const formData = new FormData();
    formData.append("asset", file);
    const res = await fetch("/api/admin/upload-ad-asset", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur upload" }));
      throw new Error(err.error || "Erreur upload");
    }
    return res.json();
  }

  async function uploadQuestionAsset(file) {
    const formData = new FormData();
    formData.append("asset", file);
    const res = await fetch("/api/admin/upload-question-media", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur upload" }));
      throw new Error(err.error || "Erreur upload");
    }
    return res.json();
  }

  function setQuestionMediaMeta(lang, text) {
    const map = { fr: questionMediaMetaFr, en: questionMediaMetaEn, es: questionMediaMetaEs, ar: questionMediaMetaAr };
    const el = map[lang];
    if (!el) return;
    el.textContent = text || "Aucun media selectionne.";
  }

  function getQuestionLangEls(lang) {
    const map = {
      fr: { kind: questionKindFr, text: questionTextFr, row: questionMediaRowFr, input: questionMediaFr },
      en: { kind: questionKindEn, text: questionTextEn, row: questionMediaRowEn, input: questionMediaEn },
      es: { kind: questionKindEs, text: questionTextEs, row: questionMediaRowEs, input: questionMediaEs },
      ar: { kind: questionKindAr, text: questionTextAr, row: questionMediaRowAr, input: questionMediaAr },
    };
    return map[lang] || null;
  }

  function syncQuestionLangUI(lang) {
    const els = getQuestionLangEls(lang);
    if (!els?.kind || !els?.row) return;
    const mode = (els.kind.value || "text").toLowerCase();
    const needsMedia = mode === "image" || mode === "video";
    els.row.hidden = !needsMedia;
    if (!needsMedia) {
      if (els.input) els.input.value = "";
      questionMediaAssetByLang[lang] = null;
      setQuestionMediaMeta(lang, "Aucun media selectionne.");
    }
  }

  function validateFileAgainstMode(file, mode) {
    if (!file) return "Fichier manquant.";
    const mime = String(file.type || "").toLowerCase();
    if (mode === "image" && !mime.startsWith("image/")) return "Choisis une image (JPG/PNG/WebP/GIF).";
    if (mode === "video" && !mime.startsWith("video/")) return "Choisis une video (MP4/WebM).";
    return "";
  }

  async function renderModerationSummary() {
    if (!moderationSummaryEl) return;
    const open = reportsCache.filter((r) => (r.status || "open") === "open").length;
    const total = reportsCache.length;
    moderationSummaryEl.textContent = `${open} signalement(s) ouverts sur ${total} total.`;
  }

  function reportType(report) {
    return report?.commentId ? "comment" : "answer";
  }

  function populateAuthorFilter() {
    if (!authorSelect) return;
    const current = moderationState.author;
    const authors = Array.from(new Set(reportsCache.map((r) => String(r.author || "").trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "fr")
    );
    authorSelect.textContent = "";
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "Tous auteurs";
    authorSelect.appendChild(all);
    authors.forEach((author) => {
      const opt = document.createElement("option");
      opt.value = author;
      opt.textContent = author;
      authorSelect.appendChild(opt);
    });
    authorSelect.value = authors.includes(current) ? current : "all";
    moderationState.author = authorSelect.value;
  }

  function filteredReports() {
    let list = reportsCache.slice();
    if (moderationState.status !== "all") {
      list = list.filter((r) => (r.status || "open") === moderationState.status);
    }
    if (moderationState.type !== "all") {
      list = list.filter((r) => reportType(r) === moderationState.type);
    }
    if (moderationState.author !== "all") {
      list = list.filter((r) => String(r.author || "") === moderationState.author);
    }
    if (moderationState.search) {
      const q = moderationState.search.toLowerCase();
      list = list.filter((r) =>
        [r.reason, r.details, r.author, r.context?.questionText, r.context?.answerText, r.context?.commentText]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    list.sort((a, b) => {
      if (moderationState.sort === "date_asc") return new Date(a.createdAt) - new Date(b.createdAt);
      if (moderationState.sort === "author_asc") return String(a.author || "").localeCompare(String(b.author || ""), "fr");
      if (moderationState.sort === "type_asc") return reportType(a).localeCompare(reportType(b), "fr");
      if (moderationState.sort === "status_asc") return String(a.status || "").localeCompare(String(b.status || ""), "fr");
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return list;
  }

  function renderReportsList() {
    if (!reportsList) return;
    reportsList.textContent = "";
    const filtered = filteredReports();
    if (!filtered.length) {
      reportsList.appendChild(articleLine("Signalements", "Aucun signalement."));
      return;
    }
    filtered.forEach((r) => {
      const card = document.createElement("article");
      card.className = "answer";
      const head = document.createElement("div");
      head.className = "answer-head";
      const title = document.createElement("strong");
      title.textContent = `[${(r.status || "open").toUpperCase()}][${reportType(r).toUpperCase()}] ${r.reason}`;
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = `${r.author} - ${new Date(r.createdAt).toLocaleString("fr-FR")}`;
      head.appendChild(title);
      head.appendChild(meta);
      card.appendChild(head);
      const details = document.createElement("p");
      details.textContent = r.details || "Aucun detail.";
      card.appendChild(details);
      const context = document.createElement("div");
      context.className = "meta";
      context.textContent = `Q: ${r.context?.questionText || "-"} | R: ${r.context?.answerText || "-"} | C: ${
        r.context?.commentText || "-"
      }`;
      card.appendChild(context);
      const actions = document.createElement("div");
      actions.className = "emoji-bar";
      const resolve = document.createElement("button");
      resolve.type = "button";
      resolve.textContent = "Resoudre";
      resolve.addEventListener("click", () => {
        socket?.emit("report:status", { reportId: r.id, status: "resolved" });
      });
      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.textContent = "Ignorer";
      dismiss.addEventListener("click", () => {
        socket?.emit("report:status", { reportId: r.id, status: "dismissed" });
      });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "danger-btn";
      del.textContent = "Supprimer contenu";
      del.disabled = !r.context?.targetExists;
      del.addEventListener("click", () => {
        socket?.emit("report:take_action", { reportId: r.id, action: "delete_content" });
      });
      actions.appendChild(resolve);
      actions.appendChild(dismiss);
      actions.appendChild(del);
      card.appendChild(actions);
      reportsList.appendChild(card);
    });
  }

  async function renderModerationDetails() {
    if (!reportsList && !moderationSummaryEl) return;
    reportsCache = await api("/api/admin/reports");
    populateAuthorFilter();
    renderModerationSummary();
    renderReportsList();
  }

  async function renderStats() {
    if (!totalsEl || !pagesEl || !geoEl) return;
    const stats = await api("/api/admin/stats");
    totalsEl.textContent = "";
    pagesEl.textContent = "";
    geoEl.textContent = "";

    totalsEl.appendChild(articleLine("Derniere mise a jour", new Date(stats.updatedAt).toLocaleString("fr-FR")));
    totalsEl.appendChild(articleLine("Requetes QDAY totales", String(stats.totals.requests)));
    totalsEl.appendChild(articleLine("Pages QDAY vues", String(stats.totals.pageViews)));
    totalsEl.appendChild(articleLine("Appels API QDAY", String(stats.totals.apiCalls)));
    totalsEl.appendChild(articleLine("Connexions socket QDAY totales", String(stats.totals.socketConnections)));
    totalsEl.appendChild(articleLine("Sockets QDAY actifs", String(stats.totals.activeSockets)));
    totalsEl.appendChild(articleLine("Visiteurs QDAY uniques approx", String(stats.totals.uniqueVisitorsApprox)));

    (stats.topPages || []).slice(0, 10).forEach((row) => {
      pagesEl.appendChild(articleLine(row.path, `${row.views} vues`));
    });
    if (!stats.topPages?.length) {
      pagesEl.appendChild(articleLine("Top pages", "Aucune donnee."));
    }

    (stats.geo || []).slice(0, 20).forEach((row) => {
      geoEl.appendChild(
        articleLine(
          `${row.country}/${row.region}`,
          `Req: ${row.requests} | Pages: ${row.pageViews} | API: ${row.apiCalls} | Socket: ${row.socketConnections} | Visiteurs~: ${row.uniqueVisitors}`
        )
      );
    });
    if (!stats.geo?.length) {
      geoEl.appendChild(articleLine("Geo", "Aucune donnee."));
    }
  }

  async function refreshAll() {
    const jobs = [];
    if (questionsEl) jobs.push(renderQuestions());
    if (adsEl) jobs.push(renderAds());
    if (reportsList || moderationSummaryEl) jobs.push(renderModerationDetails());
    if (totalsEl && pagesEl && geoEl) jobs.push(renderStats());
    await Promise.all(jobs);
  }

  async function boot() {
    try {
      const status = await api("/api/admin/status");
      if (!status?.isAdmin) {
        alert("Acces admin requis.");
        window.location.href = "/admin.html";
        return;
      }
      await refreshAll();
      if (questionForm && questionTextFr && questionTextEn && questionTextEs && questionTextAr) {
        ["fr", "en", "es", "ar"].forEach((lang) => {
          const els = getQuestionLangEls(lang);
          els?.kind?.addEventListener("change", () => syncQuestionLangUI(lang));
          els?.input?.addEventListener("change", () => {
            const file = els.input.files?.[0] || null;
            if (!file) {
              setQuestionMediaMeta(lang, questionMediaAssetByLang[lang] ? `Media pret: ${questionMediaAssetByLang[lang].name}` : "");
              return;
            }
            setQuestionMediaMeta(lang, `Nouveau media: ${file.name} (${file.type || "application/octet-stream"}, ${file.size} octets)`);
          });
          syncQuestionLangUI(lang);
        });

        questionForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const texts = {
            fr: questionTextFr.value.trim(),
            en: questionTextEn.value.trim(),
            es: questionTextEs.value.trim(),
            ar: questionTextAr.value.trim(),
          };

          const kinds = {
            fr: (questionKindFr?.value || "text").toLowerCase(),
            en: (questionKindEn?.value || "text").toLowerCase(),
            es: (questionKindEs?.value || "text").toLowerCase(),
            ar: (questionKindAr?.value || "text").toLowerCase(),
          };

          for (const lang of ["fr", "en", "es", "ar"]) {
            const mode = kinds[lang];
            if (mode === "text") {
              if (!texts[lang]) {
                alert(`Langue ${lang.toUpperCase()}: la question texte est obligatoire (ou choisis image/video).`);
                return;
              }
            } else if (mode === "image" || mode === "video") {
              const els = getQuestionLangEls(lang);
              const file = els?.input?.files?.[0] || null;
              if (!file && !questionMediaAssetByLang[lang]) {
                alert(`Langue ${lang.toUpperCase()}: choisis un fichier ${mode} (ou repasse en question texte).`);
                return;
              }
              if (file) {
                const err = validateFileAgainstMode(file, mode);
                if (err) {
                  alert(`Langue ${lang.toUpperCase()}: ${err}`);
                  return;
                }
              }
            } else {
              alert(`Langue ${lang.toUpperCase()}: type de contenu invalide.`);
              return;
            }
          }

          const media = { fr: null, en: null, es: null, ar: null };
          for (const lang of ["fr", "en", "es", "ar"]) {
            const mode = kinds[lang];
            if (mode === "image" || mode === "video") {
              const els = getQuestionLangEls(lang);
              const file = els?.input?.files?.[0] || null;
              if (file) {
                const asset = await uploadQuestionAsset(file);
                questionMediaAssetByLang[lang] = asset;
                media[lang] = { asset };
              } else if (questionMediaAssetByLang[lang]) {
                media[lang] = { asset: questionMediaAssetByLang[lang] };
              }
            }
          }

          await api("/api/admin/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              texts,
              media,
              activateAt: questionActivateAt?.value ? toISOFromLocalInput(questionActivateAt.value) : null,
            }),
          });
          questionTextFr.value = "";
          questionTextEn.value = "";
          questionTextEs.value = "";
          questionTextAr.value = "";
          if (questionKindFr) questionKindFr.value = "text";
          if (questionKindEn) questionKindEn.value = "text";
          if (questionKindEs) questionKindEs.value = "text";
          if (questionKindAr) questionKindAr.value = "text";
          ["fr", "en", "es", "ar"].forEach((lang) => {
            const els = getQuestionLangEls(lang);
            if (els?.input) els.input.value = "";
            questionMediaAssetByLang[lang] = null;
            setQuestionMediaMeta(lang, "Aucun media selectionne.");
            syncQuestionLangUI(lang);
          });
          if (questionActivateAt) questionActivateAt.value = "";
          await refreshAll();
        });
      }
      if (adForm && adSlot && adTitle && adCopy && adStart && adEnd) {
        fillAdFormForSlot(adSlot.value);
        adSlot.addEventListener("change", () => {
          fillAdFormForSlot(adSlot.value);
        });
        adAssetInput?.addEventListener("change", () => {
          const file = adAssetInput.files?.[0];
          if (file) {
            adCurrentAsset.textContent = `Nouveau media: ${file.name} (${file.type || "application/octet-stream"}, ${file.size} octets)`;
          } else {
            setCurrentAssetMeta(currentAdAsset);
          }
        });
        adForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const startsAt = toISOFromLocalInput(adStart.value);
          const endsAt = toISOFromLocalInput(adEnd.value);
          if (!startsAt || !endsAt) {
            alert("Dates invalides.");
            return;
          }
          if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
            alert("La date de fin doit etre apres la date de debut.");
            return;
          }
          let assetToSave = currentAdAsset;
          const newFile = adAssetInput?.files?.[0];
          if (newFile) {
            assetToSave = await uploadAdAsset(newFile);
          }
          await api("/api/admin/ads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slot: adSlot.value,
              label: adLabel?.value?.trim() || "Publicite",
              title: adTitle.value.trim(),
              copy: adCopy.value.trim(),
              startsAt,
              endsAt,
              asset: assetToSave,
            }),
          });
          if (adAssetInput) adAssetInput.value = "";
          await refreshAll();
          fillAdFormForSlot(adSlot.value);
        });
      }
      setInterval(() => {
        refreshAll().catch(() => {});
      }, 20_000);

      searchInput?.addEventListener("input", () => {
        moderationState.search = searchInput.value.trim();
        renderReportsList();
      });
      statusSelect?.addEventListener("change", () => {
        moderationState.status = statusSelect.value || "all";
        renderReportsList();
      });
      typeSelect?.addEventListener("change", () => {
        moderationState.type = typeSelect.value || "all";
        renderReportsList();
      });
      authorSelect?.addEventListener("change", () => {
        moderationState.author = authorSelect.value || "all";
        renderReportsList();
      });
      sortSelect?.addEventListener("change", () => {
        moderationState.sort = sortSelect.value || "date_desc";
        renderReportsList();
      });
      refreshReportsBtn?.addEventListener("click", () => {
        renderModerationDetails().catch(() => {});
      });

      if (socket) {
        socket.on("report:created", () => refreshAll().catch(() => {}));
        socket.on("report:changed", () => refreshAll().catch(() => {}));
        socket.on("report:list", (reports) => {
          reportsCache = Array.isArray(reports) ? reports : [];
          populateAuthorFilter();
          renderModerationSummary();
          renderReportsList();
        });
        socket.on("ads:list", () => refreshAll().catch(() => {}));
        socket.on("history:list", () => refreshAll().catch(() => {}));
        if (reportsList || moderationSummaryEl) socket.emit("report:list");
      }
    } catch (err) {
      alert(err.message || "Erreur");
      window.location.href = "/admin.html";
    }
  }

  boot();
})();
