import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import OrderStatus from '../components/OrderStatus/OrderStatus';
import { useCart } from '../hooks/useCart';
import { useBackNavigation } from '../hooks/useBackNavigation';

// Компонент страницы статуса заказа
const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  // Используем хук для управления кнопкой "назад" Telegram
  useBackNavigation();
  
  // Очистка корзины после успешного заказа
  React.useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <>
      <Header />
      <OrderStatus />
    </>
  );
};

export default PaymentSuccessPage;
