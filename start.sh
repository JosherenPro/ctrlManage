#!/bin/bash
set -e

echo "=== Starting ctrlManage ==="

# Kill any existing processes
echo "Cleaning up old processes..."
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3003 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend
echo "Starting backend on port 3001..."
cd /home/eren/Documents/ctrlmanage/backend
node dist/src/main.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
sleep 5
until curl -s http://127.0.0.1:3001/api/health > /dev/null 2>&1; do
  echo "Waiting for backend..."
  sleep 2
done
echo "Backend is running on http://localhost:3001"

# Start frontend
echo "Starting frontend on port 3003..."
cd /home/eren/Documents/ctrlmanage/frontend
npx next dev -p 3003 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "=== ctrlManage is running ==="
echo "Frontend: http://localhost:3003"
echo "Backend:  http://localhost:3001"
echo ""
echo "Login credentials:"
echo "  Admin:     admin@ctrlmanage.local / Test1234!"
echo "  Professor: prof@ctrlmanage.local / Test1234!"
echo "  Student:   etudiant@ctrlmanage.local / Test1234!"
echo ""
echo "Press Ctrl+C to stop both servers."
wait
