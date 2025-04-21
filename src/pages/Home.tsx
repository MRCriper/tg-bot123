import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import ProductList from '../components/ProductList/ProductList';
import { useCart } from '../hooks/useCart';
import { Product } from '../types';

// Демо-данные для пакетов Telegram звезд
const mockProducts: Product[] = [
  {
    id: 1,
    title: '50 Telegram Звезд',
    description: 'Базовый набор звезд для новичков',
    price: 499,
    image: 'https://via.placeholder.com/300x300?text=⭐️+50',
    stars: 50
  },
  {
    id: 2,
    title: '100 Telegram Звезд',
    description: 'Стандартный набор звезд для активных пользователей',
    price: 899,
    image: 'https://via.placeholder.com/300x300?text=⭐️+100',
    stars: 100
  },
  {
    id: 3,
    title: '200 Telegram Звезд',
    description: 'Популярный выбор для общительных пользователей',
    price: 1690,
    image: 'https://via.placeholder.com/300x300?text=⭐️+200',
    stars: 200
  },
  {
    id: 4,
    title: '500 Telegram Звезд',
    description: 'Набор для тех, кто ценит внимание и статус',
    price: 3990,
    image: 'https://via.placeholder.com/300x300?text=⭐️+500',
    stars: 500
  },
  {
    id: 5,
    title: '1000 Telegram Звезд',
    description: 'Премиум набор для настоящих энтузиастов Telegram',
    price: 7490,
    image: 'https://via.placeholder.com/300x300?text=⭐️+1000',
    stars: 1000
  },
  {
    id: 6,
    title: '2000 Telegram Звезд',
    description: 'VIP пакет звезд для особых случаев',
    price: 13990,
    image: 'https://via.placeholder.com/300x300?text=⭐️+2000',
    stars: 2000
  }
];

// Компонент главной страницы
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  
  // Состояние для хранения товаров (в реальном приложении они загружались бы из API)
  const [products, setProducts] = useState<Product[]>(mockProducts);
  
  // Обработчик клика по корзине в хедере
  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <>
      <Header 
        cartItemsCount={cart.items.length} 
        onCartClick={handleCartClick} 
      />
      <ProductList 
        products={products}
        onAddToCart={addToCart}
      />
    </>
  );
};

export default Home;
