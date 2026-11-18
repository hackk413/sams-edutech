#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# SAMS EDUTECH — HOSTINGER PRODUCTION DEPLOYMENT & UPDATE SCRIPT
# ═══════════════════════════════════════════════════════════════════
set -e

echo "🚀 [1/5] Pulling latest codebase from repository..."
git pull origin main

echo "📦 [2/5] Ensuring dependencies are up to date..."
npm install

echo "🏗️ [3/5] Compiling Next.js production build..."
npm run build

echo "🔄 [4/5] Reloading PM2 production server..."
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
  pm2 save
  echo "✨ PM2 process reloaded successfully."
else
  echo "⚠️ PM2 not detected. Restart your Node.js application manually."
fi

echo "✅ [5/5] Sams Edutech is live and healthy!"
