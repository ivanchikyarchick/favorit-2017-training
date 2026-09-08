const STORAGE_KEY = "favorit-platform-v2";
const SESSION_KEY = "favorit-session-v2";
const ALERT_API = "https://neptun.in.ua/api/v1/alerts";
const VIEW_TITLES = {
  dashboard: "Огляд команди",
  schedule: "Розклад",
  chats: "Чати",
  roster: "Склад команди",
  tournaments: "Турніри",
  notifications: "Сповіщення",
  admin: "Адміністрування"
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nextWeekday(dayNumber, hour, minute, extraWeeks = 0) {
  const now = new Date();
  const date = new Date(now);
  let delta = (dayNumber - now.getDay() + 7) % 7;
  date.setDate(now.getDate() + delta + extraWeeks * 7);
  date.setHours(hour, minute, 0, 0);
  if (date <= now && extraWeeks === 0) date.setDate(date.getDate() + 7);
  return date.toISOString();
}

function futureDate(days, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function seedData() {
  return {
    teams: [
      { id: "team-2017", name: "Фаворит 2017", birthYear: 2017, coach: "Андрій Савчук", color: "#225ad6" },
      { id: "team-2016", name: "Фаворит 2016", birthYear: 2016, coach: "Андрій Савчук", color: "#17845d" }
    ],
    players: [
      { id: "p1", teamId: "team-2017", name: "Максим Коваленко", number: 10, position: "Півзахисник", birth: "17.04.2017", parent: "Катерина Коваленко", phone: "+380 93 234 56 78" },
      { id: "p2", teamId: "team-2017", name: "Олексій Бондар", number: 1, position: "Воротар", birth: "02.08.2017", parent: "Олена Бондар", phone: "+380 67 412 10 34" },
      { id: "p3", teamId: "team-2017", name: "Данило Мельник", number: 7, position: "Нападник", birth: "23.01.2017", parent: "Ірина Мельник", phone: "+380 99 320 18 42" },
      { id: "p4", teamId: "team-2017", name: "Матвій Шевченко", number: 4, position: "Захисник", birth: "11.10.2017", parent: "Олег Шевченко", phone: "+380 63 805 41 27" },
      { id: "p5", teamId: "team-2017", name: "Іван Кравченко", number: 8, position: "Півзахисник", birth: "06.06.2017", parent: "Наталія Кравченко", phone: "+380 95 251 44 90" },
      { id: "p6", teamId: "team-2017", name: "Тимофій Романюк", number: 11, position: "Нападник", birth: "28.03.2017", parent: "Марина Романюк", phone: "+380 68 733 12 56" },
      { id: "p7", teamId: "team-2017", name: "Марк Поліщук", number: 5, position: "Захисник", birth: "14.09.2017", parent: "Анна Поліщук", phone: "+380 97 560 38 11" },
      { id: "p8", teamId: "team-2017", name: "Артем Лисенко", number: 9, position: "Нападник", birth: "31.05.2017", parent: "Віталій Лисенко", phone: "+380 66 420 93 62" },
      { id: "p9", teamId: "team-2016", name: "Назар Петренко", number: 6, position: "Півзахисник", birth: "08.02.2016", parent: "Світлана Петренко", phone: "+380 73 118 75 20" },
      { id: "p10", teamId: "team-2016", name: "Богдан Ткаченко", number: 3, position: "Захисник", birth: "19.07.2016", parent: "Роман Ткаченко", phone: "+380 50 872 04 19" }
    ],
    events: [
      { id: "e1", teamId: "team-2017", type: "training", title: "Тренування", start: nextWeekday(1, 19, 15), end: nextWeekday(1, 20, 30), place: "Ліцей «Основа» (8 школа)", address: "Соборна, 3", poll: true },
      { id: "e2", teamId: "team-2017", type: "training", title: "Тренування", start: nextWeekday(3, 19, 15), end: nextWeekday(3, 20, 30), place: "Ліцей «Основа» (8 школа)", address: "Соборна, 3", poll: true },
      { id: "e3", teamId: "team-2017", type: "training", title: "Тренування", start: nextWeekday(4, 19, 30), end: nextWeekday(4, 20, 45), place: "Гімназія «Перспектива» (4 школа)", address: "Київський шлях, 97", poll: true },
      { id: "e4", teamId: "team-2016", type: "training", title: "Тренування", start: nextWeekday(2, 18, 0), end: nextWeekday(2, 19, 15), place: "Стадіон «Колос»", address: "вул. Київський шлях, 1", poll: true },
      { id: "e5", teamId: "team-2016", type: "training", title: "Тренування", start: nextWeekday(5, 18, 30), end: nextWeekday(5, 19, 45), place: "Стадіон «Колос»", address: "вул. Київський шлях, 1", poll: true },
      { id: "e6", teamId: "team-2017", type: "match", title: "Контрольна гра з ФК «Лівий Берег»", start: futureDate(10, 11, 0), end: futureDate(10, 12, 30), place: "Стадіон «Колос»", address: "Київський шлях, 1", poll: true }
    ],
    scheduleRules: [],
    tournaments: [
      { id: "t1", teamId: "team-2017", title: "Кубок Борисполя U-9", date: futureDate(17, 9, 0), place: "Стадіон «Колос»", status: "Реєстрацію підтверджено", note: "Збір команди о 08:15. Форма синя." },
      { id: "t2", teamId: "team-2017", title: "Осінній Favorit Cup", date: futureDate(38, 9, 30), place: "НВК «Мрія»", status: "Планується", note: "Формат 5+1, склад буде оголошено пізніше." },
      { id: "t3", teamId: "team-2016", title: "Boryspil Junior League", date: futureDate(24, 10, 0), place: "Стадіон «Колос»", status: "Реєстрацію підтверджено", note: "Груповий етап, три матчі." }
    ],
    attendance: {
      e1: { p2: "yes", p3: "yes", p4: "no", p5: "yes", p7: "yes" },
      e2: { p2: "yes", p3: "no" }
    },
    chats: [
      { id: "c1", teamId: "team-2017", title: "Фаворит 2017 — батьки", kind: "team", unread: 2 },
      { id: "c2", teamId: "team-2017", title: "Тренер Андрій", kind: "direct", unread: 0 },
      { id: "c3", teamId: "team-2016", title: "Фаворит 2016 — батьки", kind: "team", unread: 1 }
    ],
    messages: {
      c1: [
        { id: "m1", author: "Андрій Савчук", role: "coach", text: "Добрий день! Нагадую: у понеділок тренування о 19:15 в ліцеї «Основа».", time: "18:42" },
        { id: "m2", author: "Олена Бондар", role: "parent", text: "Дякую, Олексій буде.", time: "18:47" },
        { id: "m3", author: "Андрій Савчук", role: "coach", text: "Будь ласка, усі дайте відповідь в опитуванні до 14:00 дня тренування.", time: "18:51", poll: true, eventId: "e1" }
      ],
      c2: [
        { id: "m4", author: "Катерина Коваленко", role: "parent", text: "Добрий день! Максим уже може повертатися до тренувань.", time: "10:12" },
        { id: "m5", author: "Андрій Савчук", role: "coach", text: "Чудово, тоді чекаю в понеділок. Почніть без надмірного навантаження.", time: "10:26" }
      ],
      c3: [
        { id: "m6", author: "Андрій Савчук", role: "coach", text: "У п’ятницю заняття на стадіоні «Колос».", time: "09:18" }
      ]
    },
    notifications: [
      { id: "n1", type: "poll", title: "Потрібна відповідь", text: "Чи буде Максим на наступному тренуванні?", time: new Date().toISOString(), read: false },
      { id: "n2", type: "schedule", title: "Розклад оновлено", text: "Тренування в четвер починається о 19:30.", time: futureDate(-1, 18, 30), read: true }
    ],
    settings: { attendanceReminders: true, scheduleChanges: true, chatMessages: true, lastReminder: Date.now() }
  };
}

let state = loadState();
let session = loadSession();
let currentView = "dashboard";
let currentTeamId = "team-2017";
let currentChatId = "c1";
let serverMode = false;
let publicConfig = { demo: true, vapidPublicKey: "" };
const TELEGRAM_LOGIN_KEY = "favorit-telegram-login";
let telegramLogin = null;
let telegramPollTimer = null;
let telegramPolling = false;
let adminSearch = "";
const pendingMutations = new Set();
let chatSending = false;
let deferredInstallPrompt = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && saved.teams ? saved : seedData();
  } catch {
    return seedData();
  }
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function saveSession() { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }

async function apiFetch(path, options = {}, authenticated = true) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authenticated && session?.token) headers.Authorization = `Bearer ${session.token}`;
  const response = await fetch(path, { ...options, headers });
  if (response.status === 401 && authenticated) {
    signOut();
    throw new Error("Сеанс завершився. Увійдіть знову.");
  }
  if (!response.ok) {
    let message = "Не вдалося виконати дію";
    try { message = (await response.json()).detail || message; } catch {}
    throw new Error(typeof message === "string" ? message : "Перевірте заповнення полів");
  }
  return response.status === 204 ? null : response.json();
}

async function refreshServerState(render = false) {
  const data = await apiFetch("/api/bootstrap");
  const { user, ...clubState } = data;
  state = clubState;
  session = { ...session, role: user.role, userName: user.name, userId: user.id, phone: user.phone };
  saveSession();
  if (!state.teams.some(item => item.id === currentTeamId)) currentTeamId = state.teams[0]?.id || "";
  if (!state.chats.some(item => item.id === currentChatId)) currentChatId = state.chats.find(item => item.teamId === currentTeamId)?.id || "";
  if (render) { renderShell(); renderCurrentView(); }
}

