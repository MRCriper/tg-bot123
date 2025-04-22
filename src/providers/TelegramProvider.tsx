import React, { createContext, useEffect, useState, ReactNode } from 'react';
import WebApp from '@twa-dev/sdk';

// Создаем контекст для Telegram WebApp
interface TelegramContextType {
  webApp: typeof WebApp | null;
  isReady: boolean;
  error: Error | null;
}

export const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  isReady: false,
  error: null
});

interface TelegramProviderProps {
  children: ReactNode;
}

// Провайдер для Telegram WebApp
export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Инициализация Telegram WebApp
  useEffect(() => {
    try {
      // Проверяем, доступен ли WebApp
      if (WebApp) {
        // Инициализируем WebApp
        WebApp.ready();
        WebApp.expand();
        
        // Устанавливаем тему
        const colorScheme = WebApp.colorScheme;
        document.documentElement.setAttribute('data-theme', colorScheme);
        
        // Обработчик изменения темы
        const handleThemeChange = () => {
          const newColorScheme = WebApp.colorScheme;
          document.documentElement.setAttribute('data-theme', newColorScheme);
        };
        
        WebApp.onEvent('themeChanged', handleThemeChange);
        
        // Устанавливаем флаг готовности
        setIsReady(true);
        
        // Очистка при размонтировании
        return () => {
          WebApp.offEvent('themeChanged', handleThemeChange);
        };
      } else {
        // Если WebApp недоступен, устанавливаем ошибку
        setError(new Error('Telegram WebApp is not available'));
      }
    } catch (err) {
      // Обрабатываем ошибки инициализации
      console.error('Error initializing Telegram WebApp:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, []);
  
  // Значение контекста
  const contextValue: TelegramContextType = {
    webApp: WebApp || null,
    isReady,
    error
  };
  
  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
};
