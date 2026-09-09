#!/bin/zsh

# ==============================================================================
# 🍎 IronVault Smart Gym CRM - MacBook Native Launcher
# ==============================================================================

DIR="$(cd "$(dirname "$0")" && pwd)"
echo "🚀 Initializing IronVault Gym CRM on MacBook..."
echo "📂 Working Directory: $DIR"

# 1. Start backend server in background if not already running on port 5001
if lsof -i :5001 > /dev/null 2>&1; then
  echo "✅ Backend API & WebSockets already running on port 5001"
else
  echo "📡 Starting Backend API Server (Node/Express/Prisma/SQLite/WebSocket)..."
  cd "$DIR/server" && npm run dev > /dev/null 2>&1 &
fi

# 2. Start frontend server in background if not already running on port 5173
if lsof -i :5173 > /dev/null 2>&1; then
  echo "✅ Frontend UI already running on port 5173"
else
  echo "💻 Starting Frontend Web Server (Vite/React/Tailwind)..."
  cd "$DIR/client" && npm run dev > /dev/null 2>&1 &
fi

# 3. Wait a moment for services to bind
sleep 2

# 4. Open in default macOS browser (Safari, Chrome, Arc, etc.)
echo "🌐 Launching IronVault in your default macOS browser..."
open "http://localhost:5173"

echo ""
echo "=============================================================================="
echo "⚡ IronVault Smart Gym CRM is LIVE on your MacBook!"
echo "👉 App URL:    http://localhost:5173"
echo "👉 Server API: http://localhost:5001"
echo "👉 Keyboard Shortcut: Press ⌘ + S anywhere to open the Smart Camera Scanner"
echo "👉 Press Ctrl + C in this window when you wish to close the server."
echo "=============================================================================="

# Keep process alive
wait

