import React from 'react';
import styled from 'styled-components';
import ProductCard from '../ProductCard/ProductCard';
import { Product } from '../../types';

// Стилизованные компоненты
const Container = styled.div`
  padding: 16px;
  width: 100%;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  width: 100%;
  
  /* Адаптивность для планшетов */
  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
  
  /* Адаптивность для десктопов */
  @media (min-width: 960px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 24px;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyStateText = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
`;

// Удалены неиспользуемые компоненты StarsLabel и StarIcon

// Пропсы для компонента ProductList
interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

// Компонент для отображения списка товаров
const ProductList: React.FC<ProductListProps> = ({ products, onAddToCart }) => {
  return (
    <Container>
      <div style={{ textAlign: 'left', padding: '0 16px 16px', color: 'var(--text-secondary)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Телеграм звезды</h2>
        <p>Введите желаемое количество звезд для покупки. После оплаты звезды будут переведены на указанный телеграм-аккаунт.</p>
      </div>

      {/* Сетка товаров */}
      {products.length > 0 ? (
        <Grid>
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart}
            />
          ))}
        </Grid>
      ) : (
        <EmptyStateContainer>
          <EmptyStateText>
            Товары не найдены.
          </EmptyStateText>
        </EmptyStateContainer>
      )}
    </Container>
  );
};

export default ProductList;
