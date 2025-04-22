import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import ProductList from '../components/ProductList/ProductList';
import { useCart } from '../hooks/useCart';
import { Product } from '../types';

// Импортируем изображения
import img50stars from '../images/50stars.jpg';
import img100stars from '../images/100stars.jpg';
import img200stars from '../images/200stars.jpg';
import img500stars from '../images/500stars.webp';
import img1000stars from '../images/1000stars.png';

// Демо-данные для пакетов Telegram звезд
const mockProducts: Product[] = [
  {
    id: 1,
    title: '50 Telegram Звезд',
    description: 'Базовый набор звезд для новичков',
    price: 499,
    image: img50stars,
    stars: 50
  },
  {
    id: 2,
    title: '100 Telegram Звезд',
    description: 'Стандартный набор звезд для активных пользователей',
    price: 899,
    image: img100stars,
    stars: 100
  },
  {
    id: 3,
    title: '250 Telegram Звезд',
    description: 'Популярный выбор для общительных пользователей',
    price: 1690,
    image: img200stars,
    stars: 250
  },
  {
    id: 4,
    title: '500 Telegram Звезд',
    description: 'Набор для тех, кто ценит внимание и статус',
    price: 3990,
    image: img500stars,
    stars: 500
  },
  {
    id: 5,
    title: '1000 Telegram Звезд',
    description: 'Премиум набор для настоящих энтузиастов Telegram',
    price: 7490,
    image: img1000stars,
    stars: 1000
  }
];

// Компонент главной страницы
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  
  // Товары для отображения (в реальном приложении они загружались бы из API)
  const products = mockProducts;
  
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
