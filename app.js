const STORAGE_KEY = "favorit-platform-v2";
const SESSION_KEY = "favorit-session-v2";
const ALERT_API = "https://neptun.in.ua/api/v1/alerts";
const VIEW_TITLES = {
  dashboard: "Огляд команди",
  schedule: "Розклад",
  chats: "Чати",
  roster: "Склад команди",
  tournaments: "Турніри",
  notifications: "Сповіщення"
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
let pendingPhone = "";
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
    throw new Error(message);
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
function parentPlayer() { return state.players[0]; }
function roleName() { return session?.role === "coach" ? "Тренер" : `Батьки · ${parentPlayer()?.name || "гравець"}`; }
function userName() { return session?.userName || (session?.role === "coach" ? "Андрій Савчук" : "Катерина Коваленко"); }

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
  currentTeamId = role === "parent" ? parentPlayer().teamId : currentTeamId;
  $("#authScreen").hidden = true;
  $("#appShell").hidden = false;
  renderShell();
  navigate("dashboard");
}

function signOut() {
  session = null;
  localStorage.removeItem(SESSION_KEY);
  $("#appShell").hidden = true;
  $("#authScreen").hidden = false;
  $("#phoneStep").hidden = false;
  $("#codeStep").hidden = true;
  $("#authError").textContent = "";
}

