const config = window.HUB || { title: "Hub", tagline: "", groups: [] };

const els = {
  brand: document.getElementById("brand-name"),
  title: document.getElementById("title"),
  tagline: document.getElementById("tagline"),
  search: document.getElementById("search"),
  filters: document.getElementById("filters"),
  root: document.getElementById("grid-root"),
  empty: document.getElementById("empty"),
  theme: document.getElementById("theme-toggle"),
};

const state = { query: "", category: "All" };

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function faviconOf(url) {
  const host = hostOf(url);
  return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : "";
}

function matches(link, group) {
  const q = state.query.trim().toLowerCase();
  if (state.category !== "All" && group.name !== state.category) return false;
  if (!q) return true;
  return [link.name, link.desc, hostOf(link.url), group.name]
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
  const icon = faviconOf(link.url);
  if (icon) {
    const img = document.createElement("img");
    img.src = icon;
    img.alt = "";
    img.loading = "lazy";
    img.addEventListener("error", () => img.remove());
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
  if (link.desc) {
    const desc = document.createElement("span");
    desc.className = "desc";
    desc.textContent = link.desc;
    meta.appendChild(desc);
  }

  a.append(logo, meta);
  return a;
}

function render() {
  els.root.textContent = "";
  let shown = 0;

  config.groups.forEach((group) => {
    const links = group.links.filter((link) => matches(link, group));
    if (!links.length) return;

    const section = document.createElement("section");
    section.className = "group";

    const head = document.createElement("div");
    head.className = "group-head";
    const h2 = document.createElement("h2");
    h2.textContent = group.name;
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = links.length;
    const rule = document.createElement("span");
    rule.className = "rule";
    head.append(h2, count, rule);

    const grid = document.createElement("div");
    grid.className = "grid";
    links.forEach((link) => {
      const card = cardEl(link, shown);
      if (shown === 0 && state.query.trim()) card.classList.add("is-first-result");
      grid.appendChild(card);
      shown += 1;
    });

    section.append(head, grid);
    els.root.appendChild(section);
  });

  els.empty.hidden = shown > 0;
}

function renderFilters() {
  const names = ["All", ...config.groups.map((g) => g.name)];
  els.filters.textContent = "";
  names.forEach((name) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = name;
    chip.setAttribute("aria-pressed", String(state.category === name));
    chip.addEventListener("click", () => {
      state.category = name;
      renderFilters();
      render();
    });
    els.filters.appendChild(chip);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("hub-theme", theme);
}

function init() {
  if (config.title) {
    document.title = config.title;
    els.brand.textContent = config.title;
    els.title.textContent = config.title;
  }
  if (config.tagline) els.tagline.textContent = config.tagline;

  applyTheme(localStorage.getItem("hub-theme") || "dark");
  els.theme.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  els.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });

  els.search.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const first = els.root.querySelector(".card");
    if (first) window.open(first.href, "_blank", "noopener");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== els.search) {
      event.preventDefault();
      els.search.focus();
    }
    if (event.key === "Escape" && document.activeElement === els.search) {
      els.search.value = "";
      state.query = "";
      render();
      els.search.blur();
    }
  });

  renderFilters();
  render();
}

init();
