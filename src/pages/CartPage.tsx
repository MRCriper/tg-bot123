import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Cart from '../components/Cart/Cart';
import { useCart } from '../hooks/useCart';
import { useBackNavigation } from '../hooks/useBackNavigation';

// Компонент страницы корзины
const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart } = useCart();
  // Используем хук для управления кнопкой "назад" Telegram
  useBackNavigation();

  return (
    <>
      <Header />
      <Cart 
        items={cart.items} 
        totalPrice={cart.totalPrice}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
      />
    </>
  );
};

export default CartPage;