async function runServerMutation(path, options, successMessage) {
  const mutationKey = `${options.method || "GET"}:${path}`;
  if (pendingMutations.has(mutationKey)) return false;
  pendingMutations.add(mutationKey);
  try {
    const result = await apiFetch(path, options);
    await refreshServerState(true);
    if (successMessage) showToast(successMessage, "success");
    return result;
  } catch (error) {
    showToast(error.message, "error");
    return false;
  } finally {
    pendingMutations.delete(mutationKey);
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function formatDate(value, options = {}) {
  return new Date(value).toLocaleDateString("uk-UA", options);
}

function eventDate(value) {
  return formatDate(value, { weekday: "long", day: "numeric", month: "long" });
}

function eventTime(value) {
  return new Date(value).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

function team() { return state.teams.find(item => item.id === currentTeamId) || state.teams[0]; }
function hasTeam() { return state.teams.length > 0; }
function teamPlayers() { return state.players.filter(player => player.teamId === currentTeamId); }
function teamEvents() { return state.events.filter(event => event.teamId === currentTeamId).sort((a, b) => new Date(a.start) - new Date(b.start)); }
function upcomingEvents() { return teamEvents().filter(event => new Date(event.start) > new Date()); }
function nextEvent() { return upcomingEvents()[0] || teamEvents()[0]; }
function parentPlayer() { return state.players.find(player => player.teamId === currentTeamId) || state.players[0]; }
function isManager() { return ["coach", "admin"].includes(session?.role); }
function roleName() { if (session?.role === "admin") return "Адміністратор"; return isManager() ? "Тренер" : `Батьки · ${parentPlayer()?.name || "гравець"}`; }
function userName() { return session?.userName || (isManager() ? "Андрій Савчук" : "Катерина Коваленко"); }

function showToast(message, type = "") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i data-lucide="${type === "error" ? "circle-alert" : "circle-check"}"></i><span>${escapeHtml(message)}</span>`;
  $("#toastStack").append(toast);
  refreshIcons();
  setTimeout(() => toast.remove(), 3500);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
}

async function signIn(role) {
  if (serverMode) {
    try {
      const result = await apiFetch(`/api/auth/demo/${role}`, { method: "POST" }, false);
      session = { token: result.token, role: result.user.role, userName: result.user.name, userId: result.user.id };
      saveSession();
      await refreshServerState();
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
  session = { role, phone: role === "coach" ? "+380671234567" : "+380932345678" };
  saveSession();
  }
  currentTeamId = role === "parent" ? parentPlayer()?.teamId : currentTeamId;
  $("#authScreen").hidden = true;
  $("#appShell").hidden = false;
  renderShell();
  navigate("dashboard");
  promptNotificationSetup();
}

function signOut() {
  session = null;
  localStorage.removeItem(SESSION_KEY);
  $("#appShell").hidden = true;
  $("#authScreen").hidden = false;
  clearTelegramLogin();
  state = seedData();
  $("#authError").textContent = "";
}

function renderShell() {
  const visibleTeams = state.teams;
  $$("[data-admin-only]").forEach(el => el.hidden = session?.role !== "admin");
  if (state.club?.name) { document.querySelector(".brand strong").textContent = state.club.name; document.title = state.club.name; }
  $("#teamSelect").innerHTML = visibleTeams.length
    ? visibleTeams.map(item => `<option value="${item.id}" ${item.id === currentTeamId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")
    : `<option value="">Команда ще не створена</option>`;
  $("#teamSelect").disabled = visibleTeams.length === 0;
  $("#userName").textContent = userName();
  $("#userRole").textContent = roleName();
  $("#userInitials").textContent = initials(userName());
  $("#pageEyebrow").textContent = team()?.name || (isManager() ? "Налаштування клубу" : "Клуб");
  const unread = state.chats.filter(chat => chat.teamId === currentTeamId).reduce((sum, chat) => sum + chat.unread, 0);
  $("#chatBadge").textContent = unread;
  $("#chatBadge").hidden = unread === 0;
  $("#notificationDot").hidden = !state.notifications.some(item => !item.read);
  $$('[data-switch-role]').forEach(button => button.hidden = serverMode);
  refreshIcons();
}

function navigate(view) {
  if (view === "admin" && session?.role !== "admin") view = "dashboard";
  $("#accountMenu").hidden = true;
  currentView = VIEW_TITLES[view] ? view : "dashboard";
  if (location.hash !== `#${currentView}`) history.replaceState(null, "", `#${currentView}`);
  $("#pageTitle").textContent = VIEW_TITLES[currentView];
  $("#pageEyebrow").textContent = team()?.name || (isManager() ? "Налаштування клубу" : "Клуб");
  $$(`[data-nav]`).forEach(button => button.classList.toggle("active", button.dataset.nav === currentView));
  renderCurrentView();
  $("#content").focus({ preventScroll: true });
}

function renderCurrentView() {
  if (currentView === "admin" && session?.role !== "admin") { navigate("dashboard"); return; }
  if (currentView === "admin" && session?.role === "admin") {
    $("#content").innerHTML = renderAdmin(); refreshIcons(); return;
  }
  if (!hasTeam()) {
    $("#content").innerHTML = isManager()
      ? emptyState("shield-plus", "Створіть першу команду", "Додайте команду, щоб налаштувати склад, розклад, чати та турніри клубу.", "new-team", "Створити першу команду")
      : emptyState("users-round", "Команду ще не підключено", "Ви успішно зареєструвалися. Повідомте тренеру свій номер — він додасть дитину до команди. Розклад з’явиться тут автоматично.");
    refreshIcons();
    return;
  }
  const renderers = {
    dashboard: renderDashboard,
    schedule: renderSchedule,
    chats: renderChats,
    roster: renderRoster,
    tournaments: renderTournaments,
    notifications: renderNotifications
  };
  $("#content").innerHTML = renderers[currentView]();
  refreshIcons();
  if (currentView === "dashboard") updateAlarmStatus();
  if (currentView === "chats") scrollChatToBottom();
}

function typeLabel(type) {
  return type === "match" ? "Матч" : type === "tournament" ? "Турнір" : "Тренування";
}

function eventCard(item, editable = false) {
  const date = new Date(item.start);
  const badgeClass = item.type === "match" ? "badge-match" : item.type === "tournament" ? "badge-tournament" : "badge-training";
  return `
    <article class="event-card">
      <div class="date-tile"><strong>${date.getDate()}</strong><span>${formatDate(date, { month: "short" })}</span></div>
      <div class="event-main">
        <h3><span class="badge ${badgeClass}">${typeLabel(item.type)}</span> ${escapeHtml(item.title)}</h3>
        <div class="event-meta">
          <span><i data-lucide="clock-3"></i>${eventTime(item.start)}–${eventTime(item.end)}</span>
          <span><i data-lucide="map-pin"></i>${escapeHtml(item.place)}, ${escapeHtml(item.address)}</span>
        </div>
      </div>
      <div class="event-actions">
        <a class="icon-btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.place}, ${item.address}, Бориспіль`)}" target="_blank" rel="noopener" title="Маршрут" aria-label="Відкрити маршрут"><i data-lucide="navigation"></i></a>
        ${editable ? `<button class="icon-btn" type="button" data-action="edit-event" data-id="${item.id}" title="Редагувати" aria-label="Редагувати"><i data-lucide="pencil"></i></button>` : ""}
      </div>
    </article>`;
}

function attendanceSummary(eventId) {
  const answers = state.attendance[eventId] || {};
  const players = teamPlayers();
  const yes = players.filter(player => answers[player.id] === "yes").length;
  const no = players.filter(player => answers[player.id] === "no").length;
  return { yes, no, wait: players.length - yes - no };
}

function parentPollCard(item) {
  if (!item) return "";
  const player = parentPlayer();
  const answer = state.attendance[item.id]?.[player.id];
  return `
    <section class="poll-card">
      <div class="poll-kicker"><span>Потрібна відповідь</span><span>${escapeHtml(player.name)}</span></div>
      <h3>Чи буде дитина на занятті?</h3>
      <div class="poll-details">
        <span><i data-lucide="calendar"></i>${eventDate(item.start)}</span>
        <span><i data-lucide="clock-3"></i>${eventTime(item.start)}–${eventTime(item.end)}</span>
        <span><i data-lucide="map-pin"></i>${escapeHtml(item.place)}</span>
      </div>
      ${answer ? `
        <div class="answer-state ${answer === "no" ? "no" : ""}">
          <strong>${answer === "yes" ? "Так, буде" : "Ні, не буде"}</strong>
          <button class="text-btn" type="button" data-action="change-answer" data-event="${item.id}">Змінити відповідь</button>
        </div>` : `
        <div class="poll-actions">
          <button class="btn btn-yes" type="button" data-action="answer" data-event="${item.id}" data-value="yes"><i data-lucide="check"></i> Так, буде</button>
          <button class="btn btn-no" type="button" data-action="answer" data-event="${item.id}" data-value="no"><i data-lucide="x"></i> Ні, не буде</button>
        </div>`}
    </section>`;
}

function clubBanner(item) {
  if (!item) return "";
  return `
    <section class="club-banner">
      <img src="./image.png" alt="Фото команди ${escapeHtml(team().name)}">
      <div class="banner-copy">
        <p class="eyebrow">Наступна подія</p>
        <h2>${escapeHtml(item.title)} — ${eventDate(item.start)}</h2>
        <div class="banner-meta">
          <span><i data-lucide="clock-3"></i>${eventTime(item.start)}–${eventTime(item.end)}</span>
          <span><i data-lucide="map-pin"></i>${escapeHtml(item.place)}</span>
        </div>
      </div>
    </section>`;
}

function safetyPanel() {
  return `
    <section class="panel" id="alarmPanel">
      <div class="panel-title"><h3>Безпека</h3><span class="badge" id="alarmBadge">Перевіряємо</span></div>
      <p class="small muted" id="alarmStatus">Отримуємо статус повітряної тривоги для Бориспільського району.</p>
      <a class="btn btn-secondary btn-block" href="https://map.ukrainealarm.com/" target="_blank" rel="noopener"><i data-lucide="shield-alert"></i> Карта тривог</a>
    </section>`;
}

function renderDashboard() {
  const upcoming = upcomingEvents();
  const next = upcoming[0];
  if (session.role === "parent") {
    const child = parentPlayer();
    return `
      <div class="dashboard-grid">
        <div class="stack">
          ${clubBanner(next)}
          ${parentPollCard(upcoming.find(item => item.poll))}
          <section>
            <div class="section-head"><div><h2>Найближчі події</h2><p>Розклад команди на наступні дні</p></div><button class="text-btn" data-nav="schedule" type="button">Усі події</button></div>
            <div class="event-list">${upcoming.slice(0, 3).map(item => eventCard(item)).join("")}</div>
          </section>
        </div>
        <aside class="stack">
          <section class="panel">
            <div class="panel-title"><h3>Моя дитина</h3><span class="badge badge-training">№ ${child.number}</span></div>
            <div class="person"><span class="person-avatar">${initials(child.name)}</span><div><strong>${escapeHtml(child.name)}</strong><small>${escapeHtml(child.position)}</small></div></div>
            <div class="detail-list">
              <div class="detail-row"><span>Команда</span><strong>${escapeHtml(team().name)}</strong></div>
              <div class="detail-row"><span>Тренер</span><strong>${escapeHtml(team().coach)}</strong></div>
              <div class="detail-row"><span>Найближча подія</span><strong>${next ? eventDate(next.start) : "Немає"}</strong></div>
            </div>
          </section>
          ${safetyPanel()}
          <section class="panel">
            <div class="panel-title"><h3>Зв’язок із тренером</h3></div>
            <p class="small muted">Напишіть тренеру напряму — повідомлення збережеться у вашому чаті.</p>
            <button class="btn btn-primary btn-block" type="button" data-action="open-coach-chat"><i data-lucide="message-circle"></i> Відкрити чат</button>
          </section>
        </aside>
      </div>`;
  }

  const summary = next ? attendanceSummary(next.id) : { yes: 0, no: 0, wait: 0 };
  return `
    <div class="stack">
      ${clubBanner(next)}
      <div class="dashboard-grid">
        <div class="stack">
          <section class="panel">
            <div class="panel-title"><div><h3>Готовність до тренування</h3><span class="small muted">${next ? eventDate(next.start) : "Подій немає"}</span></div><button class="text-btn" type="button" data-action="send-reminders">Нагадати</button></div>
            <div class="stat-row">
              <div class="stat yes"><strong>${summary.yes}</strong><span>Будуть</span></div>
              <div class="stat no"><strong>${summary.no}</strong><span>Не будуть</span></div>
              <div class="stat wait"><strong>${summary.wait}</strong><span>Без відповіді</span></div>
            </div>
            ${next ? coachAttendanceTable(next) : ""}
          </section>
          <section>
            <div class="section-head"><div><h2>Найближчі події</h2><p>Тренування, матчі й збори</p></div><button class="btn btn-primary" type="button" data-action="new-event"><i data-lucide="plus"></i><span>Створити</span></button></div>
            <div class="event-list">${upcoming.slice(0, 4).map(item => eventCard(item, true)).join("")}</div>
          </section>
        </div>
        <aside class="stack">
          <section class="panel">
            <div class="panel-title"><h3>Команда</h3><button class="text-btn" type="button" data-nav="roster">Відкрити склад</button></div>
            <div class="detail-list">
              <div class="detail-row"><span>Гравців</span><strong>${teamPlayers().length}</strong></div>
              <div class="detail-row"><span>Тренувань на тиждень</span><strong>${currentTeamId === "team-2017" ? 3 : 2}</strong></div>
              <div class="detail-row"><span>Активних чатів</span><strong>${state.chats.filter(chat => chat.teamId === currentTeamId).length}</strong></div>
            </div>
          </section>
          ${safetyPanel()}
          <section class="panel">
            <div class="panel-title"><h3>Швидкі дії</h3></div>
            <div class="stack" style="gap:8px">
              <button class="btn btn-secondary btn-block" type="button" data-action="new-team"><i data-lucide="shield-plus"></i> Створити команду</button>
              <button class="btn btn-secondary btn-block" type="button" data-action="chat-poll"><i data-lucide="list-checks"></i> Опитування в чат</button>
              <button class="btn btn-secondary btn-block" type="button" data-action="new-tournament"><i data-lucide="trophy"></i> Додати турнір</button>
            </div>
          </section>
        </aside>
      </div>
    </div>`;
}

function coachAttendanceTable(event) {
  const answers = state.attendance[event.id] || {};
  return `
    <div style="overflow-x:auto;margin-top:14px">
      <table class="roster-table">
        <thead><tr><th>Гравець</th><th>Відповідь</th><th>Батьки</th></tr></thead>
        <tbody>${teamPlayers().map(player => `
          <tr>
            <td><div class="person"><span class="person-avatar">${initials(player.name)}</span><div><strong>${escapeHtml(player.name)}</strong><small>№ ${player.number}</small></div></div></td>
            <td><span class="badge ${answers[player.id] === "yes" ? "badge-match" : answers[player.id] === "no" ? "badge-live" : "badge-tournament"}">${answers[player.id] === "yes" ? "Буде" : answers[player.id] === "no" ? "Не буде" : "Очікуємо"}</span></td>
            <td class="small">${escapeHtml(player.parent)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function renderSchedule() {
  const events = teamEvents();
  const rules = state.scheduleRules?.filter(rule => rule.teamId === currentTeamId) || [];
  const dayNames = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];
  return `
    <section>
      <div class="section-head">
        <div><h2>Розклад команди</h2><p>${events.length} запланованих подій</p></div>
        ${isManager() ? `<div class="section-actions"><button class="btn btn-secondary" type="button" data-action="edit-weekly-schedule"><i data-lucide="calendar-cog"></i><span>Тижневий розклад</span></button><button class="btn btn-primary" type="button" data-action="new-event"><i data-lucide="plus"></i><span>Нова подія</span></button></div>` : ""}
      </div>
      ${rules.length ? `<section class="panel weekly-schedule"><div class="panel-title"><h3>Регулярні тренування</h3><span class="small muted">Автоматично на найближчі тижні</span></div>${rules.map(rule => `<div class="detail-row"><span>${dayNames[rule.weekday]}</span><strong>${rule.start}–${rule.end} · ${escapeHtml(rule.place)}</strong></div>`).join("")}</section>` : ""}
      <div class="event-list">${events.length ? events.map(item => eventCard(item, isManager())).join("") : emptyState("calendar-x", "Подій ще немає", "Тренер додасть тренування або матч.")}</div>
    </section>`;
}

function renderRoster() {
  const players = teamPlayers();
  if (session.role === "parent") {
    const child = parentPlayer();
    return `
      <div class="player-grid">
        <section class="player-card">
          <div class="person"><span class="person-avatar">${initials(child.name)}</span><div><h3>${escapeHtml(child.name)}</h3><small>${escapeHtml(child.position)} · № ${child.number}</small></div></div>
          <div class="detail-list">
            <div class="detail-row"><span>Дата народження</span><strong>${child.birth}</strong></div>
            <div class="detail-row"><span>Команда</span><strong>${escapeHtml(team().name)}</strong></div>
            <div class="detail-row"><span>Тренер</span><strong>${escapeHtml(team().coach)}</strong></div>
            <div class="detail-row"><span>Контакти батьків</span><strong>${escapeHtml([child.phone, child.phone2].filter(Boolean).join("; "))}</strong></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-title"><h3>Контакти команди</h3></div>
          <div class="detail-list">
            <div class="detail-row"><span>Тренер</span><strong>${escapeHtml(team().coach)}</strong></div>
            <div class="detail-row"><span>Телефон</span><strong>+380 67 123 45 67</strong></div>
            <div class="detail-row"><span>Адміністратор</span><strong>Ольга Коваль</strong></div>
          </div>
        </section>
      </div>`;
  }
  return `
    <section>
      <div class="section-head">
        <div><h2>${escapeHtml(team().name)}</h2><p>${players.length} гравців у складі</p></div>
        <div class="section-actions">
          <button class="btn btn-secondary" type="button" data-action="new-team"><i data-lucide="shield-plus"></i><span>Створити команду</span></button>
          <button class="btn btn-primary" type="button" data-action="new-player"><i data-lucide="user-plus"></i><span>Додати гравця</span></button>
        </div>
      </div>
      <section class="panel" style="padding:0;overflow-x:auto">
        <table class="roster-table">
          <thead><tr><th>Гравець</th><th>Позиція</th><th>Дата народження</th><th>Батьки</th><th>Телефон</th><th></th></tr></thead>
          <tbody>${players.map(player => `
            <tr>
              <td><div class="person"><span class="person-avatar">${initials(player.name)}</span><div><strong>${escapeHtml(player.name)}</strong><small>№ ${player.number}</small></div></div></td>
              <td>${escapeHtml(player.position)}</td><td>${player.birth}</td><td>${escapeHtml([player.parent, player.parent2].filter(Boolean).join("; "))}</td><td>${escapeHtml([player.phone, player.phone2].filter(Boolean).join("; "))}</td>
              <td><button class="icon-btn" type="button" data-action="edit-player" data-id="${player.id}" title="Редагувати гравця" aria-label="Редагувати гравця"><i data-lucide="pencil"></i></button></td>
            </tr>`).join("")}</tbody>
        </table>
      </section>
    </section>`;
}

function renderTournaments() {
  const items = state.tournaments.filter(item => item.teamId === currentTeamId).sort((a, b) => new Date(a.date) - new Date(b.date));
  return `
    <section>
      <div class="section-head">
        <div><h2>Турніри та виїзди</h2><p>Змагання команди й організаційна інформація</p></div>
        ${isManager() ? `<button class="btn btn-primary" type="button" data-action="new-tournament"><i data-lucide="plus"></i><span>Додати турнір</span></button>` : ""}
      </div>
      <div class="tournament-grid">${items.length ? items.map(item => `
        <article class="tournament-card">
          <span class="badge badge-tournament"><i data-lucide="trophy"></i>${escapeHtml(item.status)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${eventDate(item.date)} · ${eventTime(item.date)}</p>
          <p>${escapeHtml(item.place)}</p>
          <div class="detail-list"><div class="detail-row"><span>Для команди</span><strong>${escapeHtml(team().name)}</strong></div></div>
          <p>${escapeHtml(item.note)}</p>
          ${isManager() ? `<button class="text-btn" style="margin-top:14px" type="button" data-action="edit-tournament" data-id="${item.id}">Редагувати</button>` : ""}
        </article>`).join("") : emptyState("trophy", "Турнірів ще немає", "Додайте перший турнір або виїзд команди.", isManager() ? "new-tournament" : "")}</div>
    </section>`;
}

function renderChats() {
  const chats = state.chats.filter(chat => chat.teamId === currentTeamId);
  const participants = state.participants?.[currentTeamId] || [];
  if (!chats.some(chat => chat.id === currentChatId)) currentChatId = chats[0]?.id;
  const active = chats.find(chat => chat.id === currentChatId);
  const messages = state.messages[currentChatId] || [];
  return `
    <section class="chat-layout">
      <aside class="chat-list">
        <div class="chat-list-head"><h2>Розмови</h2>${participants.length ? `<button class="btn btn-secondary chat-new" type="button" data-action="new-direct-chat"><i data-lucide="message-circle-plus"></i> Новий чат</button>` : ""}</div>
        ${chats.map(chat => `
          <button class="chat-thread ${chat.id === currentChatId ? "active" : ""}" type="button" data-action="select-chat" data-id="${chat.id}">
            <span class="person-avatar">${chat.kind === "team" ? "ФК" : initials(chat.peer?.name || chat.title || "У")}</span>
            <span class="thread-copy"><strong>${escapeHtml(chat.title)}</strong><span>${chat.kind === "team" ? "Командний чат" : `${roleLabel(chat.peer?.role)} · особистий чат`}</span></span>
            ${chat.unread ? `<b class="nav-badge">${chat.unread}</b>` : ""}
          </button>`).join("")}
      </aside>
      <div class="chat-panel">
        <header class="chat-head">
          <div><h3>${active ? escapeHtml(active.title) : "Чат"}</h3><span class="small muted">${active?.kind === "team" ? `${participants.length + 1} учасників` : `${roleLabel(active?.peer?.role)} · особиста розмова`}</span></div>
          ${isManager() && active?.kind === "team" ? `<button class="btn btn-secondary" type="button" data-action="chat-poll"><i data-lucide="list-checks"></i><span>Опитування</span></button>` : ""}
        </header>
        <div class="chat-messages" id="chatMessages">
          ${messages.length ? messages.map(message => messageBubble(message)).join("") : `<div class="chat-empty"><i data-lucide="message-circle"></i><strong>Почніть розмову</strong><span>Напишіть перше повідомлення.</span></div>`}
        </div>
        <form class="chat-compose" id="chatForm">
          <button class="icon-btn" type="button" title="Додати файл" aria-label="Додати файл"><i data-lucide="paperclip"></i></button>
          <input id="chatInput" aria-label="Повідомлення" placeholder="Напишіть повідомлення…" autocomplete="off">
          <button class="btn btn-primary chat-send-btn" type="submit" title="Надіслати" aria-label="Надіслати"><i data-lucide="send"></i><span>Надіслати</span></button>
        </form>
      </div>
    </section>`;
}

function messageBubble(message) {
  const mine = message.authorId ? message.authorId === session?.userId : message.author === userName();
  const pollEvent = message.poll ? state.events.find(item => item.id === message.eventId) : null;
  return `
    <article class="message ${mine ? "mine" : ""} ${message.poll ? "poll-message" : ""}">
      <span class="message-author">${escapeHtml(message.author)}</span>${session?.role === "admin" ? `<button class="text-btn" type="button" data-action="admin-delete-message" data-id="${message.id}" aria-label="Видалити повідомлення">Видалити</button>` : ""}
      <p>${escapeHtml(message.text)}</p>
      ${pollEvent ? `<button class="text-btn" type="button" data-action="go-to-poll" data-event="${pollEvent.id}" style="margin-top:8px;color:inherit">Відповісти в опитуванні</button>` : ""}
      <time>${escapeHtml(message.time)}</time>
    </article>`;
}

function renderNotifications() {
  return `
    <div class="dashboard-grid">
      <section class="stack">
        <div class="section-head"><div><h2>Останні сповіщення</h2><p>Важливі оновлення для вас і дитини</p></div><button class="text-btn" type="button" data-action="read-all">Позначити прочитаними</button></div>
        ${state.notifications.map(item => `
          <article class="notice-card">
            <span class="notice-icon"><i data-lucide="${item.type === "poll" ? "list-checks" : "calendar-clock"}"></i></span>
            <div class="notice-copy"><strong>${escapeHtml(item.title)} ${!item.read ? `<span class="badge badge-live" style="display:inline-flex">Нове</span>` : ""}</strong><span>${escapeHtml(item.text)}</span></div>
            <time>${formatDate(item.time, { day: "2-digit", month: "2-digit" })}</time>
          </article>`).join("")}
      </section>
      <aside class="stack">
        <section class="panel">
          <div class="panel-title"><h3>Налаштування</h3></div>
          ${settingSwitch("attendanceReminders", "Відповідь про присутність", "Одне нагадування, якщо відповідь ще не надана")}
          ${settingSwitch("scheduleChanges", "Зміни розкладу", "Повідомляти про перенесення й скасування")}
          ${settingSwitch("chatMessages", "Нові повідомлення", "Сповіщати про повідомлення тренера")}
          <button class="btn btn-primary btn-block" type="button" data-action="enable-notifications"><i data-lucide="bell-ring"></i> Увімкнути на пристрої</button>
          <button class="btn btn-secondary btn-block" type="button" data-action="install-app"><i data-lucide="smartphone"></i> Встановити на телефон</button>
          <button class="btn btn-secondary btn-block" type="button" data-action="test-reminder"><i data-lucide="send"></i> Перевірити нагадування</button>
        </section>
        <section class="panel"><p class="small muted" style="margin:0">На iPhone спочатку додайте платформу на екран «Додому», відкрийте її з іконки та увімкніть сповіщення. На Android достатньо дозволити сповіщення у браузері.</p></section>
      </aside>
    </div>`;
}

function settingSwitch(key, title, text) {
  return `<label class="setting-row"><span><strong>${title}</strong><span>${text}</span></span><span class="switch"><input type="checkbox" data-setting="${key}" ${state.settings[key] ? "checked" : ""}><span class="switch-track"></span></span></label>`;
}

function emptyState(icon, title, text, action = "", actionLabel = "Додати") {
  return `<div class="empty-state"><i data-lucide="${icon}"></i><h3>${title}</h3><p>${text}</p>${action ? `<button class="btn btn-primary" type="button" data-action="${action}">${actionLabel}</button>` : ""}</div>`;
}

function openModal({ eyebrow = "", title, body, saveText = "Зберегти", onSave, onDelete }) {
  $("#modalEyebrow").textContent = eyebrow;
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalActions").innerHTML = `${onDelete ? `<button class="btn btn-danger" type="button" id="modalDeleteBtn">Видалити</button>` : ""}<button class="btn btn-secondary" type="button" data-action="close-modal">Скасувати</button><button class="btn btn-primary" type="submit">${saveText}</button>`;
  $("#modalForm").onsubmit = async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent || "Зберегти";
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Зберігаємо…"; }
    try {
      const result = await onSave(formData);
      if (result !== false) $("#appModal").close();
      else if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; }
    } catch (error) {
      showToast(error.message, "error");
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; }
    }
  };
  if (onDelete) $("#modalDeleteBtn").onclick = async () => { if (await onDelete() !== false) $("#appModal").close(); };
  $("#appModal").showModal();
  refreshIcons();
}

function openProfileModal() {
  openModal({
    eyebrow: "Профіль",
    title: "Моє ім’я у чатах",
    body: `<label class="field"><span>Ім’я та прізвище</span><input class="form-input" name="name" required minlength="2" maxlength="120" value="${escapeHtml(userName())}"></label><p class="small muted">Це ім’я бачитимуть учасники в чатах і списку команди.</p>`,
    onSave: async data => {
      const name = data.get("name").trim();
      if (serverMode) return runServerMutation("/api/profile", { method: "PATCH", body: JSON.stringify({ name }) }, "Ім’я оновлено");
      session.userName = name;
      saveSession(); renderShell(); renderCurrentView(); showToast("Ім’я оновлено", "success");
    }
  });
}

function openDirectChatModal() {
  const participants = state.participants?.[currentTeamId] || [];
  if (!participants.length) return showToast("У цій команді поки немає інших учасників", "error");
  openModal({
    eyebrow: team()?.name || "Команда",
    title: "Новий особистий чат",
    saveText: "Відкрити чат",
    body: `<label class="field"><span>З ким поговорити</span><select class="form-select" name="userId">${participants.map(person => `<option value="${person.id}">${escapeHtml(person.name)} · ${roleLabel(person.role)}</option>`).join("")}</select></label><p class="small muted">Особисті повідомлення доступні лише вам і обраному учаснику.</p>`,
    onSave: async data => {
      if (serverMode) {
        try {
          const result = await apiFetch("/api/chats/direct", { method: "POST", body: JSON.stringify({ team_id: currentTeamId, user_id: data.get("userId") }) });
          await refreshServerState(true);
          currentChatId = result.id;
          navigate("chats");
          return true;
        } catch (error) { showToast(error.message, "error"); return false; }
      }
      const person = participants.find(item => item.id === data.get("userId"));
      const chat = { id: id("direct"), teamId: currentTeamId, title: person.name, kind: "direct", peer: person, unread: 0 };
      state.chats.push(chat); state.messages[chat.id] = []; currentChatId = chat.id;
      saveState(); navigate("chats");
    }
  });
}

function toLocalInput(iso) {
  const date = new Date(iso);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function openWeeklyScheduleModal() {
  const dayNames = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];
  const rules = state.scheduleRules?.filter(rule => rule.teamId === currentTeamId) || [];
  const rows = dayNames.map((day, weekday) => {
    const rule = rules.find(item => item.weekday === weekday);
    return `<div class="weekly-rule-row"><strong>${day}</strong><input class="form-input" type="time" name="start-${weekday}" value="${rule?.start || ""}"><span>до</span><input class="form-input" type="time" name="end-${weekday}" value="${rule?.end || ""}"><input class="form-input weekly-place" name="place-${weekday}" placeholder="Місце" value="${escapeHtml(rule?.place || "")}"><input class="form-input weekly-address" name="address-${weekday}" placeholder="Адреса" value="${escapeHtml(rule?.address || "")}"><input type="hidden" name="rule-${weekday}" value="${rule?.id || ""}"></div>`;
  }).join("");
  openModal({
    eyebrow: team().name,
    title: "Тижневий розклад",
    saveText: "Зберегти розклад",
    body: `<p class="small muted">Вкажіть час і місце. Порожній рядок вимкне тренування цього дня. Нові події та опитування створяться автоматично.</p><div class="weekly-rule-list">${rows}</div>`,
    onSave: async data => {
      const values = Object.fromEntries(data);
      const changes = dayNames.map((_, weekday) => ({ weekday, start: values[`start-${weekday}`], end: values[`end-${weekday}`], place: values[`place-${weekday}`]?.trim(), address: values[`address-${weekday}`]?.trim(), id: values[`rule-${weekday}`] })).filter(item => item.start || item.end || item.place || item.address);
      for (const item of changes) {
        if (!item.start || !item.end || !item.place || !item.address) { showToast("Заповніть усі поля активного дня", "error"); return false; }
        if (item.end <= item.start) { showToast("Час завершення має бути пізніше початку", "error"); return false; }
      }
      if (serverMode) {
        try {
          await Promise.all(changes.map(item => apiFetch(item.id ? `/api/schedule-rules/${item.id}` : "/api/schedule-rules", { method: item.id ? "PUT" : "POST", body: JSON.stringify({ team_id: currentTeamId, weekday: item.weekday, start: item.start, end: item.end, title: "Тренування", place: item.place, address: item.address, poll: true }) })));
          await Promise.all(rules.filter(rule => !changes.some(item => item.id === rule.id)).map(rule => apiFetch(`/api/schedule-rules/${rule.id}`, { method: "DELETE" })));
          await refreshServerState(true);
          showToast("Тижневий розклад збережено", "success");
          return true;
        } catch (error) { showToast(error.message, "error"); return false; }
      }
      state.scheduleRules = (state.scheduleRules || []).filter(rule => rule.teamId !== currentTeamId);
      changes.forEach(item => state.scheduleRules.push({ id: item.id || id("rule"), teamId: currentTeamId, weekday: item.weekday, start: item.start, end: item.end, title: "Тренування", place: item.place, address: item.address, poll: true }));
      saveState(); renderCurrentView(); showToast("Тижневий розклад збережено", "success");
    }
  });
}

function openEventModal(existing = null) {
  const start = existing?.start || futureDate(1, 19, 15);
  const end = existing?.end || futureDate(1, 20, 30);
  openModal({
    eyebrow: team().name,
    title: existing ? "Редагувати подію" : "Нова подія",
    saveText: existing ? "Зберегти зміни" : "Створити подію",
    body: `<div class="form-grid">
      <label class="field"><span>Тип</span><select class="form-select" name="type"><option value="training" ${existing?.type === "training" ? "selected" : ""}>Тренування</option><option value="match" ${existing?.type === "match" ? "selected" : ""}>Матч</option><option value="tournament" ${existing?.type === "tournament" ? "selected" : ""}>Турнір</option></select></label>
      <label class="field"><span>Назва</span><input class="form-input" name="title" required value="${escapeHtml(existing?.title || "Тренування")}"></label>
      <label class="field"><span>Початок</span><input class="form-input" type="datetime-local" name="start" required value="${toLocalInput(start)}"></label>
      <label class="field"><span>Завершення</span><input class="form-input" type="datetime-local" name="end" required value="${toLocalInput(end)}"></label>
      <label class="field full"><span>Місце</span><input class="form-input" name="place" required value="${escapeHtml(existing?.place || "Ліцей «Основа» (8 школа)")}"></label>
      <label class="field full"><span>Адреса</span><input class="form-input" name="address" required value="${escapeHtml(existing?.address || "Соборна, 3")}"></label>
      <label class="setting-row full"><span><strong>Опитування про присутність</strong><span>Батьки отримають кнопки «Так» і «Ні»</span></span><span class="switch"><input type="checkbox" name="poll" ${existing?.poll !== false ? "checked" : ""}><span class="switch-track"></span></span></label>
    </div>`,
    onSave: async data => {
      const values = Object.fromEntries(data);
      if (new Date(values.end) <= new Date(values.start)) { showToast("Час завершення має бути пізніше початку", "error"); return false; }
      const record = { id: existing?.id || id("event"), teamId: currentTeamId, type: values.type, title: values.title.trim(), start: new Date(values.start).toISOString(), end: new Date(values.end).toISOString(), place: values.place.trim(), address: values.address.trim(), poll: data.has("poll") };
      if (serverMode) {
        return runServerMutation(existing ? `/api/events/${existing.id}` : "/api/events", {
          method: existing ? "PUT" : "POST",
          body: JSON.stringify({ team_id: currentTeamId, type: record.type, title: record.title, start: record.start, end: record.end, place: record.place, address: record.address, notes: existing?.notes || "", poll: record.poll })
        }, existing ? "Подію оновлено" : "Подію створено");
      }
      if (existing) state.events = state.events.map(item => item.id === existing.id ? record : item); else state.events.push(record);
      state.attendance[record.id] ||= {};
      addNotification(existing ? "Подію оновлено" : "Нова подія", `${record.title}: ${eventDate(record.start)}, ${eventTime(record.start)}`, "schedule");
      saveState(); renderCurrentView(); showToast(existing ? "Подію оновлено" : "Подію створено", "success");
    },
    onDelete: existing ? async () => {
      if (!confirm("Видалити цю подію з розкладу?")) return false;
      if (serverMode) return runServerMutation(`/api/events/${existing.id}`, { method: "DELETE" }, "Подію видалено");
      state.events = state.events.filter(item => item.id !== existing.id);
      delete state.attendance[existing.id];
      saveState(); renderCurrentView(); showToast("Подію видалено");
    } : null
  });
}

function openPlayerModal(existing = null) {
  openModal({
    eyebrow: team().name,
    title: existing ? "Редагувати гравця" : "Новий гравець",
    saveText: existing ? "Зберегти зміни" : "Додати до складу",
    body: `<div class="form-grid">
      <label class="field full"><span>Ім’я та прізвище дитини</span><input class="form-input" name="name" required value="${escapeHtml(existing?.name || "")}"></label>
      <label class="field"><span>Номер</span><input class="form-input" type="number" min="1" max="99" name="number" required value="${existing?.number || ""}"></label>
      <label class="field"><span>Позиція</span><select class="form-select" name="position">${["Воротар", "Захисник", "Півзахисник", "Нападник"].map(position => `<option ${existing?.position === position || (!existing && position === "Півзахисник") ? "selected" : ""}>${position}</option>`).join("")}</select></label>
      <label class="field"><span>Дата народження</span><input class="form-input" name="birth" placeholder="дд.мм.рррр" required value="${escapeHtml(existing?.birth || "")}"></label>
      <label class="field"><span>Телефон першого з батьків</span><input class="form-input" type="tel" name="phone" required placeholder="+380…" value="${escapeHtml(existing?.phone || "")}"></label>
      <label class="field"><span>Ім’я першого з батьків</span><input class="form-input" name="parent" required value="${escapeHtml(existing?.parent || "")}"></label>
      <label class="field"><span>Телефон другого з батьків</span><input class="form-input" type="tel" name="phone2" placeholder="Необов’язково" value="${escapeHtml(existing?.phone2 || "")}"></label>
      <label class="field"><span>Ім’я другого з батьків</span><input class="form-input" name="parent2" placeholder="Необов’язково" value="${escapeHtml(existing?.parent2 || "")}"></label>
    </div>`,
    onSave: async data => {
      const values = Object.fromEntries(data);
      if (serverMode) {
        return runServerMutation(existing ? `/api/players/${existing.id}` : "/api/players", { method: existing ? "PUT" : "POST", body: JSON.stringify({ team_id: currentTeamId, name: values.name.trim(), number: Number(values.number), position: values.position, birth: values.birth.trim(), parent: values.parent.trim(), phone: values.phone.trim(), parent2: values.parent2.trim(), phone2: values.phone2.trim() }) }, existing ? "Дані гравця оновлено" : "Гравця додано до складу");
      }
      const record = { id: existing?.id || id("player"), teamId: currentTeamId, name: values.name.trim(), number: Number(values.number), position: values.position, birth: values.birth.trim(), parent: values.parent.trim(), phone: values.phone.trim(), parent2: values.parent2.trim(), phone2: values.phone2.trim() };
      if (existing) state.players = state.players.map(item => item.id === existing.id ? record : item); else state.players.push(record);
      saveState(); renderCurrentView(); showToast(existing ? "Дані гравця оновлено" : "Гравця додано до складу", "success");
    },
    onDelete: existing ? async () => {
      if (!confirm("Видалити гравця зі складу?")) return false;
      if (serverMode) return runServerMutation(`/api/players/${existing.id}`, { method: "DELETE" }, "Гравця видалено зі складу");
      state.players = state.players.filter(item => item.id !== existing.id);
      saveState(); renderCurrentView(); showToast("Гравця видалено зі складу");
    } : null
  });
}

function openTeamModal() {
  openModal({
    eyebrow: "Клуб",
    title: "Нова команда",
    saveText: "Створити команду",
    body: `<div class="form-grid"><label class="field full"><span>Назва команди</span><input class="form-input" name="name" required placeholder="Фаворит 2018"></label><label class="field"><span>Рік народження</span><input class="form-input" type="number" name="birthYear" min="2005" max="2022" required></label><label class="field"><span>Тренер</span><input class="form-input" name="coach" value="${escapeHtml(userName())}" required></label></div>`,
    onSave: async data => {
      const values = Object.fromEntries(data);
      if (serverMode) {
        const result = await runServerMutation("/api/teams", { method: "POST", body: JSON.stringify({ name: values.name.trim(), birthYear: Number(values.birthYear), coach: values.coach.trim() }) }, "Команду створено");
        if (result) { currentTeamId = result.id; await refreshServerState(true); navigate("roster"); }
        return result;
      }
      const newTeam = { id: id("team"), name: values.name.trim(), birthYear: Number(values.birthYear), coach: values.coach.trim(), color: "#225ad6" };
      state.teams.push(newTeam);
      state.chats.push({ id: id("chat"), teamId: newTeam.id, title: `${newTeam.name} — батьки`, kind: "team", unread: 0 });
      currentTeamId = newTeam.id;
      saveState(); renderShell(); navigate("roster"); showToast("Команду створено", "success");
    }
  });
}

function openTournamentModal(existing = null) {
  openModal({
    eyebrow: team().name,
    title: existing ? "Редагувати турнір" : "Новий турнір",
    saveText: existing ? "Зберегти зміни" : "Додати турнір",
    body: `<div class="form-grid">
      <label class="field full"><span>Назва</span><input class="form-input" name="title" required value="${escapeHtml(existing?.title || "")}"></label>
      <label class="field"><span>Дата й час</span><input class="form-input" type="datetime-local" name="date" required value="${toLocalInput(existing?.date || futureDate(14, 9, 0))}"></label>
      <label class="field"><span>Статус</span><select class="form-select" name="status"><option ${existing?.status === "Планується" ? "selected" : ""}>Планується</option><option ${existing?.status === "Реєстрацію підтверджено" ? "selected" : ""}>Реєстрацію підтверджено</option><option ${existing?.status === "Склад сформовано" ? "selected" : ""}>Склад сформовано</option></select></label>
      <label class="field full"><span>Місце</span><input class="form-input" name="place" required value="${escapeHtml(existing?.place || "Стадіон «Колос»")}"></label>
      <label class="field full"><span>Нотатка для батьків</span><textarea class="form-textarea" name="note">${escapeHtml(existing?.note || "")}</textarea></label>
    </div>`,
    onSave: async data => {
      const values = Object.fromEntries(data);
      const record = { id: existing?.id || id("tournament"), teamId: currentTeamId, title: values.title.trim(), date: new Date(values.date).toISOString(), place: values.place.trim(), status: values.status, note: values.note.trim() };
      if (serverMode) {
        return runServerMutation(existing ? `/api/tournaments/${existing.id}` : "/api/tournaments", {
          method: existing ? "PUT" : "POST",
          body: JSON.stringify({ team_id: currentTeamId, title: record.title, date: record.date, place: record.place, status: record.status, note: record.note })
        }, existing ? "Турнір оновлено" : "Турнір додано");
      }
      if (existing) state.tournaments = state.tournaments.map(item => item.id === existing.id ? record : item); else state.tournaments.push(record);
      addNotification(existing ? "Турнір оновлено" : "Додано турнір", `${record.title}: ${eventDate(record.date)}`, "schedule");
      saveState(); renderCurrentView(); showToast(existing ? "Турнір оновлено" : "Турнір додано", "success");
    },
    onDelete: existing ? async () => {
      if (!confirm("Видалити цей турнір?")) return false;
      if (serverMode) return runServerMutation(`/api/tournaments/${existing.id}`, { method: "DELETE" }, "Турнір видалено");
      state.tournaments = state.tournaments.filter(item => item.id !== existing.id);
      saveState(); renderCurrentView(); showToast("Турнір видалено");
    } : null
  });
}

function addNotification(title, text, type = "schedule") {
  state.notifications.unshift({ id: id("notice"), title, text, type, time: new Date().toISOString(), read: false });
}

async function answerAttendance(eventId, value) {
  if (serverMode) return runServerMutation(`/api/events/${eventId}/attendance`, { method: "PUT", body: JSON.stringify({ value, player_id: parentPlayer().id }) }, "Відповідь збережено");
  state.attendance[eventId] ||= {};
  state.attendance[eventId][parentPlayer().id] = value;
  addNotification("Відповідь збережено", value === "yes" ? "Максим буде на занятті." : "Максим не буде на занятті.", "poll");
  saveState(); renderShell(); renderCurrentView(); showToast("Відповідь збережено", "success");
}

async function sendReminders(test = false) {
  const event = nextEvent();
  if (!event) return showToast("Немає найближчої події", "error");
  if (serverMode && test) {
    await showBrowserNotification("ФК «Фаворит»", `Чи буде ${parentPlayer()?.name || "дитина"} на найближчому тренуванні?`);
    showToast("Тестове нагадування надіслано", "success");
    return true;
  }
  if (serverMode && !test) {
    const result = await runServerMutation(`/api/events/${event.id}/remind`, { method: "POST" });
    if (result) showToast(`Нагадування надіслано: ${result.sent}`, "success");
    return result;
  }
  const summary = attendanceSummary(event.id);
  addNotification("Нагадування про тренування", `Потрібна відповідь щодо ${eventDate(event.start)}.`, "poll");
  state.settings.lastReminder = Date.now();
  saveState();
  if (test) showBrowserNotification("ФК «Фаворит»", "Чи буде Максим на найближчому тренуванні? Натисніть, щоб відповісти.");
  showToast(test ? "Тестове нагадування надіслано" : `Нагадування надіслано: ${summary.wait}`, "success");
  if (currentView === "notifications") renderCurrentView();
}

async function showBrowserNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const registration = await navigator.serviceWorker?.ready.catch(() => null);
  if (registration) registration.showNotification(title, { body, icon: "./logo.png", badge: "./logo.png", tag: "favorit-attendance" });
  else new Notification(title, { body, icon: "./logo.png" });
}

async function enableNotifications() {
  if (!("Notification" in window)) return showToast("Цей браузер не підтримує сповіщення", "error");
  const permission = await Notification.requestPermission();
  if (permission === "granted" && serverMode && publicConfig.vapidPublicKey && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicConfig.vapidPublicKey) });
      await apiFetch("/api/push-subscriptions", { method: "POST", body: JSON.stringify(subscription.toJSON()) });
    } catch (error) {
      return showToast(error.message || "Не вдалося підключити push-сповіщення", "error");
    }
  }
  showToast(permission === "granted" ? "Сповіщення увімкнено" : "Дозвіл на сповіщення не надано", permission === "granted" ? "success" : "error");
}

async function promptNotificationSetup() {
  if (!serverMode || !session || !("Notification" in window) || Notification.permission !== "default" || sessionStorage.getItem("favorit-notification-prompted")) return;
  sessionStorage.setItem("favorit-notification-prompted", "1");
  setTimeout(() => enableNotifications(), 700);
}

async function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  showToast(isIos ? "Safari → Поділитися → На екран «Додому», потім відкрийте платформу з іконки" : "У меню браузера виберіть «Встановити застосунок» або «Додати на головний екран»");
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

function checkAttendanceReminders() {
  if (serverMode) return;
  if (!session || session.role !== "parent" || !state.settings.attendanceReminders) return;
  const event = upcomingEvents().find(item => item.poll && new Date(item.start).getTime() - Date.now() < 48 * 60 * 60 * 1000);
  if (!event || state.attendance[event.id]?.[parentPlayer().id]) return;
  if (state.settings.remindedEventId === event.id) return;
  state.settings.remindedEventId = event.id;
  state.settings.lastReminder = Date.now();
  addNotification("Потрібна відповідь", `Чи буде Максим на занятті ${eventDate(event.start)}?`, "poll");
  saveState();
  showBrowserNotification("ФК «Фаворит»", "Підтвердьте участь Максима в найближчому тренуванні.");
}

async function sendChatMessage(text) {
  const value = text.trim();
  if (!value || !currentChatId) return;
  if (serverMode) {
    const chatId = currentChatId;
    const optimisticMessage = {
      id: `pending-${Date.now()}`,
      authorId: session.userId,
      author: userName(),
      role: session.role,
      text: value,
      time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
    };
    state.messages[chatId] ||= [];
    state.messages[chatId].push(optimisticMessage);
    renderCurrentView();
    try {
      await apiFetch(`/api/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify({ text: value }) });
      await refreshServerState(true);
    } catch (error) {
      state.messages[chatId] = (state.messages[chatId] || []).filter(message => message.id !== optimisticMessage.id);
      renderCurrentView();
      showToast(error.message, "error");
    }
    return;
  }
  state.messages[currentChatId] ||= [];
  state.messages[currentChatId].push({ id: id("message"), authorId: session.userId, author: userName(), role: session.role, text: value, time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) });
  saveState(); renderCurrentView();
}

