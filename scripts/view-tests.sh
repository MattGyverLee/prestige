#!/bin/bash
# Quick script to view tests interactively

echo "Choose a viewing option:"
echo ""
echo "1) Watch Mode - Auto-run tests when files change"
echo "2) UI Mode - Beautiful browser interface"
echo "3) Coverage Report - See what's tested"
echo "4) List all test files"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    npm run test:watch
    ;;
  2)
    echo "Opening Vitest UI in browser..."
    npm run test:ui
    ;;
  3)
    npm run test:coverage
    echo ""
    echo "📊 Coverage report generated!"
    echo "Open: coverage/index.html in your browser"
    ;;
  4)
    echo ""
    echo "📁 Test Files:"
    find src public -name "*.test.*" -o -name "__tests__"
    ;;
  *)
    echo "Invalid choice"
    ;;
esac
