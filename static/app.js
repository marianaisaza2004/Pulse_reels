const form = document.getElementById("intake-form");
const textInput = document.getElementById("text-input");
const fileInput = document.getElementById("file-input");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

const emailInput = document.getElementById("email-input");
const emailContinueBtn = document.getElementById("email-continue-btn");
const changeEmailBtn = document.getElementById("change-email-btn");
const emailStatusEl = document.getElementById("email-status");
const intakeSection = document.getElementById("intake-section");
const intakeHeading = document.getElementById("intake-heading");

const GOALS = [
  ["brand_awareness", "Increase Brand Awareness", "Make more people recognize your brand."],
  ["drive_sales", "Drive Sales", "Encourage people to purchase a product or service."],
  ["generate_leads", "Generate Leads", "Capture potential customers."],
  ["increase_engagement", "Increase Engagement", "Get more likes, comments, shares, and saves."],
  ["educate_audience", "Educate Your Audience", "Teach something valuable related to your industry or product."],
  ["build_trust", "Build Trust & Credibility", "Position your brand as reliable and knowledgeable."],
  ["grow_community", "Grow Your Community", "Attract followers and strengthen relationships with your audience."],
  ["promote_product", "Promote a Product or Service", "Highlight features, benefits, or launches."],
  ["announce_promotion", "Announce a Promotion or Offer", "Promote discounts, limited-time offers, or special campaigns."],
  ["drive_traffic", "Drive Website Traffic", "Encourage people to visit your website or landing page."],
  ["collect_ugc", "Collect User-Generated Content (UGC)", "Encourage customers to create or share content."],
  ["launch_product", "Launch a New Product", "Introduce something new to the market."],
  ["retain_customers", "Retain Existing Customers", "Keep current customers engaged and loyal."],
  ["brand_story", "Share Your Brand Story", "Communicate your mission, values, or company journey."],
  ["recruit_talent", "Recruit Talent", "Attract potential employees."],
  ["promote_event", "Promote an Event", "Increase registrations or attendance for an event or webinar."],
  ["entertain", "Entertain Your Audience", "Create engaging or humorous content to increase visibility."],
];

const PLATFORMS = ["TikTok", "Instagram", "LinkedIn", "Other"];

const MOMENT_LABELS = [
  ["hook", "Hook"],
  ["beat_1", "Beat 1"],
  ["beat_2", "Beat 2"],
  ["beat_3", "Beat 3"],
  ["beat_4", "Beat 4"],
  ["cta", "CTA"],
];

let currentProfile = null;
let currentLabels = null;
let editingCategories = false;
let currentEmail = null;
let currentBrief = null;

function setStatus(message, kind) {
  statusEl.textContent = message || "";
  statusEl.className = "status" + (kind ? " " + kind : "");
}

function setEmailStatus(message, kind) {
  emailStatusEl.textContent = message || "";
  emailStatusEl.className = "status" + (kind ? " " + kind : "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function labelize(key) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function renderValue(value) {
  if (!value || !String(value).trim()) {
    return `<div class="field-value empty">— sin datos —</div>`;
  }
  if (value.includes("; ")) {
    const items = value
      .split("; ")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => `<li>${escapeHtml(v)}</li>`)
      .join("");
    return `<div class="field-value"><ul>${items}</ul></div>`;
  }
  return `<div class="field-value">${escapeHtml(value)}</div>`;
}

function renderFieldControl(categoryKey, fieldKey, value) {
  if (!editingCategories) {
    return renderValue(value);
  }
  const dataField = fieldKey || "";
  return `<textarea class="field-edit" data-category="${categoryKey}" data-field="${dataField}" rows="2">${escapeHtml(
    value
  )}</textarea>`;
}

