// ---------- STATE ----------
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let user = localStorage.getItem("user");
let currentFilter = "all";
let selectedDate = todayStr();

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_PX = 60;

// ---------- ELEMENTS ----------
const $ = (id) => document.getElementById(id);

const loginScreen = $("login-screen");
const homeScreen = $("home-screen");
const calendarScreen = $("calendar-screen");
const screens = [loginScreen, homeScreen, calendarScreen];

const addBtn = $("add-btn");
const bottomNav = $("bottom-nav");
const modal = $("modal");

// ---------- HELPERS ----------
function todayStr() {
  const d = new Date();
  return toISO(d);
}

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function sortedTasks(list) {
  return [...list].sort((a, b) =>
    (a.date + a.start).localeCompare(b.date + b.start)
  );
}

function formatDate(str) {
  return parseDate(str).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning!";
  if (h < 17) return "Good Afternoon!";
  return "Good Evening!";
}

function statusLabel(s) {
  if (s === "in-progress") return "In-progress";
  if (s === "completed") return "Completed";
  return "Pending";
}

// ---------- SCREENS ----------
function showScreen(id) {
  screens.forEach((s) => s.classList.add("hidden"));
  $(id).classList.remove("hidden");

  const loggedIn = id !== "login-screen";
  addBtn.classList.toggle("hidden", !loggedIn);
  bottomNav.classList.toggle("hidden", !loggedIn);

  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.screen === id);
  });

  if (id === "home-screen") renderHome();
  if (id === "calendar-screen") renderCalendar();
}

// ---------- LOGIN ----------
$("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("login-email").value.trim();
  const name = email.split("@")[0];
  user = name.charAt(0).toUpperCase() + name.slice(1);
  localStorage.setItem("user", user);
  showScreen("home-screen");
});

$("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("user");
  user = null;
  $("login-form").reset();
  showScreen("login-screen");
});

// ---------- HOME ----------
function renderHome() {
  $("user-name").textContent = user;
  $("avatar").textContent = user.charAt(0).toUpperCase();
  document.querySelector(".user small").textContent = greeting();

  renderCards();
  renderTodayList();
}

function renderCards() {
  const box = $("cards");
  box.innerHTML = "";

  let list = tasks;
  if (currentFilter !== "all") {
    list = tasks.filter((t) => t.status === currentFilter);
  }
  list = sortedTasks(list);

  if (list.length === 0) {
    box.innerHTML = '<p class="empty">No tasks here.</p>';
    return;
  }

  list.forEach((t) => {
    const card = document.createElement("div");
    card.className = "card";

    const tags = document.createElement("div");
    tags.className = "tags";

    const tag = document.createElement("span");
    tag.className = "tag " + t.status;
    tag.textContent = statusLabel(t.status);
    tags.appendChild(tag);

    const title = document.createElement("h4");
    title.textContent = t.title;

    const date = document.createElement("small");
    date.textContent = formatDate(t.date);

    card.append(tags, title, date);
    card.addEventListener("click", () => openModal(t.id));
    box.appendChild(card);
  });
}

function renderTodayList() {
  const box = $("today-list");
  box.innerHTML = "";

  const list = sortedTasks(tasks.filter((t) => t.date === todayStr()));

  if (list.length === 0) {
    box.innerHTML = '<p class="empty">No tasks for today. Tap + to add one.</p>';
    return;
  }

  list.forEach((t) => box.appendChild(buildTaskItem(t)));
}

function buildTaskItem(t) {
  const item = document.createElement("div");
  item.className = "task-item" + (t.status === "completed" ? " completed" : "");

  const info = document.createElement("div");
  const h4 = document.createElement("h4");
  h4.textContent = t.title;
  const desc = document.createElement("p");
  desc.textContent = t.desc || "No description";
  const time = document.createElement("p");
  time.textContent = `${t.start} - ${t.end}`;
  info.append(h4, desc, time);

  const menuBtn = document.createElement("button");
  menuBtn.className = "task-menu-btn";
  menuBtn.textContent = "⋮";
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = item.querySelector(".menu-popup");
    closeMenus();
    if (!open) item.appendChild(buildMenu(t));
  });

  item.append(info, menuBtn);
  return item;
}

