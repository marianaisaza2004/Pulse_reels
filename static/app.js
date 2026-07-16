const form = document.getElementById("intake-form");
const textInput = document.getElementById("text-input");
const fileInput = document.getElementById("file-input");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const intakeSection = document.getElementById("intake-section");
const intakeHeading = document.getElementById("intake-heading");

const loginScreen = document.getElementById("login-screen");
const signupScreen = document.getElementById("signup-screen");
const appScreen = document.getElementById("app-screen");
const welcomeHeading = document.getElementById("welcome-heading");

const loginEmailInput = document.getElementById("login-email-input");
const loginPasswordInput = document.getElementById("login-password-input");
const loginContinueBtn = document.getElementById("login-continue-btn");
const loginStatusEl = document.getElementById("login-status");
const loginNoAccountEl = document.getElementById("login-no-account");
const goToSignupBtn = document.getElementById("go-to-signup-btn");

const signupEmailInput = document.getElementById("signup-email-input");
const signupPasswordInput = document.getElementById("signup-password-input");
const signupConfirmPasswordInput = document.getElementById("signup-confirm-password-input");
const signupFirstNameInput = document.getElementById("signup-first-name-input");
const signupLastNameInput = document.getElementById("signup-last-name-input");
const signupCompanyInput = document.getElementById("signup-company-input");
const signupSubmitBtn = document.getElementById("signup-submit-btn");
const backToLoginBtn = document.getElementById("back-to-login-btn");
const signupStatusEl = document.getElementById("signup-status");

const logoutBtn = document.getElementById("logout-btn");
const collapseBrandBtn = document.getElementById("collapse-brand-btn");

const FIELD_HELP = {
  // business_identity
  company_name: "Your company or brand name, exactly as you want it to appear.",
  industry: "The industry your business is in (e.g. skincare, restaurants, software).",
  products_services: "What products or services you sell, in a few words.",
  business_model: "How you make money: direct sales, subscription, services, marketplace?",
  value_proposition: "Why someone would choose your brand — the main benefit you offer.",
  competitive_advantage: "What you do differently or better than the competition.",
  // brand_personality
  tone_of_voice: "Formal, casual, funny, technical? How the brand sounds when it speaks.",
  personality: "Adjectives that describe the brand's personality (e.g. bold, warm, minimalist).",
  communication_style: "How you communicate: direct, storytelling, educational, casual...",
  words_to_use: "Words or phrases the brand actually uses.",
  words_to_avoid: "Words or phrases the brand avoids using.",
  // target_audience
  demographics: "Age, gender, location, or other demographic details about your audience.",
  pain_points: "The problems or frustrations your audience has.",
  goals: "What your audience is trying to achieve.",
  motivations: "What drives them to take action or make a purchase decision.",
  buying_triggers: "What moment or situation makes them decide to buy.",
  objections: "What doubts or reasons stop them from buying.",
  interests: "Topics, hobbies, or interests related to your audience.",
  // business_goals
  brand_awareness: "How important it is for more people to recognize the brand.",
  leads: "How important it is to capture potential customers (leads).",
  sales: "How important it is to generate direct sales.",
  community: "How important it is to build a loyal community or audience.",
  education: "How important it is to educate the audience about the topic or product.",
  retention: "How important it is to retain existing customers.",
  // content_strategy
  content_pillars: "The core topics you create content around on a recurring basis.",
  preferred_formats: "Formats you prefer: reels, carousels, static posts, lives...",
  platforms: "Which social platforms you post on or plan to post on.",
  posting_frequency: "How often you publish content.",
  topics: "Specific topics you typically cover in your content.",
  content_to_avoid: "Topics or formats you'd rather NOT cover.",
  // brand_assets
  website: "The brand's website, if you have one.",
  brand_guidelines: "Whether a brand guide exists, or visual/tone rules to follow.",
  colors: "The brand's official colors.",
  logo: "Description or reference for the brand's logo.",
  slogan: "The slogan or tagline that represents the brand.",
  existing_captions: "Examples of captions or copy you've used before.",
  best_performing_posts: "Posts that have already worked well for you, and why.",
  // social_performance
  best_posts: "The best-performing posts you've had.",
  worst_posts: "The posts that have performed worst.",
  viral_content: "Any content that went viral, and why you think it happened.",
  average_engagement: "How much engagement you typically get (likes, comments, shares).",
  // competitor_context
  main_competitors: "Who your main competitors are.",
  market_positioning: "How you position yourself against those competitors.",
  opportunities: "Opportunities you see in the market that no one covers well yet.",
  trends: "Market or industry trends that are relevant right now.",
  // constraints
  legal_restrictions: "Legal or regulatory restrictions that apply to the content.",
  mandatory_cta: "A call to action that must always be included.",
  forbidden_claims: "Claims that can NOT be made (e.g. medical promises).",
  brand_rules: "Specific brand rules the content must respect.",
  maximum_duration: "Maximum allowed duration for videos/reels.",
  platform: "The specific platform this restriction applies to, if any.",
  // founder_story
  origin_story: "Why they started the business, and the story behind it.",
  founder_background: "Who's behind the brand — relevant experience or background.",
  mission: "What they're trying to change or improve for customers, beyond just selling to them.",
};

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

