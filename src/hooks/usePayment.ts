import { useCallback, useState } from 'react';
import { rocketPayService } from '../services/rocketPayService';
import { Cart, RocketPaymentData, RocketPayResponse, UserData } from '../types';

// Хук для работы с платежной системой
export function usePayment() {
  // Состояния для отслеживания статуса платежа
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  // Функция для создания уникального ID заказа
  const generateOrderId = useCallback(() => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `order_${timestamp}_${random}`;
  }, []);

  // Проверка соединения с интернетом
  const checkInternetConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('usePayment - Проверка соединения с интернетом');
      
      // Проверяем соединение с интернетом через запрос к Google
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('usePayment - Соединение с интернетом доступно');
      return true;
    } catch (error) {
      console.error('usePayment - Ошибка при проверке соединения с интернетом:', error);
      return false;
    }
  }, []);

  // Инициация платежа
  const initiatePayment = useCallback(async (cart: Cart, userData: UserData) => {
    console.log('usePayment - Начало инициации платежа');
    setIsLoading(true);
    setPaymentError(null);
    
    try {
      // Проверяем соединение с интернетом
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        throw new Error('Отсутствует подключение к интернету. Пожалуйста, проверьте ваше соединение и попробуйте снова.');
      }
      
      // Проверяем, что имя пользователя Telegram не пустое
      if (!userData.telegramUsername || userData.telegramUsername.trim() === '') {
        throw new Error('Имя пользователя Telegram не указано');
      }
      
      // Генерируем ID заказа
      const newOrderId = generateOrderId();
      setOrderId(newOrderId);
      console.log('usePayment - Сгенерирован ID заказа:', newOrderId);

      // Формируем данные для платежа
      const telegramUsername = userData.telegramUsername.replace('@', ''); // Убираем @ если он есть
      
      // Проверяем, что имя пользователя соответствует требованиям Telegram (5-32 символа, только буквы, цифры и _)
      if (!/^[a-zA-Z0-9_]{5,32}$/.test(telegramUsername)) {
        throw new Error('Некорректное имя пользователя Telegram. Должно содержать от 5 до 32 символов, только буквы, цифры и _');
      }
      
      // Формируем URL для перенаправления после оплаты
      // Используем абсолютный URL с origin для надежности
      const origin = window.location.origin;
      // Кодируем параметры URL для безопасности
      const encodedOrderId = encodeURIComponent(newOrderId);
      const redirectUrl = `${origin}/payment/success?orderId=${encodedOrderId}`;
      
      console.log('usePayment - Сформирован URL для перенаправления:', redirectUrl);
      
      const paymentData: RocketPaymentData = {
        orderId: newOrderId,
        amount: cart.totalPrice,
        description: `Оплата заказа ${newOrderId}`,
        customerTelegram: telegramUsername,
        // URL для перенаправления после оплаты (должен обрабатываться вашим приложением)
        redirectUrl: redirectUrl
      };
      
      console.log('usePayment - Данные для платежа:', {
        orderId: newOrderId,
        amount: cart.totalPrice,
        customerTelegram: telegramUsername,
        redirectUrl: redirectUrl
      });

      // Отправляем запрос в Rocket Pay с повторными попытками
      console.log('usePayment - Отправка запроса в Rocket Pay');
      
      // Максимальное количество попыток
      const maxRetries = 2;
      let currentRetry = 0;
      let lastError: Error | null = null;
      let paymentResult: RocketPayResponse | null = null;
      
      while (currentRetry <= maxRetries) {
        try {
          // Устанавливаем таймаут для запроса
          const timeoutPromise = new Promise<RocketPayResponse>((_, reject) => {
            setTimeout(() => reject(new Error('Превышено время ожидания ответа от платежной системы')), 30000);
          });
          
          // Выполняем запрос с таймаутом
          const result = await Promise.race([
            rocketPayService.initiatePayment(paymentData),
            timeoutPromise
          ]);
          
          console.log('usePayment - Получен ответ от Rocket Pay:', result);
          
          // Если запрос успешен, сохраняем результат и выходим из цикла
          if (result.success && result.paymentUrl) {
            console.log('usePayment - Платеж успешно создан, URL:', result.paymentUrl);
            paymentResult = result;
            break;
          } else {
            // Если ошибка не связана с сетью, сохраняем результат и выходим из цикла
            if (!result.error?.includes('Network Error') && 
                !result.error?.includes('timeout') && 
                !result.error?.includes('соединение')) {
              console.log('usePayment - Получена ошибка, не связанная с сетью:', result.error);
              paymentResult = result;
              break;
            }
            
            // Иначе сохраняем ошибку и пробуем еще раз
            lastError = new Error(result.error || 'Неизвестная ошибка');
            console.log(`usePayment - Сетевая ошибка, попытка ${currentRetry + 1} из ${maxRetries + 1}:`, result.error);
          }
        } catch (error) {
          // Сохраняем ошибку
          lastError = error instanceof Error ? error : new Error('Неизвестная ошибка');
          console.error(`usePayment - Ошибка при выполнении запроса, попытка ${currentRetry + 1} из ${maxRetries + 1}:`, error);
        }
        
        // Увеличиваем счетчик попыток
        currentRetry++;
        
        // Если это не последняя попытка, ждем перед следующей
        if (currentRetry <= maxRetries) {
          const delay = Math.pow(2, currentRetry - 1) * 1000; // 1с, 2с, 4с, ...
          console.log(`usePayment - Ожидание ${delay}мс перед следующей попыткой...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Проверяем соединение перед повторной попыткой
          const isStillConnected = await checkInternetConnection();
          if (!isStillConnected) {
            throw new Error('Отсутствует подключение к интернету. Пожалуйста, проверьте ваше соединение и попробуйте снова.');
          }
        }
      }
      
      // Обрабатываем результат после всех попыток
      if (paymentResult) {
        if (paymentResult.success && paymentResult.paymentUrl) {
          // Проверяем, что URL не пустой
          if (!paymentResult.paymentUrl || paymentResult.paymentUrl.trim() === '') {
            throw new Error('Получен пустой URL для оплаты');
          }
          
          setPaymentUrl(paymentResult.paymentUrl);
          
          // Сохраняем ID инвойса для последующей проверки статуса
          if (paymentResult.invoiceId) {
            console.log('usePayment - Сохранен ID инвойса:', paymentResult.invoiceId);
            setInvoiceId(paymentResult.invoiceId);
          }
          
          return paymentResult;
        } else {
          console.error('usePayment - Ошибка при создании платежа:', paymentResult.error);
          
          // Преобразуем общие ошибки в более понятные для пользователя
          let userFriendlyError = paymentResult.error || 'Неизвестная ошибка при создании платежа';
          
          if (userFriendlyError.includes('Network Error')) {
            userFriendlyError = 'Ошибка сети при подключении к платежной системе. Пожалуйста, проверьте ваше соединение и попробуйте снова.';
          } else if (userFriendlyError.includes('timeout')) {
            userFriendlyError = 'Превышено время ожидания ответа от платежной системы. Пожалуйста, попробуйте снова позже.';
          } else if (userFriendlyError.includes('CORS')) {
            userFriendlyError = 'Ошибка доступа к платежной системе. Пожалуйста, попробуйте снова позже или обратитесь в поддержку.';
          }
          
          setPaymentError(userFriendlyError);
          return paymentResult;
        }
      }
      
      // Если все попытки не удались и нет результата, выбрасываем последнюю ошибку
      if (lastError) {
        throw lastError;
      }
      
      // Если дошли до этой точки, значит что-то пошло не так
      throw new Error('Не удалось создать платеж после нескольких попыток');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('Ошибка при инициации платежа:', errorMessage);
      
      // Преобразуем общие ошибки в более понятные для пользователя
      let userFriendlyError = errorMessage;
      
      if (errorMessage.includes('Network Error')) {
        userFriendlyError = 'Ошибка сети при подключении к платежной системе. Пожалуйста, проверьте ваше соединение и попробуйте снова.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Превышено время ожидания ответа от платежной системы. Пожалуйста, попробуйте снова позже.';
      }
      
      setPaymentError(userFriendlyError);
      
      // Сбрасываем orderId в случае ошибки
      setOrderId(null);
    } finally {
      setIsLoading(false);
    }
  }, [generateOrderId]);

  // Проверка статуса платежа
  const checkPaymentStatus = useCallback(async (checkOrderId: string) => {
    console.log('usePayment - Начало проверки статуса платежа для заказа:', checkOrderId);
    setIsLoading(true);
    
    try {
      // Используем invoiceId для проверки статуса, если он доступен
      // В противном случае используем orderId (для обратной совместимости)
      const idToCheck = invoiceId || checkOrderId;
      console.log('usePayment - Отправка запроса на проверку статуса в Rocket Pay, ID:', idToCheck);
      
      const statusResult = await rocketPayService.checkPaymentStatus(idToCheck);
      console.log('usePayment - Получен результат проверки статуса:', statusResult);
      return statusResult;
    } catch (error) {
      console.error('usePayment - Ошибка при проверке статуса платежа:', error);
      return { status: 'error', success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Сброс состояния платежа
  const resetPayment = useCallback(() => {
    setPaymentUrl(null);
    setPaymentError(null);
    setOrderId(null);
    setInvoiceId(null);
    setIsLoading(false);
  }, []);

  return {
    paymentUrl,
    paymentError,
    isLoading,
    orderId,
    invoiceId,
    initiatePayment,
    checkPaymentStatus,
    resetPayment
  };
}