function buildCategoryGrid() {
  const grid = document.createElement("div");
  grid.className = "grid";

  for (const [key, label] of currentLabels) {
    const value = currentProfile[key];
    const card = document.createElement("div");
    card.className = "panel category-card";

    if (typeof value === "string") {
      card.innerHTML = `<h2>${label}</h2>${renderFieldControl(key, null, value)}`;
    } else {
      const fields = Object.entries(value)
        .map(
          ([fieldKey, fieldValue]) => `
            <div class="field">
              <div class="field-label">${labelize(fieldKey)}</div>
              ${renderFieldControl(key, fieldKey, fieldValue)}
            </div>`
        )
        .join("");
      card.innerHTML = `<h2>${label}</h2>${fields}`;
    }

    grid.appendChild(card);
  }

  return grid;
}

function renderCategoryView() {
  resultsEl.innerHTML = "";
  resultsEl.appendChild(buildCategoryGrid());

  const actions = document.createElement("div");
  actions.className = "panel actions-row";
  actions.innerHTML = editingCategories
    ? `<button type="button" id="save-edits-btn">Guardar cambios</button>`
    : `<button type="button" id="edit-btn" class="secondary">Editar categorías</button>
       <button type="button" id="add-info-btn" class="secondary">+ Agregar información</button>
       <button type="button" id="continue-btn">Continuar →</button>`;
  resultsEl.appendChild(actions);

  if (editingCategories) {
    document.getElementById("save-edits-btn").addEventListener("click", saveEdits);
  } else {
    document.getElementById("edit-btn").addEventListener("click", () => {
      editingCategories = true;
      renderCategoryView();
    });
    document.getElementById("add-info-btn").addEventListener("click", showAddMoreInfoForm);
    document.getElementById("continue-btn").addEventListener("click", renderCampaignBrief);
  }
}

async function saveEdits() {
  document.querySelectorAll(".field-edit").forEach((el) => {
    const category = el.dataset.category;
    const field = el.dataset.field;
    if (field) {
      currentProfile[category][field] = el.value.trim();
    } else {
      currentProfile[category] = el.value.trim();
    }
  });
  editingCategories = false;
  renderCategoryView();

  if (currentEmail) {
    try {
      await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, profile: currentProfile }),
      });
    } catch (err) {
      // Edits still apply for this session even if the save call fails.
    }
  }
}

function showAddMoreInfoForm() {
  intakeHeading.textContent =
    "Agrega más información — se combinará con tu perfil actual, sin borrar lo que ya tienes.";
  textInput.value = "";
  fileInput.value = "";
  setStatus("", "");
  resultsEl.innerHTML = "";
  intakeSection.style.display = "block";
  intakeSection.scrollIntoView({ behavior: "smooth" });
}

