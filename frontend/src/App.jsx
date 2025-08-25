import { useEffect, useState } from "react";

const API = "http://localhost:4000/api";

function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) return alert("Datos inválidos");
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Error");
    onLogin(data.token);
  }
  return (
    <form onSubmit={submit} style={{maxWidth:420, margin:"40px auto"}}>
      <h2>Entrar</h2>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button>Login</button>
      <p>¿Sin cuenta? <button type="button" onClick={switchToRegister}>Registrate</button></p>
      <style>{`input,button{display:block;width:100%;padding:10px;margin:8px 0}`}</style>
    </form>
  );
}

function Register({ onLogin, switchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !email.includes("@") || password.length < 6) return alert("Datos inválidos");
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Error");
    onLogin(data.token);
  }
  return (
    <form onSubmit={submit} style={{maxWidth:420, margin:"40px auto"}}>
      <h2>Registrarse</h2>
      <input placeholder="nombre" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button>Crear cuenta</button>
      <p>¿Ya tenés cuenta? <button type="button" onClick={switchToLogin}>Ir a Login</button></p>
      <style>{`input,button{display:block;width:100%;padding:10px;margin:8px 0}`}</style>
    </form>
  );
}

function Tasks({ token, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  async function load() {
    const res = await fetch(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` }});
    if (res.status === 401) return onLogout();
    const data = await res.json();
    setTasks(data);
  }
  useEffect(() => { load(); }, []);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title })
    });
    const data = await res.json();
    if (res.ok) { setTasks([data, ...tasks]); setTitle(""); }
  }

  async function toggle(t) {
    const res = await fetch(`${API}/tasks/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ done: !t.done })
    });
    const data = await res.json();
    if (res.ok) setTasks(tasks.map(x => x.id === t.id ? data : x));
  }

  async function remove(id) {
    const res = await fetch(`${API}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setTasks(tasks.filter(x => x.id !== id));
  }

  return (
    <div style={{maxWidth:520, margin:"40px auto"}}>
      <h2>Tareas</h2>
      <form onSubmit={addTask}>
        <input placeholder="Nueva tarea..." value={title} onChange={e=>setTitle(e.target.value)} />
        <button>Agregar</button>
      </form>
      <ul>
        {tasks.map(t => (
          <li key={t.id} style={{display:"flex",gap:10,alignItems:"center",margin:"8px 0"}}>
            <input type="checkbox" checked={t.done} onChange={()=>toggle(t)} />
            <span style={{textDecoration: t.done ? "line-through" : "none"}}>{t.title}</span>
            <button onClick={()=>remove(t.id)}>Borrar</button>
          </li>
        ))}
      </ul>
      <button onClick={onLogout}>Salir</button>
      <style>{`input,button{padding:10px;margin:6px 0}`}</style>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [view, setView] = useState(token ? "tasks" : "login");

  function onLogin(tk){ localStorage.setItem("token", tk); setToken(tk); setView("tasks"); }
  function onLogout(){ localStorage.removeItem("token"); setToken(""); setView("login"); }

  if (view === "register") return <Register onLogin={onLogin} switchToLogin={()=>setView("login")} />;
  if (view === "login") return <Login onLogin={onLogin} switchToRegister={()=>setView("register")} />;
  return <Tasks token={token} onLogout={onLogout} />;
}