async function createChatPoll() {
  const event = nextEvent();
  const teamChat = state.chats.find(chat => chat.teamId === currentTeamId && chat.kind === "team");
  if (!event || !teamChat) return showToast("Спочатку створіть подію та командний чат", "error");
  if (serverMode) {
    currentChatId = teamChat.id;
    const result = await runServerMutation(`/api/chats/${teamChat.id}/poll`, { method: "POST", body: JSON.stringify({ event_id: event.id }) }, "Опитування надіслано в командний чат");
    if (result) navigate("chats");
    return result;
  }
  state.messages[teamChat.id] ||= [];
  state.messages[teamChat.id].push({ id: id("message"), author: userName(), role: "coach", text: `Чи буде ваша дитина на події «${event.title}» ${eventDate(event.start)} о ${eventTime(event.start)}?`, time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }), poll: true, eventId: event.id });
  state.attendance[event.id] ||= {};
  currentChatId = teamChat.id;
  saveState(); navigate("chats"); showToast("Опитування надіслано в командний чат", "success");
}

function scrollChatToBottom() {
  requestAnimationFrame(() => { const box = $("#chatMessages"); if (box) box.scrollTop = box.scrollHeight; });
}

async function updateAlarmStatus() {
  const status = $("#alarmStatus");
  const badge = $("#alarmBadge");
  if (!status || !badge) return;
  try {
    const response = await fetch(ALERT_API, { cache: "no-store" });
    if (!response.ok) throw new Error("alert api");
    const data = await response.json();
    const active = [...(data.raions || []), ...(data.oblasts || [])].some(item => item.name === "Бориспільський район" || item.name === "Київська область");
    badge.textContent = active ? "Тривога" : "Все спокійно";
    badge.className = `badge ${active ? "badge-live" : "badge-match"}`;
    status.textContent = active ? "У районі або області активна повітряна тривога. Дотримуйтесь правил безпеки." : "За даними NEPTUN, активної тривоги в районі зараз немає. Перевіряйте офіційні джерела.";
  } catch {
    badge.textContent = "Статус невідомий";
    badge.className = "badge badge-tournament";
    status.textContent = "Не вдалося отримати актуальний статус. Перевірте офіційну карту перед виїздом.";
  }
}

