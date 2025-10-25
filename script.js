// --- Variables ---
const moonPhases = [
  { name: "New Moon", class: "new", effect: "The night is dark and silent. Strahd's power wanes." },
  { name: "Waxing Crescent", class: "waxing-crescent", effect: "A faint sliver of moonlight appears." },
  { name: "First Quarter", class: "first-quarter", effect: "Partial moonlight illuminates the cursed land." },
  { name: "Waxing Gibbous", class: "waxing-gibbous", effect: "The moon shines brightly, shadows grow deeper." },
  { name: "Full Moon", class: "full", effect: "The full moon bathes Barovia in silver light. Strahd's power peaks!" },
  { name: "Waning Gibbous", class: "waning-gibbous", effect: "The moonlight slowly dims, darkness returns." },
  { name: "Last Quarter", class: "last-quarter", effect: "Half of the moon is visible in the sky." },
  { name: "Waning Crescent", class: "waning-crescent", effect: "Only a faint crescent glows in the darkness." }
];

// Storage variables - using in-memory storage with localStorage fallback
let currentDay = 1;
let notes = {};
let events = {};
let quests = [];
let doneQuests = [];

// Initialize from localStorage if available
try {
  currentDay = parseInt(localStorage.getItem("campaignDay")) || 1;
  notes = JSON.parse(localStorage.getItem("dayNotes")) || {};
  
  // Parse events and ensure they're arrays
  const storedEvents = JSON.parse(localStorage.getItem("dayEvents"));
  if (storedEvents && typeof storedEvents === 'object') {
    events = {};
    for (let key in storedEvents) {
      if (Array.isArray(storedEvents[key])) {
        events[key] = storedEvents[key];
      }
    }
  }
  
  quests = JSON.parse(localStorage.getItem("quests")) || [];
  doneQuests = JSON.parse(localStorage.getItem("doneQuests")) || [];
  
  // Ensure quests are arrays
  if (!Array.isArray(quests)) quests = [];
  if (!Array.isArray(doneQuests)) doneQuests = [];
  
} catch (e) {
  console.log("Using fresh storage:", e);
  currentDay = 1;
  notes = {};
  events = {};
  quests = [];
  doneQuests = [];
}

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

// Event elements
const eventList = document.getElementById("event-list");
const newEventInput = document.getElementById("new-event");
const eventIcon = document.getElementById("event-icon");
const addEventBtn = document.getElementById("add-event");

// Map Modal
const mapModal = document.getElementById("mapModal");
const showMapBtn = document.getElementById("showMap");
const closeMap = document.getElementById("closeMap");
const mapImage = mapModal.querySelector("img");

// Quest Board
const questList = document.getElementById("quest-list");
const doneQuestList = document.getElementById("done-quest-list");
const newQuestInput = document.getElementById("new-quest");
const questDayInput = document.getElementById("quest-day");
const addQuestBtn = document.getElementById("add-quest");

// --- Helper Functions ---
function saveToStorage() {
  try {
    localStorage.setItem("campaignDay", currentDay);
    localStorage.setItem("dayNotes", JSON.stringify(notes));
    localStorage.setItem("dayEvents", JSON.stringify(events));
    localStorage.setItem("quests", JSON.stringify(quests));
    localStorage.setItem("doneQuests", JSON.stringify(doneQuests));
  } catch (e) {
    console.log("Storage not available, using in-memory only");
  }
}

// --- Calendar Functions ---
function getMoonPhaseIndex(day) {
  // Custom moon cycle: Day 1 = New Moon, Day 8 = Full Moon, Day 15 = New Moon, Day 22 = Full Moon
  
  if (day === 1 || day === 15) return 0; // New Moon
  if (day === 8 || day === 22) return 4; // Full Moon
  
  // Days 2-7: New to Full
  if (day === 2 || day === 3) return 1; // Waxing Crescent
  if (day === 4 || day === 5) return 2; // First Quarter
  if (day === 6 || day === 7) return 3; // Waxing Gibbous
  
  // Days 9-14: Full to New
  if (day === 9 || day === 10) return 5; // Waning Gibbous
  if (day === 11 || day === 12) return 6; // Last Quarter
  if (day === 13 || day === 14) return 7; // Waning Crescent
  
  // Days 16-21: New to Full
  if (day === 16 || day === 17) return 1; // Waxing Crescent
  if (day === 18 || day === 19) return 2; // First Quarter
  if (day === 20 || day === 21) return 3; // Waxing Gibbous
  
  // Days 23-28: Full to New
  if (day === 23 || day === 24) return 5; // Waning Gibbous
  if (day === 25 || day === 26) return 6; // Last Quarter
  if (day === 27 || day === 28) return 7; // Waning Crescent
  
  return 0; // Default to New Moon
}

