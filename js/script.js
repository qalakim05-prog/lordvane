/* Lord Vane Lair Rentals - Service Estimator */

// ---------- Pricing data ----------
const SERVICES = {
  barracks: { label: "Henchman Barracks Deep Clean", rate: 80 },
  laser:    { label: "Laser Security Grid Calibration", rate: 120 },
  escape:   { label: "Trapdoor and Escape Pod Repair", rate: 150 },
  shark:    { label: "Shark Tank and Moat Maintenance", rate: 200 },
  deathray: { label: "Death Ray Recalibration", rate: 300 }
};

const CONDITIONS = {
  worn:    { label: "Lightly worn", multiplier: 1.0 },
  damaged: { label: "Damaged by a hero raid", multiplier: 1.5 },
  ruined:  { label: "Partly exploded", multiplier: 2.2 }
};

const URGENCY = {
  standard:  { label: "Standard (within 7 days)", multiplier: 1.0 },
  express:   { label: "Express (within 48 hours)", multiplier: 1.3 },
  emergency: { label: "Emergency (before the hero arrives)", multiplier: 1.8 }
};

const EXTRAS = {
  heroproof: { label: "Hero-proof coating", fee: 250 },
  evidence:  { label: "Evidence disposal", fee: 180 },
  lighting:  { label: "Dramatic fog and lighting", fee: 90 }
};

