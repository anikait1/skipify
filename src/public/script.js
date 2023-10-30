let rangeStart;
let rangeStop;
let automationSelection;
let automationSubmit;

document.addEventListener("DOMContentLoaded", initialize);

function initialize(event) {
  setupDOMNodesAndEvents();
  resetAutomationInputFields();

  document.addEventListener(
    "htmx:afterSettle",
    updateNodesForAutomationInputSwap
  );
}

function setupDOMNodesAndEvents() {
  automationSelection = document.querySelector("#automation-type");
  rangeStart = document.querySelector("#range-start");
  rangeStop = document.querySelector("#range-stop");
  automationSubmit = document.querySelector("#submit-automation");

  automationSelection.addEventListener(
    "change",
    handleAutomationRangeSelection
  );
}

function updateNodesForAutomationInputSwap(event) {
  if (event.detail.elt.id !== "automation-input") {
    return;
  }

  setupDOMNodesAndEvents();
}

function resetAutomationInputFields() {
  automationSubmit.disabled = true;
  automationSelection.selectedIndex = 0;
  rangeStart.disabled = true;
  rangeStop.disabled = true;
}

function handleAutomationRangeSelection(event) {
  automationSubmit.disabled = false;
  if (event.target.value === "RANGE:START") {
    rangeStart.disabled = false;
    rangeStart.required = true;

    rangeStop.disabled = true;
    rangeStop.required = false;
  }

  if (event.target.value === "RANGE:BETWEEN") {
    rangeStart.disabled = false;
    rangeStart.required = true;

    rangeStop.required = true;
    rangeStop.disabled = false;
  }
}
