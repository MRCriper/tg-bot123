import axios from 'axios';
import { RocketPaymentData, RocketPayResponse } from '../types';

// Используем локальный прокси-сервер для обхода проблем с CORS
// Убедимся, что URL не содержит слеш в конце
const API_ENDPOINT = '/api';

// Логируем URL API для отладки
console.log('Используем локальный прокси-сервер для API Rocket Pay:', API_ENDPOINT);
console.log('Полный URL API из .env:', process.env.REACT_APP_ROCKET_PAY_API_URL);

// URL для получения курса TON/RUB
const TON_PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=rub';

// Сервис для взаимодействия с платежной системой Rocket Pay
export const rocketPayService = {
  /**
   * Получает актуальный курс TON/RUB
   * @returns - курс TON/RUB (сколько рублей стоит 1 TON)
   */
  async getTonToRubRate(): Promise<number> {
    try {
      console.log('Запрос курса TON/RUB');
      const response = await axios.get(TON_PRICE_API_URL);
      
      if (response.data && response.data['the-open-network'] && response.data['the-open-network'].rub) {
        const rate = response.data['the-open-network'].rub;
        console.log(`Получен курс TON/RUB: 1 TON = ${rate} RUB`);
        return rate;
      } else {
        console.error('Не удалось получить курс TON/RUB из API');
        // Возвращаем примерный курс на случай, если API недоступно
        return 350; // Примерный курс TON/RUB
      }
    } catch (error) {
      console.error('Ошибка при получении курса TON/RUB:', error);
      // Возвращаем примерный курс на случай, если API недоступно
      return 350; // Примерный курс TON/RUB
    }
  },
  
  /**
   * Конвертирует сумму из рублей в TON
   * @param amountRub - сумма в рублях
   * @returns - сумма в TON
   */
  async convertRubToTon(amountRub: number): Promise<number> {
    try {
      const tonRate = await this.getTonToRubRate();
      const amountTon = amountRub / tonRate;
      
      // Округляем до 9 знаков после запятой (максимальная точность для TON)
      const roundedAmount = parseFloat(amountTon.toFixed(9));
      
      console.log(`Конвертация: ${amountRub} RUB = ${roundedAmount} TON (курс: ${tonRate} RUB за 1 TON)`);
      return roundedAmount;
    } catch (error) {
      console.error('Ошибка при конвертации RUB в TON:', error);
      // В случае ошибки делаем примерную конвертацию
      const approximateRate = 350; // Примерный курс TON/RUB
      return parseFloat((amountRub / approximateRate).toFixed(9));
    }
  },
  /**
   * Инициирует платеж в Rocket Pay
   * @param paymentData - данные для создания платежа
   * @returns - объект с URL для перенаправления на платежную форму или ошибка
   */
  async initiatePayment(paymentData: RocketPaymentData): Promise<RocketPayResponse> {
    // Максимальное количество попыток
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: any = null;
    
    // Функция для выполнения запроса с повторными попытками
    const executeWithRetry = async (): Promise<RocketPayResponse> => {
      try {
        // Конвертируем сумму из рублей в TON
        const amountTon = await this.convertRubToTon(paymentData.amount);
        
        // Подробное логирование запроса
        console.log(`Отправка запроса на создание tg-invoice (попытка ${retryCount + 1}/${maxRetries}):`, {
          url: `${API_ENDPOINT}/tg-invoices`,
          data: {
            amount: amountTon,
            description: paymentData.description,
            callbackUrl: paymentData.redirectUrl,
            payload: paymentData.orderId,
            originalAmountRub: paymentData.amount
          }
        });

        // Проверяем, что API_ENDPOINT установлен
        if (!API_ENDPOINT) {
          console.error('Отсутствует API_ENDPOINT');
          return {
            success: false,
            error: 'Ошибка конфигурации: Отсутствует API_ENDPOINT',
          };
        }

        // Проверяем, что customerTelegram не пустой
        if (!paymentData.customerTelegram) {
          console.error('Отсутствует customerTelegram в данных платежа');
          return {
            success: false,
            error: 'Ошибка данных: Отсутствует имя пользователя Telegram',
          };
        }

        // Нормализуем имя пользователя Telegram (убираем @ если он есть)
        // Используем напрямую в запросе, поэтому не создаем отдельную переменную
        paymentData.customerTelegram = paymentData.customerTelegram.replace('@', '');

        // Нормализуем URL для перенаправления
        // Убедимся, что URL абсолютный и содержит origin
        let redirectUrl = paymentData.redirectUrl;
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          // Если URL относительный, добавляем origin
          if (redirectUrl.startsWith('/')) {
            redirectUrl = `${window.location.origin}${redirectUrl}`;
          } else {
            redirectUrl = `${window.location.origin}/${redirectUrl}`;
          }
        }
        
        console.log('Нормализованный URL для перенаправления:', redirectUrl);
        
        // Подготавливаем данные для запроса в соответствии с документацией API
        // Строго следуем документации API для создания tg-invoices
        const requestData = {
          amount: amountTon, // Сумма в TON после конвертации (до 9 десятичных знаков)
          minPayment: amountTon, // Минимальная сумма платежа (обычно равна amount)
          numPayments: 1, // Количество платежей (по умолчанию 1)
          currency: "TONCOIN", // Валюта (TON) - обязательный параметр
          description: `${paymentData.description} (${paymentData.amount} ₽)`, // Добавляем сумму в рублях в описание
          hiddenMessage: `thank you`, // Скрытое сообщение
          commentsEnabled: false, // Отключаем комментарии
          callbackUrl: redirectUrl, // URL для перенаправления после оплаты
          payload: `${paymentData.orderId}`, // Дополнительные данные (используем orderId)
          expiredIn: 10 // Время жизни счета в минутах
        };
        
        console.log('Подготовленные данные для запроса:', requestData);
        
        // Пропускаем предварительную проверку доступности API, так как она может вызывать ложные срабатывания
        console.log('Пропускаем предварительную проверку доступности API');

        // Устанавливаем таймаут для запроса
        console.log('Отправка POST запроса на', `${API_ENDPOINT}/tg-invoices`);
        
        // Создаем конфигурацию для запроса
        const axiosConfig = {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000 // Увеличиваем таймаут до 30 секунд
        };
        
        // Выполняем запрос через локальный прокси-сервер
        const response = await axios.post(`${API_ENDPOINT}/tg-invoices`, requestData, axiosConfig);

        // Подробное логирование ответа
        console.log('Ответ API:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });

        // Проверяем ответ
        if (response.data && response.data.success && response.data.data && response.data.data.link) {
          console.log('Успешно получен URL для оплаты:', response.data.data.link);
          
          // Проверяем, что URL не пустой и имеет правильный формат
          if (!response.data.data.link || response.data.data.link.trim() === '') {
            console.error('Получен пустой URL для оплаты');
            return {
              success: false,
              error: 'Ошибка при создании платежа: Получен пустой URL для оплаты',
            };
          }
          
          // Проверяем, что URL начинается с http:// или https://
          let paymentUrl = response.data.data.link;
          if (!paymentUrl.startsWith('http://') && !paymentUrl.startsWith('https://')) {
            paymentUrl = `https://${paymentUrl}`;
            console.log('Добавлен протокол https:// к URL:', paymentUrl);
          }
          
          // Проверяем, что URL содержит домен платежной системы
          if (!paymentUrl.includes('pay.xrocket.tg') && 
              !paymentUrl.includes('xrocket.tg') && 
              !paymentUrl.includes('ton-rocket.com')) {
            console.warn('URL не содержит ожидаемый домен платежной системы:', paymentUrl);
          }
          
          return {
            success: true,
            paymentUrl: paymentUrl,
          };
        } else {
          console.error('Ответ API не содержит URL для оплаты:', response.data);
          // Более подробная информация об ошибке
          let errorMessage = 'Ошибка при создании платежа: Не получен URL для оплаты';
          if (response.data && !response.data.success) {
            errorMessage = response.data.message || errorMessage;
            if (response.data.errors && Array.isArray(response.data.errors)) {
              errorMessage += '. ' + response.data.errors.join('. ');
            }
          }
          return {
            success: false,
            error: errorMessage,
          };
        }
      } catch (error) {
        console.error(`Ошибка при создании платежа (попытка ${retryCount + 1}/${maxRetries}):`, error);
        
        // Подробное логирование ошибки
        if (axios.isAxiosError(error)) {
          console.error('Детали ошибки Axios:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers,
              data: error.config?.data
            },
            message: error.message,
            code: error.code,
            isAxiosError: error.isAxiosError
          });
          
          lastError = error;
          
          // Если ошибка связана с сетью или таймаутом, повторяем запрос
          if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.log('Обнаружена сетевая ошибка, будет выполнена повторная попытка');
            throw error; // Пробрасываем ошибку для повторной попытки
          }
          
          // Если ошибка 401 (Unauthorized), значит проблема с ключом API
          if (error.response?.status === 401) {
            console.error('Получена ошибка 401 Unauthorized - проблема с ключом API');
            return {
              success: false,
              error: 'Ошибка авторизации: Неверный ключ API. Проверьте настройки API-ключа в .env файле.',
            };
          }
          
          // Если ошибка 403 (Forbidden)
          if (error.response?.status === 403) {
            console.error('Получена ошибка 403 Forbidden - доступ запрещен');
            return {
              success: false,
              error: 'Доступ запрещен: У вас нет прав для выполнения этой операции. Проверьте API-ключ.',
            };
          }
          
          // Если ошибка 404 (Not Found)
          if (error.response?.status === 404) {
            console.error('Получена ошибка 404 Not Found - ресурс не найден');
            return {
              success: false,
              error: 'Ресурс не найден: Проверьте правильность URL API в .env файле.',
            };
          }
          
          // Если ошибка связана с CORS
          if (error.message.includes('Network Error') || error.message.includes('CORS')) {
            console.error('Обнаружена ошибка CORS или сетевая ошибка');
            return {
              success: false,
              error: 'Сетевая ошибка: Возможно, проблема с CORS или доступом к API. Проверьте настройки безопасности браузера или используйте прокси-сервер.',
            };
          }
        } else {
          console.error('Не-Axios ошибка:', error);
        }
        
        // Возвращаем ошибку
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка при создании платежа',
        };
      }
    };
    
    // Выполняем запрос с повторными попытками
    while (retryCount < maxRetries) {
      try {
        const result = await executeWithRetry();
        
        // Если получили успешный результат или конкретную ошибку, возвращаем его
        if (result.success || (result.error && result.error !== 'Неизвестная ошибка при создании платежа')) {
          return result;
        }
        
        // Иначе пробуем еще раз
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Экспоненциальная задержка перед повторной попыткой (1с, 2с, 4с, ...)
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.log(`Повторная попытка через ${delay}мс...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Экспоненциальная задержка перед повторной попыткой (1с, 2с, 4с, ...)
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.log(`Повторная попытка через ${delay}мс...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Если все попытки не удались, возвращаем последнюю ошибку
    console.error('Все попытки создания платежа не удались');
    return {
      success: false,
      error: lastError instanceof Error 
        ? lastError.message 
        : 'Не удалось создать платеж после нескольких попыток',
    };
  },

  /**
   * Проверяет статус платежа
   * @param orderId - идентификатор заказа (payload)
   * @returns - информация о статусе платежа
   */
  async checkPaymentStatus(orderId: string): Promise<{ status: string, success: boolean }> {
    // Максимальное количество попыток
    const maxRetries = 3;
    let retryCount = 0;
    
    // Функция для выполнения запроса с повторными попытками
    const executeWithRetry = async (): Promise<{ status: string, success: boolean }> => {
      try {
        // Получаем список счетов и ищем нужный по payload
        console.log(`Отправка запроса на получение списка tg-invoices (попытка ${retryCount + 1}/${maxRetries}):`, {
          url: `${API_ENDPOINT}/tg-invoices`,
          orderId: orderId
        });

        const response = await axios.get(`${API_ENDPOINT}/tg-invoices`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // Устанавливаем таймаут в 10 секунд
        });

        if (response.data && response.data.success && response.data.data) {
          // Ищем счет с нужным payload (orderId)
          const invoice = response.data.data.find((inv: any) => inv.payload === orderId);
          
          if (invoice) {
            // Преобразуем статус в понятный формат
            let status = 'unknown';
            if (invoice.status === 'active') {
              status = 'PENDING';
            } else if (invoice.totalActivations > 0) {
              status = 'PAID';
            } else {
              status = 'CANCELLED';
            }
            
            console.log(`Найден счет для заказа ${orderId}, статус: ${status}`);
            return {
              status: status,
              success: true,
            };
          } else {
            console.log(`Счет для заказа ${orderId} не найден в списке`);
          }
        } else {
          console.error('Ответ API не содержит данных о счетах:', response.data);
        }
        
        return {
          status: 'unknown',
          success: false,
        };
      } catch (error) {
        console.error(`Ошибка при проверке статуса платежа (попытка ${retryCount + 1}/${maxRetries}):`, error);
        
        // Более подробное логирование для отладки
        if (axios.isAxiosError(error)) {
          console.error('Детали ошибки Axios при проверке статуса:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers
            }
          });
          
          // Если ошибка связана с сетью или таймаутом, повторяем запрос
          if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw error; // Пробрасываем ошибку для повторной попытки
          }
        }
        
        return {
          status: 'error',
          success: false,
        };
      }
    };
    
    // Выполняем запрос с повторными попытками
    while (retryCount < maxRetries) {
      try {
        const result = await executeWithRetry();
        // Если получили успешный результат или конкретный статус, возвращаем его
        if (result.success || result.status !== 'error') {
          return result;
        }
        
        // Иначе пробуем еще раз
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Экспоненциальная задержка перед повторной попыткой (1с, 2с, 4с, ...)
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.log(`Повторная попытка проверки статуса через ${delay}мс...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Экспоненциальная задержка перед повторной попыткой
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.log(`Повторная попытка проверки статуса через ${delay}мс...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Если все попытки не удались
    console.error('Все попытки проверки статуса платежа не удались');
    return {
      status: 'error',
      success: false,
    };
  },

  /**
   * Проверяет подпись вебхука от Rocket Pay
   * @param body - тело запроса
   * @param signature - подпись из заголовка rocket-pay-signature
   * @returns - результат проверки подписи
   */
  verifySignature(body: string, signature: string): boolean {
    try {
      // В реальном приложении здесь должна быть проверка подписи
      // с использованием crypto.createHmac('sha256', secretKey).update(body).digest('hex')
      // Для демо-версии просто возвращаем true
      console.log('Проверка подписи вебхука:', { body, signature });
      return true;
    } catch (error) {
      console.error('Ошибка при проверке подписи:', error);
      return false;
    }
  },

  /**
   * Обрабатывает колбэк от Rocket Pay (в реальности должно быть на сервере)
   * @param callbackData - данные из вебхука Rocket Pay
   * @returns - результат обработки колбэка
   */
  processCallback(callbackData: any): { success: boolean, message: string } {
    try {
      // Проверка подписи (в реальности должна быть проверка rocket-pay-signature)
      const signature = callbackData.headers?.['rocket-pay-signature'];
      
      if (signature) {
        const isValidSignature = this.verifySignature(JSON.stringify(callbackData.body), signature);
        
        if (!isValidSignature) {
          return { success: false, message: 'Недействительная подпись' };
        }
      } else {
        console.warn('Отсутствует заголовок rocket-pay-signature в вебхуке');
      }

      // Обработка данных платежа
      const payload = callbackData.payload; // Получаем orderId из payload
      const status = callbackData.status;
      const amount = callbackData.amount;
      
      // Обновление статуса заказа в вашей системе
      // ...

      return {
        success: true,
        message: `Колбэк успешно обработан: платеж ${payload} на сумму ${amount} имеет статус ${status}`,
      };
    } catch (error) {
      console.error('Ошибка при обработке колбэка:', error);
      
      return {
        success: false,
        message: 'Ошибка при обработке колбэка',
      };
    }
  },
};

// Примечание: В реальном приложении все платежные операции должны проходить через ваш бэкенд.
// Прямое обращение к API платежной системы с фронтенда небезопасно и может привести к утечке
// секретных ключей. Данный код предоставляется исключительно в демонстрационных целях.
