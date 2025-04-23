import React, { createContext, useEffect, useState, ReactNode } from 'react';
import WebApp from '@twa-dev/sdk';

// Создаем контекст для Telegram WebApp
interface TelegramContextType {
  webApp: typeof WebApp | null;
  isReady: boolean;
  error: Error | null;
  platform: 'web' | 'ios' | 'android' | 'unknown';
}

export const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  isReady: false,
  error: null,
  platform: 'unknown'
});

interface TelegramProviderProps {
  children: ReactNode;
}

// Функция для определения платформы Telegram
const detectTelegramPlatform = (): 'web' | 'ios' | 'android' | 'unknown' => {
  try {
    // Проверяем, доступен ли WebApp
    if (!WebApp) {
      return 'unknown';
    }

    // Проверяем User-Agent для определения платформы
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return 'android';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      return 'ios';
    } else {
      return 'web';
    }
  } catch (err) {
    console.error('Error detecting Telegram platform:', err);
    return 'unknown';
  }
};

// Провайдер для Telegram WebApp
export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android' | 'unknown'>('unknown');
  
  // Инициализация Telegram WebApp
  useEffect(() => {
    try {
      // Определяем платформу
      const detectedPlatform = detectTelegramPlatform();
      setPlatform(detectedPlatform);
      console.log('Detected Telegram platform:', detectedPlatform);
      
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
          try {
            WebApp.offEvent('themeChanged', handleThemeChange);
          } catch (cleanupErr) {
            console.error('Error during cleanup:', cleanupErr);
          }
        };
      } else {
        // Если WebApp недоступен, устанавливаем ошибку
        console.warn('Telegram WebApp is not available');
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
    error,
    platform
  };
  
  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
};
