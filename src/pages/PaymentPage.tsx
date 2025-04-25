import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import PaymentForm from '../components/PaymentForm/PaymentForm';
import { useCart } from '../hooks/useCart';
import { usePayment } from '../hooks/usePayment';
import { useBackNavigation } from '../hooks/useBackNavigation';

// Компонент страницы оплаты
const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { 
    paymentUrl, 
    paymentError, 
    isLoading, 
    orderId,
    initiatePayment,
    resetPayment
  } = usePayment();
  // Используем хук для управления кнопкой "назад" Telegram
  useBackNavigation();

  // Перенаправляем на главную, если корзина пуста
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/');
    }
  }, [cart.items.length, navigate]);

  // Обработчик перенаправления на платежную страницу Rocket Pay
  // Этот обработчик вызывается при нажатии на кнопку оплаты в Telegram
  const handleRedirectToPayment = () => {
    if (paymentUrl) {
      console.log('PaymentPage - Кнопка оплаты нажата, URL:', paymentUrl);
      // Перенаправление происходит автоматически в компоненте PaymentForm через useEffect
      // Здесь ничего не делаем, чтобы избежать дублирования перенаправления
    } else {
      console.log('PaymentPage - Кнопка оплаты нажата, но URL еще не получен');
    }
  };

  // Обработчик отмены оплаты
  const handleCancel = () => {
    resetPayment();
    navigate('/cart');
  };

  // Если пользователь сразу попал на эту страницу, но у нас нет orderId,
  // перенаправляем его на страницу оформления заказа
  useEffect(() => {
    if (!orderId && !isLoading) {
      navigate('/checkout');
    }
  }, [orderId, isLoading, navigate]);

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
