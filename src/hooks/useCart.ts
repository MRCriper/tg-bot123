import { useState, useCallback, useEffect } from 'react';
import { Cart, CartItem, Product } from '../types';

// Хук для управления корзиной товаров
export function useCart() {
  // Инициализация состояния корзины
  const [cart, setCart] = useState<Cart>(() => {
    // Попытка восстановить корзину из localStorage
    const savedCart = localStorage.getItem('cart');
    return savedCart 
      ? JSON.parse(savedCart) 
      : { items: [], totalPrice: 0 };
  });

  // Расчет общей стоимости корзины
  const calculateTotalPrice = useCallback((items: CartItem[]): number => {
    return items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }, []);

  // Добавление товара в корзину
  const addToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      // Проверяем, есть ли уже такой товар в корзине
      const existingItemIndex = prevCart.items.findIndex(
        (item) => item.product.id === product.id
      );

      let newItems;
      
      if (existingItemIndex >= 0) {
        // Если товар уже есть, увеличиваем количество
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1,
        };
      } else {
        // Если товара нет, добавляем новый элемент
        newItems = [...prevCart.items, { product, quantity: 1 }];
      }

      // Рассчитываем общую стоимость
      const totalPrice = calculateTotalPrice(newItems);

      return { items: newItems, totalPrice };
    });
  }, [calculateTotalPrice]);

  // Удаление товара из корзины
  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) => {
      // Удаляем товар из корзины
      const newItems = prevCart.items.filter(
        (item) => item.product.id !== productId
      );
      
      // Рассчитываем новую общую стоимость
      const totalPrice = calculateTotalPrice(newItems);
      
      return { items: newItems, totalPrice };
    });
  }, [calculateTotalPrice]);

  // Изменение количества товара в корзине
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) => {
        if (item.product.id === productId) {
          return { ...item, quantity };
        }
        return item;
      });

      const totalPrice = calculateTotalPrice(newItems);
      
      return { items: newItems, totalPrice };
    });
  }, [calculateTotalPrice, removeFromCart]);

  // Очистка корзины
  const clearCart = useCallback(() => {
    setCart({ items: [], totalPrice: 0 });
  }, []);

  // Сохранение корзины в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}
