const SUPABASE_FN_URL = "https://zzwdnekgsdyxdzyhuafk.supabase.co/functions/v1/triage";

let evidence = [];
let sex = "";
let age = 0;

// --- Networking ---
async function callInfermedica(action, payload) {
  try {
    const response = await fetch(SUPABASE_FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload })
    });

    const raw = await response.text();
    console.log("Raw response:", raw);

    if (!response.ok) {
      throw new Error(`Supabase error ${response.status}: ${raw}`);
    }

    return JSON.parse(raw);
  } catch (err) {
    console.error("callInfermedica failed:", err);
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
    </label><br/>
    <label>Age: 
      <input type="number" id="age" value="30" min="0" max="120"/>
    </label><br/>
    <label>Main Symptom:
      <input type="text" id="symptomInput" placeholder="e.g. headache" />
      <input type="hidden" id="symptomIdHidden"/>
    </label>
    <div id="suggestions"></div><br/>
    <button id="start-triage-btn">Start Diagnosis</button>
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

  document.getElementById("start-triage-btn").addEventListener("click", startDiagnosis);
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

// --- Diagnosis Flow ---
async function startDiagnosis() {
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
    showError("Diagnosis failed.");
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

    const triageBtn = document.createElement("button");
    triageBtn.textContent = "Check Urgency";
    triageBtn.onclick = async () => {
      try {
        const triageData = await callInfermedica("triage", {
          sex,
          age: { value: age },
          evidence
        });
        renderTriage(triageData);
      } catch {
        showError("Triage failed.");
      }
    };
    sBox.appendChild(triageBtn);
    return;
  }

  if (data.question) {
    const p = document.createElement("p");
    p.textContent = data.question.text;
    qBox.appendChild(p);

    (data.question.items || []).forEach(item => {
      const itemBox = document.createElement("div");
      itemBox.style.marginBottom = "10px";

      // label for this specific symptom/item
      const itemLabel = document.createElement("p");
      itemLabel.textContent = item.name || item.id;
      itemBox.appendChild(itemLabel);

      // add buttons for this item only
      item.choices.forEach(choice => {
        const b = document.createElement("button");
        b.textContent = choice.label;

        // highlight when selected
        b.onclick = () => {
          // remove old highlight
          [...itemBox.querySelectorAll("button")].forEach(btn => btn.style.backgroundColor = "");
          b.style.backgroundColor = "#d4edda";

          // answer
          answerQuestion(item.id, choice.id);
        };

        itemBox.appendChild(b);
      });

      qBox.appendChild(itemBox);
    });
  }
}

async function answerQuestion(symptomId, choiceId) {
  // remove any old entry for this symptom
  evidence = evidence.filter(e => e.id !== symptomId);

  // add the new choice
  evidence.push({ id: symptomId, choice_id: choiceId });

  // call diagnosis again
  const data = await callInfermedica("diagnosis", { sex, age: { value: age }, evidence });
  renderDiagnosis(data);
}

// --- Triage Renderer ---
function renderTriage(data) {
  const sBox = document.getElementById("summary-box");
  sBox.innerHTML = `
    <h3>Triage Result</h3>
    <p><strong>Urgency:</strong> ${data.triage_level || "Unknown"}</p>
    <p><strong>Recommendation:</strong> ${data.recommendation || "No specific recommendation"}</p>
    ${data.serious ? `<p><strong>Serious:</strong> ${data.serious.join(", ")}</p>` : ""}
  `;
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