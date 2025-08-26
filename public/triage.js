// --- Question Rendering ---
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

    if (data.question.type === "group_multiple") {
      const selections = new Set();
      (data.question.items || []).forEach(item => {
        item.choices.forEach(choice => {
          const label = document.createElement("label");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = choice.id;
          checkbox.onchange = () => {
            if (checkbox.checked) {
              selections.add({ id: item.id, choice_id: choice.id });
            } else {
              selections.forEach(sel => {
                if (sel.id === item.id && sel.choice_id === choice.id) {
                  selections.delete(sel);
                }
              });
            }
            // Auto-submit when all items have at least one selected choice
            const allItemsSelected = (data.question.items || []).every(i =>
              [...selections].some(sel => sel.id === i.id)
            );
            if (allItemsSelected) {
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
      // Single choice
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
