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
    const label = item.name || item.label || "Unknown Symptom";
    div.textContent = label;
    div.style.cursor = "pointer";

    // --- Touch event for mobile ---
    div.addEventListener("touchstart", (e) => {
      e.preventDefault(); // prevent ghost click
      document.getElementById("symptomInput").value = label;
      document.getElementById("symptomIdHidden").value = item.id;
      container.innerHTML = "";
    }, { passive: false });

    // --- Click event for desktop ---
    div.addEventListener("click", () => {
      document.getElementById("symptomInput").value = label;
      document.getElementById("symptomIdHidden").value = item.id;
      container.innerHTML = "";
    });

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

// --- Question & Results Renderer ---
function renderDiagnosis(data) {
  const qBox = document.getElementById("question-box");
  const sBox = document.getElementById("summary-box");
  qBox.innerHTML = "";
  sBox.innerHTML = "";

  if (data.has_emergency_evidence) {
    sBox.innerHTML = `<h3 style="color:red;">Emergency detected — seek care!</h3>`;
    return;
  }

  // --- Conditions Display ---
  if (!data.question && Array.isArray(data.conditions)) {
    sBox.innerHTML = "<h3>Possible Conditions</h3>";
    data.conditions.forEach(c => {
      const prob = (c.probability * 100).toFixed(1);
      const redIntensity = Math.floor(c.probability * 255); // 0-255
      const div = document.createElement("div");
      div.style.backgroundColor = `rgba(255, ${255 - redIntensity}, ${255 - redIntensity}, 0.2)`;
      div.style.border = "1px solid #ccc";
      div.style.padding = "8px";
      div.style.margin = "5px 0";
      div.style.borderRadius = "6px";
      div.innerHTML = `<strong>${c.common_name}</strong> - ${prob}%`;
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

  // --- Questions (Single & Multiple) ---
  if (data.question) {
    const p = document.createElement("p");
    p.textContent = data.question.text;
    qBox.appendChild(p);

    if (data.question.type === "group_multiple") {
      const selections = new Map();

      (data.question.items || []).forEach(item => {
        item.choices.forEach(choice => {
          const label = document.createElement("label");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = choice.id;
          checkbox.onchange = () => {
            if (checkbox.checked) {
              selections.set(item.id, { id: item.id, choice_id: choice.id });
            } else {
              selections.delete(item.id);
            }

            const allSelected = (data.question.items || []).every(i => selections.has(i.id));
            if (allSelected) {
              selections.forEach(sel => evidence.push(sel));
              proceedDiagnosis();
            }
          };
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(choice.label));
          qBox.appendChild(label);
          qBox.appendChild(document.createElement("br"));
        });
      });
    } else {
      (data.question.items || []).forEach(item => {
        item.choices.forEach(choice => {
          const b = document.createElement("button");
          b.textContent = choice.label;
          b.onclick = () => answerQuestion(item.id, choice.id);
          qBox.appendChild(b);
        });
      });
    }
  }
}

async function proceedDiagnosis() {
  const data = await callInfermedica("diagnosis", { sex, age: { value: age }, evidence });
  renderDiagnosis(data);
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