function renderCampaignBrief() {
  resultsEl.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <h2>Brief de este contenido</h2>

    <div class="field">
      <div class="field-label">¿Para qué es este contenido?</div>
      <select id="goal-select">
        ${GOALS.map(
          ([value, title, desc]) =>
            `<option value="${value}">${escapeHtml(title)} — ${escapeHtml(desc)}</option>`
        ).join("")}
      </select>
    </div>

    <div class="field">
      <div class="field-label">Plataforma</div>
      <div class="pill-group" id="platform-group">
        ${PLATFORMS.map(
          (p) => `<button type="button" class="pill" data-platform="${p}">${p}</button>`
        ).join("")}
      </div>
      <input
        type="text"
        id="platform-other-input"
        placeholder="¿Cuál plataforma?"
        style="display: none; margin-top: 8px;"
      />
    </div>

    <div class="field">
      <div class="field-label">¿De qué trata este contenido en específico?</div>
      <textarea id="topic-input" rows="3" placeholder="Ej: Un reel mostrando 3 errores comunes al usar retinol..."></textarea>
    </div>

    <div class="field">
      <div class="field-label">Duración preferida (opcional)</div>
      <input type="text" id="duration-input" placeholder="Ej: 30 segundos — déjalo vacío si no tienes preferencia" />
    </div>

    <div class="actions-row">
      <button type="button" id="brief-back-btn" class="secondary">← Volver a categorías</button>
      <button type="button" id="brief-submit-btn">Ver resumen</button>
    </div>
    <div id="brief-status" class="status"></div>
  `;
  resultsEl.appendChild(panel);

  let selectedPlatform = null;
  const otherInput = document.getElementById("platform-other-input");
  document.querySelectorAll("#platform-group .pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#platform-group .pill")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedPlatform = btn.dataset.platform;

      if (selectedPlatform === "Other") {
        otherInput.style.display = "block";
        otherInput.focus();
      } else {
        otherInput.style.display = "none";
        otherInput.value = "";
      }
    });
  });

  document.getElementById("brief-back-btn").addEventListener("click", renderCategoryView);

  document.getElementById("brief-submit-btn").addEventListener("click", () => {
    const briefStatus = document.getElementById("brief-status");
    const goalValue = document.getElementById("goal-select").value;
    const goal = GOALS.find(([v]) => v === goalValue);
    const topic = document.getElementById("topic-input").value.trim();
    const duration = document.getElementById("duration-input").value.trim();
    const customPlatform = otherInput.value.trim();

    if (!selectedPlatform) {
      briefStatus.textContent = "Selecciona una plataforma.";
      briefStatus.className = "status error";
      return;
    }
    if (selectedPlatform === "Other" && !customPlatform) {
      briefStatus.textContent = "Escribe cuál plataforma.";
      briefStatus.className = "status error";
      return;
    }
    if (!topic) {
      briefStatus.textContent = "Cuéntanos brevemente de qué trata el contenido.";
      briefStatus.className = "status error";
      return;
    }

    renderFinalSummary({
      goal: { value: goal[0], label: goal[1], description: goal[2] },
      platform: selectedPlatform === "Other" ? customPlatform : selectedPlatform,
      topic,
      duration,
    });
  });
}

function renderFinalSummary(brief) {
  currentBrief = brief;
  resultsEl.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <h2>Resumen del brief</h2>
    <div class="field">
      <div class="field-label">Objetivo</div>
      <div class="field-value">${escapeHtml(brief.goal.label)}</div>
    </div>
    <div class="field">
      <div class="field-label">Plataforma</div>
      <div class="field-value">${escapeHtml(brief.platform)}</div>
    </div>
    <div class="field">
      <div class="field-label">Tema</div>
      <div class="field-value">${escapeHtml(brief.topic)}</div>
    </div>
    <div class="field">
      <div class="field-label">Duración preferida</div>
      ${renderValue(brief.duration)}
    </div>
    <div class="actions-row">
      <button type="button" id="back-to-brief-btn" class="secondary">← Editar brief</button>
      <button type="button" id="generate-script-btn">Generar guión →</button>
    </div>
    <div id="generate-status" class="status"></div>
  `;
  resultsEl.appendChild(panel);
  document.getElementById("back-to-brief-btn").addEventListener("click", renderCampaignBrief);
  document.getElementById("generate-script-btn").addEventListener("click", generateScript);

  const referenceHeading = document.createElement("p");
  referenceHeading.className = "status";
  referenceHeading.textContent = "Perfil de marca usado (referencia):";
  resultsEl.appendChild(referenceHeading);
  resultsEl.appendChild(buildCategoryGrid());
}

async function generateScript() {
  const btn = document.getElementById("generate-script-btn");
  const genStatus = document.getElementById("generate-status");
  btn.disabled = true;
  genStatus.textContent = "Escribiendo el guión (puede tardar hasta 20-30 segundos)...";
  genStatus.className = "status loading";

  try {
    const res = await fetch("/api/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: currentProfile,
        brief: {
          goal_label: currentBrief.goal.label,
          goal_description: currentBrief.goal.description,
          platform: currentBrief.platform,
          topic: currentBrief.topic,
          duration: currentBrief.duration,
        },
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      genStatus.textContent = data.detail || "Ocurrió un error.";
      genStatus.className = "status error";
      btn.disabled = false;
      return;
    }

    renderScriptResult(data);
  } catch (err) {
    genStatus.textContent = "No se pudo conectar con el servidor.";
    genStatus.className = "status error";
    btn.disabled = false;
  }
}

