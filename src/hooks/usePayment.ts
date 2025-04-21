import { useCallback, useState } from 'react';
import { paystoService } from '../services/paystoService';
import { Cart, PaystoPaymentData, UserData } from '../types';

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
      const paymentData: PaystoPaymentData = {
        orderId: newOrderId,
        amount: cart.totalPrice,
        description: `Оплата заказа ${newOrderId}`,
        customerEmail: userData.email || `user_${Date.now()}@example.com`, // Используем дефолтное значение если email не указан
        // URL для перенаправления после оплаты (должен обрабатываться вашим приложением)
        redirectUrl: `${window.location.origin}/payment/success?orderId=${newOrderId}`
      };

      // Отправляем запрос в Paysto
      const result = await paystoService.initiatePayment(paymentData);

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
      const statusResult = await paystoService.checkPaymentStatus(checkOrderId);
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