document.addEventListener("click", async event => {
  const nav = event.target.closest("[data-nav]");
  if (nav && session) { event.preventDefault(); navigate(nav.dataset.nav); return; }

  const demo = event.target.closest("[data-demo-role]");
  if (demo) return signIn(demo.dataset.demoRole);

  const role = event.target.closest("[data-switch-role]");
  if (role) {
    if (serverMode) return;
    session.role = role.dataset.switchRole; saveSession(); $("#accountMenu").hidden = true;
    if (session.role === "parent") currentTeamId = parentPlayer()?.teamId;
    renderShell(); navigate("dashboard"); showToast(`Відкрито: ${roleName()}`); return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;
  const name = action.dataset.action;
  if (name === "edit-profile") return openProfileModal();
  if (name === "new-direct-chat") return openDirectChatModal();
  if (name.startsWith("admin-") && session?.role !== "admin") return;
  if (name === "admin-user") return openAdminUser(action.dataset.id);
  if (name === "admin-team") return openAdminTeam(action.dataset.id);
  if (name === "admin-settings") return openClubSettings();
  if (name === "admin-manage-team") { currentTeamId = action.dataset.id; renderShell(); navigate("roster"); return; }
  if (name === "admin-delete-message" && confirm("Видалити повідомлення для всіх учасників?")) return runServerMutation(`/api/admin/messages/${action.dataset.id}`, { method: "DELETE" }, "Повідомлення видалено");
  if (name === "close-modal") $("#appModal").close();
  if (name === "answer") answerAttendance(action.dataset.event, action.dataset.value);
  if (name === "change-answer") {
    if (serverMode) await runServerMutation(`/api/events/${action.dataset.event}/attendance?player_id=${parentPlayer().id}`, { method: "DELETE" });
    else { delete state.attendance[action.dataset.event][parentPlayer().id]; saveState(); renderCurrentView(); }
  }
  if (name === "new-event") openEventModal();
  if (name === "edit-weekly-schedule") openWeeklyScheduleModal();
  if (name === "edit-event") openEventModal(state.events.find(item => item.id === action.dataset.id));
  if (name === "new-player") openPlayerModal();
  if (name === "edit-player") openPlayerModal(state.players.find(item => item.id === action.dataset.id));
  if (name === "new-team") session?.role === "admin" ? openAdminTeam() : openTeamModal();
  if (name === "new-tournament") openTournamentModal();
  if (name === "edit-tournament") openTournamentModal(state.tournaments.find(item => item.id === action.dataset.id));
  if (name === "send-reminders") sendReminders();
  if (name === "chat-poll") createChatPoll();
  if (name === "open-coach-chat") { currentChatId = state.chats.find(chat => chat.teamId === currentTeamId && chat.kind === "direct")?.id || state.chats[0]?.id; navigate("chats"); }
  if (name === "select-chat") { currentChatId = action.dataset.id; const chat = state.chats.find(item => item.id === currentChatId); if (chat) chat.unread = 0; if (!serverMode) saveState(); renderShell(); renderCurrentView(); }
  if (name === "go-to-poll") navigate("dashboard");
  if (name === "read-all") {
    if (serverMode) await runServerMutation("/api/notifications/read-all", { method: "POST" });
    else { state.notifications.forEach(item => item.read = true); saveState(); renderShell(); renderCurrentView(); }
  }
  if (name === "enable-notifications") enableNotifications();
  if (name === "install-app") installApp();
  if (name === "test-reminder") sendReminders(true);
});

document.addEventListener("change", async event => {
  if (event.target.id === "teamSelect") {
    currentTeamId = event.target.value;
    currentChatId = state.chats.find(chat => chat.teamId === currentTeamId)?.id;
    renderShell(); navigate(currentView);
  }
  if (event.target.matches("[data-setting]")) {
    state.settings[event.target.dataset.setting] = event.target.checked;
    if (serverMode) await runServerMutation("/api/settings", { method: "PATCH", body: JSON.stringify({ [event.target.dataset.setting]: event.target.checked }) }, "Налаштування збережено");
    else { saveState(); showToast("Налаштування збережено", "success"); }
  }
});

document.addEventListener("submit", event => {
  if (event.target.id !== "chatForm") return;
  event.preventDefault();
  if (chatSending) return;
  chatSending = true;
  const input = $("#chatInput");
  const submit = event.target.querySelector('button[type="submit"]');
  const value = input.value;
  input.value = "";
  input.disabled = true;
  if (submit) submit.disabled = true;
  sendChatMessage(value).finally(() => {
    chatSending = false;
    const nextInput = $("#chatInput");
    const nextSubmit = document.querySelector('#chatForm button[type="submit"]');
    if (nextInput) { nextInput.disabled = false; nextInput.focus(); }
    if (nextSubmit) nextSubmit.disabled = false;
  });
});

$("#accountBtn").addEventListener("click", () => {
  const menu = $("#accountMenu");
  menu.hidden = !menu.hidden;
  $("#accountBtn").setAttribute("aria-expanded", String(!menu.hidden));
});
$("#notificationBtn").addEventListener("click", () => navigate("notifications"));
$("#logoutBtn").addEventListener("click", signOut);

window.addEventListener("hashchange", () => { if (session) navigate(location.hash.slice(1)); });
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
});
window.addEventListener("click", event => {
  if (!event.target.closest("#accountBtn") && !event.target.closest("#accountMenu")) $("#accountMenu").hidden = true;
});

