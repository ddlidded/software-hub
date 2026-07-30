const el = (id) => document.getElementById(id);

const ui = {
  gate: el("gate"),
  app: el("app"),
  authForm: el("auth-form"),
  authHeading: el("auth-heading"),
  authSub: el("auth-sub"),
  authName: el("auth-name"),
  nameField: el("name-field"),
  authEmail: el("auth-email"),
  authPassword: el("auth-password"),
  authError: el("auth-error"),
  authSubmit: el("auth-submit"),
  authSwitch: el("auth-switch"),
  switchCopy: el("switch-copy"),
  who: el("who"),
  logout: el("logout"),
  theme: el("theme-toggle"),
  title: el("title"),
  search: el("search"),
  filters: el("filters"),
  root: el("grid-root"),
  empty: el("empty"),
  settings: el("settings"),
  settingsOpen: el("settings-open"),
  settingsOpenFooter: el("settings-open-footer"),
  settingsClose: el("settings-close"),
  linkForm: el("link-form"),
  formTitle: el("form-title"),
  formSubmit: el("form-submit"),
  formCancel: el("form-cancel"),
  formError: el("form-error"),
  fName: el("f-name"),
  fCategory: el("f-category"),
  fUrl: el("f-url"),
  fDescription: el("f-description"),
  categoryOptions: el("category-options"),
  manageList: el("manage-list"),
  manageCount: el("manage-count"),
};

const state = {
  user: null,
  links: [],
  query: "",
  category: "All",
  mode: "login",
  editingId: null,
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function showError(node, message) {
  node.textContent = message || "";
  node.hidden = !message;
}

/* ---------- links view ---------- */

function categories() {
  return [...new Set(state.links.map((link) => link.category))];
}

function matches(link) {
  const q = state.query.trim().toLowerCase();
  if (state.category !== "All" && link.category !== state.category) return false;
  if (!q) return true;
  return [link.name, link.description, hostOf(link.url), link.category]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q));
}

function cardEl(link, index) {
  const a = document.createElement("a");
  a.className = "card";
  a.href = link.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.animationDelay = `${Math.min(index, 12) * 22}ms`;

  const logo = document.createElement("span");
  logo.className = "logo";
  logo.textContent = link.name.charAt(0).toUpperCase();
  const host = hostOf(link.url);
  if (host) {
    const img = document.createElement("img");
    img.src = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    img.alt = "";
    img.loading = "lazy";
    img.addEventListener("load", () => {
      logo.textContent = "";
      logo.appendChild(img);
    });
  }

  const meta = document.createElement("span");
  meta.className = "meta";
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = link.name;
  meta.appendChild(name);
  if (link.description) {
    const desc = document.createElement("span");
    desc.className = "desc";
    desc.textContent = link.description;
    meta.appendChild(desc);
  }

  a.append(logo, meta);
  return a;
}

function renderGrid() {
  ui.root.textContent = "";
  let shown = 0;

  categories().forEach((category) => {
    const links = state.links.filter((link) => link.category === category && matches(link));
    if (!links.length) return;

    const section = document.createElement("section");
    section.className = "group";

    const head = document.createElement("div");
    head.className = "group-head";
    const h2 = document.createElement("h2");
    h2.textContent = category;
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = links.length;
    const rule = document.createElement("span");
    rule.className = "rule";
    head.append(h2, count, rule);

    const grid = document.createElement("div");
    grid.className = "grid";
    links.forEach((link) => {
      grid.appendChild(cardEl(link, shown));
      shown += 1;
    });

    section.append(head, grid);
    ui.root.appendChild(section);
  });

  ui.empty.hidden = shown > 0;
  ui.empty.textContent = state.links.length
    ? "No tools match that search."
    : "No links yet — open Settings to add your first one.";
}

function renderFilters() {
  const names = ["All", ...categories()];
  if (!names.includes(state.category)) state.category = "All";
  ui.filters.textContent = "";
  names.forEach((name) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = name;
    chip.setAttribute("aria-pressed", String(state.category === name));
    chip.addEventListener("click", () => {
      state.category = name;
      renderFilters();
      renderGrid();
    });
    ui.filters.appendChild(chip);
  });
}

/* ---------- settings ---------- */

function resetForm() {
  state.editingId = null;
  ui.linkForm.reset();
  ui.formTitle.textContent = "Add a link";
  ui.formSubmit.textContent = "Add link";
  ui.formCancel.hidden = true;
  showError(ui.formError, "");
}

function startEdit(link) {
  state.editingId = link.id;
  ui.fName.value = link.name;
  ui.fCategory.value = link.category;
  ui.fUrl.value = link.url;
  ui.fDescription.value = link.description;
  ui.formTitle.textContent = "Edit link";
  ui.formSubmit.textContent = "Save changes";
  ui.formCancel.hidden = false;
  showError(ui.formError, "");
  ui.fName.focus();
}

