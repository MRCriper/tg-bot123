import { useEffect, useCallback, useRef } from 'react';
import WebApp from '@twa-dev/sdk';

// Хук для работы с Telegram WebApp API
export function useTelegram() {
  // Ссылка на текущий callback для кнопки
  const mainButtonCallbackRef = useRef<(() => void) | null>(null);
  
  // Функция для закрытия Telegram WebApp
  const close = useCallback(() => {
    WebApp.close();
  }, []);

  // Функция для отображения MainButton
  const showMainButton = useCallback((text: string, callback: () => void) => {
    WebApp.MainButton.setText(text);
    
    // Сохраняем ссылку на callback
    mainButtonCallbackRef.current = callback;
    
    WebApp.MainButton.onClick(callback);
    WebApp.MainButton.show();
  }, []);

  // Функция для скрытия MainButton
  const hideMainButton = useCallback(() => {
    WebApp.MainButton.hide();
    
    // Если у нас есть сохраненный callback, передаем его в offClick
    if (mainButtonCallbackRef.current) {
      WebApp.MainButton.offClick(mainButtonCallbackRef.current);
      mainButtonCallbackRef.current = null;
    }
  }, []);

  // Функция для установки цвета MainButton
  const setMainButtonColor = useCallback((color: string, textColor: string) => {
    WebApp.MainButton.setParams({
      color,
      text_color: textColor,
    });
  }, []);

  // Функция для отображения BackButton
  const showBackButton = useCallback(() => {
    WebApp.BackButton.show();
  }, []);

  // Функция для скрытия BackButton
  const hideBackButton = useCallback(() => {
    WebApp.BackButton.hide();
  }, []);

  // Функция для настройки BackButton
  const onBackButtonClicked = useCallback((callback: () => void) => {
    WebApp.BackButton.onClick(callback);
  }, []);

  // Функция для установки темы приложения (светлая/темная)
  const setThemeParams = useCallback(() => {
    const colorScheme = WebApp.colorScheme;
    document.documentElement.setAttribute('data-theme', colorScheme);
    return colorScheme;
  }, []);

  // Функция для получения user data из Telegram
  const getUserData = useCallback(() => {
    const user = WebApp.initDataUnsafe?.user;
    return {
      id: user?.id,
      firstName: user?.first_name,
      lastName: user?.last_name,
      username: user?.username,
    };
  }, []);

  // Инициализация WebApp при монтировании компонента
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    setThemeParams();

    // Обработчик изменения темы
    WebApp.onEvent('themeChanged', setThemeParams);

    // Очистка при размонтировании
    return () => {
      WebApp.offEvent('themeChanged', setThemeParams);
    };
  }, [setThemeParams]);

  return {
    close,
    showMainButton,
    hideMainButton,
    setMainButtonColor,
    showBackButton,
    hideBackButton,
    onBackButtonClicked,
    setThemeParams,
    getUserData,
    colorScheme: WebApp.colorScheme,
    themeParams: WebApp.themeParams,
    viewportHeight: WebApp.viewportHeight,
    viewportStableHeight: WebApp.viewportStableHeight,
  };
}