function renderShell() {
  const visibleTeams = session.role === "coach" ? state.teams : state.teams.filter(item => item.id === parentPlayer().teamId);
  $("#teamSelect").innerHTML = visibleTeams.length
    ? visibleTeams.map(item => `<option value="${item.id}" ${item.id === currentTeamId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")
    : `<option value="">Команда ще не створена</option>`;
  $("#teamSelect").disabled = visibleTeams.length === 0;
  $("#userName").textContent = userName();
  $("#userRole").textContent = roleName();
  $("#userInitials").textContent = initials(userName());
  $("#pageEyebrow").textContent = team()?.name || (session.role === "coach" ? "Налаштування клубу" : "Клуб");
  const unread = state.chats.filter(chat => chat.teamId === currentTeamId).reduce((sum, chat) => sum + chat.unread, 0);
  $("#chatBadge").textContent = unread;
  $("#chatBadge").hidden = unread === 0;
  $("#notificationDot").hidden = !state.notifications.some(item => !item.read);
  $$('[data-switch-role]').forEach(button => button.hidden = serverMode);
  refreshIcons();
}

function navigate(view) {
  currentView = VIEW_TITLES[view] ? view : "dashboard";
  if (location.hash !== `#${currentView}`) history.replaceState(null, "", `#${currentView}`);
  $("#pageTitle").textContent = VIEW_TITLES[currentView];
  $("#pageEyebrow").textContent = team()?.name || (session?.role === "coach" ? "Налаштування клубу" : "Клуб");
  $$(`[data-nav]`).forEach(button => button.classList.toggle("active", button.dataset.nav === currentView));
  renderCurrentView();
  $("#content").focus({ preventScroll: true });
}

function renderCurrentView() {
  if (!hasTeam()) {
    $("#content").innerHTML = session?.role === "coach"
      ? emptyState("shield-plus", "Створіть першу команду", "Додайте команду, щоб налаштувати склад, розклад, чати та турніри клубу.", "new-team", "Створити першу команду")
      : emptyState("users-round", "Команду ще не підключено", "Попросіть тренера додати ваш номер телефону до складу команди.");
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
  return `
    <section>
      <div class="section-head">
        <div><h2>Календар команди</h2><p>${events.length} запланованих подій</p></div>
        ${session.role === "coach" ? `<button class="btn btn-primary" type="button" data-action="new-event"><i data-lucide="plus"></i><span>Нова подія</span></button>` : ""}
      </div>
      <div class="event-list">${events.length ? events.map(item => eventCard(item, session.role === "coach")).join("") : emptyState("calendar-x", "Подій ще немає", "Тренер додасть тренування або матч.")}</div>
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
            <div class="detail-row"><span>Контакт батьків</span><strong>${escapeHtml(child.phone)}</strong></div>
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
              <td>${escapeHtml(player.position)}</td><td>${player.birth}</td><td>${escapeHtml(player.parent)}</td><td>${escapeHtml(player.phone)}</td>
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
        ${session.role === "coach" ? `<button class="btn btn-primary" type="button" data-action="new-tournament"><i data-lucide="plus"></i><span>Додати турнір</span></button>` : ""}
      </div>
      <div class="tournament-grid">${items.length ? items.map(item => `
        <article class="tournament-card">
          <span class="badge badge-tournament"><i data-lucide="trophy"></i>${escapeHtml(item.status)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${eventDate(item.date)} · ${eventTime(item.date)}</p>
          <p>${escapeHtml(item.place)}</p>
          <div class="detail-list"><div class="detail-row"><span>Для команди</span><strong>${escapeHtml(team().name)}</strong></div></div>
          <p>${escapeHtml(item.note)}</p>
          ${session.role === "coach" ? `<button class="text-btn" style="margin-top:14px" type="button" data-action="edit-tournament" data-id="${item.id}">Редагувати</button>` : ""}
        </article>`).join("") : emptyState("trophy", "Турнірів ще немає", "Додайте перший турнір або виїзд команди.", session.role === "coach" ? "new-tournament" : "")}</div>
    </section>`;
}

function renderChats() {
  const chats = state.chats.filter(chat => chat.teamId === currentTeamId);
  if (!chats.some(chat => chat.id === currentChatId)) currentChatId = chats[0]?.id;
  const active = chats.find(chat => chat.id === currentChatId);
  const messages = state.messages[currentChatId] || [];
  return `
    <section class="chat-layout">
      <aside class="chat-list">
        <div class="chat-list-head"><h2>Розмови</h2></div>
        ${chats.map(chat => `
          <button class="chat-thread ${chat.id === currentChatId ? "active" : ""}" type="button" data-action="select-chat" data-id="${chat.id}">
            <span class="person-avatar">${chat.kind === "team" ? "ФК" : "АС"}</span>
            <span class="thread-copy"><strong>${escapeHtml(chat.title)}</strong><span>${chat.kind === "team" ? "Командний чат" : "Особистий чат"}</span></span>
            ${chat.unread ? `<b class="nav-badge">${chat.unread}</b>` : ""}
          </button>`).join("")}
      </aside>
      <div class="chat-panel">
        <header class="chat-head">
          <div><h3>${active ? escapeHtml(active.title) : "Чат"}</h3><span class="small muted">${active?.kind === "team" ? `${teamPlayers().length + 1} учасників` : "Тренер команди"}</span></div>
          ${session.role === "coach" && active?.kind === "team" ? `<button class="btn btn-secondary" type="button" data-action="chat-poll"><i data-lucide="list-checks"></i><span>Опитування</span></button>` : ""}
        </header>
        <div class="chat-messages" id="chatMessages">
          ${messages.map(message => messageBubble(message)).join("")}
        </div>
        <form class="chat-compose" id="chatForm">
          <button class="icon-btn" type="button" title="Додати файл" aria-label="Додати файл"><i data-lucide="paperclip"></i></button>
          <input id="chatInput" aria-label="Повідомлення" placeholder="Напишіть повідомлення…" autocomplete="off">
          <button class="icon-btn" type="submit" title="Надіслати" aria-label="Надіслати"><i data-lucide="send"></i></button>
        </form>
      </div>
    </section>`;
}

function messageBubble(message) {
  const mine = message.role === session.role;
  const pollEvent = message.poll ? state.events.find(item => item.id === message.eventId) : null;
  return `
    <article class="message ${mine ? "mine" : ""} ${message.poll ? "poll-message" : ""}">
      <span class="message-author">${escapeHtml(message.author)}</span>
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
          ${settingSwitch("attendanceReminders", "Відповідь про присутність", "Нагадувати кожні 30 хвилин до відповіді")}
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
    const result = await onSave(formData);
    if (result !== false) $("#appModal").close();
  };
  if (onDelete) $("#modalDeleteBtn").onclick = async () => { if (await onDelete() !== false) $("#appModal").close(); };
  $("#appModal").showModal();
  refreshIcons();
}

function toLocalInput(iso) {
  const date = new Date(iso);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
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
      <label class="field"><span>Телефон батьків</span><input class="form-input" type="tel" name="phone" required placeholder="+380…" value="${escapeHtml(existing?.phone || "")}"></label>
      <label class="field full"><span>Ім’я та прізвище когось із батьків</span><input class="form-input" name="parent" required value="${escapeHtml(existing?.parent || "")}"></label>
    </div>`,
    onSave: async data => {
      const values = Object.fromEntries(data);
      if (serverMode) {
        return runServerMutation(existing ? `/api/players/${existing.id}` : "/api/players", { method: existing ? "PUT" : "POST", body: JSON.stringify({ team_id: currentTeamId, name: values.name.trim(), number: Number(values.number), position: values.position, birth: values.birth.trim(), parent: values.parent.trim(), phone: values.phone.trim() }) }, existing ? "Дані гравця оновлено" : "Гравця додано до складу");
      }
      const record = { id: existing?.id || id("player"), teamId: currentTeamId, name: values.name.trim(), number: Number(values.number), position: values.position, birth: values.birth.trim(), parent: values.parent.trim(), phone: values.phone.trim() };
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
  if (Date.now() - Number(state.settings.lastReminder || 0) < 30 * 60 * 1000) return;
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
  state.messages[currentChatId].push({ id: id("message"), author: userName(), role: session.role, text: value, time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) });
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
    if (session.role === "parent") currentTeamId = parentPlayer().teamId;
    renderShell(); navigate("dashboard"); showToast(`Відкрито: ${roleName()}`); return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;
  const name = action.dataset.action;
  if (name === "close-modal") $("#appModal").close();
  if (name === "answer") answerAttendance(action.dataset.event, action.dataset.value);
  if (name === "change-answer") {
    if (serverMode) await runServerMutation(`/api/events/${action.dataset.event}/attendance?player_id=${parentPlayer().id}`, { method: "DELETE" });
    else { delete state.attendance[action.dataset.event][parentPlayer().id]; saveState(); renderCurrentView(); }
  }
  if (name === "new-event") openEventModal();
  if (name === "edit-event") openEventModal(state.events.find(item => item.id === action.dataset.id));
  if (name === "new-player") openPlayerModal();
  if (name === "edit-player") openPlayerModal(state.players.find(item => item.id === action.dataset.id));
  if (name === "new-team") openTeamModal();
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

$("#sendCodeBtn").addEventListener("click", async () => {
  const digits = $("#phoneInput").value.replace(/\D/g, "");
  if (digits.length < 9) { $("#authError").textContent = "Введіть повний номер телефону."; return; }
  $("#authError").textContent = "";
  pendingPhone = $("#phoneInput").value;
  if (serverMode) {
    try {
      const result = await apiFetch("/api/auth/request-code", { method: "POST", body: JSON.stringify({ phone: pendingPhone }) }, false);
      $("#codeHelp").innerHTML = result.devCode ? `Локальний код: <strong>${escapeHtml(result.devCode)}</strong>` : "Код надіслано в Telegram. Він діє 10 хвилин.";
    } catch (error) {
      $("#authError").textContent = error.message;
      return;
    }
  } else {
    $("#codeHelp").innerHTML = "Демо-код: <strong>1111</strong>";
  }
  $("#phoneStep").hidden = true;
  $("#codeStep").hidden = false;
  $("#codeInput").focus();
});
$("#backToPhoneBtn").addEventListener("click", () => { $("#phoneStep").hidden = false; $("#codeStep").hidden = true; });
$("#verifyCodeBtn").addEventListener("click", async () => {
  if (serverMode) {
    try {
      const result = await apiFetch("/api/auth/verify", { method: "POST", body: JSON.stringify({ phone: pendingPhone, code: $("#codeInput").value }) }, false);
      session = { token: result.token, role: result.user.role, userName: result.user.name, userId: result.user.id };
      saveSession();
      await refreshServerState();
      $("#authScreen").hidden = true;
      $("#appShell").hidden = false;
      currentTeamId = state.teams[0]?.id || "";
      renderShell(); navigate("dashboard");
    } catch (error) {
      $("#authError").textContent = error.message;
    }
    return;
  }
  if ($("#codeInput").value !== "1111") { $("#authError").textContent = "Для демоверсії введіть код 1111."; return; }
  const digits = $("#phoneInput").value.replace(/\D/g, "");
  signIn(digits.endsWith("671234567") ? "coach" : "parent");
});

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
  if (!serverMode || !session?.token || document.hidden || $("#appModal").open) return;
  try { await refreshServerState(true); } catch {}
}, 15000);

async function initialize() {
  try {
    publicConfig = await apiFetch("/api/config", {}, false);
    serverMode = Boolean(publicConfig.server);
  } catch {
    serverMode = false;
  }
  $("#demoAccess").hidden = serverMode && !publicConfig.demo;
  if (serverMode && /^[A-Za-z0-9_]+$/.test(publicConfig.telegramBot || "")) {
    $("#telegramEntry").hidden = false;
    $("#telegramLink").href = `https://t.me/${publicConfig.telegramBot}?start=login`;
  }
  $("#demoNote").textContent = serverMode
    ? (publicConfig.demo ? "Тестовий вхід увімкнено адміністратором." : "Вхід доступний лише для номерів, доданих тренером.")
    : "Статична демоверсія: дані зберігаються лише на цьому пристрої.";

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
    currentTeamId = session.role === "parent" ? parentPlayer().teamId : (state.teams[0]?.id || currentTeamId);
    renderShell();
    navigate(location.hash.slice(1) || "dashboard");
  } else {
    refreshIcons();
  }
}

initialize();