// ---------- Helpers ----------
function formatMoney(amount) {
  return "RM " + amount.toFixed(2);
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function setError(id, message) {
  document.getElementById(id).textContent = message;
}

function clearErrors() {
  const errors = document.querySelectorAll(".error");
  for (let i = 0; i < errors.length; i++) {
    errors[i].textContent = "";
  }
}

// ---------- Client-side validation ----------
// Returns an object { valid: true/false, messages: [...] }
function validateForm() {
  clearErrors();
  const messages = [];

  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const service = document.getElementById("serviceType").value;
  const chambersRaw = document.getElementById("chambers").value.trim();
  const condition = document.querySelector('input[name="condition"]:checked');
  const urgency = document.getElementById("urgency").value;
  const terms = document.getElementById("terms").checked;

  // Name: required, at least 3 characters, letters/spaces/common name symbols only
  const namePattern = /^[A-Za-z][A-Za-z\s'.\-]{2,}$/;
  if (name === "") {
    setError("nameError", "Please enter your villain name.");
    messages.push("Name is required.");
  } else if (!namePattern.test(name)) {
    setError("nameError", "Use at least 3 letters. Numbers are not allowed.");
    messages.push("Name is invalid.");
  }

  // Email: required and valid format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (email === "") {
    setError("emailError", "Please enter your email.");
    messages.push("Email is required.");
  } else if (!emailPattern.test(email)) {
    setError("emailError", "Enter a valid email, such as you@secretlair.com.");
    messages.push("Email format is invalid.");
  }

  // Service type
  if (service === "") {
    setError("serviceError", "Please choose a service.");
    messages.push("Service type is required.");
  }

  // Number of chambers: required, numeric, whole number, 1 to 50
  const chambers = Number(chambersRaw);
  if (chambersRaw === "") {
    setError("chambersError", "Please enter the number of chambers.");
    messages.push("Number of chambers is required.");
  } else if (isNaN(chambers) || !Number.isInteger(chambers)) {
    setError("chambersError", "Chambers must be a whole number.");
    messages.push("Chambers must be a whole number.");
  } else if (chambers < 1 || chambers > 50) {
    setError("chambersError", "Chambers must be between 1 and 50.");
    messages.push("Chambers must be between 1 and 50.");
  }

  // Condition
  if (!condition) {
    setError("conditionError", "Please select the condition of the lair.");
    messages.push("Condition is required.");
  }

  // Urgency
  if (urgency === "") {
    setError("urgencyError", "Please choose how urgent the job is.");
    messages.push("Urgency is required.");
  }

  // Confirmation checkbox
  if (!terms) {
    setError("termsError", "You must confirm you are not a hero in disguise.");
    messages.push("Confirmation is required.");
  }

  return { valid: messages.length === 0, messages: messages };
}

// ---------- Calculation ----------
function calculateCharge(serviceKey, chambers, conditionKey, urgencyKey, extraKeys) {
  const service = SERVICES[serviceKey];
  const condition = CONDITIONS[conditionKey];
  const urgency = URGENCY[urgencyKey];

  const baseTotal = service.rate * chambers;
  const afterCondition = baseTotal * condition.multiplier;
  const afterUrgency = afterCondition * urgency.multiplier;

  let extrasTotal = 0;
  for (let i = 0; i < extraKeys.length; i++) {
    extrasTotal += EXTRAS[extraKeys[i]].fee;
  }

  return {
    baseTotal: baseTotal,
    afterCondition: afterCondition,
    afterUrgency: afterUrgency,
    extrasTotal: extrasTotal,
    total: afterUrgency + extrasTotal
  };
}

// ---------- Display ----------
function displayResult(data, calc) {
  const result = document.getElementById("result");

  let extrasHTML = "<li>None selected</li>";
  if (data.extraKeys.length > 0) {
    extrasHTML = "";
    for (let i = 0; i < data.extraKeys.length; i++) {
      const extra = EXTRAS[data.extraKeys[i]];
      extrasHTML += "<li>" + extra.label + ": " + formatMoney(extra.fee) + "</li>";
    }
  }

  result.innerHTML =
    "<h3>Quote for " + escapeHTML(data.name) + "</h3>" +
    "<p class=\"muted\">Sent to: " + escapeHTML(data.email) + "</p>" +
    "<table><tbody>" +
    "<tr><td>Service</td><td>" + SERVICES[data.service].label + "</td></tr>" +
    "<tr><td>Base rate</td><td>" + formatMoney(SERVICES[data.service].rate) + " per chamber</td></tr>" +
    "<tr><td>Chambers</td><td>" + data.chambers + "</td></tr>" +
    "<tr><td>Base total</td><td>" + formatMoney(calc.baseTotal) + "</td></tr>" +
    "<tr><td>Condition: " + CONDITIONS[data.condition].label + " (x " + CONDITIONS[data.condition].multiplier.toFixed(1) + ")</td><td>" + formatMoney(calc.afterCondition) + "</td></tr>" +
    "<tr><td>Urgency: " + URGENCY[data.urgency].label + " (x " + URGENCY[data.urgency].multiplier.toFixed(1) + ")</td><td>" + formatMoney(calc.afterUrgency) + "</td></tr>" +
    "<tr><td>Extras</td><td>" + formatMoney(calc.extrasTotal) + "</td></tr>" +
    "</tbody></table>" +
    "<ul class=\"extras-list\">" + extrasHTML + "</ul>" +
    "<p class=\"total\">Total service charge: " + formatMoney(calc.total) + "</p>" +
    "<p class=\"note\">Rule applied: (base rate x chambers x condition x urgency) + extras.</p>";

  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------- Form handling ----------
function handleSubmit(event) {
  event.preventDefault();

  const check = validateForm();
  if (!check.valid) {
    document.getElementById("result").hidden = true;
    alert("Invalid input, please check your form.\n\n- " + check.messages.join("\n- "));
    return;
  }

  // Read form values from the DOM and convert numeric input to a number
  const data = {
    name: document.getElementById("customerName").value.trim(),
    email: document.getElementById("customerEmail").value.trim(),
    service: document.getElementById("serviceType").value,
    chambers: Number(document.getElementById("chambers").value),
    condition: document.querySelector('input[name="condition"]:checked').value,
    urgency: document.getElementById("urgency").value,
    extraKeys: []
  };

  const extraBoxes = document.querySelectorAll('input[name="extras"]:checked');
  for (let i = 0; i < extraBoxes.length; i++) {
    data.extraKeys.push(extraBoxes[i].value);
  }

  const calc = calculateCharge(data.service, data.chambers, data.condition, data.urgency, data.extraKeys);
  displayResult(data, calc);
  alert("Calculation complete! Your total is " + formatMoney(calc.total) + ".");
}

function handleReset() {
  if (confirm("Clear the form and start over?")) {
    document.getElementById("estimatorForm").reset();
    clearErrors();
    document.getElementById("result").hidden = true;
  }
}

document.getElementById("estimatorForm").addEventListener("submit", handleSubmit);
document.getElementById("resetBtn").addEventListener("click", handleReset);
