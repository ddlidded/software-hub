# Software Hub

A single, fast page linking every tool you use. No build step, no dependencies — three static files.

## Use it

Open `index.html`, or serve locally:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Customize

Everything lives in `links.js`: the page title, tagline, categories, and links.

```js
window.HUB = {
  title: "Edmund's Hub",
  tagline: "Every tool, one keystroke away.",
  groups: [
    { name: "Development", links: [{ name: "GitHub", url: "https://github.com", desc: "Repos, PRs, issues" }] }
  ]
};
```

Icons are fetched automatically from each site's favicon; the first letter of the name is used as a fallback.

## Features

- Instant fuzzy-free search across names, descriptions, hostnames, and categories
- Category filter chips
- Dark/light theme, remembered in `localStorage`
- Keyboard: `/` focuses search, `Enter` opens the top result, `Esc` clears
- Responsive, animated gradient background, respects `prefers-reduced-motion`

## Deploy to GitHub Pages

Repository → Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/root`.
