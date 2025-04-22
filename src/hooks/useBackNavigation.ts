import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from './useTelegram';

// Карта маршрутов для навигации назад
// Ключ - текущий маршрут, значение - маршрут, на который нужно перейти при нажатии кнопки "назад"
const BACK_ROUTES: Record<string, string> = {
  '/': '/', // На главной странице кнопка "назад" не нужна
  '/cart': '/', // Из корзины - на главную
  '/checkout': '/cart', // Из оформления - в корзину
  '/payment': '/cart', // Из оплаты - в корзину (вместо /checkout)
  '/payment/success': '/cart', // Из успешной оплаты - в корзину
};

/**
 * Хук для управления кнопкой "назад" Telegram WebApp
 * Автоматически настраивает кнопку "назад" в зависимости от текущего маршрута
 */
export function useBackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showBackButton, hideBackButton, onBackButtonClicked } = useTelegram();
  
  // Текущий путь
  const currentPath = location.pathname;
  
  // Функция для определения маршрута "назад"
  const getBackRoute = useCallback((path: string) => {
    // Сначала проверяем точное совпадение
    if (BACK_ROUTES[path]) {
      return BACK_ROUTES[path];
    }
    
    // Если точного совпадения нет, проверяем маршруты с параметрами
    // Например, /payment/success?orderId=123 должен соответствовать /payment/success
    for (const route in BACK_ROUTES) {
      if (path.startsWith(route)) {
        return BACK_ROUTES[route];
      }
    }
    
    // Если ничего не найдено, возвращаем главную страницу
    return '/';
  }, []);
  
  // Настройка кнопки "назад"
  useEffect(() => {
    try {
      // Определяем, куда должна вести кнопка "назад" для текущего маршрута
      const backRoute = getBackRoute(currentPath);
      
      // Если маршрут "назад" не совпадает с текущим
      if (backRoute !== currentPath) {
        // Показываем кнопку "назад" и настраиваем обработчик
        showBackButton();
        onBackButtonClicked(() => {
          navigate(backRoute);
        });
        
        // Очистка при размонтировании
        return () => {
          try {
            hideBackButton();
          } catch (error) {
            console.error('Ошибка при скрытии кнопки "назад":', error);
          }
        };
      } else {
        // Если маршрут "назад" совпадает с текущим, скрываем кнопку "назад"
        hideBackButton();
      }
    } catch (error) {
      console.error('Ошибка при настройке кнопки "назад":', error);
    }
  }, [currentPath, navigate, showBackButton, hideBackButton, onBackButtonClicked, getBackRoute]);
}
