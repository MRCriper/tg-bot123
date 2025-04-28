@echo off
echo Останавливаем текущие процессы...
taskkill /f /im node.exe

echo Запускаем сервер в режиме отладки...
start cmd /k "npm run server:debug"

echo Запускаем клиент...
start cmd /k "npm start"

echo Серверы запущены!
echo Прокси-сервер: http://localhost:3001
echo Клиент: http://localhost:3000
