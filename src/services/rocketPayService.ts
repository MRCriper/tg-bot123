import axios from 'axios';
import { RocketPaymentData, RocketPayResponse } from '../types';

// URL API Rocket Pay
const ROCKET_PAY_API_URL = process.env.REACT_APP_ROCKET_PAY_API_URL || 'https://pay.xrocket.tg/api';

// Секретный ключ (будет предоставлен при регистрации в Rocket Pay)
// В реальном приложении этот ключ должен храниться на сервере и не должен быть доступен на клиенте
const ROCKET_PAY_SECRET_KEY = process.env.REACT_APP_ROCKET_PAY_SECRET_KEY || '';

// Сервис для взаимодействия с платежной системой Rocket Pay
export const rocketPayService = {
  /**
   * Инициирует платеж в Rocket Pay
   * @param paymentData - данные для создания платежа
   * @returns - объект с URL для перенаправления на платежную форму или ошибка
   */
  async initiatePayment(paymentData: RocketPaymentData): Promise<RocketPayResponse> {
    try {
      // В реальности запрос должен отправляться через ваш сервер для безопасности
      // Это демо-реализация для наглядности
      const response = await axios.post(`${ROCKET_PAY_API_URL}/tg-invoices`, {
        amount: paymentData.amount,
        minPayment: paymentData.amount, // Минимальная сумма платежа (обычно равна amount)
        numPayments: 1, // Количество платежей (по умолчанию 1)
        currency: "TONCOIN", // Валюта (TON)
        description: paymentData.description,
        hiddenMessage: `Заказ №${paymentData.orderId}`, // Скрытое сообщение, видимое только продавцу
        commentsEnabled: false, // Отключаем комментарии
        callbackUrl: paymentData.redirectUrl, // URL для перенаправления после оплаты
        payload: paymentData.orderId, // Дополнительные данные (используем orderId)
        expiredIn: 10 // Время жизни счета в минутах
      }, {
        headers: {
          'Authorization': `Bearer ${ROCKET_PAY_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Rocket-Pay-Key': ROCKET_PAY_SECRET_KEY
        },
      });

      if (response.data && response.data.success && response.data.data && response.data.data.link) {
        return {
          success: true,
          paymentUrl: response.data.data.link,
        };
      } else {
        return {
          success: false,
          error: 'Ошибка при создании платежа: Не получен URL для оплаты',
        };
      }
    } catch (error) {
      console.error('Ошибка при создании платежа:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка при создании платежа',
      };
    }
  },

  /**
   * Проверяет статус платежа
   * @param orderId - идентификатор заказа (payload)
   * @returns - информация о статусе платежа
   */
  async checkPaymentStatus(orderId: string): Promise<{ status: string, success: boolean }> {
    try {
      // В реальности запрос должен отправляться через ваш сервер для безопасности
      // Получаем список счетов и ищем нужный по payload
      const response = await axios.get(`${ROCKET_PAY_API_URL}/tg-invoices`, {
        headers: {
          'Authorization': `Bearer ${ROCKET_PAY_SECRET_KEY}`,
          'Rocket-Pay-Key': ROCKET_PAY_SECRET_KEY
        },
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
          
          return {
            status: status,
            success: true,
          };
        }
      }
      
      return {
        status: 'unknown',
        success: false,
      };
    } catch (error) {
      console.error('Ошибка при проверке статуса платежа:', error);
      
      return {
        status: 'error',
        success: false,
      };
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
      // const signature = callbackData.headers['rocket-pay-signature'];
      // const isValidSignature = verifySignature(callbackData.body, signature);
      
      // if (!isValidSignature) {
      //   return { success: false, message: 'Недействительная подпись' };
      // }

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
