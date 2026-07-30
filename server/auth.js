import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db, seedLinksForUser } from "./db.js";

const SESSION_COOKIE = "hub_session";
const SESSION_DAYS = 30;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  path: "/",
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function validateCredentials(email, password) {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizeEmail(email))) return "Enter a valid email address.";
  if (String(password || "").length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function createUser({ email, password, displayName }) {
  const normalized = normalizeEmail(email);
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized);
  if (existing) return { error: "An account with that email already exists." };

  const name = String(displayName || "").trim() || normalized.split("@")[0];
  const info = db
    .prepare("INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)")
    .run(normalized, name, bcrypt.hashSync(password, 12));

  seedLinksForUser(info.lastInsertRowid);
  return { user: { id: info.lastInsertRowid, email: normalized, displayName: name } };
}

export function verifyUser({ email, password }) {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(email));
  if (!row || !bcrypt.compareSync(String(password || ""), row.password_hash)) {
    return { error: "Incorrect email or password." };
  }
  return { user: { id: row.id, email: row.email, displayName: row.display_name } };
}

export function startSession(res, userId) {
  const id = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, expires);
  res.cookie(SESSION_COOKIE, id, cookieOptions);
}

export function endSession(req, res) {
  const id = req.cookies?.[SESSION_COOKIE];
  if (id) db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
}

export function attachUser(req, _res, next) {
  const id = req.cookies?.[SESSION_COOKIE];
  if (id) {
    const row = db
      .prepare(
        `SELECT u.id, u.email, u.display_name FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.id = ? AND s.expires_at > datetime('now')`
      )
      .get(id);
    if (row) req.user = { id: row.id, email: row.email, displayName: row.display_name };
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in to continue." });
  next();
}
