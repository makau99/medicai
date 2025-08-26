const SUPABASE_FN_URL = "https://zzwdnekgsdyxdzyhuafk.supabase.co/functions/v1/triage"; 

let evidence = [];
let sex = "";
let age = 0;

function askInitialDetails() {
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
    <label>Main symptom:
      <input type="text" id="symptomId" placeholder="Start typing..." oninput="suggestSymptoms(this.value)" />
    </label>
    <div id="suggestions"></div>
    <br/>
    <button onclick="startTriage()">Start Triage</button>
  `;
}

async function callInfermedica(action, payload) {
  try {
    console.log("Sending to Supabase:", { action, payload });
    const res = await fetch(SUPABASE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6d2RuZWtnc2R5eGR6eWh1YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODM4MjcsImV4cCI6MjA2ODE1OTgyN30.Bw3UgVe_RjvX_HfxEn1HrPkzJ6N4KpIFahKe0lxMSmg"
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase function returned", res.status, err);
      throw new Error(`Function error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("callInfermedica error:", err);
    throw err;
  }
}

async function suggestSymptoms(query) {
  const container = document.getElementById("suggestions");
  if (!query || query.length < 2) {
    container.innerHTML = "";
    return;
  }
  const selectedSex = document.getElementById("sex")?.value || "male";
  const ageValue = document.getElementById("age")?.value || 30;

  try {
    const data = await callInfermedica("search", { 
      phrase: query, sex: selectedSex, age: { value: ageValue }
    });

    if (!Array.isArray(data)) {
      console.warn("Unexpected response:", data);
      container.innerHTML = `<div style="color:red;">No suggestions</div>`;
      return;
    }
    container.innerHTML = data
      .map((item) => `<div class="suggest-item" onclick="selectSymptom('${item.id}', '${(item.name || item.label).replace(/'/g, "\\'")}')">${item.name || item.label}</div>`)
      .join("");
  } catch (err) {
    console.error("suggestSymptoms error:", err);
    container.innerHTML = `<div style="color:red;">Fetch failed</div>`;
  }
}

function selectSymptom(symptomId, label) {
  document.getElementById("symptomId").value = symptomId;
  document.getElementById("suggestions").innerHTML = "";
}

async function startTriage() {
  sex = document.getElementById("sex").value;
  age = parseInt(document.getElementById("age").value);
  const symptomId = document.getElementById("symptomId").value.trim();
  if (!symptomId) return alert("Please select a symptom.");

  evidence = [{ id: symptomId, choice_id: "present", source: "initial" }];
  try {
    const triageData = await callInfermedica("diagnosis", { 
      sex, age: { value: age }, evidence 
    });
    showQuestion(triageData);
  } catch (err) {
    console.error("startTriage error:", err);
    alert("Triage failed. Check console.");
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

  if (!data.question) {
    if (Array.isArray(data.conditions) && data.conditions.length) {
      displaySummary(data.conditions);
    } else {
      summary.innerHTML += "<p>No condition identified.</p>";
    }
    return;
  }

  const q = document.createElement("p");
  q.textContent = data.question.text;
  box.appendChild(q);

  const opt = document.createElement("div");
  opt.className = "option-buttons";

  data.question.items.forEach((item) => {
    item.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.textContent = choice.label;
      btn.addEventListener("click", () => answerQuestion(item.id, choice.id));
      opt.appendChild(btn);
    });
  });

  box.appendChild(opt);
}

async function answerQuestion(symptomId, choiceId) {
  evidence.push({ id: symptomId, choice_id: choiceId });
  try {
    const data = await callInfermedica("diagnosis", { 
      sex, age: { value: age }, evidence 
    });
    showQuestion(data);
  } catch (err) {
    console.error("answerQuestion error:", err);
  }
}

function displaySummary(conditions) {
  const container = document.getElementById("summary-box");
  container.innerHTML = "<h3>Summary</h3>";
  conditions.forEach((c) => {
    const card = document.createElement("div");
    card.className = "summary-card";
    card.innerHTML = `<p><strong>${c.common_name || c.name}</strong></p>
                      <p>Probability: ${(c.probability * 100).toFixed(1)}%</p>`;
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", askInitialDetails);
