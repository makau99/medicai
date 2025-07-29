let evidence = [];
let sex = '';
let age = 0;

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
    <input type="number" id="age" value="30" min="10" max="99" /></label>
    <br />
    <label>Main symptom: <input type="text" id="symptomId" placeholder="Start typing..." oninput="suggestSymptoms(this.value)" /></label>
    <div id="suggestions"></div>
    <br />
    <button class = "logbut"onclick="startTriage()">Start Triage</button>
  `;
}

async function suggestSymptoms(query) {
  const container = document.getElementById('suggestions');
  if (query.length < 2) return container.innerHTML = '';

  const sex = document.getElementById('sex').value || 'male';
  const age = document.getElementById('age').value || 30;

  const response = await fetch(`/api/search-symptoms?q=${encodeURIComponent(query)}&sex=${sex}&age=${age}`);
  const data = await response.json();

  if (!Array.isArray(data)) {
    container.innerHTML = `<div style="color:red;">${data.message || 'Error'}</div>`;
    return;
  }

  container.innerHTML = data.map(item => `
    <div onclick="selectSymptom('${item.id}')">${item.label}</div>
  `).join('');
}

function selectSymptom(symptomId) {
  document.getElementById('symptomId').value = symptomId;
  document.getElementById('suggestions').innerHTML = '';
}

async function startTriage() {
  sex = document.getElementById('sex').value;
  age = parseInt(document.getElementById('age').value);
  const symptomId = document.getElementById('symptomId').value.trim();

  if (!symptomId) return alert('Please select a symptom.');

  evidence = [{ id: symptomId, choice_id: 'present', source: 'initial' }];

  const response = await fetch('/api/diagnosis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sex: sex,
      age: { value: age },
      evidence: evidence
    })
  });

  const data = await response.json();
  showQuestion(data);
}

async function showQuestion(data) {
  const box = document.getElementById('question-box');
  const summary = document.getElementById('summary-box');
  box.innerHTML = '';
  summary.innerHTML = '';

  if (data.has_emergency_evidence) {
    summary.innerHTML = `<h3 style="color:red;">⚠️ Emergency detected. Please seek immediate care.</h3>`;
  }

  if (!data.question) {
    summary.innerHTML += `<h3>Summary</h3><pre>${JSON.stringify(data.conditions, null, 2)}</pre>`;
    return;
  }

  // Add the question
  box.innerHTML = `<p>${data.question.text}</p>`;

  // Create container for buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'option-buttons';

  // Add buttons to the container
  data.question.items.forEach(item => {
    item.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.innerText = `${item.name || item.id}: ${choice.label}`;
      btn.onclick = () => answerQuestion(item.id, choice.id);
      buttonContainer.appendChild(btn);
    });
  });

  // Append container to question box
  box.appendChild(buttonContainer);
}

async function answerQuestion(symptomId, choiceId) {
  evidence.push({ id: symptomId, choice_id: choiceId });

  const response = await fetch('/api/diagnosis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sex: sex,
      age: { value: age },
      evidence: evidence
    })
  });

  const data = await response.json();
  showQuestion(data);
}

document.addEventListener('DOMContentLoaded', askInitialDetails);
