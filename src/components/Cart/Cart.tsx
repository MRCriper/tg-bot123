import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { CartItem } from '../../types';

// Стилизованные компоненты
const CartContainer = styled.div`
  padding: 16px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const CartItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const ItemCard = styled.div`
  display: flex;
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px var(--shadow);
`;

const ItemImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  
  @media (min-width: 600px) {
    width: 120px;
    height: 120px;
  }
`;

const ItemDetails = styled.div`
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ItemTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
`;

const ItemPrice = styled.span`
  font-weight: 700;
  color: var(--accent);
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  margin-top: auto;
`;

const QuantityButton = styled.button`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0;
`;

const QuantityValue = styled.span`
  margin: 0 12px;
  font-weight: 600;
  color: var(--text-primary);
`;

const RemoveButton = styled.button`
  background-color: transparent;
  color: var(--error);
  padding: 4px 8px;
  margin-left: auto;
  font-size: 0.8rem;
`;

const SummaryContainer = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px var(--shadow);
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 1rem;
  color: var(--text-primary);
`;

const TotalRow = styled(SummaryRow)`
  font-weight: 700;
  font-size: 1.2rem;
  margin-top: 16px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
`;

const EmptyCartContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyCartText = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
`;

const GoShoppingButton = styled.button`
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  background-color: var(--accent);
  color: white;
  border-radius: 8px;
`;

// Иконка корзины для пустой корзины
const CartIcon = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

// Пропсы для компонента Cart
interface CartProps {
  items: CartItem[];
  totalPrice: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

// Компонент корзины
const Cart: React.FC<CartProps> = ({ 
  items, 
  totalPrice, 
  onUpdateQuantity, 
  onRemoveItem 
}) => {
  const navigate = useNavigate();
  const { showMainButton, hideMainButton } = useTelegram();
  
  // Форматирование цены
  const formatPrice = (price: number): string => {
    return `${price.toLocaleString('ru-RU')} ₽`;
  };

  // Расчет количества товаров и общего количества звезд
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  
  // Расчет общего количества звезд
  const totalStars = items.reduce((acc, item) => acc + (item.product.stars * item.quantity), 0);
  
  // При монтировании компонента показываем кнопку оформления заказа в Telegram
  React.useEffect(() => {
    if (items.length > 0) {
      showMainButton('Оформить заказ', () => navigate('/checkout'));
    } else {
      hideMainButton();
    }
    
    return () => {
      hideMainButton();
    };
  }, [items.length, showMainButton, hideMainButton, navigate]);

  // Переход к оформлению заказа
  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Переход в каталог товаров
  const goToShopping = () => {
    navigate('/');
  };

  // Отображение пустой корзины
  if (items.length === 0) {
    return (
      <EmptyCartContainer>
        <CartIcon />
        <EmptyCartText>
          Ваша корзина пуста
        </EmptyCartText>
        <GoShoppingButton onClick={goToShopping}>
          Перейти к покупкам
        </GoShoppingButton>
      </EmptyCartContainer>
    );
  }

  return (
    <CartContainer>
      <CartItemsList>
        {items.map((item) => (
          <ItemCard key={item.product.id}>
            <ItemImage src={item.product.image} alt={item.product.title} />
            <ItemDetails>
              <div>
                <ItemTitle>{item.product.title}</ItemTitle>
                <ItemPrice>{formatPrice(item.product.price)}</ItemPrice>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <QuantityControls>
                  <QuantityButton 
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  >
                    -
                  </QuantityButton>
                  <QuantityValue>{item.quantity}</QuantityValue>
                  <QuantityButton 
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  >
                    +
                  </QuantityButton>
                </QuantityControls>
                
                <RemoveButton onClick={() => onRemoveItem(item.product.id)}>
                  Удалить
                </RemoveButton>
              </div>
            </ItemDetails>
          </ItemCard>
        ))}
      </CartItemsList>
      
      <SummaryContainer>
        <SummaryRow>
          <span>Товары ({itemsCount})</span>
          <span>{formatPrice(totalPrice)}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Количество звезд</span>
          <span>{totalStars} ⭐</span>
        </SummaryRow>
        <TotalRow>
          <span>Итого</span>
          <span>{formatPrice(totalPrice)}</span>
        </TotalRow>
        
      </SummaryContainer>
    </CartContainer>
  );
};

export default Cart;
