let evidence = [];
let sex = '';
let age = 0;

// --- INITIAL INPUT FORM ---
function askInitialDetails() {
  const box = document.getElementById('input-box');
  box.innerHTML = `
    <label>Sex:<br />
      <select id="sex">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </label>
    <br />
    <label>Age: <br />
      <input type="number" id="age" value="30" min="10" max="99" />
    </label>
    <br />
    <label>Main symptom: 
      <input type="text" id="symptomId" placeholder="Start typing..." oninput="suggestSymptoms(this.value)" />
    </label>
    <div id="suggestions"></div>
    <br />
    <button onclick="startTriage()">Start Triage</button>
  `;
}

// --- SUPABASE PROXY CALL ---
async function callInfermedica(path, method = 'POST', body = null) {
  const res = await fetch('https://zzwdnekgsdyxdzyhuafk.supabase.co/functions/v1/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, method, body })
  });
  return res.json();
}

// --- AUTOCOMPLETE SUGGESTIONS ---
async function suggestSymptoms(query) {
  const container = document.getElementById('suggestions');
  if (query.length < 2) return container.innerHTML = '';

  const selectedSex = document.getElementById('sex')?.value || 'male';
  const ageValue = document.getElementById('age')?.value || 30;

  try {
    const data = await callInfermedica('search', 'POST', {
      phrase: query,
      sex: selectedSex,
      age: { value: ageValue },
      type: 'symptom'
    });

    if (!Array.isArray(data)) {
      container.innerHTML = `<div style="color:red;">${data.message || 'Error'}</div>`;
      return;
    }

    container.innerHTML = data.map(item =>
      `<div onclick="selectSymptom('${item.id}', '${item.name || item.label}')">${item.name || item.label}</div>`
    ).join('');

  } catch (err) {
    container.innerHTML = `<div style="color:red;">Failed to fetch suggestions</div>`;
    console.error(err);
  }
}

// --- SELECT SYMPTOM ---
function selectSymptom(symptomId, label) {
  document.getElementById('symptomId').value = symptomId;
  document.getElementById('suggestions').innerHTML = '';
}

// --- START TRIAGE ---
async function startTriage() {
  sex = document.getElementById('sex').value;
  age = parseInt(document.getElementById('age').value);
  const symptomId = document.getElementById('symptomId').value.trim();
  if (!symptomId) return alert('Please select a symptom.');

  evidence = [{ id: symptomId, choice_id: 'present', source: 'initial' }];
  const data = await callInfermedica('diagnosis', 'POST', { sex, age: { value: age }, evidence });
  showQuestion(data);
}

// --- SHOW QUESTIONS ---
async function showQuestion(data) {
  const box = document.getElementById('question-box');
  const summary = document.getElementById('summary-box');
  box.innerHTML = '';
  summary.innerHTML = '';

  if (data.has_emergency_evidence) {
    summary.innerHTML = `<h3 style="color:red;">⚠️ Emergency detected. Please seek immediate care.</h3>`;
  }

  if (!data.question) {
    if (data.conditions && data.conditions.length > 0) {
      displaySummary(data.conditions);
    } else {
      summary.innerHTML += `<p>No condition could be identified based on the given symptoms.</p>`;
    }
    return;
  }

  // Render current question
  const questionText = document.createElement('p');
  questionText.textContent = data.question.text;
  box.appendChild(questionText);

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'option-buttons';

  data.question.items.forEach(item => {
    item.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.innerText = `${choice.label}`;
      btn.onclick = () => answerQuestion(item.id, choice.id);
      buttonContainer.appendChild(btn);
    });
  });

  box.appendChild(buttonContainer);
}

// --- ANSWER QUESTION ---
async function answerQuestion(symptomId, choiceId) {
  evidence.push({ id: symptomId, choice_id: choiceId });
  const data = await callInfermedica('diagnosis', 'POST', { sex, age: { value: age }, evidence });
  showQuestion(data);
}

// --- DISPLAY SUMMARY ---
function displaySummary(conditions) {
  const container = document.getElementById('summary-box');
  container.innerHTML += `<h3>Summary:</h3>`;

  conditions.forEach(result => {
    const card = document.createElement('div');
    card.className = 'summary-card';

    const condition = document.createElement('p');
    condition.innerHTML = `<strong>Condition:</strong> ${result.common_name || result.name}`;

    const probability = document.createElement('p');
    probability.innerHTML = `<strong>Probability:</strong> ${(result.probability * 100).toFixed(1)}%`;

    card.appendChild(condition);
    card.appendChild(probability);
    container.appendChild(card);
  });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', askInitialDetails);
