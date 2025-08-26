// triage.js — fixed version (plain JS, matches your HTML)

const SUPABASE_FN_URL = "https://zzwdnekgsdyxdzyhuafk.supabase.co/functions/v1/triage";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6d2RuZWtnc2R5eGR6eWh1YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODM4MjcsImV4cCI6MjA2ODE1OTgyN30.Bw3UgVe_RjvX_HfxEn1HrPkzJ6N4KpIFahKe0lxMSmg";

let evidence = [];
let sex = "";
let age = 0;

// --- Networking ---
async function callInfermedica(action, payload) {
  try {
    const res = await fetch(SUPABASE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action, payload })
    });

    const raw = await res.text();
    console.log("Raw response:", raw);

    if (!res.ok) throw new Error(`Supabase error ${res.status}: ${raw}`);

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch (err) {
    console.error("callInfermedica failed:", err);
    showError("Connection failed. See console for details.");
    throw err;
  }
}

function showError(message) {
  const box = document.getElementById("summary-box");
  if (box) box.innerHTML = `<p style="color:red">${message}</p>`;
}

// --- UI Initialization ---
function initUI() {
  document.getElementById("input-box").innerHTML = `
    <label>Sex:
      <select id="sex">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </label>
    <br/>
    <label>Age: 
      <input type="number" id="age" value="30" min="0" max="120"/>
    </label>
    <br/>
    <label>Main Symptom:
      <input type="text" id="symptomInput" placeholder="e.g. headache" />
      <input type="hidden" id="symptomIdHidden"/>
    </label>
    <div id="suggestions"></div>
    <br/>
    <button id="start-triage-btn">Start Triage</button>
  `;

  document.getElementById("symptomInput").addEventListener("input", debounce(async (e) => {
    const query = e.target.value;
    if (query.length < 2) return;
    try {
      const data = await callInfermedica("search", { phrase: query, sex: "male", age: { value: 30 } });
      showSuggestions(data);
    } catch {
      showError("No suggestions found.");
    }
  }, 300));

  document.getElementById("start-triage-btn").addEventListener("click", startTriage);
}

// --- Suggestions ---
function showSuggestions(list) {
  const container = document.getElementById("suggestions");
  container.innerHTML = "";
  if (!Array.isArray(list)) return;

  list.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item.name || item.id;
    div.style.cursor = "pointer";
    div.onclick = () => {
      document.getElementById("symptomInput").value = item.name;
      document.getElementById("symptomIdHidden").value = item.id;
      container.innerHTML = "";
    };
    container.appendChild(div);
  });
}

// --- Triage Flow ---
async function startTriage() {
  sex = document.getElementById("sex").value;
  age = parseInt(document.getElementById("age").value, 10);
  const symptomId = document.getElementById("symptomIdHidden").value;

  if (!symptomId) {
    showError("Please select a symptom from suggestions.");
    return;
  }

  evidence = [{ id: symptomId, choice_id: "present", source: "initial" }];

  try {
    const data = await callInfermedica("diagnosis", { sex, age: { value: age }, evidence });
    renderDiagnosis(data);
  } catch {
    showError("Triage failed.");
  }
}

function renderDiagnosis(data) {
  const qBox = document.getElementById("question-box");
  const sBox = document.getElementById("summary-box");
  qBox.innerHTML = "";
  sBox.innerHTML = "";

  if (data.has_emergency_evidence) {
    sBox.innerHTML = `<h3 style="color:red;">Emergency detected — seek care!</h3>`;
    return;
  }

  if (!data.question && Array.isArray(data.conditions)) {
    sBox.innerHTML = "<h3>Conditions</h3>";
    data.conditions.forEach(c => {
      const div = document.createElement("div");
      div.innerHTML = `<strong>${c.common_name}</strong> - ${(c.probability * 100).toFixed(1)}%`;
      sBox.appendChild(div);
    });
    return;
  }

  if (data.question) {
    const p = document.createElement("p");
    p.textContent = data.question.text;
    qBox.appendChild(p);

    const btns = document.createElement("div");
    (data.question.items || []).forEach(item => {
      item.choices.forEach(choice => {
        const b = document.createElement("button");
        b.textContent = choice.label;
        b.onclick = () => answerQuestion(item.id, choice.id);
        btns.appendChild(b);
      });
    });
    qBox.appendChild(btns);
  }
}

async function answerQuestion(symptomId, choiceId) {
  evidence.push({ id: symptomId, choice_id: choiceId });
  const data = await callInfermedica("diagnosis", { sex, age: { value: age }, evidence });
  renderDiagnosis(data);
}

// --- Helpers ---
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// --- Start ---
document.addEventListener("DOMContentLoaded", initUI);