function renderManageList() {
  ui.manageCount.textContent = state.links.length;
  ui.manageList.textContent = "";

  ui.categoryOptions.textContent = "";
  categories().forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    ui.categoryOptions.appendChild(option);
  });

  state.links.forEach((link) => {
    const li = document.createElement("li");
    li.className = "manage-item";

    const info = document.createElement("div");
    info.className = "manage-info";
    const name = document.createElement("span");
    name.className = "manage-name";
    name.textContent = link.name;
    const sub = document.createElement("span");
    sub.className = "manage-sub";
    sub.textContent = `${link.category} · ${hostOf(link.url)}`;
    info.append(name, sub);

    const actions = document.createElement("div");
    actions.className = "manage-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn tiny";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => startEdit(link));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn tiny danger";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!confirm(`Delete “${link.name}”?`)) return;
      try {
        await api(`/api/links/${link.id}`, { method: "DELETE" });
        state.links = state.links.filter((item) => item.id !== link.id);
        if (state.editingId === link.id) resetForm();
        refreshAll();
      } catch (error) {
        showError(ui.formError, error.message);
      }
    });

    actions.append(edit, remove);
    li.append(info, actions);
    ui.manageList.appendChild(li);
  });
}

function refreshAll() {
  renderFilters();
  renderGrid();
  renderManageList();
}

function openSettings() {
  ui.settings.hidden = false;
  ui.fName.focus();
}

function closeSettings() {
  ui.settings.hidden = true;
  resetForm();
}

ui.linkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: ui.fName.value,
    category: ui.fCategory.value,
    url: ui.fUrl.value,
    description: ui.fDescription.value,
  };

  try {
    if (state.editingId) {
      const { link } = await api(`/api/links/${state.editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      state.links = state.links.map((item) => (item.id === link.id ? { ...item, ...link } : item));
    } else {
      const { link } = await api("/api/links", { method: "POST", body: JSON.stringify(payload) });
      state.links.push(link);
    }
    resetForm();
    refreshAll();
  } catch (error) {
    showError(ui.formError, error.message);
  }
});

ui.formCancel.addEventListener("click", resetForm);
ui.settingsOpen.addEventListener("click", openSettings);
ui.settingsOpenFooter.addEventListener("click", openSettings);
ui.settingsClose.addEventListener("click", closeSettings);
ui.settings.addEventListener("click", (event) => {
  if (event.target === ui.settings) closeSettings();
});

/* ---------- auth ---------- */

function setMode(mode) {
  state.mode = mode;
  const signup = mode === "signup";
  ui.authHeading.textContent = signup ? "Create your hub" : "Welcome back";
  ui.authSub.textContent = signup ? "Your links stay private to your account." : "Sign in to see your links.";
  ui.authSubmit.textContent = signup ? "Create account" : "Sign in";
  ui.nameField.hidden = !signup;
  ui.switchCopy.textContent = signup ? "Already have an account?" : "New here?";
  ui.authSwitch.textContent = signup ? "Sign in" : "Create an account";
  ui.authPassword.autocomplete = signup ? "new-password" : "current-password";
  showError(ui.authError, "");
}

ui.authSwitch.addEventListener("click", () => setMode(state.mode === "signup" ? "login" : "signup"));

ui.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const path = state.mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
  const body = {
    email: ui.authEmail.value,
    password: ui.authPassword.value,
    displayName: ui.authName.value,
  };

  ui.authSubmit.disabled = true;
  try {
    const { user } = await api(path, { method: "POST", body: JSON.stringify(body) });
    ui.authForm.reset();
    await enterApp(user);
  } catch (error) {
    showError(ui.authError, error.message);
  } finally {
    ui.authSubmit.disabled = false;
  }
});

ui.logout.addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" }).catch(() => {});
  state.user = null;
  state.links = [];
  closeSettings();
  ui.app.hidden = true;
  ui.gate.hidden = false;
  setMode("login");
});

async function enterApp(user) {
  state.user = user;
  const { links } = await api("/api/links");
  state.links = links;
  ui.who.textContent = user.displayName;
  ui.title.textContent = `${user.displayName}'s Hub`;
  document.title = `${user.displayName}'s Hub`;
  ui.gate.hidden = true;
  ui.app.hidden = false;
  refreshAll();
}

/* ---------- theme & shortcuts ---------- */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("hub-theme", theme);
}

ui.theme.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

ui.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderGrid();
});

ui.search.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const first = ui.root.querySelector(".card");
  if (first) window.open(first.href, "_blank", "noopener");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !ui.settings.hidden) {
    closeSettings();
    return;
  }
  if (!state.user || !ui.settings.hidden) return;
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
  if (event.key === "/" && !typing) {
    event.preventDefault();
    ui.search.focus();
  }
  if (event.key === "Escape" && document.activeElement === ui.search) {
    ui.search.value = "";
    state.query = "";
    renderGrid();
    ui.search.blur();
  }
});

async function boot() {
  applyTheme(localStorage.getItem("hub-theme") || "dark");
  setMode("login");
  try {
    const { user } = await api("/api/me");
    if (user) return await enterApp(user);
  } catch {
    /* fall through to the sign-in gate */
  }
  ui.gate.hidden = false;
}

boot();