const CRITERIA_LABELS = {
  clarity: "Clarity",
  curiosity: "Curiosity",
  emotion: "Emotion",
  shareability: "Shareability",
  save_worthiness: "Save-worthiness",
  conversation_potential: "Conversation Potential",
  simplicity: "Simplicity (one idea only)",
  novelty: "Novelty",
  authority: "Authority",
  hook_strength: "Hook Strength",
};

const VIRAL_ENGINE_DISCLAIMER =
  "Pulse maximizes reach potential by following high-performing content principles — " +
  "it does not guarantee viral results.";

const MOMENT_LABELS = [
  ["hook", "Hook"],
  ["beat_1", "Beat 1"],
  ["beat_2", "Beat 2"],
  ["beat_3", "Beat 3"],
  ["beat_4", "Beat 4"],
  ["cta", "CTA"],
];

let currentBrands = [];
let activeBrandId = null;
let currentProfile = null;
let currentLabels = null;
let editingCategories = false;
let categoriesCollapsed = false;
let currentEmail = null;
let currentFirstName = null;
let currentCompanyName = null;
let currentBrief = null;
let currentScript = null;
let momentUIMode = {};
let currentScoreData = null;
let teleprompterInterval = null;
let teleprompterFontSize = 2.2;
let teleprompterFinished = false;

function setStatus(message, kind) {
  statusEl.textContent = message || "";
  statusEl.className = "status" + (kind ? " " + kind : "");
}

function setLoginStatus(message, kind) {
  loginStatusEl.textContent = message || "";
  loginStatusEl.className = "status" + (kind ? " " + kind : "");
}

function setSignupStatus(message, kind) {
  signupStatusEl.textContent = message || "";
  signupStatusEl.className = "status" + (kind ? " " + kind : "");
}

function setupPasswordToggle(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  btn.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    btn.textContent = showing ? "Show" : "Hide";
  });
}

setupPasswordToggle("login-password-input", "login-password-toggle");
setupPasswordToggle("signup-password-input", "signup-password-toggle");
setupPasswordToggle("signup-confirm-password-input", "signup-confirm-password-toggle");

function showLoginScreen() {
  loginScreen.style.display = "block";
  signupScreen.style.display = "none";
  appScreen.style.display = "none";
}

function showSignupScreen() {
  loginScreen.style.display = "none";
  signupScreen.style.display = "block";
  appScreen.style.display = "none";
}

function showAppScreen() {
  loginScreen.style.display = "none";
  signupScreen.style.display = "none";
  appScreen.style.display = "block";
  welcomeHeading.textContent = `Welcome ${currentFirstName}!`;
}

function enterApp(email, data) {
  currentEmail = email;
  currentFirstName = data.first_name;
  currentCompanyName = data.company_name;
  currentBrands = data.brands || [];
  currentLabels = data.category_labels;
  activeBrandId = null;
  currentProfile = null;
  editingCategories = false;
  categoriesCollapsed = true;
  currentBrief = null;
  resultsEl.innerHTML = "";
  setStatus("", "");

  showAppScreen();

  if (currentBrands.length > 0) {
    intakeSection.style.display = "none";
    renderCategoryView();
  } else {
    showIntakeFormForNewBrand("Tell us about your brand to create your first profile.");
  }
}

function showIntakeFormForNewBrand(heading) {
  intakeHeading.textContent = heading;
  textInput.value = "";
  fileInput.value = "";
  setStatus("", "");
  resultsEl.innerHTML = "";
  intakeSection.style.display = "block";
  updateCollapseBrandBtnVisibility();
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
    return `<div class="field-value empty">— no data —</div>`;
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
  return `<textarea class="field-edit" data-category="${categoryKey}" data-field="${dataField}" data-original-value="${escapeHtml(
    value
  )}" rows="2">${escapeHtml(value)}</textarea>`;
}

function renderHelpIcon(fieldKey) {
  const help = FIELD_HELP[fieldKey];
  if (!help) return "";
  return `<span class="field-help" tabindex="0">?<span class="field-help-tooltip">${escapeHtml(help)}</span></span>`;
}

