import axios from 'axios';
import { RocketPaymentData, RocketPayResponse } from '../types';

// URL API Rocket Pay
// Исправляем потенциальное дублирование /api в URL
const ROCKET_PAY_API_URL = process.env.REACT_APP_ROCKET_PAY_API_URL || 'https://pay.xrocket.tg';
const API_ENDPOINT = ROCKET_PAY_API_URL.endsWith('/api') ? ROCKET_PAY_API_URL : `${ROCKET_PAY_API_URL}/api`;

// Логируем URL API для отладки
console.log('Rocket Pay API URL:', API_ENDPOINT);
console.log('Rocket Pay API URL из .env:', process.env.REACT_APP_ROCKET_PAY_API_URL);

// Секретный ключ (будет предоставлен при регистрации в Rocket Pay)
// В реальном приложении этот ключ должен храниться на сервере и не должен быть доступен на клиенте
const ROCKET_PAY_SECRET_KEY = process.env.REACT_APP_ROCKET_PAY_SECRET_KEY || '';
console.log('Rocket Pay Secret Key установлен:', ROCKET_PAY_SECRET_KEY ? 'Да' : 'Нет');
console.log('Длина ключа:', ROCKET_PAY_SECRET_KEY.length);

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
          apiKey: ROCKET_PAY_SECRET_KEY ? 'Ключ установлен' : 'Ключ отсутствует',
          data: {
            amount: amountTon,
            description: paymentData.description,
            callbackUrl: paymentData.redirectUrl,
            payload: paymentData.orderId,
            originalAmountRub: paymentData.amount
          }
        });

        // Проверяем, что API_ENDPOINT и ROCKET_PAY_SECRET_KEY установлены
        if (!API_ENDPOINT || (API_ENDPOINT === 'https://pay.xrocket.tg/api' && !ROCKET_PAY_SECRET_KEY)) {
          console.error('Отсутствует API_ENDPOINT или ROCKET_PAY_SECRET_KEY');
          return {
            success: false,
            error: 'Ошибка конфигурации: Отсутствует API_ENDPOINT или ROCKET_PAY_SECRET_KEY',
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
        const telegramUsername = paymentData.customerTelegram.replace('@', '');

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
        
        // Создаем URL для неудачной оплаты
        const failureUrl = `${window.location.origin}/cart`;
        
        // Подготавливаем данные для запроса
        const requestData = {
          amount: amountTon, // Сумма в TON после конвертации
          minPayment: amountTon, // Минимальная сумма платежа (обычно равна amount)
          numPayments: 1, // Количество платежей (по умолчанию 1)
          currency: "TONCOIN", // Валюта (TON)
          description: `${paymentData.description} (${paymentData.amount} ₽)`, // Добавляем сумму в рублях в описание
          hiddenMessage: `Заказ №${paymentData.orderId} | ${telegramUsername}`, // Скрытое сообщение с данными пользователя
          commentsEnabled: false, // Отключаем комментарии
          callbackUrl: redirectUrl, // URL для перенаправления после оплаты
          payload: paymentData.orderId, // Дополнительные данные (используем orderId)
          expiredIn: 30, // Время жизни счета в минутах (увеличено до 30 минут)
          // Добавляем параметр для Telegram username
          telegramUsername: telegramUsername,
          // Добавляем параметры для улучшения обработки перенаправления
          returnUrl: redirectUrl, // Дублируем URL для перенаправления в другом параметре
          successUrl: redirectUrl, // URL для перенаправления при успешной оплате
          failureUrl: failureUrl, // URL для перенаправления при неудачной оплате
        };
        
        console.log('Подготовленные данные для запроса:', requestData);
        
        // Проверяем доступность API перед отправкой основного запроса
        try {
          console.log('Проверка доступности API Rocket Pay...');
          const pingResponse = await axios.get(`${API_ENDPOINT}/ping`, {
            timeout: 5000
          });
          console.log('Ответ на ping:', pingResponse.status, pingResponse.statusText);
        } catch (pingError) {
          console.error('Ошибка при проверке доступности API:', pingError);
          
          // Проверяем, доступен ли сервер вообще
          try {
            console.log('Проверка доступности сервера Rocket Pay...');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const serverCheckResponse = await fetch('https://pay.xrocket.tg', { 
              mode: 'no-cors',
              cache: 'no-cache',
              method: 'HEAD'
            });
            console.log('Сервер Rocket Pay доступен, но API не отвечает');
            
            // Если сервер доступен, но API не отвечает, возможно проблема с API
            return {
              success: false,
              error: 'Ошибка сети при подключении к платежной системе. Пожалуйста, проверьте ваше соединение и попробуйте снова.'
            };
          } catch (serverError) {
            console.error('Ошибка при проверке доступности сервера:', serverError);
            
            // Если сервер недоступен, возвращаем соответствующую ошибку
            return {
              success: false,
              error: 'Сервер платежной системы недоступен. Пожалуйста, попробуйте позже.'
            };
          }
        }

        // Устанавливаем таймаут для запроса
        console.log('Отправка POST запроса на', `${API_ENDPOINT}/tg-invoices`);
        console.log('Заголовки запроса:', {
          'Content-Type': 'application/json',
          'Rocket-Pay-Key': ROCKET_PAY_SECRET_KEY ? 'Установлен (скрыт)' : 'Не установлен',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        });
        
        const response = await axios.post(`${API_ENDPOINT}/tg-invoices`, requestData, {
          headers: {
            'Content-Type': 'application/json',
            'Rocket-Pay-Key': ROCKET_PAY_SECRET_KEY,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Accept': 'application/json'
          },
          timeout: 30000 // Увеличиваем таймаут до 30 секунд
        });

        // Подробное логирование ответа
        console.log('Ответ API:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });

        // Проверяем ответ
        if (response.data && response.data.success && response.data.data && response.data.data.link) {
          console.log('Успешно получен URL для оплаты:', response.data.data.link);
          
          // Проверяем, что URL не пустой
          if (!response.data.data.link || response.data.data.link.trim() === '') {
            console.error('Получен пустой URL для оплаты');
            return {
              success: false,
              error: 'Ошибка при создании платежа: Получен пустой URL для оплаты',
            };
          }
          
          return {
            success: true,
            paymentUrl: response.data.data.link,
          };
        } else {
          console.error('Ответ API не содержит URL для оплаты:', response.data);
          return {
            success: false,
            error: response.data?.message || 'Ошибка при создании платежа: Не получен URL для оплаты',
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
              error: 'Ошибка авторизации: Неверный ключ API',
            };
          }
          
          // Если ошибка связана с CORS
          if (error.message.includes('Network Error') || error.message.includes('CORS')) {
            console.error('Обнаружена ошибка CORS или сетевая ошибка');
            return {
              success: false,
              error: 'Сетевая ошибка: Возможно, проблема с CORS или доступом к API',
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
        // В реальности запрос должен отправляться через ваш сервер для безопасности
        // Получаем список счетов и ищем нужный по payload
        console.log(`Отправка запроса на получение списка tg-invoices (попытка ${retryCount + 1}/${maxRetries}):`, {
          url: `${API_ENDPOINT}/tg-invoices`,
          apiKey: ROCKET_PAY_SECRET_KEY ? 'Ключ установлен' : 'Ключ отсутствует',
          orderId: orderId
        });

        const response = await axios.get(`${API_ENDPOINT}/tg-invoices`, {
          headers: {
            'Rocket-Pay-Key': ROCKET_PAY_SECRET_KEY,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
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
