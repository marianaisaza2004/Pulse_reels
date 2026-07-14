const form = document.getElementById("intake-form");
const textInput = document.getElementById("text-input");
const fileInput = document.getElementById("file-input");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

function setStatus(message, kind) {
  statusEl.textContent = message || "";
  statusEl.className = "status" + (kind ? " " + kind : "");
}

function renderValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `<div class="field-value empty">— sin datos —</div>`;
    }
    const items = value.map((v) => `<li>${escapeHtml(v)}</li>`).join("");
    return `<div class="field-value"><ul>${items}</ul></div>`;
  }
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function labelize(key) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function renderResults(data) {
  const { profile, category_labels } = data;
  resultsEl.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "grid";

  for (const [key, label] of category_labels) {
    const value = profile[key];
    const card = document.createElement("div");
    card.className = "panel category-card";

    if (typeof value === "string") {
      card.innerHTML = `<h2>${label}</h2>${renderValue(value)}`;
    } else {
      const fields = Object.entries(value)
        .map(
          ([fieldKey, fieldValue]) => `
            <div class="field">
              <div class="field-label">${labelize(fieldKey)}</div>
              ${renderValue(fieldValue)}
            </div>`
        )
        .join("");
      card.innerHTML = `<h2>${label}</h2>${fields}`;
    }

    grid.appendChild(card);
  }

  resultsEl.appendChild(grid);
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
    renderResults(data);
  } catch (err) {
    setStatus("No se pudo conectar con el servidor.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});
