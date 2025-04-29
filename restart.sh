#!/bin/bash
# Скрипт для перезапуска сервера на Replit

# Останавливаем текущий процесс
pkill -f "node server.js" || true

# Запускаем сервер заново
npm run dev