function renderScriptResult(data) {
  resultsEl.innerHTML = "";

  const script = data.script;
  const panel = document.createElement("div");
  panel.className = "panel";

  const moments = MOMENT_LABELS.filter(([key]) => {
    const m = script[key];
    return m.time || m.visual || m.script;
  })
    .map(
      ([key, label]) => `
        <div class="field">
          <div class="field-label">${label} (${escapeHtml(script[key].time)})</div>
          <div class="field-value"><em>${escapeHtml(script[key].visual)}</em></div>
          <div class="field-value">"${escapeHtml(script[key].script)}"</div>
        </div>`
    )
    .join("");

  panel.innerHTML = `
    <h2>Guión</h2>
    ${moments}
    <div class="field">
      <div class="field-label">Pattern interrupts</div>
      ${renderValue(script.pattern_interrupts)}
    </div>
    <div class="field">
      <div class="field-label">Por qué funciona</div>
      <div class="field-value">${escapeHtml(script.why_it_works)}</div>
    </div>
    <div class="actions-row">
      <button type="button" id="back-to-summary-btn" class="secondary">← Volver al resumen</button>
      <button type="button" id="regenerate-btn">Generar otra versión</button>
    </div>
  `;
  resultsEl.appendChild(panel);
  document
    .getElementById("back-to-summary-btn")
    .addEventListener("click", () => renderFinalSummary(currentBrief));
  document.getElementById("regenerate-btn").addEventListener("click", generateScript);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = textInput.value.trim();
  const file = fileInput.files[0];

  if (!text && !file) {
    setStatus("Pega texto o sube un archivo primero.", "error");
    return;
  }

  const formData = new FormData();
  if (text) formData.append("text", text);
  if (file) formData.append("file", file);
  if (currentEmail) formData.append("email", currentEmail);

  submitBtn.disabled = true;
  setStatus("Analizando...", "loading");
  resultsEl.innerHTML = "";

  try {
    const res = await fetch("/api/categorize", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.detail || "Ocurrió un error.", "error");
      return;
    }

    setStatus(
      `Listo — ${data.meta.characters_processed} caracteres procesados${
        data.meta.file_name ? ` (incluye ${data.meta.file_name})` : ""
      }.`,
      ""
    );

    currentProfile = data.profile;
    currentLabels = data.category_labels;
    editingCategories = false;
    intakeSection.style.display = "none";
    renderCategoryView();
  } catch (err) {
    setStatus("No se pudo conectar con el servidor.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

emailContinueBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    setEmailStatus("Escribe un correo válido.", "error");
    return;
  }

  currentEmail = email;
  emailContinueBtn.disabled = true;
  emailInput.disabled = true;
  setEmailStatus("Buscando perfil guardado...", "loading");

  try {
    const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);

    if (res.ok) {
      const data = await res.json();
      currentProfile = data.profile;
      currentLabels = data.category_labels;
      editingCategories = false;
      setEmailStatus(`Perfil encontrado para ${email}.`, "");
      intakeSection.style.display = "none";
      renderCategoryView();
    } else if (res.status === 404) {
      setEmailStatus(`No hay perfil guardado para ${email} todavía — vamos a crear uno.`, "");
      intakeHeading.textContent = `Nuevo perfil para ${email}`;
      resultsEl.innerHTML = "";
      intakeSection.style.display = "block";
    } else {
      const data = await res.json();
      setEmailStatus(data.detail || "Ocurrió un error.", "error");
      emailContinueBtn.disabled = false;
      emailInput.disabled = false;
      currentEmail = null;
      return;
    }

    changeEmailBtn.style.display = "inline-block";
  } catch (err) {
    setEmailStatus("No se pudo conectar con el servidor.", "error");
    emailContinueBtn.disabled = false;
    emailInput.disabled = false;
    currentEmail = null;
  }
});

changeEmailBtn.addEventListener("click", () => {
  currentEmail = null;
  currentProfile = null;
  currentLabels = null;
  editingCategories = false;

  emailInput.value = "";
  emailInput.disabled = false;
  emailContinueBtn.disabled = false;
  changeEmailBtn.style.display = "none";
  setEmailStatus("", "");

  intakeSection.style.display = "none";
  resultsEl.innerHTML = "";
  setStatus("", "");
});
