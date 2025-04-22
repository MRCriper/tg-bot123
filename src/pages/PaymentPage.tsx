import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import PaymentForm from '../components/PaymentForm/PaymentForm';
import { useCart } from '../hooks/useCart';
import { usePayment } from '../hooks/usePayment';
import { useTelegram } from '../hooks/useTelegram';

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
  const { onBackButtonClicked, showBackButton, hideBackButton } = useTelegram();

  // Настраиваем кнопку назад в Telegram WebApp
  useEffect(() => {
    showBackButton();
    onBackButtonClicked(() => {
      navigate('/checkout');
    });
    
    return () => {
      hideBackButton();
    };
  }, [showBackButton, hideBackButton, onBackButtonClicked, navigate]);

  // Перенаправляем на главную, если корзина пуста
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/');
    }
  }, [cart.items.length, navigate]);

  // Обработчик перенаправления на платежную страницу Paysto
  const handleRedirectToPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      navigate(`/payment/success?orderId=${orderId}`);
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