function updateCalendar() {
  const phase = moonPhases[getMoonPhaseIndex(currentDay)];
  dayDisplay.textContent = `Campaign Day: ${currentDay}`;
  moonDisplay.className = `moon ${phase.class}`;
  moonName.textContent = phase.name;
  moonEffect.textContent = phase.effect;
  saveToStorage();
  renderGrid();
}

function renderGrid() {
  calendarGrid.innerHTML = "";
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Add day names
  daysOfWeek.forEach(d => {
    const div = document.createElement("div");
    div.classList.add("day-name");
    div.textContent = d;
    calendarGrid.appendChild(div);
  });

  // Add all 28 days
  for (let i = 1; i <= 28; i++) {
    const phase = moonPhases[getMoonPhaseIndex(i)];
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    if (i === currentDay) dayDiv.classList.add("current");
    
    // Create day content
    const dayNumber = document.createElement("span");
    dayNumber.textContent = i;
    dayDiv.appendChild(dayNumber);
    
    // Create moon element
    const moonDiv = document.createElement("div");
    moonDiv.className = `moon ${phase.class}`;
    moonDiv.title = phase.name;
    dayDiv.appendChild(moonDiv);
    
    // Add events if they exist
    if (events[i] && Array.isArray(events[i]) && events[i].length > 0) {
      const eventsDiv = document.createElement("div");
      eventsDiv.className = "day-events";
      
      events[i].forEach(event => {
        const eventDiv = document.createElement("div");
        eventDiv.title = event.text;
        eventDiv.textContent = `${event.icon ? event.icon + " " : ""}${event.text}`;
        eventsDiv.appendChild(eventDiv);
      });
      
      dayDiv.appendChild(eventsDiv);
    }
    
    dayDiv.addEventListener("click", () => openNotesModal(i));
    calendarGrid.appendChild(dayDiv);
  }
}

// --- Notes & Events Modal ---
function openNotesModal(day) {
  modalDay.textContent = day;
  modalNotes.value = notes[day] || "";
  renderEventList(day);
  notesModal.style.display = "block";
}

function renderEventList(day) {
  eventList.innerHTML = "";
  const dayEvents = events[day] || [];
  
  if (!Array.isArray(dayEvents)) {
    events[day] = [];
    return;
  }
  
  dayEvents.forEach((event, idx) => {
    const li = document.createElement("li");
    const textSpan = document.createElement("span");
    textSpan.textContent = `${event.icon ? event.icon + " " : ""}${event.text}`;
    li.appendChild(textSpan);
    
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.title = "Delete event";
    delBtn.addEventListener("click", () => {
      events[day].splice(idx, 1);
      if (events[day].length === 0) delete events[day];
      saveToStorage();
      renderEventList(day);
      renderGrid();
    });
    li.appendChild(delBtn);
    eventList.appendChild(li);
  });
}

addEventBtn.addEventListener("click", () => {
  const day = parseInt(modalDay.textContent);
  const text = newEventInput.value.trim();
  if (!text) return;
  
  if (!events[day]) events[day] = [];
  events[day].push({
    text: text,
    icon: eventIcon.value
  });
  
  newEventInput.value = "";
  eventIcon.value = "";
  saveToStorage();
  renderEventList(day);
  renderGrid();
});

// Allow Enter key to add event
newEventInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addEventBtn.click();
  }
});

saveNotes.addEventListener("click", () => {
  const day = modalDay.textContent;
  notes[day] = modalNotes.value;
  saveToStorage();
  notesModal.style.display = "none";
});

closeNotes.addEventListener("click", () => notesModal.style.display = "none");

// --- Day Controls ---
document.getElementById("nextDay").addEventListener("click", () => {
  currentDay = currentDay === 28 ? 1 : currentDay + 1;
  updateCalendar();
});

document.getElementById("prevDay").addEventListener("click", () => {
  currentDay = currentDay === 1 ? 28 : currentDay - 1;
  updateCalendar();
});

document.getElementById("jumpButton").addEventListener("click", () => {
  let newDay = parseInt(document.getElementById("jumpInput").value);
  if (!isNaN(newDay) && newDay >= 1 && newDay <= 28) {
    currentDay = newDay;
    document.getElementById("jumpInput").value = "";
    updateCalendar();
  }
});

