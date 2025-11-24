#!/bin/bash

# Script to fix "Cannot access before initialization" build errors
# This clears Next.js cache and rebuilds the application

echo "🧹 Cleaning Next.js cache and build artifacts..."

# Remove Next.js cache
rm -rf .next

# Remove node_modules/.cache if it exists
rm -rf node_modules/.cache

# Remove TypeScript build info
rm -f tsconfig.tsbuildinfo

# Clear npm cache (optional, but can help)
# npm cache clean --force

echo "✅ Cache cleared. Now rebuilding..."

# Rebuild the application
npm run build

echo "✅ Build complete!"

