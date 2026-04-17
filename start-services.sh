#!/bin/bash

# Start chat service
if ! pgrep -f "bun.*chat-service" > /dev/null 2>&1 && ! pgrep -f "mini-services.*index" > /dev/null 2>&1; then
  cd /home/z/my-project/mini-services/chat-service
  nohup bun index.ts > /tmp/chat-service.log 2>&1 &
  echo "Chat service started (PID: $!)"
else
  echo "Chat service already running"
fi

# Start Next.js
if ! pgrep -f "next-server" > /dev/null 2>&1; then
  cd /home/z/my-project
  nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
  echo "Next.js started (PID: $!)"
else
  echo "Next.js already running"
fi

echo "Waiting for services..."
sleep 15

# Verify
if pgrep -f "next-server" > /dev/null 2>&1; then
  echo "✅ Next.js is running"
else
  echo "❌ Next.js failed to start"
fi

if pgrep -f "bun.*index" > /dev/null 2>&1; then
  echo "✅ Chat service is running"
else
  echo "❌ Chat service failed to start"
fi
