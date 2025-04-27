import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';

// Стилизованные компоненты
const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border);
  z-index: 10;
`;

const Title = styled.h1`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const CartButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: var(--accent);
  padding: 8px;
  border-radius: 50%;
  position: relative;
`;

const CartCount = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--error);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Иконка корзины в SVG формате
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

// Пропсы для компонента Header
interface HeaderProps {
  cartItemsCount?: number;
  onCartClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount = 0, onCartClick }) => {
  // Удаляем неиспользуемую переменную navigate
  const location = useLocation();

  // Определяем заголовок на основе текущего маршрута
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Каталог товаров';
    if (path === '/cart') return 'Корзина';
    if (path === '/checkout') return 'Оформление заказа';
    if (path === '/payment') return 'Оплата';
    if (path.includes('/payment/success')) return 'Статус заказа';
    
    return 'Магазин';
  };

  return (
    <HeaderContainer>
      <Title>{getPageTitle()}</Title>
      
      {/* Отображаем кнопку корзины только на странице каталога */}
      {location.pathname === '/' && (
        <CartButton onClick={onCartClick}>
          <CartIcon />
          {cartItemsCount > 0 && <CartCount>{cartItemsCount}</CartCount>}
        </CartButton>
      )}
    </HeaderContainer>
  );
};

export default Header;
