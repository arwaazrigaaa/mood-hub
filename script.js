// ---------- Data ----------
// Each mood has an emoji, a label and a score (1 = worst, 5 = best).
const MOODS = [
  { emoji: "😢", label: "Awful", score: 1 },
  { emoji: "😕", label: "Bad", score: 2 },
  { emoji: "😐", label: "Okay", score: 3 },
  { emoji: "🙂", label: "Good", score: 4 },
  { emoji: "😄", label: "Great", score: 5 },
];

const STORAGE_KEY = "mood-hub-entries";

// Entries are saved in the browser (localStorage) so they survive a refresh.
let entries = loadEntries();
let selectedMood = null;

// ---------- Grab HTML elements ----------
const moodPicker = document.getElementById("mood-picker");
const noteInput = document.getElementById("note");
const saveBtn = document.getElementById("save-btn");
const historyList = document.getElementById("history");
const emptyMessage = document.getElementById("empty-message");
const statTotal = document.getElementById("stat-total");
const statStreak = document.getElementById("stat-streak");
const statAverage = document.getElementById("stat-average");

// ---------- Storage ----------
function loadEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ---------- Mood picker ----------
function renderMoodPicker() {
  MOODS.forEach((mood) => {
    const btn = document.createElement("button");
    btn.className = "mood-btn";
    btn.textContent = mood.emoji;
    btn.title = mood.label;

    btn.addEventListener("click", () => {
      selectedMood = mood;
      // Highlight only the clicked button
      document.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      saveBtn.disabled = false;
    });

    moodPicker.appendChild(btn);
  });
}

// ---------- Add / delete ----------
function addEntry() {
  if (!selectedMood) return;

  const entry = {
    id: Date.now(), // simple unique id
    score: selectedMood.score,
    note: noteInput.value.trim(),
    date: new Date().toISOString(),
  };

  entries.unshift(entry); // newest first
  saveEntries();

  // Reset the form
  selectedMood = null;
  noteInput.value = "";
  saveBtn.disabled = true;
  document.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("selected"));

  render();
}

function deleteEntry(id) {
  entries = entries.filter((entry) => entry.id !== id);
  saveEntries();
  render();
}

// ---------- Stats ----------
// Turns a date into "YYYY-MM-DD" in local time, so we can compare days.
function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Number of consecutive days (ending today or yesterday) with at least one entry.
function computeStreak() {
  const days = new Set(entries.map((e) => dayKey(e.date)));
  const cursor = new Date();

  // If nothing logged today, the streak can still continue from yesterday.
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Average mood over the last 7 days, shown as the closest emoji.
function computeWeeklyMood() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => new Date(e.date).getTime() >= weekAgo);
  if (recent.length === 0) return "–";

  const avg = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
  return MOODS[Math.round(avg) - 1].emoji;
}

// ---------- Render ----------
function render() {
  // History
  historyList.innerHTML = "";
  entries.forEach((entry) => {
    const mood = MOODS[entry.score - 1];
    const li = document.createElement("li");
    li.className = "entry";

    const emoji = document.createElement("span");
    emoji.className = "entry-emoji";
    emoji.textContent = mood.emoji;

    const info = document.createElement("div");
    info.className = "entry-info";

    const date = document.createElement("div");
    date.className = "entry-date";
    date.textContent = new Date(entry.date).toLocaleString();
    info.appendChild(date);

    if (entry.note) {
      const note = document.createElement("div");
      note.className = "entry-note";
      note.textContent = entry.note; // textContent (not innerHTML) = safe from HTML injection
      info.appendChild(note);
    }

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "✕";
    del.title = "Delete";
    del.addEventListener("click", () => deleteEntry(entry.id));

    li.append(emoji, info, del);
    historyList.appendChild(li);
  });

  emptyMessage.style.display = entries.length === 0 ? "block" : "none";

  // Stats
  statTotal.textContent = entries.length;
  statStreak.textContent = computeStreak();
  statAverage.textContent = computeWeeklyMood();
}

// ---------- Start ----------
saveBtn.addEventListener("click", addEntry);
renderMoodPicker();
render();
