import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header/Header';
import PaymentForm from '../components/PaymentForm/PaymentForm';
import { useCart } from '../hooks/useCart';
import { usePayment } from '../hooks/usePayment';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useTelegram } from '../hooks/useTelegram';
import { UserData } from '../types';

// Компонент страницы оплаты
const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const { 
    paymentUrl, 
    paymentError, 
    isLoading, 
    orderId,
    initiatePayment,
    resetPayment
  } = usePayment();
  
  // Состояние для отслеживания, была ли уже выполнена инициация платежа
  const [paymentInitiated, setPaymentInitiated] = useState<boolean>(false);
  
  // Используем хук для управления кнопкой "назад" Telegram
  useBackNavigation();

  // Перенаправляем на главную, если корзина пуста
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/');
    }
  }, [cart.items.length, navigate]);

  // Получаем userData из состояния навигации
  useEffect(() => {
    // Проверяем, есть ли userData в состоянии навигации
    const userData = location.state?.userData as UserData | undefined;
    
    // Если есть userData и платеж еще не инициирован, инициируем его
    if (userData && !paymentInitiated && !isLoading && !paymentUrl) {
      console.log('PaymentPage - Инициируем платеж с данными пользователя:', userData);
      
      // Устанавливаем флаг, что платеж инициирован
      setPaymentInitiated(true);
      
      // Инициируем платеж
      initiatePayment(cart, userData).catch(error => {
        console.error('PaymentPage - Ошибка при инициации платежа:', error);
        // Если произошла ошибка, сбрасываем флаг
        setPaymentInitiated(false);
      });
    } else if (!userData && !orderId && !isLoading) {
      // Если нет userData и нет orderId, перенаправляем на страницу оформления заказа
      console.log('PaymentPage - Нет данных пользователя, перенаправляем на страницу оформления заказа');
      navigate('/checkout');
    }
  }, [location.state, paymentInitiated, isLoading, paymentUrl, orderId, cart, initiatePayment, navigate]);

  // Обработчик перенаправления на платежную страницу Rocket Pay
  // Этот обработчик вызывается при нажатии на кнопку оплаты в Telegram
  const { openLink } = useTelegram();
  
  const handleRedirectToPayment = () => {
    if (paymentUrl) {
      console.log('PaymentPage - Кнопка оплаты нажата, URL:', paymentUrl);
      
      try {
        // Проверяем, что URL начинается с https:// или http://
        let finalUrl = paymentUrl;
        if (!paymentUrl.startsWith('https://') && !paymentUrl.startsWith('http://')) {
          finalUrl = `https://${paymentUrl}`;
          console.log('PaymentPage - Добавлен протокол https://, итоговый URL:', finalUrl);
        }
        
        // Проверяем, что URL содержит домен платежной системы
        if (finalUrl.includes('pay.xrocket.tg') || 
            finalUrl.includes('xrocket.tg') || 
            finalUrl.includes('ton-rocket.com')) {
          console.log('PaymentPage - Обнаружен URL платежной системы Rocket Pay');
          
          // Упрощенная логика открытия ссылки без предварительных проверок
          console.log('PaymentPage - Открываем платежную ссылку:', finalUrl);
          
          // Используем метод openLink из хука useTelegram
          // Это обеспечит корректное открытие ссылки в среде Telegram WebApp
          const success = openLink(finalUrl);
          console.log('PaymentPage - Результат открытия ссылки:', success ? 'успешно' : 'неудачно');
          
          // Если не удалось открыть через Telegram WebApp, пробуем через window.open
          if (!success) {
            console.log('PaymentPage - Пробуем открыть через window.open');
            try {
              const newWindow = window.open(finalUrl, '_blank');
              
              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                console.log('PaymentPage - Не удалось открыть через window.open, пробуем через location.href');
                window.location.href = finalUrl;
              }
            } catch (windowError) {
              console.error('PaymentPage - Ошибка при открытии через window.open:', windowError);
              window.location.href = finalUrl;
            }
          }
        } else {
          console.warn('PaymentPage - URL не содержит домен платежной системы Rocket Pay:', finalUrl);
          // Все равно пытаемся открыть URL
          const success = openLink(finalUrl);
          
          // Если не удалось открыть через Telegram WebApp, пробуем через window.open
          if (!success) {
            console.log('PaymentPage - Пробуем открыть через window.open');
            window.open(finalUrl, '_blank');
          }
        }
      } catch (error) {
        console.error('PaymentPage - Ошибка при открытии платежной ссылки:', error);
        
        // В случае ошибки пробуем открыть через window.location
        try {
          window.location.href = paymentUrl;
        } catch (locationError) {
          console.error('PaymentPage - Не удалось открыть ссылку даже через window.location:', locationError);
          
          // Если все методы не сработали, показываем пользователю сообщение
          alert(`Не удалось открыть платежную страницу. Пожалуйста, скопируйте ссылку вручную: ${paymentUrl}`);
        }
      }
    } else {
      console.log('PaymentPage - Кнопка оплаты нажата, но URL еще не получен');
      
      // Если URL еще не получен, но есть ошибка, показываем ее пользователю
      if (paymentError) {
        alert(`Ошибка при создании платежа: ${paymentError}. Пожалуйста, попробуйте снова.`);
      }
    }
  };

  // Обработчик отмены оплаты
  const handleCancel = () => {
    resetPayment();
    navigate('/cart');
  };

  return (
    <>
      <Header />
      <PaymentForm 
        orderId={orderId}
        amount={cart.totalPrice}
        isLoading={isLoading}
        paymentUrl={paymentUrl}
        paymentError={paymentError}
        onRedirectToPayment={handleRedirectToPayment}
        onCancel={handleCancel}
      />
    </>
  );
};

export default PaymentPage;
