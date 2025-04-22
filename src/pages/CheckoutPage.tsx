import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import CheckoutForm from '../components/CheckoutForm/CheckoutForm';
import { useCart } from '../hooks/useCart';
import { usePayment } from '../hooks/usePayment';
import { useTelegram } from '../hooks/useTelegram';
import { UserData } from '../types';

// Компонент страницы оформления заказа
const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { initiatePayment, isLoading } = usePayment();
  const { onBackButtonClicked, showBackButton, hideBackButton } = useTelegram();
  
  // Настраиваем кнопку назад в Telegram WebApp
  useEffect(() => {
    showBackButton();
    onBackButtonClicked(() => {
      navigate('/cart');
    });
    
    return () => {
      hideBackButton();
    };
  }, [showBackButton, hideBackButton, onBackButtonClicked, navigate]);
  
  // Обработчик отправки формы оформления заказа
  const handleSubmit = async (userData: UserData) => {
    try {
      // Инициация платежа
      await initiatePayment(cart, userData);
      
      // Перенаправление на страницу оплаты
      navigate('/payment');
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
