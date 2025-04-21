import React from 'react';
import styled from 'styled-components';
import { Product } from '../../types';

// Стилизованные компоненты
const Card = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow);
  transition: transform 0.3s ease;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 100%; /* Соотношение сторон 1:1 */
  overflow: hidden;
`;

const ProductImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
`;

const ContentContainer = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: space-between;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
`;

const Description = styled.p`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const Price = styled.span`
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--accent);
`;

const StarsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 0.9rem;
  color: var(--accent);
`;

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

const AddToCartButton = styled.button`
  padding: 6px 12px;
  background-color: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--accent);
    opacity: 0.9;
  }
`;

// Пропсы для компонента ProductCard
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

// Компонент карточки товара
const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  // Форматирование цены
  const formatPrice = (price: number): string => {
    return `${price.toLocaleString('ru-RU')} ₽`;
  };

  // Обработчик добавления в корзину
  const handleAddToCart = () => {
    onAddToCart(product);
  };

  return (
    <Card>
      <ImageContainer>
        <ProductImage 
          src={product.image} 
          alt={product.title} 
          loading="lazy" 
        />
      </ImageContainer>
      <ContentContainer>
        <div>
          <Title>{product.title}</Title>
          <StarsContainer>
            <StarIcon />{product.stars} звезд
          </StarsContainer>
          <Description>{product.description}</Description>
        </div>
        <PriceRow>
          <Price>{formatPrice(product.price)}</Price>
          <AddToCartButton onClick={handleAddToCart}>
            В корзину
          </AddToCartButton>
        </PriceRow>
      </ContentContainer>
    </Card>
  );
};

export default ProductCard;
