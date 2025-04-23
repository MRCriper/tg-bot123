import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from './useTelegram';

// Карта маршрутов для навигации назад
// Ключ - текущий маршрут или его префикс, значение - маршрут, на который нужно перейти при нажатии кнопки "назад"
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
 * Поддерживает все платформы Telegram (веб, iOS, Android)
 */
export function useBackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showBackButton, hideBackButton, onBackButtonClicked, isBackButtonSupported } = useTelegram();
  
  // Текущий путь
  const currentPath = location.pathname;
  
  // Ref для отслеживания, была ли уже настроена кнопка назад
  const backButtonSetupRef = useRef(false);
  
  // Функция для определения маршрута "назад"
  const getBackRoute = useCallback((path: string) => {
    // Удаляем параметры запроса, если они есть
    const pathWithoutQuery = path.split('?')[0];
    
    // Сначала проверяем точное совпадение
    if (BACK_ROUTES[pathWithoutQuery]) {
      return BACK_ROUTES[pathWithoutQuery];
    }
    
    // Если точного совпадения нет, проверяем маршруты с параметрами
    // Например, /payment/success/123 должен соответствовать /payment/success
    // Сортируем маршруты по длине (от самого длинного к самому короткому),
    // чтобы сначала проверять более специфичные маршруты
    const routes = Object.keys(BACK_ROUTES).sort((a, b) => b.length - a.length);
    
    for (const route of routes) {
      if (pathWithoutQuery.startsWith(route)) {
        return BACK_ROUTES[route];
      }
    }
    
    // Если ничего не найдено, возвращаем главную страницу
    return '/';
  }, []);
  

  // Настройка кнопки "назад"
  useEffect(() => {
    // Если BackButton не поддерживается на этой платформе, выходим
    if (!isBackButtonSupported()) {
      console.log('Telegram WebApp BackButton не поддерживается на этой платформе');
      return;
    }

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
        
        // Отмечаем, что кнопка была настроена
        backButtonSetupRef.current = true;
        
        // Очистка при размонтировании
        return () => {
          try {
            if (isBackButtonSupported()) {
              hideBackButton();
              backButtonSetupRef.current = false;
            }
          } catch (error) {
            console.error('Ошибка при скрытии кнопки "назад":', error);
          }
        };
      } else {
        // Если маршрут "назад" совпадает с текущим, скрываем кнопку "назад"
        hideBackButton();
        backButtonSetupRef.current = false;
      }
    } catch (error) {
      console.error('Ошибка при настройке кнопки "назад":', error);
    }
  }, [currentPath, navigate, showBackButton, hideBackButton, onBackButtonClicked, getBackRoute, isBackButtonSupported]);
}