if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
setInterval(checkAttendanceReminders, 60 * 1000);
setInterval(() => { if (currentView === "dashboard" && session) updateAlarmStatus(); }, 60 * 1000);
setInterval(async () => {
  if (!serverMode || !session?.token || document.hidden || $("#appModal").open || (currentView === "admin" && document.activeElement?.id === "adminSearch")) return;
  try { await refreshServerState(true); } catch {}
}, 15000);

async function initialize() {
  try {
    publicConfig = await apiFetch("/api/config", {}, false);
    serverMode = Boolean(publicConfig.server);
  } catch {
    serverMode = false;
  }
  $("#demoAccess").hidden = !serverMode || !publicConfig.demo;
  $("#telegramConnectBtn").disabled = !serverMode || !publicConfig.telegramReady;
  if (publicConfig.clubName) { $("#authTitle").textContent = publicConfig.clubName; document.title = publicConfig.clubName; }
  if (publicConfig.welcome) $("#clubWelcome").textContent = publicConfig.welcome;
  $("#demoNote").textContent = serverMode
    ? (publicConfig.demo ? "Тестовий перегляд увімкнено адміністратором." : "")
    : "Сервер недоступний. Перевірте з’єднання та оновіть сторінку.";
  if (serverMode && !publicConfig.telegramReady) $("#authError").textContent = "Адміністратор ще налаштовує Telegram-бота. Спробуйте пізніше.";
  if (!serverMode && session?.token) session = null;

  if (session && (!serverMode || session.token)) {
    if (serverMode) {
      try { await refreshServerState(); } catch { session = null; }
    }
  } else if (serverMode) {
    session = null;
  }

  if (session) {
    $("#authScreen").hidden = true;
    $("#appShell").hidden = false;
    currentTeamId = session.role === "parent" ? parentPlayer()?.teamId : (state.teams[0]?.id || currentTeamId);
    renderShell();
    navigate(location.hash.slice(1) || "dashboard");
    promptNotificationSetup();
  } else {
    if (serverMode) {
      try { telegramLogin = JSON.parse(sessionStorage.getItem(TELEGRAM_LOGIN_KEY)); } catch {}
      if (telegramLogin) { showTelegramWaiting(); pollTelegramLogin(); }
    }
    refreshIcons();
  }
}

