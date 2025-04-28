#!/bin/bash

echo "Останавливаем текущие процессы..."
pkill -f node || true

echo "Запускаем сервер..."
npm run server &

echo "Запускаем клиент..."
npm start &

echo "Серверы запущены!"
echo "Прокси-сервер: http://localhost:3001"
echo "Клиент: http://localhost:3000"
