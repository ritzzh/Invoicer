#!/bin/bash
set -e

# ============================================================
#  Invoicer - One-command Docker deployment
#  Usage: bash deploy.sh
# ============================================================

echo ""
echo "🚀  Invoicer Deployment"
echo "========================"

# Check Docker is installed
if ! command -v docker &> /dev/null; then
  echo "❌  Docker not found. Install it from https://docs.docker.com/get-docker/"
  exit 1
fi

# Check docker compose (v2 plugin or v1 standalone)
if docker compose version &> /dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE="docker-compose"
else
  echo "❌  Docker Compose not found."
  echo "   Install: https://docs.docker.com/compose/install/"
  exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo ""
  echo "⚙️   No .env file found. Creating one..."
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "change_me_$(date +%s)")
  cat > .env << EOF
JWT_SECRET=${JWT_SECRET}
PORT=3000
EOF
  echo "✅  .env created with a random JWT_SECRET."
  echo "    Edit .env to change the port or other settings."
fi

echo ""
echo "🔨  Building and starting Invoicer..."
echo ""

# Pull latest code changes if in a git repo
if [ -d .git ]; then
  echo "📦  Pulling latest changes from git..."
  git pull
fi

# Build and start (--build forces rebuild on code changes)
$COMPOSE up -d --build

echo ""
echo "✅  Invoicer is running!"

# Get the port from .env or default
PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2 || echo "3000")

echo ""
echo "🌐  Access it at: http://$(hostname -I | awk '{print $1}'):${PORT}"
echo "    Or locally:   http://localhost:${PORT}"
echo ""
echo "📋  Useful commands:"
echo "    View logs:    $COMPOSE logs -f"
echo "    Stop:         $COMPOSE down"
echo "    Restart:      $COMPOSE restart"
echo "    Update:       bash deploy.sh"
echo ""
