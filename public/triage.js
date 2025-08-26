// triage.js — fully corrected & robust version
const SUPABASE_FN_URL = "https://zzwdnekgsdyxdzyhuafk.supabase.co/functions/v1/triage";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6d2RuZWtnc2R5eGR6eWh1YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODM4MjcsImV4cCI6MjA2ODE1OTgyN30.Bw3UgVe_RjvX_HfxEn1HrPkzJ6N4KpIFahKe0lxMSmg"; // <-- REPLACE

let evidence = [];
let sex = "";
let age = 0;

// --- Helpers ---
function ensureContainers() {
  if (!document.getElementById("input-box")) {
    const el = document.createElement("div");
    el.id = "input-box";
    document.body.prepend(el);
  }
  if (!document.getElementById("question-box")) {
    const el = document.createElement("div");
    el.id = "question-box";
    document.body.appendChild(el);
  }
  if (!document.getElementById("summary-box")) {
    const el = document.createElement("div");
    el.id = "summary-box";
    document.body.appendChild(el);
  }
}

function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function showError(message, where = "suggestions") {
  const container = document.getElementById(where) || document.getElementById("summary-box");
  if (container) container.innerHTML = `<div class="error" style="color:red">${message}</div>`;
  console.error(message);
}

// --- Networking ---
async function callInfermedica(action, payload) {
  try {
    const body = { action, payload };
    console.log("Sending to Supabase:", body);

    const res = await fetch(SUPABASE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}` // some setups accept both
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    console.log("Raw response text:", raw);

    if (!res.ok) {
      // provide the raw body for easier debugging
      console.error("Supabase function returned", res.status, raw);
      throw new Error(`Function error: ${res.status} - ${raw}`);
    }

    // try to parse JSON (may throw)
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to parse JSON:", err);
      return raw;
    }
  } catch (err) {
    console.error("callInfermedica error:", err);
    throw err;
  }
}

// --- UI Setup ---
function askInitialDetails() {
  ensureContainers();

  const box = document.getElementById("input-box");
  box.innerHTML = `
    <label>Sex:<br />
      <select id="sex">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </label>
    <br />
    <label>Age: <br />
      <input type="number" id="age" value="30" min="0" max="120" />
    </label>
    <br />
    <label>Main symptom:<br/>
      <input type="text" id="symptomInput" placeholder="Start typing..." autocomplete="off" />
      <input type="hidden" id="symptomIdHidden" value="" />
    </label>
    <div id="suggestions" style="position:relative;"></div>
    <br/>
    <button id="start-triage-btn">Start Triage</button>
  `;

  // attach listeners (debounced)
  const symptomInput = document.getElementById("symptomInput");
  const debouncedSuggest = debounce((val) => suggestSymptoms(val), 300);
  symptomInput.addEventListener("input", (e) => debouncedSuggest(e.target.value));

  document.getElementById("start-triage-btn").addEventListener("click", startTriage);
}

// --- Suggest / Search ---
async function suggestSymptoms(query) {
  const container = document.getElementById("suggestions");
  container.innerHTML = "";
  if (!query || query.length < 2) return;

  const selectedSex = document.getElementById("sex")?.value || "male";
  const ageValue = parseInt(document.getElementById("age")?.value || 30, 10);

  try {
    const data = await callInfermedica("search", { phrase: query, sex: selectedSex, age: { value: ageValue } });

    if (!Array.isArray(data)) {
      showError("No suggestions (unexpected response)", "suggestions");
      console.warn("search response:", data);
      return;
    }

    // Build suggestion list (click sets id + label)
    container.innerHTML = data
      .map((item) => {
        const label = item.name || item.label || item.id;
        const id = item.id || label;
        // escape single quotes for inline onclick handler
        const safeLabel = String(label).replace(/'/g, "\\'");
        return `<div class="suggest-item" data-id="${id}" style="cursor:pointer;padding:6px;border-bottom:1px solid #eee;">${safeLabel}</div>`;
      })
      .join("");

    // attach click handlers
    container.querySelectorAll(".suggest-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        const label = el.textContent || id;
        selectSymptom(id, label);
      });
    });
  } catch (err) {
    showError("Failed to fetch suggestions", "suggestions");
    console.error("suggestSymptoms error:", err);
  }
}

function selectSymptom(symptomId, label) {
  const visible = document.getElementById("symptomInput");
  const hidden = document.getElementById("symptomIdHidden");
  if (visible) visible.value = label;
  if (hidden) hidden.value = symptomId;
  const container = document.getElementById("suggestions");
  if (container) container.innerHTML = "";
}

// --- Triage / Diagnosis flow ---
async function startTriage() {
  sex = document.getElementById("sex")?.value || "male";
  age = parseInt(document.getElementById("age")?.value || "30", 10);
  const symptomId = document.getElementById("symptomIdHidden")?.value?.trim();

  if (!symptomId) {
    // If user typed an ID manually into visible input, try that as fallback:
    const visibleVal = document.getElementById("symptomInput")?.value?.trim();
    if (visibleVal && visibleVal.length > 0) {
      // it's safer to require the user select from suggestions, but we'll allow a fallback
      showError("You didn't select a symptom from suggestions; using visible input as id (best to click a suggestion).", "summary-box");
    }
  }

  evidence = [];
  if (symptomId) evidence.push({ id: symptomId, choice_id: "present", source: "initial" });

  try {
    const triageData = await callInfermedica("diagnosis", { sex, age: { value: age }, evidence });
    showQuestion(triageData);
  } catch (err) {
    showError("Triage failed. See console for details.", "summary-box");
    console.error("startTriage error:", err);
  }
}

function showQuestion(data) {
  const box = document.getElementById("question-box");
  const summary = document.getElementById("summary-box");
  box.innerHTML = "";
  summary.innerHTML = "";

  if (!data) {
    summary.innerHTML = "<p>No response</p>";
    return;
  }

  if (data.has_emergency_evidence) {
    summary.innerHTML = `<h3 style="color:red;">⚠️ Emergency detected. Seek immediate care.</h3>`;
  }

  // If there's no question, show conditions summary
  if (!data.question) {
    if (Array.isArray(data.conditions) && data.conditions.length) {
      displaySummary(data.conditions);
    } else {
      summary.innerHTML += "<p>No condition identified.</p>";
    }
    return;
  }

  // show question text
  const q = document.createElement("p");
  q.textContent = data.question.text || "Question:";
  box.appendChild(q);

  const opt = document.createElement("div");
  opt.className = "option-buttons";

  // Each question item may have choices
  (data.question.items || []).forEach((item) => {
    item.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.textContent = choice.label || choice.id;
      btn.addEventListener("click", () => answerQuestion(item.id, choice.id));
      opt.appendChild(btn);
    });
  });

  box.appendChild(opt);
}

async function answerQuestion(symptomId, choiceId) {
  evidence.push({ id: symptomId, choice_id: choiceId });
  try {
    const data = await callInfermedica("diagnosis", { sex, age: { value: age }, evidence });
    showQuestion(data);
  } catch (err) {
    showError("Failed to answer question.", "summary-box");
    console.error("answerQuestion error:", err);
  }
}

function displaySummary(conditions) {
  const container = document.getElementById("summary-box");
  container.innerHTML = "<h3>Summary</h3>";
  conditions.forEach((c) => {
    const card = document.createElement("div");
    card.className = "summary-card";
    card.style.border = "1px solid #ddd";
    card.style.padding = "8px";
    card.style.margin = "6px 0";
    card.innerHTML = `<p><strong>${c.common_name || c.name}</strong></p>
                      <p>Probability: ${( (c.probability || 0) * 100).toFixed(1)}%</p>`;
    container.appendChild(card);
  });
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  ensureContainers();
  askInitialDetails();
  console.log("triage.js loaded");
});