function buildCategoryGrid() {
  const grid = document.createElement("div");
  grid.className = "grid";

  for (const [key, label] of currentLabels) {
    const value = currentProfile[key];
    const card = document.createElement("div");
    card.className = "panel category-card";
    card.id = `category-${key}`;

    if (typeof value === "string") {
      card.innerHTML = `<h2>${label}</h2>${renderFieldControl(key, null, value)}`;
    } else {
      const fields = Object.entries(value)
        .map(
          ([fieldKey, fieldValue]) => `
            <div class="field">
              <div class="field-label">${labelize(fieldKey)} ${renderHelpIcon(fieldKey)}</div>
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

function getIncompleteCategories() {
  return currentLabels
    .map(([key, label]) => {
      const value = currentProfile[key];
      let missingFields;
      if (typeof value === "string") {
        missingFields = value.trim() ? [] : ["information"];
      } else {
        missingFields = Object.entries(value)
          .filter(([, fieldValue]) => !fieldValue || !String(fieldValue).trim())
          .map(([fieldKey]) => labelize(fieldKey));
      }
      return { key, label, missingFields };
    })
    .filter((category) => category.missingFields.length > 0);
}

function buildIntroPanel() {
  const panel = document.createElement("div");
  panel.className = "panel";

  const incomplete = getIncompleteCategories();
  const missingListHtml = incomplete.length
    ? `
      <p class="field-label" style="margin-top: 14px;">You're missing information in these categories:</p>
      <ul class="missing-categories-list">
        ${incomplete
          .map(
            (category) =>
              `<li><button type="button" class="missing-category-link" data-category="${category.key}">${category.label}</button></li>`
          )
          .join("")}
      </ul>`
    : `<p class="status" style="margin-top: 14px;">✓ All categories have information.</p>`;

  panel.innerHTML = `
    <h2>Your brand profile</h2>
    <p class="intake-description">
      This is what Pulse understood about your brand, organized into 10 standard categories
      the AI uses to create content that's on-brand. Check that the information is correct —
      you can edit any field or add more information at any time with the button below.
    </p>
    ${missingListHtml}
  `;

  panel.querySelectorAll(".missing-category-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingCategories = true;
      renderCategoryView(btn.dataset.category);
    });
  });

  return panel;
}

function renderIncompleteWarning(incomplete) {
  const existing = document.getElementById("incomplete-warning");
  if (existing) existing.remove();

  const panel = document.createElement("div");
  panel.id = "incomplete-warning";
  panel.className = "panel";
  panel.innerHTML = `
    <p class="status error">
      You're still missing information in: ${incomplete.map((category) => category.label).join(", ")}.
    </p>
    <p class="intake-description">
      We recommend completing it so the content turns out better, but you can continue
      anyway.
    </p>
    <div class="actions-row">
      <button type="button" id="warning-back-btn" class="secondary">Go back and complete it</button>
      <button type="button" id="warning-continue-btn">Continue anyway</button>
    </div>
  `;
  resultsEl.appendChild(panel);
  panel.scrollIntoView({ behavior: "smooth", block: "center" });

  document.getElementById("warning-back-btn").addEventListener("click", () => panel.remove());
  document.getElementById("warning-continue-btn").addEventListener("click", renderCampaignBrief);
}

function goToBriefWithIncompleteCheck() {
  const incomplete = getIncompleteCategories();
  if (incomplete.length) {
    renderIncompleteWarning(incomplete);
    return;
  }
  renderCampaignBrief();
}

function updateCollapseBrandBtnVisibility() {
  const showing = activeBrandId !== null && (editingCategories || !categoriesCollapsed);
  collapseBrandBtn.style.display = showing ? "" : "none";
}

function getBrandName(profile) {
  return (profile.business_identity && profile.business_identity.company_name) || "Unnamed brand";
}

function openBrand(brandId) {
  const brand = currentBrands.find((b) => b.id === brandId);
  if (!brand) return;
  activeBrandId = brand.id;
  currentProfile = brand.profile;
  categoriesCollapsed = false;
  editingCategories = false;
  renderCategoryView();
}

function renderBrandsOverview() {
  updateCollapseBrandBtnVisibility();
  resultsEl.innerHTML = "";

  const list = document.createElement("div");
  list.className = "grid";
  currentBrands.forEach((brand) => {
    const box = document.createElement("div");
    box.className = "panel brand-collapsed-box";
    box.innerHTML = `
      <h2>${escapeHtml(getBrandName(brand.profile))}</h2>
      <p class="intake-description">Click to view or edit this brand's profile.</p>
    `;
    box.addEventListener("click", () => openBrand(brand.id));
    list.appendChild(box);
  });
  resultsEl.appendChild(list);

  const addPanel = document.createElement("div");
  addPanel.className = "panel actions-row";
  addPanel.innerHTML = `<button type="button" id="add-brand-btn">+ Add another brand</button>`;
  resultsEl.appendChild(addPanel);

  document.getElementById("add-brand-btn").addEventListener("click", () => {
    showIntakeFormForNewBrand("Tell us about this new brand.");
  });
}

function renderCategoryView(scrollToCategory) {
  if (!editingCategories && categoriesCollapsed && !scrollToCategory) {
    renderBrandsOverview();
    return;
  }

  updateCollapseBrandBtnVisibility();
  resultsEl.innerHTML = "";
  resultsEl.appendChild(buildIntroPanel());
  resultsEl.appendChild(buildCategoryGrid());

  const actions = document.createElement("div");
  actions.className = "panel actions-row";
  actions.innerHTML = editingCategories
    ? `<button type="button" id="save-edits-btn" style="display: none;">Save changes</button>
       <button type="button" id="continue-btn">Continue →</button>`
    : `<button type="button" id="edit-btn" class="secondary">Add information</button>
       <button type="button" id="continue-btn">Continue →</button>`;
  resultsEl.appendChild(actions);

  document.getElementById("continue-btn").addEventListener("click", goToBriefWithIncompleteCheck);

  if (editingCategories) {
    const saveBtn = document.getElementById("save-edits-btn");
    saveBtn.addEventListener("click", saveEdits);
    resultsEl.querySelectorAll(".field-edit").forEach((el) => {
      el.addEventListener("input", () => {
        if (el.value !== el.dataset.originalValue) {
          saveBtn.style.display = "";
        }
      });
    });
  } else {
    document.getElementById("edit-btn").addEventListener("click", () => {
      editingCategories = true;
      renderCategoryView();
    });
  }

  if (scrollToCategory) {
    const card = document.getElementById(`category-${scrollToCategory}`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
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
  categoriesCollapsed = true;
  renderCategoryView();

  if (currentEmail && activeBrandId !== null) {
    try {
      await fetch("/api/brand/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, brand_id: activeBrandId, profile: currentProfile }),
      });
    } catch (err) {
      // Edits still apply for this session even if the save call fails.
    }
  }
}

function renderCampaignBrief() {
  resultsEl.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <h2>Content brief</h2>

    <div class="field">
      <div class="field-label">What is this content for?</div>
      <select id="goal-select">
        ${GOALS.map(
          ([value, title, desc]) =>
            `<option value="${value}">${escapeHtml(title)} — ${escapeHtml(desc)}</option>`
        ).join("")}
      </select>
    </div>

    <div class="field">
      <div class="field-label">Platform</div>
      <div class="pill-group" id="platform-group">
        ${PLATFORMS.map(
          (p) => `<button type="button" class="pill" data-platform="${p}">${p}</button>`
        ).join("")}
      </div>
      <input
        type="text"
        id="platform-other-input"
        placeholder="Which platform?"
        style="display: none; margin-top: 8px;"
      />
    </div>

    <div class="field">
      <div class="field-label">What is this piece of content specifically about?</div>
      <textarea id="topic-input" rows="3" placeholder="E.g. A reel showing 3 common mistakes when using retinol..."></textarea>
    </div>

    <div class="field">
      <div class="field-label">Preferred duration (optional)</div>
      <input type="text" id="duration-input" placeholder="E.g. 30 seconds — leave blank if you have no preference" />
    </div>

    <div class="actions-row">
      <button type="button" id="brief-back-btn" class="secondary">← Back to categories</button>
      <button type="button" id="brief-submit-btn">See summary</button>
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
      briefStatus.textContent = "Select a platform.";
      briefStatus.className = "status error";
      return;
    }
    if (selectedPlatform === "Other" && !customPlatform) {
      briefStatus.textContent = "Enter which platform.";
      briefStatus.className = "status error";
      return;
    }
    if (!topic) {
      briefStatus.textContent = "Tell us briefly what this content is about.";
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
    <h2>Brief summary</h2>
    <div class="field">
      <div class="field-label">Goal</div>
      <div class="field-value">${escapeHtml(brief.goal.label)}</div>
    </div>
    <div class="field">
      <div class="field-label">Platform</div>
      <div class="field-value">${escapeHtml(brief.platform)}</div>
    </div>
    <div class="field">
      <div class="field-label">Topic</div>
      <div class="field-value">${escapeHtml(brief.topic)}</div>
    </div>
    <div class="field">
      <div class="field-label">Preferred duration</div>
      ${renderValue(brief.duration)}
    </div>
    <div class="actions-row">
      <button type="button" id="back-to-brief-btn" class="secondary">← Edit brief</button>
      <button type="button" id="generate-script-btn">Evaluate idea →</button>
    </div>
    <div id="generate-status" class="status"></div>
  `;
  resultsEl.appendChild(panel);
  document.getElementById("back-to-brief-btn").addEventListener("click", renderCampaignBrief);
  document.getElementById("generate-script-btn").addEventListener("click", generateScript);

  const referenceHeading = document.createElement("p");
  referenceHeading.className = "status";
  referenceHeading.textContent = "Brand profile used (reference):";
  resultsEl.appendChild(referenceHeading);
  resultsEl.appendChild(buildCategoryGrid());
}

function briefPayload() {
  return {
    goal_label: currentBrief.goal.label,
    goal_description: currentBrief.goal.description,
    platform: currentBrief.platform,
    topic: currentBrief.topic,
    duration: currentBrief.duration,
  };
}

async function generateScript() {
  const btn = document.getElementById("generate-script-btn");
  const genStatus = document.getElementById("generate-status");
  btn.disabled = true;
  genStatus.textContent =
    "Evaluating the idea against the Viral Engine — if the score isn't good enough, it'll " +
    "sharpen and re-score it on its own before writing the script (this can take up to " +
    "60 seconds)...";
  genStatus.className = "status loading";

  try {
    const res = await fetch("/api/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: currentProfile, brief: briefPayload() }),
    });
    const data = await res.json();

    if (!res.ok) {
      genStatus.textContent = data.detail || "Something went wrong.";
      genStatus.className = "status error";
      btn.disabled = false;
      return;
    }

    currentScoreData = {
      scores: data.scores,
      total: data.total,
      threshold: data.threshold,
      finalTopic: data.final_topic,
      roundsTried: data.rounds_tried,
      originalTopic: currentBrief.topic,
    };

    if (!data.produced) {
      renderScoreGate(data);
      return;
    }

    currentScript = data.script;
    momentUIMode = {};
    renderScriptView();
  } catch (err) {
    genStatus.textContent = "Couldn't connect to the server.";
    genStatus.className = "status error";
    btn.disabled = false;
  }
}

function buildMomentBlock(key, label) {
  const m = currentScript[key];
  const mode = momentUIMode[key] || "view";

  if (mode !== "edit" && !m.time && !m.visual && !m.script) {
    return "";
  }

  if (mode === "edit") {
    return `
      <div class="field moment-block" data-moment="${key}">
        <div class="field-label">${label}</div>
        <input type="text" class="moment-time-input" placeholder="Time, e.g. 0:00-0:03" value="${escapeHtml(m.time)}" />
        <textarea class="moment-visual-input" rows="2" placeholder="Visual direction">${escapeHtml(m.visual)}</textarea>
        <textarea class="moment-script-input" rows="2" placeholder="What to say on camera">${escapeHtml(m.script)}</textarea>
        <div class="actions-row">
          <button type="button" class="moment-save-btn">Save</button>
          <button type="button" class="moment-cancel-btn secondary">Cancel</button>
        </div>
      </div>`;
  }

  if (mode === "ai-fix") {
    return `
      <div class="field moment-block" data-moment="${key}">
        <div class="field-label">${label} (${escapeHtml(m.time)})</div>
        <div class="field-value"><em>${escapeHtml(m.visual)}</em></div>
        <div class="field-value">"${escapeHtml(m.script)}"</div>
        <textarea class="moment-instruction-input" rows="2" placeholder='E.g. "Make it funnier", "start with a question", "make it shorter"...'></textarea>
        <div class="actions-row">
          <button type="button" class="moment-ai-submit-btn">Ask AI to adjust</button>
          <button type="button" class="moment-cancel-btn secondary">Cancel</button>
        </div>
        <div class="status moment-ai-status"></div>
      </div>`;
  }

  return `
    <div class="field moment-block" data-moment="${key}">
      <div class="field-label">${label} (${escapeHtml(m.time)})</div>
      <div class="field-value"><em>${escapeHtml(m.visual)}</em></div>
      <div class="field-value">"${escapeHtml(m.script)}"</div>
      <div class="actions-row">
        <button type="button" class="moment-edit-btn secondary">Edit manually</button>
        <button type="button" class="moment-ai-btn secondary">Ask AI to adjust</button>
      </div>
    </div>`;
}

function renderScoreGrid(scores, total, threshold, refinement) {
  const panel = document.createElement("div");
  panel.className = "panel";

  const passed = total >= threshold;
  const rows = Object.entries(CRITERIA_LABELS)
    .map(([key, label]) => {
      const weak = scores[key].score < 7 ? " weak-score" : "";
      return `
        <div class="field" data-criterion="${key}">
          <div class="field-label">${escapeHtml(label)} — <span class="${weak}">${scores[key].score}/10</span></div>
          <div class="field-value">${escapeHtml(scores[key].note)}</div>
          <button type="button" class="score-improve-btn secondary">Improve</button>
          <div class="score-improve-form" style="display: none;">
            <textarea class="score-improve-instruction" rows="2" placeholder="What would you like to focus on? (optional)"></textarea>
            <div class="actions-row">
              <button type="button" class="score-improve-submit-btn">Apply</button>
              <button type="button" class="score-improve-cancel-btn secondary">Cancel</button>
            </div>
            <div class="status score-improve-status"></div>
          </div>
        </div>`;
    })
    .join("");

  const refinementNote =
    refinement && refinement.roundsTried > 1 && refinement.finalTopic !== refinement.originalTopic
      ? `<div class="field">
           <div class="field-label">Angle automatically optimized (${refinement.roundsTried} attempts)</div>
           <div class="field-value">${escapeHtml(refinement.finalTopic)}</div>
         </div>`
      : "";

  panel.innerHTML = `
    <h2>Viral Engine</h2>
    <p class="status ${passed ? "" : "error"}" style="font-size: 1.1rem; font-weight: 700;">
      Score: ${total}/100 (minimum to generate script: ${threshold})
    </p>
    <p class="intake-description">${VIRAL_ENGINE_DISCLAIMER}</p>
    ${refinementNote}
    ${rows}
  `;

  panel.querySelectorAll(".field[data-criterion]").forEach((field) => {
    const criterion = field.dataset.criterion;
    const form = field.querySelector(".score-improve-form");
    const improveBtn = field.querySelector(".score-improve-btn");
    const submitBtn = field.querySelector(".score-improve-submit-btn");
    const cancelBtn = field.querySelector(".score-improve-cancel-btn");
    const instructionInput = field.querySelector(".score-improve-instruction");
    const statusEl = field.querySelector(".score-improve-status");

    improveBtn.addEventListener("click", () => {
      panel.querySelectorAll(".score-improve-form").forEach((f) => (f.style.display = "none"));
      form.style.display = "";
      instructionInput.focus();
    });

    cancelBtn.addEventListener("click", () => {
      form.style.display = "none";
      statusEl.textContent = "";
      instructionInput.value = "";
    });

    submitBtn.addEventListener("click", () => {
      requestScoreImprove(criterion, instructionInput.value.trim(), submitBtn, statusEl);
    });
  });

  return panel;
}

async function requestScoreImprove(criterion, instruction, submitBtn, statusEl) {
  submitBtn.disabled = true;
  statusEl.textContent = "Sharpening this idea and re-scoring...";
  statusEl.className = "status loading score-improve-status";

  try {
    const res = await fetch("/api/score/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: currentProfile,
        brief: briefPayload(),
        scores: currentScoreData.scores,
        criterion,
        instruction,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.detail || "Something went wrong.";
      statusEl.className = "status error score-improve-status";
      submitBtn.disabled = false;
      return;
    }

    const newRoundsTried = (currentScoreData.roundsTried || 1) + 1;
    currentBrief.topic = data.final_topic;
    currentScoreData = {
      scores: data.scores,
      total: data.total,
      threshold: data.threshold,
      finalTopic: data.final_topic,
      roundsTried: newRoundsTried,
      originalTopic: currentScoreData.originalTopic,
    };

    if (data.produced && data.script) {
      currentScript = data.script;
      momentUIMode = {};
      renderScriptView();
    } else {
      data.rounds_tried = newRoundsTried;
      renderScoreGate(data);
    }
  } catch (err) {
    statusEl.textContent = "Couldn't connect to the server.";
    statusEl.className = "status error score-improve-status";
    submitBtn.disabled = false;
  }
}

function renderScoreGate(data) {
  const btn = document.getElementById("generate-script-btn");
  if (btn) btn.disabled = false;

  resultsEl.innerHTML = "";
  resultsEl.appendChild(
    renderScoreGrid(data.scores, data.total, data.threshold, {
      roundsTried: data.rounds_tried,
      finalTopic: data.final_topic,
      originalTopic: currentBrief.topic,
    })
  );

  const panel = document.createElement("div");
  panel.className = "panel";
  const triedMsg =
    data.rounds_tried > 1
      ? `We already tried improving it automatically ${data.rounds_tried} times, but it didn't reach the minimum score.`
      : "This idea hasn't reached the minimum score to generate the script yet.";
  panel.innerHTML = `
    <p class="status error">
      ${triedMsg}
    </p>
    <div class="field">
      <div class="field-label">Stronger angle suggested for the same idea</div>
      <div class="field-value">${escapeHtml(data.scores.stronger_angle)}</div>
    </div>
    <div class="actions-row">
      <button type="button" id="back-to-summary-btn" class="secondary">← Back to summary</button>
      <button type="button" id="use-suggested-angle-btn">Use this angle and retry</button>
    </div>
  `;
  resultsEl.appendChild(panel);

  document
    .getElementById("back-to-summary-btn")
    .addEventListener("click", () => renderFinalSummary(currentBrief));
  document.getElementById("use-suggested-angle-btn").addEventListener("click", () => {
    currentBrief.topic = data.scores.stronger_angle;
    renderFinalSummary(currentBrief);
    generateScript();
  });
}

function buildScriptPanelElement() {
  const panel = document.createElement("div");
  panel.className = "panel";
  const moments = MOMENT_LABELS.map(([key, label]) => buildMomentBlock(key, label)).join("");

  panel.innerHTML = `
    <h2>Script</h2>
    ${moments}
    <div class="field">
      <div class="field-label">Pattern interrupts</div>
      ${renderValue(currentScript.pattern_interrupts)}
    </div>
    <div class="field">
      <div class="field-label">Why it works</div>
      <div class="field-value">${escapeHtml(currentScript.why_it_works)}</div>
    </div>
    <div class="actions-row">
      <button type="button" id="back-to-summary-btn" class="secondary">← Back to summary</button>
      <button type="button" id="regenerate-btn">Generate another version</button>
      <button type="button" id="teleprompter-btn" class="secondary">🎥 Record (Teleprompter)</button>
    </div>
  `;

  panel.querySelectorAll(".moment-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      momentUIMode[btn.closest(".moment-block").dataset.moment] = "edit";
      renderScriptView();
    });
  });
  panel.querySelectorAll(".moment-ai-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      momentUIMode[btn.closest(".moment-block").dataset.moment] = "ai-fix";
      renderScriptView();
    });
  });
  panel.querySelectorAll(".moment-cancel-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      momentUIMode[btn.closest(".moment-block").dataset.moment] = "view";
      renderScriptView();
    });
  });
  panel.querySelectorAll(".moment-save-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const block = btn.closest(".moment-block");
      const key = block.dataset.moment;
      currentScript[key] = {
        time: block.querySelector(".moment-time-input").value.trim(),
        visual: block.querySelector(".moment-visual-input").value.trim(),
        script: block.querySelector(".moment-script-input").value.trim(),
      };
      momentUIMode[key] = "view";
      renderScriptView();
    });
  });
  panel.querySelectorAll(".moment-ai-submit-btn").forEach((btn) => {
    btn.addEventListener("click", () => requestMomentFix(btn.closest(".moment-block").dataset.moment));
  });

  panel
    .querySelector("#back-to-summary-btn")
    .addEventListener("click", () => renderFinalSummary(currentBrief));
  panel.querySelector("#regenerate-btn").addEventListener("click", generateScript);
  panel.querySelector("#teleprompter-btn").addEventListener("click", openTeleprompter);

  return panel;
}

