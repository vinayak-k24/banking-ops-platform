<#
.SYNOPSIS
  Sets up and runs the backend (FastAPI, port 8000) and frontend (Next.js, port 3000) locally.

.EXAMPLE
  .\dev.ps1            # set up if needed, then start both in separate windows
  .\dev.ps1 -Setup     # force reinstall of Python and npm dependencies, then start
  .\dev.ps1 -SetupOnly # only create .venv and install dependencies

  If scripts are blocked:  powershell -ExecutionPolicy Bypass -File .\dev.ps1
#>
param(
    [switch]$Setup,
    [switch]$SetupOnly
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$backend = Join-Path $root 'backend'
$venvPython = Join-Path $backend '.venv\Scripts\python.exe'

function Assert-Command($name, $hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "$name not found. $hint"
    }
}

Assert-Command python 'Install Python 3.11+ from https://www.python.org/downloads/ and tick "Add to PATH".'
Assert-Command npm 'Install Node.js 20+ from https://nodejs.org/.'

# --- Backend: virtual environment and dependencies ---
if ($Setup -or $SetupOnly -or -not (Test-Path $venvPython)) {
    if (-not (Test-Path $venvPython)) {
        Write-Host 'Creating backend\.venv ...' -ForegroundColor Cyan
        python -m venv (Join-Path $backend '.venv')
    }
    Write-Host 'Installing backend dependencies ...' -ForegroundColor Cyan
    & $venvPython -m pip install --upgrade pip --quiet
    & $venvPython -m pip install -r (Join-Path $backend 'requirements.txt') --quiet
    if ($LASTEXITCODE -ne 0) { throw 'pip install failed' }
}

# --- Frontend: npm packages ---
if ($Setup -or $SetupOnly -or -not (Test-Path (Join-Path $root 'node_modules'))) {
    Write-Host 'Installing frontend dependencies ...' -ForegroundColor Cyan
    Push-Location $root
    try {
        npm install
        if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
    } finally {
        Pop-Location
    }
}

if ($SetupOnly) {
    Write-Host 'Setup complete.' -ForegroundColor Green
    return
}

# --- Start both servers in their own windows (close a window to stop that server) ---
Write-Host 'Starting backend on http://localhost:8000 ...' -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $backend -ArgumentList @(
    '-NoExit', '-Command',
    "`$Host.UI.RawUI.WindowTitle = 'Backend :8000'; & '$venvPython' -m uvicorn main:app --reload --port 8000"
)

Write-Host 'Starting frontend on http://localhost:3000 ...' -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $root -ArgumentList @(
    '-NoExit', '-Command',
    "`$Host.UI.RawUI.WindowTitle = 'Frontend :3000'; npm run dev"
)

Write-Host ''
Write-Host 'App:      http://localhost:3000' -ForegroundColor Green
Write-Host 'API docs: http://localhost:8000/docs' -ForegroundColor Green
Write-Host 'Close the two server windows (or press Ctrl+C in them) to stop.'
