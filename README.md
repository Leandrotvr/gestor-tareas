# Gestor de Tareas (React + Vite) + API (Node/Express + SQLite)

## Cómo correr local
```bash
# Backend (http://localhost:4000)
cd backend
npm i
node server.js

# Frontend (http://localhost:5173)
cd ../frontend
npm i
npm run dev
```

## Variables de entorno
- **Backend**: `JWT_SECRET` (requerida), `PORT=4000` (por defecto).
- **Frontend**: `VITE_API_URL` (ej.: `http://localhost:4000/api` o `https://TU-BACKEND.onrender.com/api`).

## Endpoints
- `POST /api/register` `{ name,email,password } -> { token }`
- `POST /api/login`    `{ email,password } -> { token }`
- `GET  /api/tasks`    (Auth) -> `[ { id,title,done } ]`
- `POST /api/tasks`    (Auth) `{ title }`
- `PUT  /api/tasks/:id`(Auth) `{ title?, done? }`
- `DELETE /api/tasks/:id` (Auth)

## Smoke test (PowerShell)
```powershell
$api="http://localhost:4000/api"
$rand=Get-Random -Minimum 1000 -Maximum 9999
$reg=Invoke-RestMethod -Method POST -Uri "$api/register" -ContentType "application/json" -Body (@{name="Demo$rand";email="demo$rand@test.com";password="123456"} | ConvertTo-Json)
$token=$reg.token
Invoke-RestMethod -Method POST -Uri "$api/tasks" -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body (@{title="Tarea demo"} | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method GET -Uri "$api/tasks" -Headers @{Authorization="Bearer $token"}
```

## Deploy rápido
**Backend → Render**
1) Sube el repo a GitHub. 2) En Render: *New Web Service* usando `render.yaml`. 3) Añadí `JWT_SECRET` si no se generó.

**Frontend → Vercel**
1) Importa `frontend/`. 2) Agrega `VITE_API_URL=https://TU-BACKEND.onrender.com/api`. 3) Deploy.

## Scripts útiles
- `run-dev.ps1` (raíz): levanta backend+frontend y abre el navegador.
