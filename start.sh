#!/bin/sh
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Starting application..."
exec node server.js
