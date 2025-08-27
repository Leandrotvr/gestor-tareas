import React, { useState } from "react";

// Normaliza la URL base del API (quita espacios/saltos/barras finales)
const RAW_API = (import.meta?.env?.VITE_API_URL ?? "https://gestor-tareas-api-ra7s.onrender.com/api");
const API = "https://gestor-tareas-api-ra7s.onrender.com/api"; console.log('API =', API); console.log('API =', API); console.log('API =', API); console.log("API =", API);

export default function App() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  return (
    <div style={{minHeight:"100vh", background:"#111", color:"#eee", display:"grid", placeItems:"start", padding:"24px"}}>
      <div style={{width:360}}>
        <div style={{display:"flex", gap:8, marginBottom:16}}>
          <button onClick={()=>setTab("login")}>Ir a Login</button>
          <button onClick={()=>setTab("register")}>Ir a Registro</button>
        </div>
        {tab === "login" ? <Login/> : <Register/>}
      </div>
    </div>
  );
}

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const { token } = await res.json();
      localStorage.setItem("token", token);
      alert("Registro ok");
      location.href = "/";
    } catch (err) {
      alert("Error al registrar: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
      <h2>Registrarse</h2>
      <input placeholder="Nombre" value={name} onChange={(e)=>setName(e.target.value)} />
      <input placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input type="password" placeholder="contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</button>
    </form>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const { token } = await res.json();
      localStorage.setItem("token", token);
      alert("Login ok");
      location.href = "/";
    } catch (err) {
      alert("Error al entrar: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
      <h2>Entrar</h2>
      <input placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input type="password" placeholder="contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "Entrando..." : "Login"}</button>
    </form>
  );
}




