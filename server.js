const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

// Загружаем переменные окружения из .env и .env.server (если существует)
require('dotenv').config();
// Пытаемся загрузить .env.server, если он существует
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.server') });
  console.log('Загружены переменные окружения из .env.server');
} catch (err) {
  console.log('Файл .env.server не найден или не может быть загружен');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Получаем API ключ и URL из переменных окружения
// Node.js не использует префикс REACT_APP_, поэтому создаем переменные без префикса
const ROCKET_PAY_SECRET_KEY = process.env.ROCKET_PAY_SECRET_KEY || process.env.REACT_APP_ROCKET_PAY_SECRET_KEY;
const XROCKET_API_KEY = process.env.XROCKET_API_KEY || process.env.REACT_APP_XROCKET_API_KEY || ROCKET_PAY_SECRET_KEY;
// Убираем слеш в конце URL, если он есть
const ROCKET_PAY_API_URL = (process.env.ROCKET_PAY_API_URL || process.env.REACT_APP_ROCKET_PAY_API_URL || 'https://pay.xrocket.tg/api').replace(/\/$/, '');

// Добавляем дополнительное логирование для отладки
console.log('Полный URL API:', ROCKET_PAY_API_URL);
console.log('Длина API ключа Rocket Pay:', ROCKET_PAY_SECRET_KEY ? ROCKET_PAY_SECRET_KEY.length : 0);
console.log('Длина API ключа XRocket:', XROCKET_API_KEY ? XROCKET_API_KEY.length : 0);

// Логируем конфигурацию при запуске
console.log('Прокси-сервер для Rocket Pay API');
console.log('API URL:', ROCKET_PAY_API_URL);
console.log('Rocket Pay API Key установлен:', ROCKET_PAY_SECRET_KEY ? 'Да' : 'Нет');
console.log('XRocket API Key установлен:', XROCKET_API_KEY ? 'Да' : 'Нет');

// Прокси для создания tg-invoices
app.post('/api/tg-invoices', async (req, res) => {
  try {
    console.log('Получен запрос на создание tg-invoice');
    console.log('Данные запроса:', req.body);

    // Проверяем, что API ключ установлен
    if (!XROCKET_API_KEY) {
      console.error('API ключ XRocket не установлен');
      return res.status(500).json({
        success: false,
        message: 'API ключ XRocket не установлен в переменных окружения'
      });
    }

    // Формируем URL для запроса к API
    const apiUrl = `${ROCKET_PAY_API_URL}/tg-invoices`;
    console.log('Отправка запроса к API:', apiUrl);
    console.log('Заголовки запроса:', {
      'Content-Type': 'application/json',
      'Rocket-Pay-Key': XROCKET_API_KEY ? `${XROCKET_API_KEY.substring(0, 4)}...` : 'не установлен',
      'Accept': 'application/json'
    });

    // Отправляем запрос к API
    const response = await axios.post(apiUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Rocket-Pay-Key': XROCKET_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 30000 // Увеличиваем таймаут до 30 секунд
    });

    console.log('Получен ответ от API:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    // Возвращаем ответ клиенту
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Ошибка при создании tg-invoice:', error);

    // Если есть ответ от API, возвращаем его
    if (error.response) {
      console.error('Ответ API с ошибкой:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
      
      // Проверяем, является ли ошибка 404 (Not Found)
      if (error.response.status === 404) {
        console.error('Ошибка 404: Ресурс не найден. Проверьте правильность URL API в .env файле.');
        console.error('Текущий URL API:', ROCKET_PAY_API_URL);
        console.error('Полный URL запроса:', apiUrl);
      }
      
      return res.status(error.response.status).json(error.response.data);
    }

    // Если нет ответа от API, возвращаем общую ошибку
    console.error('Детали ошибки:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Ошибка при обращении к API Rocket Pay',
      error: error.message,
      code: error.code
    });
  }
});

// Прокси для получения списка tg-invoices
app.get('/api/tg-invoices', async (req, res) => {
  try {
    console.log('Получен запрос на получение списка tg-invoices');

    // Проверяем, что API ключ установлен
    if (!ROCKET_PAY_SECRET_KEY) {
      console.error('API ключ не установлен');
      return res.status(500).json({
        success: false,
        message: 'API ключ не установлен в переменных окружения'
      });
    }

    // Формируем URL для запроса к API
    const apiUrl = `${ROCKET_PAY_API_URL}/tg-invoices`;
    console.log('Отправка запроса к API:', apiUrl);

    // Отправляем запрос к API
    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': ROCKET_PAY_SECRET_KEY,
        'Accept': 'application/json'
      }
    });

    console.log('Получен ответ от API:', {
      status: response.status,
      data: response.data
    });

    // Возвращаем ответ клиенту
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Ошибка при получении списка tg-invoices:', error);

    // Если есть ответ от API, возвращаем его
    if (error.response) {
      console.error('Ответ API с ошибкой:', {
        status: error.response.status,
        data: error.response.data
      });
      return res.status(error.response.status).json(error.response.data);
    }

    // Если нет ответа от API, возвращаем общую ошибку
    return res.status(500).json({
      success: false,
      message: 'Ошибка при обращении к API Rocket Pay',
      error: error.message
    });
  }
});

// Прокси для получения информации о tg-invoice по ID
app.get('/api/tg-invoices/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    console.log(`Получен запрос на получение информации о tg-invoice с ID: ${invoiceId}`);

    // Проверяем, что API ключ установлен
    if (!ROCKET_PAY_SECRET_KEY) {
      console.error('API ключ не установлен');
      return res.status(500).json({
        success: false,
        message: 'API ключ не установлен в переменных окружения'
      });
    }

    // Формируем URL для запроса к API
    const apiUrl = `${ROCKET_PAY_API_URL}/tg-invoices/${invoiceId}`;
    console.log('Отправка запроса к API:', apiUrl);

    // Отправляем запрос к API
    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': ROCKET_PAY_SECRET_KEY,
        'Accept': 'application/json'
      }
    });

    console.log('Получен ответ от API:', {
      status: response.status,
      data: response.data
    });

    // Возвращаем ответ клиенту
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Ошибка при получении информации о tg-invoice с ID: ${req.params.id}`, error);

    // Если есть ответ от API, возвращаем его
    if (error.response) {
      console.error('Ответ API с ошибкой:', {
        status: error.response.status,
        data: error.response.data
      });
      return res.status(error.response.status).json(error.response.data);
    }

    // Если нет ответа от API, возвращаем общую ошибку
    return res.status(500).json({
      success: false,
      message: 'Ошибка при обращении к API Rocket Pay',
      error: error.message
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Прокси-сервер запущен на порту ${PORT}`);
  console.log(`URL для доступа: http://localhost:${PORT}`);
});
