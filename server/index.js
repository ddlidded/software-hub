import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import { db } from "./db.js";
import {
  attachUser,
  createUser,
  endSession,
  ensureAdminUser,
  requireUser,
  startSession,
  validateCredentials,
  verifyUser,
} from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());
app.use(attachUser);

function cleanLink(body) {
  const name = String(body.name || "").trim();
  const rawUrl = String(body.url || "").trim();
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const category = String(body.category || "").trim() || "Other";
  const description = String(body.description || "").trim().slice(0, 120);

  if (!name) return { error: "Name is required." };
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad protocol");
  } catch {
    return { error: "Enter a valid URL." };
  }
  return { link: { name: name.slice(0, 60), url, category: category.slice(0, 40), description } };
}

app.post("/api/auth/signup", (req, res) => {
  const { email, password, displayName } = req.body || {};
  const invalid = validateCredentials(email, password);
  if (invalid) return res.status(400).json({ error: invalid });

  const result = createUser({ email, password, displayName });
  if (result.error) return res.status(409).json({ error: result.error });

  startSession(res, result.user.id);
  res.status(201).json({ user: result.user });
});

app.post("/api/auth/login", (req, res) => {
  const result = verifyUser(req.body || {});
  if (result.error) return res.status(401).json({ error: result.error });

  startSession(res, result.user.id);
  res.json({ user: result.user });
});

app.post("/api/auth/logout", (req, res) => {
  endSession(req, res);
  res.json({ ok: true });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  res.json({ user: req.user || null });
});

app.get("/api/links", requireUser, (req, res) => {
  const links = db
    .prepare("SELECT id, category, name, url, description, position FROM links WHERE user_id = ? ORDER BY position, id")
    .all(req.user.id);
  res.json({ links });
});

app.post("/api/links", requireUser, (req, res) => {
  const { link, error } = cleanLink(req.body || {});
  if (error) return res.status(400).json({ error });

  const { next } = db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM links WHERE user_id = ?").get(req.user.id);
  const info = db
    .prepare(
      `INSERT INTO links (user_id, category, name, url, description, position)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, link.category, link.name, link.url, link.description, next);
  res.status(201).json({ link: { id: info.lastInsertRowid, ...link, position: next } });
});

app.put("/api/links/:id", requireUser, (req, res) => {
  const { link, error } = cleanLink(req.body || {});
  if (error) return res.status(400).json({ error });

  const info = db
    .prepare("UPDATE links SET category = ?, name = ?, url = ?, description = ? WHERE id = ? AND user_id = ?")
    .run(link.category, link.name, link.url, link.description, req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: "Link not found." });
  res.json({ link: { id: Number(req.params.id), ...link } });
});

app.delete("/api/links/:id", requireUser, (req, res) => {
  const info = db.prepare("DELETE FROM links WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: "Link not found." });
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, "..", "public")));

ensureAdminUser();

const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Hub running on http://localhost:${port}`);
});
