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

// Звездочка рядом с количеством звезд
const StarsLabel = styled.div`
  display: flex;
  align-items: center;
  margin-right: 10px;
  color: var(--accent);
  font-weight: bold;
`;

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background-color: var(--input-bg);
  color: var(--text-primary);
  margin-bottom: 16px;
  font-size: 1rem;
  
  &:focus {
    border-color: var(--accent);
    outline: none;
  }
`;

// Пропсы для компонента ProductList
interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

// Компонент для отображения списка товаров
const ProductList: React.FC<ProductListProps> = ({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Фильтрация товаров по поисковому запросу
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [products, searchTerm]);

  // Обработчик изменения поискового запроса
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Container>
      {/* Поисковая строка */}
      <SearchInput 
        type="text" 
        placeholder="Поиск звезд..." 
        value={searchTerm}
        onChange={handleSearchChange}
      />
      
      <div style={{ textAlign: 'left', padding: '0 16px 16px', color: 'var(--text-secondary)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Телеграм звезды</h2>
        <p>Выберите количество звезд для покупки. После оплаты звезды будут переведены на указанный телеграм-аккаунт.</p>
      </div>

      {/* Сетка товаров или сообщение, если товары не найдены */}
      {filteredProducts.length > 0 ? (
        <Grid>
          {filteredProducts.map(product => (
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
            По вашему запросу товары не найдены.
          </EmptyStateText>
        </EmptyStateContainer>
      )}
    </Container>
  );
};

export default ProductList;
