import { useCallback, useState } from 'react';
import { rocketPayService } from '../services/rocketPayService';
import { Cart, RocketPaymentData, UserData } from '../types';

// Хук для работы с платежной системой
export function usePayment() {
  // Состояния для отслеживания статуса платежа
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Функция для создания уникального ID заказа
  const generateOrderId = useCallback(() => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `order_${timestamp}_${random}`;
  }, []);

  // Инициация платежа
  const initiatePayment = useCallback(async (cart: Cart, userData: UserData) => {
    console.log('usePayment - Начало инициации платежа');
    setIsLoading(true);
    setPaymentError(null);
    
    try {
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

      // Отправляем запрос в Rocket Pay
      console.log('usePayment - Отправка запроса в Rocket Pay');
      const result = await rocketPayService.initiatePayment(paymentData);
      console.log('usePayment - Получен ответ от Rocket Pay:', result);

      if (result.success && result.paymentUrl) {
        console.log('usePayment - Платеж успешно создан, URL:', result.paymentUrl);
        
        // Проверяем, что URL не пустой
        if (!result.paymentUrl || result.paymentUrl.trim() === '') {
          throw new Error('Получен пустой URL для оплаты');
        }
        
        setPaymentUrl(result.paymentUrl);
      } else {
        console.error('usePayment - Ошибка при создании платежа:', result.error);
        setPaymentError(result.error || 'Неизвестная ошибка при создании платежа');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('Ошибка при инициации платежа:', errorMessage);
      setPaymentError(errorMessage);
      
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
      console.log('usePayment - Отправка запроса на проверку статуса в Rocket Pay');
      const statusResult = await rocketPayService.checkPaymentStatus(checkOrderId);
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
    setIsLoading(false);
  }, []);

  return {
    paymentUrl,
    paymentError,
    isLoading,
    orderId,
    initiatePayment,
    checkPaymentStatus,
    resetPayment
  };
}