initialize();

function clearTelegramLogin(message = "") {
  telegramLogin = null;
  clearTimeout(telegramPollTimer);
  sessionStorage.removeItem(TELEGRAM_LOGIN_KEY);
  $("#telegramWaiting").hidden = true;
  $("#telegramConnectBtn").hidden = false;
  $("#telegramConnectBtn").disabled = !serverMode || !publicConfig.telegramReady;
  $("#authError").textContent = message;
}

function roleLabel(role) {
  return role === "coach" ? "Тренер" : role === "admin" ? "Адміністратор" : role === "parent" ? "Батьки" : "Учасник";
}

function showTelegramWaiting() {
  $("#telegramWaiting").hidden = false;
  $("#telegramConnectBtn").hidden = true;
  $("#telegramLink").href = telegramLogin.url;
  $("#telegramStatus").textContent = "Очікуємо підтвердження в Telegram…";
}

async function pollTelegramLogin() {
  if (!telegramLogin || session?.token || telegramPolling) return;
  clearTimeout(telegramPollTimer);
  const pending = telegramLogin;
  if (Date.now() >= pending.expiresAt) { clearTelegramLogin("Час очікування минув. Натисніть кнопку, щоб спробувати ще раз."); return; }
  telegramPolling = true;
  try {
    const result = await apiFetch("/api/auth/telegram/poll", {
      method: "POST", body: JSON.stringify({ id: pending.id, secret: pending.secret })
    }, false);
    if (telegramLogin !== pending) return;
    if (result.status === "approved") {
      session = { token: result.token, role: result.user.role, userName: result.user.name, userId: result.user.id };
      saveSession();
      clearTelegramLogin();
      await refreshServerState();
      $("#authScreen").hidden = true;
      $("#appShell").hidden = false;
      renderShell(); navigate(session.role === "admin" ? "admin" : "dashboard");
    } else if (result.status === "expired" || result.status === "blocked") {
      clearTelegramLogin(result.status === "blocked" ? "Обліковий запис заблоковано. Зверніться до адміністратора." : "Посилання вже використано або застаріло. Спробуйте ще раз.");
    } else {
      $("#telegramStatus").textContent = "Очікуємо: натисніть Start і поділіться номером у боті.";
    }
  } catch (error) {
    if (session?.token) {
      $("#authError").textContent = "Вхід підтверджено, але дані не завантажилися. Оновіть сторінку.";
    } else if (telegramLogin === pending) {
      $("#telegramStatus").textContent = "З’єднання перервано. Пробуємо знову…";
    }
  } finally {
    telegramPolling = false;
    if (telegramLogin) telegramPollTimer = setTimeout(pollTelegramLogin, 2500);
  }
}

