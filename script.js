// --- Variables ---
const moonPhases = [
  { name: "New Moon", class: "new", effect: "The night is dark and silent." },
  { name: "Waxing Crescent", class: "waxing", effect: "A faint sliver of moonlight appears." },
  { name: "First Quarter", class: "first", effect: "Partial moonlight illuminates the land." },
  { name: "Waxing Gibbous", class: "waxing-gibbous", effect: "The moon shines brightly in the sky." },
  { name: "Full Moon", class: "full", effect: "The full moon bathes Barovia in silver light." },
  { name: "Waning Gibbous", class: "waning-gibbous", effect: "The moonlight slowly dims." },
  { name: "Last Quarter", class: "last", effect: "Half of the moon is visible in the sky." },
  { name: "Waning Crescent", class: "waning", effect: "Only a faint crescent glows in the darkness." }
];

const totalDays = 29;
let currentDay = parseInt(localStorage.getItem("campaignDay")) || 1;
let notes = JSON.parse(localStorage.getItem("dayNotes")) || {};

// --- DOM Elements ---
const dayDisplay = document.getElementById("day-display");
const moonDisplay = document.querySelector(".moon-display .moon");
const moonName = document.getElementById("moon-name");
const moonEffect = document.getElementById("moon-effect");
const calendarGrid = document.getElementById("calendar-grid");

// Dice
const diceType = document.getElementById("diceType");
const rollDice = document.getElementById("rollDice");
const diceResult = document.getElementById("diceResult");

// Notes Modal
const notesModal = document.getElementById("notesModal");
const modalDay = document.getElementById("modalDay");
const modalNotes = document.getElementById("modalNotes");
const saveNotes = document.getElementById("saveNotes");
const closeNotes = document.getElementById("closeNotes");

// Map Modal
const mapModal = document.getElementById("mapModal");
const showMapBtn = document.getElementById("showMap");
const closeMap = document.getElementById("closeMap");
const mapImage = mapModal.querySelector("img");

// --- Calendar Functions ---
function getMoonPhaseIndex(day) {
  const lunarDay = day % 29.53;
  if (lunarDay < 4) return 0;
  if (lunarDay < 8) return 1;
  if (lunarDay < 11) return 2;
  if (lunarDay < 15) return 3;
  if (lunarDay < 19) return 4;
  if (lunarDay < 23) return 5;
  if (lunarDay < 27) return 6;
  return 7;
}

function updateCalendar() {
  const phase = moonPhases[getMoonPhaseIndex(currentDay)];
  dayDisplay.textContent = `Campaign Day: ${currentDay}`;
  moonDisplay.className = `moon ${phase.class}`;
  moonName.textContent = phase.name;
  moonEffect.textContent = phase.effect;
  localStorage.setItem("campaignDay", currentDay);
  renderGrid();
}

function renderGrid() {
  calendarGrid.querySelectorAll(".day").forEach(d => d.remove());
  for (let i = 1; i <= totalDays; i++) {
    const phase = moonPhases[getMoonPhaseIndex(i)];
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    if (i === currentDay) dayDiv.classList.add("current");
    dayDiv.innerHTML = `
      <span>${i}</span>
      <div class="moon ${phase.class}" title="${phase.name}"></div>
    `;
    dayDiv.addEventListener("click", () => {
      if (currentDay === i) {
        // Clicked the same day twice - open notes
        openNotesModal(i);
      } else {
        // First click - just select the day
        currentDay = i;
        updateCalendar();
      }
    });
    calendarGrid.appendChild(dayDiv);
  }
}

// --- Notes Modal ---
function openNotesModal(day) {
  modalDay.textContent = day;
  modalNotes.value = notes[day] || "";
  notesModal.style.display = "block";
}
saveNotes.addEventListener("click", () => {
  const day = modalDay.textContent;
  notes[day] = modalNotes.value;
  localStorage.setItem("dayNotes", JSON.stringify(notes));
  notesModal.style.display = "none";
});
closeNotes.addEventListener("click", () => notesModal.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === notesModal) notesModal.style.display = "none";
});

// --- Day Controls ---
document.getElementById("nextDay").addEventListener("click", () => {
  currentDay = currentDay === totalDays ? 1 : currentDay + 1;
  updateCalendar();
});
document.getElementById("prevDay").addEventListener("click", () => {
  currentDay = currentDay === 1 ? totalDays : currentDay - 1;
  updateCalendar();
});
document.getElementById("jumpButton").addEventListener("click", () => {
  let newDay = parseInt(document.getElementById("jumpInput").value);
  if (!isNaN(newDay) && newDay >= 1) {
    currentDay = ((newDay - 1) % totalDays) + 1;
    updateCalendar();
  }
});

// --- Dice ---
rollDice.addEventListener("click", () => {
  const sides = parseInt(diceType.value);
  const result = Math.floor(Math.random() * sides) + 1;
  diceResult.textContent = `Result: ${result}`;
});

// --- Map Modal: Drag & Zoom ---
let scale = 1;
let isDragging = false;
let hasDragged = false;
let startX, startY;
let translateX = 0, translateY = 0;

// Open/close map modal
showMapBtn.addEventListener("click", () => {
  mapModal.style.display = "flex";
});
closeMap.addEventListener("click", () => {
  mapModal.style.display = "none";
  resetMap();
});
window.addEventListener("click", e => {
  if (e.target === mapModal) {
    mapModal.style.display = "none";
    resetMap();
  }
});

function resetMap() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  updateTransform();
}

function updateTransform() {
  mapImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Click image to toggle zoom (only if not dragging)
mapImage.addEventListener("click", (e) => {
  if (hasDragged) return;
  e.stopPropagation();
  
  if (scale !== 1) {
    // Zoom out - reset to center
    scale = 1;
    translateX = 0;
    translateY = 0;
  } else {
    // Zoom in on click point
    const rect = mapImage.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Get the natural image dimensions
    const imgCenterX = rect.width / 2;
    const imgCenterY = rect.height / 2;
    
    const newScale = 2;
    
    // Calculate offset to center the clicked point
    translateX = imgCenterX - (clickX * newScale);
    translateY = imgCenterY - (clickY * newScale);
    scale = newScale;
  }
  
  updateTransform();
});

// Dragging the map
mapImage.addEventListener("mousedown", (e) => {
  e.preventDefault();
  isDragging = true;
  hasDragged = false;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
  mapImage.style.cursor = "grabbing";
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  mapImage.style.cursor = "grab";
  setTimeout(() => hasDragged = false, 10);
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  hasDragged = true;
  translateX = e.clientX - startX;
  translateY = e.clientY - startY;
  updateTransform();
});

// Zoom with mouse wheel
mapImage.addEventListener("wheel", (e) => {
  e.preventDefault();
  
  // Get the image's bounding box
  const rect = mapImage.getBoundingClientRect();
  
  // Mouse position relative to the image's current visual position
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Store old scale
  const oldScale = scale;
  
  // Calculate new scale
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  const newScale = Math.min(Math.max(0.5, scale * delta), 4);
  
  // Calculate the ratio of scale change
  const scaleRatio = newScale / oldScale;
  
  // Adjust translation to zoom towards mouse position
  translateX = mouseX - (mouseX - translateX) * scaleRatio;
  translateY = mouseY - (mouseY - translateY) * scaleRatio;
  scale = newScale;
  
  updateTransform();
});

// --- Initialize ---
updateCalendar();