function buildTeleprompterLines() {
  return MOMENT_LABELS.map(([key]) => currentScript[key])
    .filter((m) => m && m.script && m.script.trim())
    .map((m) => `<p class="tp-line">${escapeHtml(m.script)}</p>`)
    .join("");
}

function openTeleprompter() {
  const overlay = document.createElement("div");
  overlay.id = "teleprompter-overlay";
  overlay.innerHTML = `
    <div class="tp-controls">
      <button type="button" id="tp-exit-btn" class="secondary">✕ Exit</button>
      <div class="tp-controls-right">
        <button type="button" id="tp-font-minus" class="secondary">A-</button>
        <button type="button" id="tp-font-plus" class="secondary">A+</button>
        <input type="range" id="tp-speed" min="10" max="120" value="40" title="Scroll speed" />
        <button type="button" id="tp-restart-btn" class="secondary" style="display: none;">⟲ Restart</button>
        <button type="button" id="tp-play-btn">▶ Play</button>
      </div>
    </div>
    <div class="tp-content" id="tp-content" style="font-size: ${teleprompterFontSize}rem;">
      ${buildTeleprompterLines()}
      <div class="tp-spacer"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  teleprompterFinished = false;

  document.getElementById("tp-exit-btn").addEventListener("click", closeTeleprompter);
  document.getElementById("tp-font-minus").addEventListener("click", () => adjustTeleprompterFont(-0.2));
  document.getElementById("tp-font-plus").addEventListener("click", () => adjustTeleprompterFont(0.2));
  document.getElementById("tp-play-btn").addEventListener("click", toggleTeleprompterScroll);
  document.getElementById("tp-restart-btn").addEventListener("click", restartTeleprompterScroll);
}

function adjustTeleprompterFont(delta) {
  teleprompterFontSize = Math.max(1.2, Math.min(4, teleprompterFontSize + delta));
  const content = document.getElementById("tp-content");
  if (content) content.style.fontSize = `${teleprompterFontSize}rem`;
}

function toggleTeleprompterScroll() {
  const playBtn = document.getElementById("tp-play-btn");
  const restartBtn = document.getElementById("tp-restart-btn");
  const content = document.getElementById("tp-content");
  const speedInput = document.getElementById("tp-speed");

  if (teleprompterInterval) {
    clearInterval(teleprompterInterval);
    teleprompterInterval = null;
    playBtn.textContent = "▶ Play";
    restartBtn.style.display = "none";
    return;
  }

  if (teleprompterFinished) {
    content.scrollTop = 0;
    teleprompterFinished = false;
  }

  playBtn.textContent = "⏸ Pause";
  restartBtn.style.display = "inline-block";
  teleprompterInterval = setInterval(() => {
    const pxPerSecond = Number(speedInput.value);
    content.scrollTop += pxPerSecond / 10;
    if (content.scrollTop + content.clientHeight >= content.scrollHeight) {
      clearInterval(teleprompterInterval);
      teleprompterInterval = null;
      teleprompterFinished = true;
      playBtn.textContent = "⟲ Restart";
      restartBtn.style.display = "none";
    }
  }, 100);
}

function restartTeleprompterScroll() {
  document.getElementById("tp-content").scrollTop = 0;
}

function closeTeleprompter() {
  if (teleprompterInterval) {
    clearInterval(teleprompterInterval);
    teleprompterInterval = null;
  }
  const overlay = document.getElementById("teleprompter-overlay");
  if (overlay) overlay.remove();
}

function renderScriptView() {
  resultsEl.innerHTML = "";
  if (currentScoreData) {
    resultsEl.appendChild(
      renderScoreGrid(currentScoreData.scores, currentScoreData.total, currentScoreData.threshold, {
        roundsTried: currentScoreData.roundsTried,
        finalTopic: currentScoreData.finalTopic,
        originalTopic: currentScoreData.originalTopic,
      })
    );
  }
  resultsEl.appendChild(buildScriptPanelElement());
}

async function requestMomentFix(key) {
  const block = document.querySelector(`.moment-block[data-moment="${key}"]`);
  const instruction = block.querySelector(".moment-instruction-input").value.trim();
  const aiStatus = block.querySelector(".moment-ai-status");

  if (!instruction) {
    aiStatus.textContent = "Write what you'd like to change.";
    aiStatus.className = "status error moment-ai-status";
    return;
  }

  aiStatus.textContent = "Adjusting...";
  aiStatus.className = "status loading moment-ai-status";

  try {
    const res = await fetch("/api/script/revise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: currentProfile,
        brief: briefPayload(),
        script: currentScript,
        moment_key: key,
        instruction,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      aiStatus.textContent = data.detail || "Something went wrong.";
      aiStatus.className = "status error moment-ai-status";
      return;
    }

    currentScript[key] = data.moment;
    momentUIMode[key] = "view";
    renderScriptView();
  } catch (err) {
    aiStatus.textContent = "Couldn't connect to the server.";
    aiStatus.className = "status error moment-ai-status";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = textInput.value.trim();
  const file = fileInput.files[0];

  if (!text && !file) {
    setStatus("Paste some information or upload a file first.", "error");
    return;
  }

  const formData = new FormData();
  if (text) formData.append("text", text);
  if (file) formData.append("file", file);
  if (currentEmail) formData.append("email", currentEmail);

  submitBtn.disabled = true;
  setStatus("Analyzing...", "loading");
  resultsEl.innerHTML = "";

  try {
    const res = await fetch("/api/categorize", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.detail || "Something went wrong.", "error");
      return;
    }

    setStatus(
      `Done — ${data.meta.characters_processed} characters processed${
        data.meta.file_name ? ` (includes ${data.meta.file_name})` : ""
      }.`,
      ""
    );

    currentProfile = data.profile;
    currentLabels = data.category_labels;
    activeBrandId = data.brand_id;
    if (data.brand_id !== null && data.brand_id !== undefined) {
      currentBrands.push({ id: data.brand_id, profile: data.profile });
    }
    editingCategories = false;
    categoriesCollapsed = false;
    intakeSection.style.display = "none";
    renderCategoryView();
  } catch (err) {
    setStatus("Couldn't connect to the server.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

function setLoginFormDisabled(disabled) {
  loginContinueBtn.disabled = disabled;
  loginEmailInput.disabled = disabled;
  loginPasswordInput.disabled = disabled;
}

loginContinueBtn.addEventListener("click", async () => {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  loginNoAccountEl.style.display = "none";

  if (!isValidEmail(email)) {
    setLoginStatus("Enter a valid email.", "error");
    return;
  }
  if (!password) {
    setLoginStatus("Enter a password.", "error");
    return;
  }

  setLoginFormDisabled(true);
  setLoginStatus("Checking...", "loading");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoginFormDisabled(false);
      if (data.detail === "no_account") {
        setLoginStatus("", "");
        loginNoAccountEl.style.display = "block";
      } else {
        setLoginStatus(data.detail || "Something went wrong.", "error");
      }
      return;
    }

    setLoginStatus("", "");
    setLoginFormDisabled(false);
    enterApp(email, data);
  } catch (err) {
    setLoginStatus("Couldn't connect to the server.", "error");
    setLoginFormDisabled(false);
  }
});

goToSignupBtn.addEventListener("click", () => {
  signupEmailInput.value = loginEmailInput.value.trim();
  signupPasswordInput.value = "";
  signupConfirmPasswordInput.value = "";
  signupFirstNameInput.value = "";
  signupLastNameInput.value = "";
  signupCompanyInput.value = "";
  setSignupStatus("", "");
  showSignupScreen();
});

backToLoginBtn.addEventListener("click", () => {
  setSignupStatus("", "");
  showLoginScreen();
});

signupSubmitBtn.addEventListener("click", async () => {
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value;
  const confirmPassword = signupConfirmPasswordInput.value;
  const firstName = signupFirstNameInput.value.trim();
  const lastName = signupLastNameInput.value.trim();
  const companyName = signupCompanyInput.value.trim();

  if (!isValidEmail(email)) {
    setSignupStatus("Enter a valid email.", "error");
    return;
  }
  if (!password) {
    setSignupStatus("Enter a password.", "error");
    return;
  }
  if (password !== confirmPassword) {
    setSignupStatus("Passwords don't match.", "error");
    return;
  }
  if (!firstName || !lastName) {
    setSignupStatus("Enter your first and last name.", "error");
    return;
  }
  if (!companyName) {
    setSignupStatus("Enter your company, brand, or username.", "error");
    return;
  }

  signupSubmitBtn.disabled = true;
  setSignupStatus("Creating account...", "loading");

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        confirm_password: confirmPassword,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSignupStatus(data.detail || "Something went wrong.", "error");
      signupSubmitBtn.disabled = false;
      return;
    }

    setSignupStatus("", "");
    signupSubmitBtn.disabled = false;
    enterApp(email, data);
  } catch (err) {
    setSignupStatus("Couldn't connect to the server.", "error");
    signupSubmitBtn.disabled = false;
  }
});

collapseBrandBtn.addEventListener("click", () => {
  if (activeBrandId === null) return;
  activeBrandId = null;
  currentProfile = null;
  editingCategories = false;
  categoriesCollapsed = true;
  currentBrief = null;
  intakeSection.style.display = "none";
  setStatus("", "");
  renderCategoryView();
});

logoutBtn.addEventListener("click", () => {
  currentEmail = null;
  currentFirstName = null;
  currentCompanyName = null;
  currentBrands = [];
  activeBrandId = null;
  currentProfile = null;
  currentLabels = null;
  currentBrief = null;
  editingCategories = false;

  loginEmailInput.value = "";
  loginPasswordInput.value = "";
  setLoginFormDisabled(false);
  loginNoAccountEl.style.display = "none";
  setLoginStatus("", "");

  intakeSection.style.display = "none";
  resultsEl.innerHTML = "";
  setStatus("", "");
  updateCollapseBrandBtnVisibility();

  showLoginScreen();
});