$("#telegramConnectBtn").addEventListener("click", async () => {
  const button = $("#telegramConnectBtn");
  if (button.disabled) return;
  button.disabled = true;
  $("#authError").textContent = "";
  // Open during the click so mobile browsers do not block the Telegram tab.
  const popup = window.open("about:blank", "_blank");
  if (popup) popup.opener = null;
  try {
    const result = await apiFetch("/api/auth/telegram/start", { method: "POST" }, false);
    telegramLogin = { ...result, expiresAt: Date.now() + result.expiresIn * 1000 };
    sessionStorage.setItem(TELEGRAM_LOGIN_KEY, JSON.stringify(telegramLogin));
    showTelegramWaiting();
    if (popup) popup.location.replace(result.url);
    pollTelegramLogin();
  } catch (error) {
    if (popup) popup.close();
    clearTelegramLogin(error.message);
  } finally { button.disabled = false; }
});
$("#telegramCancelBtn").addEventListener("click", () => clearTelegramLogin());
window.addEventListener("focus", () => pollTelegramLogin());
document.addEventListener("visibilitychange", () => { if (!document.hidden) pollTelegramLogin(); });

function renderAdmin() {
  const admin = state.admin;
  if (!admin) return emptyState("shield-check", "Адміністрування недоступне", "Оновіть сторінку.");
  const coaches = admin.users.filter(u => u.active && u.role === "coach").length;
  return `<div class="stack">
    <section class="panel admin-summary"><div><h2>Керування клубом</h2><p class="muted">${admin.users.length} користувачів · ${coaches} тренерів · ${admin.teams.length} команд</p></div><button class="btn btn-secondary" data-action="admin-settings">Налаштування сайту</button></section>
    <section class="panel"><div class="panel-title"><h3>Команди</h3><button class="btn btn-primary" data-action="admin-team"><i data-lucide="plus"></i> Додати команду</button></div>
      <div class="admin-team-list">${admin.teams.map(t => `<article class="admin-team"><div><strong>${escapeHtml(t.name)}</strong><p class="small muted">${t.birthYear} рік · ${escapeHtml(admin.users.find(u => u.id === t.coachId)?.name || "Без тренера")}</p></div><div class="section-actions"><button class="btn btn-secondary" data-action="admin-team" data-id="${t.id}">Команда й тренер</button><button class="btn btn-secondary" data-action="admin-manage-team" data-id="${t.id}">Відкрити склад</button></div></article>`).join("") || `<p class="muted">Створіть першу команду й призначте їй тренера.</p>`}</div>
      <p class="small muted">Оберіть команду у меню, щоб керувати її розкладом, складом, турнірами та чатами.</p>
    </section>
    <section class="panel"><div class="panel-title"><h3>Користувачі</h3></div><label class="field"><span>Знайти за ім’ям або номером</span><input class="form-input" id="adminSearch" type="search" value="${escapeHtml(adminSearch)}" placeholder="Ім’я або +380…"></label><div id="adminUsers">${renderAdminUsers()}</div></section>
  </div>`;
}

