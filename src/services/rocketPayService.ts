import axios from 'axios';
import { RocketPaymentData, RocketPayResponse } from '../types';

// URL для получения курса TON/RUB
const TON_PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=rub';

// Логируем информацию для отладки
console.log('Используем обновленный API XRocket для платежей');

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
   * Создает инвойс в XRocket
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
        
        // Проверяем, что customerTelegram не пустой
        if (!paymentData.customerTelegram) {
          console.error('Отсутствует customerTelegram в данных платежа');
          return {
            success: false,
            error: 'Ошибка данных: Отсутствует имя пользователя Telegram',
          };
        }

        // Нормализуем имя пользователя Telegram (убираем @ если он есть)
        paymentData.customerTelegram = paymentData.customerTelegram.replace('@', '');

        // Нормализуем URL для перенаправления
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
        
        // Получаем API ключ из переменных окружения
        const apiKey = process.env.REACT_APP_XROCKET_API_KEY;
        if (!apiKey) {
          console.error('Отсутствует API ключ XRocket');
          return {
            success: false,
            error: 'Ошибка конфигурации: Отсутствует API ключ XRocket',
          };
        }
        
        console.log(`Отправка запроса на создание инвойса (попытка ${retryCount + 1}/${maxRetries})`);
        
        // Создаем инвойс с использованием обновленного API XRocket
        const response = await axios.post(
          'https://pay.xrocket.tg/api/tg-invoices', 
          {
            amount: amountTon,
            minPayment: amountTon,
            numPayments: 1,
            currency: "TONCOIN",
            description: `${paymentData.description} (${paymentData.amount} ₽)`,
            hiddenMessage: "thank you",
            commentsEnabled: false,
            expiredIn: 300, // 5 минут в секундах
            // Используем redirectUrl как callbackUrl
            callbackUrl: redirectUrl,
            // Используем orderId как payload
            payload: `${paymentData.orderId}`
          },
          {
            headers: {
              'Rocket-Pay-Key': apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Ответ API:', response.data);
        
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
          
          // Проверяем, что URL начинается с http:// или https://
          let paymentUrl = response.data.data.link;
          if (!paymentUrl.startsWith('http://') && !paymentUrl.startsWith('https://')) {
            paymentUrl = `https://${paymentUrl}`;
            console.log('Добавлен протокол https:// к URL:', paymentUrl);
          }
          
          return {
            success: true,
            paymentUrl: paymentUrl,
            // Сохраняем ID инвойса для последующей проверки статуса
            invoiceId: response.data.data.id
          };
        } else {
          console.error('Ответ API не содержит URL для оплаты:', response.data);
          let errorMessage = 'Ошибка при создании платежа: Не получен URL для оплаты';
          if (response.data && !response.data.success) {
            errorMessage = response.data.message || errorMessage;
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
            message: error.message
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
   * @param id - идентификатор инвойса или orderId (payload)
   * @returns - информация о статусе платежа
   */
  async checkPaymentStatus(id: string): Promise<{ status: string, success: boolean }> {
    // Максимальное количество попыток
    const maxRetries = 3;
    let retryCount = 0;
    
    // Функция для выполнения запроса с повторными попытками
    const executeWithRetry = async (): Promise<{ status: string, success: boolean }> => {
      try {
        // Получаем API ключ из переменных окружения
        const apiKey = process.env.REACT_APP_XROCKET_API_KEY;
        if (!apiKey) {
          console.error('Отсутствует API ключ XRocket');
          return {
            status: 'error',
            success: false,
          };
        }
        
        console.log(`Отправка запроса на проверку статуса инвойса (попытка ${retryCount + 1}/${maxRetries})`);
        
        // Определяем, является ли id инвойсом или payload (orderId)
        // Если id содержит только цифры, считаем его инвойсом, иначе - payload
        const isInvoiceId = /^\d+$/.test(id);
        
        let response;
        if (isInvoiceId) {
          // Получаем информацию о конкретном инвойсе по ID
          console.log(`Проверка статуса по ID инвойса: ${id}`);
          response = await axios.get(
            `https://pay.xrocket.tg/api/tg-invoices/${id}`,
            {
              headers: {
                'Rocket-Pay-Key': apiKey,
                'Content-Type': 'application/json'
              },
              timeout: 10000 // Устанавливаем таймаут в 10 секунд
            }
          );
        } else {
          // Получаем информацию об инвойсе по payload (orderId)
          console.log(`Проверка статуса по payload (orderId): ${id}`);
          response = await axios.get(
            `https://pay.xrocket.tg/api/tg-invoices?payload=${id}`,
            {
              headers: {
                'Rocket-Pay-Key': apiKey,
                'Content-Type': 'application/json'
              },
              timeout: 10000 // Устанавливаем таймаут в 10 секунд
            }
          );
        }
        
        console.log('Ответ API при проверке статуса:', response.data);
        
        if (response.data && response.data.success) {
          if (isInvoiceId && response.data.data) {
            // Обработка ответа для запроса по ID инвойса
            // Преобразуем статус в понятный формат
            let status = 'unknown';
            if (response.data.data.status === 'active') {
              status = 'PENDING';
            } else if (response.data.data.status === 'paid') {
              status = 'PAID';
            } else if (response.data.data.status === 'expired') {
              status = 'CANCELLED';
            }
            
            console.log(`Статус инвойса ${id}: ${status}`);
            return {
              status: status,
              success: true,
            };
          } else if (!isInvoiceId && response.data.data) {
            // Обработка ответа для запроса по payload (orderId)
            // Ищем счет с нужным payload
            const invoice = response.data.data.find((inv: any) => inv.payload === id);
            
            if (invoice) {
              // Преобразуем статус в понятный формат
              let status = 'unknown';
              if (invoice.status === 'active') {
                status = 'PENDING';
              } else if (invoice.status === 'paid') {
                status = 'PAID';
              } else if (invoice.status === 'expired') {
                status = 'CANCELLED';
              }
              
              console.log(`Найден счет для заказа ${id}, статус: ${status}`);
              return {
                status: status,
                success: true,
              };
            } else {
              console.log(`Счет для заказа ${id} не найден в списке`);
            }
          }
        }
        
        console.error('Ответ API не содержит данных об инвойсе:', response.data);
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
            data: error.response?.data
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
