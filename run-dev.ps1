# === run-dev.ps1 ===
$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Kill-Port([int]$port){
  (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess |
    Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

Kill-Port 4000
Kill-Port 5173

# Backend en consola nueva
Start-Process powershell -ArgumentList @(
  "-NoExit","-Command",
  "cd `"$root\backend`"; if(!(Test-Path node_modules)){ npm i }; node server.js"
)

# Frontend en consola nueva (fijando puerto 5173)
Start-Process powershell -ArgumentList @(
  "-NoExit","-Command",
  "cd `"$root\frontend`"; if(!(Test-Path node_modules)){ npm i }; npm run dev -- --port 5173 --host"
)

# Esperar hasta 20s a que ambos puertos estén arriba
$ok4000=$false; $ok5173=$false
1..20 | ForEach-Object {
  Start-Sleep -Seconds 1
  if (-not $ok4000) { $ok4000 = (Test-NetConnection -ComputerName "localhost" -Port 4000 -WarningAction SilentlyContinue).TcpTestSucceeded }
  if (-not $ok5173) { $ok5173 = (Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue).TcpTestSucceeded }
  if ($ok4000 -and $ok5173) { break }
}

if ($ok5173) { Start-Process "http://localhost:5173/" } else { Write-Warning "Vite no arrancó (5173)." }
if ($ok4000) { Write-Host "Backend OK en http://localhost:4000" } else { Write-Warning "Backend no arrancó (4000)." }