function renderAdminUsers() {
  const roles = { parent: "Батьки", coach: "Тренер", admin: "Адміністратор" };
  const users = (state.admin?.users || []).filter(u => `${u.name} ${u.phone}`.toLocaleLowerCase("uk").includes(adminSearch.toLocaleLowerCase("uk")));
  return users.map(u => `<article class="admin-user"><div><strong>${escapeHtml(u.name)}</strong><p class="small muted">${escapeHtml(u.phone)} · ${roles[u.role]}${u.active ? "" : " · Заблоковано"}${u.telegram ? " · Telegram підключено" : ""}</p></div><button class="btn btn-secondary" data-action="admin-user" data-id="${u.id}">Керувати</button></article>`).join("") || `<p class="muted">Нікого не знайдено.</p>`;
}

document.addEventListener("input", event => {
  if (event.target.id !== "adminSearch") return;
  adminSearch = event.target.value;
  $("#adminUsers").innerHTML = renderAdminUsers();
});

function openAdminUser(userId) {
  const user = state.admin.users.find(u => u.id === userId);
  if (!user) return;
  openModal({ title: "Користувач", eyebrow: user.phone,
    body: `<div class="stack"><label class="field"><span>Ім’я</span><input class="form-input" name="name" required minlength="2" maxlength="120" value="${escapeHtml(user.name)}"></label><label class="field"><span>Роль</span><select class="form-select" name="role">${Object.entries({parent:"Батьки",coach:"Тренер",admin:"Адміністратор"}).map(([value,label]) => `<option value="${value}" ${value === user.role ? "selected" : ""}>${label}</option>`).join("")}</select></label><label><input type="checkbox" name="active" ${user.active ? "checked" : ""}> Доступ до сайту дозволено</label><p class="small muted">Тренер керує своїми командами. Адміністратор має доступ до всього клубу.</p></div>`,
    onSave: data => runServerMutation(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({name: data.get("name"), role: data.get("role"), active: data.has("active")}) }, "Користувача оновлено")
  });
}

function openAdminTeam(teamId) {
  const existing = state.admin.teams.find(t => t.id === teamId);
  const coaches = state.admin.users.filter(u => u.active && ["coach", "admin"].includes(u.role));
  openModal({ title: existing ? "Команда й тренер" : "Нова команда",
    body: `<div class="stack"><label class="field"><span>Назва</span><input class="form-input" name="name" required minlength="3" maxlength="100" value="${escapeHtml(existing?.name || "")}"></label><label class="field"><span>Рік народження</span><input class="form-input" type="number" name="birthYear" min="2005" max="2100" required value="${existing?.birthYear || 2017}"></label><label class="field"><span>Тренер</span><select class="form-select" name="coachId" required>${coaches.map(u => `<option value="${u.id}" ${u.id === existing?.coachId ? "selected" : ""}>${escapeHtml(u.name)} · ${escapeHtml(u.phone)}</option>`).join("")}</select></label><p class="small muted">Щоб додати нового тренера до списку, змініть його роль у розділі «Користувачі».</p></div>`,
    onSave: data => runServerMutation(existing ? `/api/admin/teams/${existing.id}` : "/api/admin/teams", {method: existing ? "PUT" : "POST", body: JSON.stringify({name:data.get("name"), birthYear:Number(data.get("birthYear")), coachId:Number(data.get("coachId"))})}, "Команду збережено"),
    onDelete: existing ? () => {
      if (!confirm(`Видалити «${existing.name}» разом зі складом, розкладом, відповідями, турнірами та чатами? Цю дію не можна скасувати.`)) return false;
      return runServerMutation(`/api/admin/teams/${existing.id}`, {method:"DELETE"}, "Команду видалено");
    } : null
  });
}

function openClubSettings() {
  const settings = state.admin.settings;
  openModal({ title: "Налаштування сайту", body: `<div class="stack"><label class="field"><span>Назва клубу</span><input class="form-input" name="name" minlength="2" maxlength="100" required value="${escapeHtml(settings.name)}"></label><label class="field"><span>Текст на сторінці входу</span><textarea class="form-textarea" name="welcome" maxlength="500">${escapeHtml(settings.welcome)}</textarea></label></div>`,
    onSave: async data => {
      const result = await runServerMutation("/api/admin/settings", {method:"PUT", body:JSON.stringify(Object.fromEntries(data))}, "Налаштування збережено");
      if (result !== false) { $("#authTitle").textContent = data.get("name"); $("#clubWelcome").textContent = data.get("welcome"); }
      return result;
    }
  });
}
