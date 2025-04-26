import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import CheckoutForm from '../components/CheckoutForm/CheckoutForm';
import { useCart } from '../hooks/useCart';
import { usePayment } from '../hooks/usePayment';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { UserData } from '../types';

// Компонент страницы оформления заказа
const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { isLoading, resetPayment } = usePayment();
  // Используем хук для управления кнопкой "назад" Telegram
  useBackNavigation();
  
  // Сбрасываем состояние платежа при монтировании компонента
  useEffect(() => {
    resetPayment();
  }, [resetPayment]);
  
  // Обработчик отправки формы оформления заказа
  const handleSubmit = (userData: UserData) => {
    try {
      console.log('CheckoutPage - Форма отправлена, данные пользователя:', userData);
      
      // Перенаправление на страницу оплаты с передачей данных пользователя
      navigate('/payment', { state: { userData } });
    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error);
      // Можно добавить отображение ошибки для пользователя
    }
  };

  return (
    <>
      <Header />
      <CheckoutForm 
        cart={cart} 
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
};

export default CheckoutPage;
