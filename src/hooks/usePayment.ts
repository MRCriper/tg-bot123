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
    setIsLoading(true);
    setPaymentError(null);
    
    try {
      // Генерируем ID заказа
      const newOrderId = generateOrderId();
      setOrderId(newOrderId);

      // Формируем данные для платежа
      const paymentData: RocketPaymentData = {
        orderId: newOrderId,
        amount: cart.totalPrice,
        description: `Оплата заказа ${newOrderId}`,
        customerTelegram: userData.telegramUsername.replace('@', ''), // Убираем @ если он есть
        // URL для перенаправления после оплаты (должен обрабатываться вашим приложением)
        redirectUrl: `${window.location.origin}/payment/success?orderId=${newOrderId}`
      };

      // Отправляем запрос в Rocket Pay
      const result = await rocketPayService.initiatePayment(paymentData);

      if (result.success && result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
      } else {
        setPaymentError(result.error || 'Неизвестная ошибка при создании платежа');
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      console.error('Ошибка при инициации платежа:', error);
    } finally {
      setIsLoading(false);
    }
  }, [generateOrderId]);

  // Проверка статуса платежа
  const checkPaymentStatus = useCallback(async (checkOrderId: string) => {
    setIsLoading(true);
    
    try {
      const statusResult = await rocketPayService.checkPaymentStatus(checkOrderId);
      return statusResult;
    } catch (error) {
      console.error('Ошибка при проверке статуса платежа:', error);
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
