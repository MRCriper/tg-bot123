import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';

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

// Иконка для навигации назад
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// Пропсы для компонента Header
interface HeaderProps {
  cartItemsCount?: number;
  onCartClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount = 0, onCartClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showBackButton, hideBackButton, onBackButtonClicked } = useTelegram();
  
  React.useEffect(() => {
    // Если мы не на главной странице, показываем кнопку возврата
    if (location.pathname !== '/') {
      showBackButton();
      onBackButtonClicked(() => navigate(-1));
    } else {
      hideBackButton();
    }
    
    // Очистка при размонтировании
    return () => {
      hideBackButton();
    };
  }, [location.pathname, showBackButton, hideBackButton, onBackButtonClicked, navigate]);

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
