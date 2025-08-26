const cors = require('cors');
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  /\.vercel\.app$/
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // CLI/Postman/SSR
    const ok = allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin));
    return ok ? cb(null, true) : cb(new Error('CORS bloqueado: ' + origin));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev";
const PORT = process.env.PORT || 4000;

// Helpers
const emailValido = (e) => typeof e === "string" && e.includes("@") && e.length <= 120;
const passValida  = (p) => typeof p === "string" && p.length >= 6 && p.length <= 120;
const textoCorto  = (t) => typeof t === "string" && t.trim().length > 0 && t.trim().length <= 200;

// Healthcheck
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Middleware auth
function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    req.user = jwt.verify(token, JWT_SECRET); // { id, email }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// -------- AUTH --------
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!textoCorto(name) || !emailValido(email) || !passValida(password))
    return res.status(400).json({ error: "Datos inválidos" });

  const normalizedEmail = email.trim().toLowerCase();
  const userExists = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (userExists) return res.status(409).json({ error: "Email ya registrado" });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
    .run(name.trim(), normalizedEmail, hash);

  const user = { id: result.lastInsertRowid, email: normalizedEmail };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!emailValido(email) || !passValida(password))
    return res.status(400).json({ error: "Datos inválidos" });

  const normalizedEmail = email.trim().toLowerCase();
  const row = db
    .prepare("SELECT id, email, password FROM users WHERE email = ?")
    .get(normalizedEmail);

  if (!row || !bcrypt.compareSync(password, row.password))
    return res.status(401).json({ error: "Credenciales inválidas" });

  const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token });
});

// -------- TASKS --------
app.get("/api/tasks", auth, (req, res) => {
  const tasks = db
    .prepare("SELECT id, title, done FROM tasks WHERE user_id = ? ORDER BY id DESC")
    .all(req.user.id)
    .map(t => ({ ...t, done: !!t.done }));
  res.json(tasks);
});

app.post("/api/tasks", auth, (req, res) => {
  const { title } = req.body || {};
  if (!textoCorto(title)) return res.status(400).json({ error: "Título inválido" });

  const result = db
    .prepare("INSERT INTO tasks (user_id, title, done) VALUES (?, ?, 0)")
    .run(req.user.id, title.trim());

  const task = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ ...task, done: !!task.done });
});

app.put("/api/tasks/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body || {};
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  if (title !== undefined && !textoCorto(title)) return res.status(400).json({ error: "Título inválido" });
  if (done  !== undefined && typeof done !== "boolean") return res.status(400).json({ error: "Done inválido" });

  const current = db
    .prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?")
    .get(id, req.user.id);

  if (!current) return res.status(404).json({ error: "No encontrada" });

  const fields = [];
  const vals = [];
  if (title !== undefined) { fields.push("title = ?"); vals.push(title.trim()); }
  if (done  !== undefined) { fields.push("done = ?");  vals.push(done ? 1 : 0); }
  if (!fields.length) return res.status(400).json({ error: "Nada para actualizar" });

  // IMPORTANTE: usar template literal para SET dinámico
  vals.push(id, req.user.id);
  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`).run(...vals);

  const task = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?").get(id);
  res.json({ ...task, done: !!task.done });
});

app.delete("/api/tasks/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
  const del = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, req.user.id);
  if (!del.changes) return res.status(404).json({ error: "No encontrada" });
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));

