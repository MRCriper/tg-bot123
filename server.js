const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Получаем API ключ и URL из переменных окружения
const ROCKET_PAY_SECRET_KEY = process.env.REACT_APP_ROCKET_PAY_SECRET_KEY;
const ROCKET_PAY_API_URL = process.env.REACT_APP_ROCKET_PAY_API_URL || 'https://pay.xrocket.tg/api';

// Логируем конфигурацию при запуске
console.log('Прокси-сервер для Rocket Pay API');
console.log('API URL:', ROCKET_PAY_API_URL);
console.log('API Key установлен:', ROCKET_PAY_SECRET_KEY ? 'Да' : 'Нет');

// Прокси для создания tg-invoices
app.post('/api/tg-invoices', async (req, res) => {
  try {
    console.log('Получен запрос на создание tg-invoice');
    console.log('Данные запроса:', req.body);

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
    const response = await axios.post(apiUrl, req.body, {
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
    console.error('Ошибка при создании tg-invoice:', error);

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