function buildMenu(t) {
  const menu = document.createElement("div");
  menu.className = "menu-popup";

  const doneBtn = document.createElement("button");
  doneBtn.textContent = t.status === "completed" ? "Mark pending" : "Mark done";
  doneBtn.addEventListener("click", () => {
    t.status = t.status === "completed" ? "pending" : "completed";
    saveTasks();
    refresh();
  });

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => openModal(t.id));

  const delBtn = document.createElement("button");
  delBtn.className = "delete";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", () => {
    tasks = tasks.filter((x) => x.id !== t.id);
    saveTasks();
    refresh();
  });

  menu.append(doneBtn, editBtn, delBtn);
  return menu;
}

function closeMenus() {
  document.querySelectorAll(".menu-popup").forEach((m) => m.remove());
}

document.addEventListener("click", closeMenus);

// tabs
$("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  renderCards();
});

// ---------- CALENDAR ----------
function renderCalendar() {
  const sel = parseDate(selectedDate);

  $("month-label").textContent = sel.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  renderWeekStrip(sel);
  renderTimeline();
}

function renderWeekStrip(sel) {
  const strip = $("week-strip");
  strip.innerHTML = "";

  // week starts Monday
  const monday = new Date(sel);
  const diff = (sel.getDay() + 6) % 7;
  monday.setDate(sel.getDate() - diff);

  const names = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toISO(d);

    const el = document.createElement("div");
    el.className = "day" + (iso === selectedDate ? " selected" : "");
    el.innerHTML = `${names[i]}<b>${d.getDate()}</b>`;
    el.addEventListener("click", () => {
      selectedDate = iso;
      renderCalendar();
    });
    strip.appendChild(el);
  }
}

function renderTimeline() {
  const box = $("timeline");
  box.innerHTML = "";

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const row = document.createElement("div");
    row.className = "time-row";
    row.innerHTML = `<span>${String(h).padStart(2, "0")}:00</span>`;
    box.appendChild(row);
  }

  const dayTasks = tasks.filter((t) => t.date === selectedDate);

  dayTasks.forEach((t) => {
    const startMin = toMinutes(t.start);
    const endMin = toMinutes(t.end);
    const top = ((startMin - START_HOUR * 60) / 60) * HOUR_PX;
    const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 30);

    if (top < 0 || top > (END_HOUR - START_HOUR) * HOUR_PX) return;

    const block = document.createElement("div");
    block.className = "event-block";
    block.style.top = top + "px";
    block.style.height = height + "px";
    block.innerHTML = `${escapeHTML(t.title)}<small>${t.start} - ${t.end}</small>`;
    block.addEventListener("click", () => openModal(t.id));
    box.appendChild(block);
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- NAVIGATION ----------
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => showScreen(btn.dataset.screen));
});

$("back-btn").addEventListener("click", () => showScreen("home-screen"));

// ---------- MODAL (ADD / EDIT) ----------
function openModal(id) {
  closeMenus();
  const form = $("task-form");
  form.reset();

  if (id) {
    const t = tasks.find((x) => x.id === id);
    $("modal-title").textContent = "Edit Task";
    $("task-id").value = t.id;
    $("task-title").value = t.title;
    $("task-desc").value = t.desc;
    $("task-date").value = t.date;
    $("task-start").value = t.start;
    $("task-end").value = t.end;
    $("task-status").value = t.status;
  } else {
    $("modal-title").textContent = "Add Task";
    $("task-id").value = "";
    $("task-date").value = isCalendarOpen() ? selectedDate : todayStr();
    $("task-start").value = "10:00";
    $("task-end").value = "11:00";
    $("task-status").value = "pending";
  }

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

function isCalendarOpen() {
  return !calendarScreen.classList.contains("hidden");
}

function refresh() {
  if (isCalendarOpen()) renderCalendar();
  else renderHome();
}

addBtn.addEventListener("click", () => openModal());
$("cancel-btn").addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

$("task-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const start = $("task-start").value;
  const end = $("task-end").value;

  if (toMinutes(end) <= toMinutes(start)) {
    alert("End time start time se baad ka hona chahiye.");
    return;
  }

  const data = {
    title: $("task-title").value.trim(),
    desc: $("task-desc").value.trim(),
    date: $("task-date").value,
    start: start,
    end: end,
    status: $("task-status").value,
  };

  const id = $("task-id").value;

  if (id) {
    tasks = tasks.map((t) => (t.id === Number(id) ? { ...t, ...data } : t));
  } else {
    tasks.push({ id: Date.now(), ...data });
  }

  saveTasks();
  closeModal();
  refresh();
});

// ---------- INIT ----------
if (user) {
  showScreen("home-screen");
} else {
  showScreen("login-screen");
}