// Allow Enter key to jump to day
document.getElementById("jumpInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("jumpButton").click();
  }
});

// --- Dice Roller ---
rollDice.addEventListener("click", () => {
  const sides = parseInt(diceType.value);
  const result = Math.floor(Math.random() * sides) + 1;
  diceResult.textContent = `Result: ${result}`;
  
  // Add animation by removing and re-adding
  diceResult.style.animation = 'none';
  setTimeout(() => {
    diceResult.style.animation = '';
  }, 10);
});

// --- Map Modal with Drag & Zoom ---
let scale = 1, isDragging = false, hasDragged = false, startX, startY, translateX = 0, translateY = 0;

showMapBtn.addEventListener("click", () => mapModal.style.display = "flex");
closeMap.addEventListener("click", () => { 
  mapModal.style.display = "none"; 
  resetMap(); 
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

mapImage.addEventListener("click", (e) => {
  if (hasDragged) return;
  e.stopPropagation();
  const rect = mapImage.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  const imgCenterX = rect.width / 2;
  const imgCenterY = rect.height / 2;
  
  if (scale !== 1) { 
    scale = 1; 
    translateX = 0; 
    translateY = 0; 
  } else { 
    const newScale = 2; 
    translateX = imgCenterX - (clickX * newScale); 
    translateY = imgCenterY - (clickY * newScale); 
    scale = newScale; 
  }
  updateTransform();
});

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

mapImage.addEventListener("wheel", (e) => { 
  e.preventDefault(); 
  const rect = mapImage.getBoundingClientRect(); 
  const mouseX = e.clientX - rect.left; 
  const mouseY = e.clientY - rect.top; 
  const oldScale = scale; 
  const delta = e.deltaY < 0 ? 1.1 : 0.9; 
  const newScale = Math.min(Math.max(0.5, scale * delta), 4); 
  const ratio = newScale / oldScale; 
  translateX = mouseX - (mouseX - translateX) * ratio; 
  translateY = mouseY - (mouseY - translateY) * ratio; 
  scale = newScale; 
  updateTransform(); 
});

// --- Quest Board ---
function renderQuests() {
  questList.innerHTML = "";
  doneQuestList.innerHTML = "";

  quests.forEach((q, idx) => {
    const li = document.createElement("li");

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        doneQuests.push(q);
        quests.splice(idx, 1);
        saveToStorage();
        renderQuests();
      }
    });
    li.appendChild(checkbox);

    // Text
    const textSpan = document.createElement("span");
    textSpan.textContent = q.day ? `Day ${q.day}: ${q.text}` : q.text;
    textSpan.style.flex = "1";
    li.appendChild(textSpan);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.title = "Delete quest";
    delBtn.addEventListener("click", () => {
      quests.splice(idx, 1);
      saveToStorage();
      renderQuests();
    });
    li.appendChild(delBtn);

    questList.appendChild(li);
  });

  doneQuests.forEach((q, idx) => {
    const li = document.createElement("li");
    li.classList.add("completed");

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.addEventListener("change", () => {
      if (!checkbox.checked) {
        quests.push(q);
        doneQuests.splice(idx, 1);
        saveToStorage();
        renderQuests();
      }
    });
    li.appendChild(checkbox);

    // Text
    const textSpan = document.createElement("span");
    textSpan.textContent = q.day ? `Day ${q.day}: ${q.text}` : q.text;
    textSpan.style.flex = "1";
    li.appendChild(textSpan);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.title = "Delete quest";
    delBtn.addEventListener("click", () => {
      doneQuests.splice(idx, 1);
      saveToStorage();
      renderQuests();
    });
    li.appendChild(delBtn);

    doneQuestList.appendChild(li);
  });
}

addQuestBtn.addEventListener("click", () => {
  const text = newQuestInput.value.trim();
  if (!text) return;
  const day = parseInt(questDayInput.value);
  quests.push(day && day >= 1 && day <= 28 ? { text, day } : { text });
  newQuestInput.value = "";
  questDayInput.value = "";
  saveToStorage();
  renderQuests();
});

// Allow Enter key to add quest
newQuestInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addQuestBtn.click();
  }
});

// --- Modal Click Outside to Close ---
window.addEventListener("click", (e) => { 
  if (e.target === notesModal) notesModal.style.display = "none"; 
  if (e.target === mapModal) { 
    mapModal.style.display = "none"; 
    resetMap(); 
  }
});

// --- Initialize ---
updateCalendar();
renderQuests();