import { useEffect } from 'react';
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
  
  useEffect(() => {
    // Определяем, куда должна вести кнопка "назад" для текущего маршрута
    const backRoute = BACK_ROUTES[currentPath];
    
    // Если для текущего маршрута определен маршрут "назад" и он не совпадает с текущим
    if (backRoute && backRoute !== currentPath) {
      // Показываем кнопку "назад" и настраиваем обработчик
      showBackButton();
      onBackButtonClicked(() => {
        navigate(backRoute);
      });
      
      // Очистка при размонтировании
      return () => {
        hideBackButton();
      };
    } else {
      // Если для текущего маршрута не определен маршрут "назад" или он совпадает с текущим,
      // скрываем кнопку "назад"
      hideBackButton();
    }
  }, [currentPath, navigate, showBackButton, hideBackButton, onBackButtonClicked]);
}
