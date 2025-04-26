import { useContext, useCallback, useRef } from 'react';
import { TelegramContext } from '../providers/TelegramProvider';

// Хук для работы с Telegram WebApp API
export function useTelegram() {
  // Получаем контекст Telegram WebApp
  const { webApp, isReady, error, platform } = useContext(TelegramContext);
  
  // Ссылки на текущие callbacks для кнопок
  const mainButtonCallbackRef = useRef<(() => void) | null>(null);
  const backButtonCallbackRef = useRef<(() => void) | null>(null);
  
  // Функция для закрытия Telegram WebApp
  const close = useCallback(() => {
    try {
      if (webApp && isReady) {
        webApp.close();
      }
    } catch (err) {
      console.error('Error closing Telegram WebApp:', err);
    }
  }, [webApp, isReady]);

  // Функция для отображения MainButton
  const showMainButton = useCallback((text: string, callback: () => void) => {
    try {
      if (webApp && isReady) {
        webApp.MainButton.setText(text);
        
        // Сохраняем ссылку на callback
        mainButtonCallbackRef.current = callback;
        
        webApp.MainButton.onClick(callback);
        webApp.MainButton.show();
      }
    } catch (err) {
      console.error('Error showing MainButton:', err);
    }
  }, [webApp, isReady]);

  // Функция для скрытия MainButton
  const hideMainButton = useCallback(() => {
    try {
      if (webApp && isReady) {
        webApp.MainButton.hide();
        
        // Если у нас есть сохраненный callback, передаем его в offClick
        if (mainButtonCallbackRef.current) {
          webApp.MainButton.offClick(mainButtonCallbackRef.current);
          mainButtonCallbackRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error hiding MainButton:', err);
    }
  }, [webApp, isReady]);

  // Функция для установки цвета MainButton
  const setMainButtonColor = useCallback((color: string, textColor: string) => {
    try {
      if (webApp && isReady) {
        webApp.MainButton.setParams({
          color,
          text_color: textColor,
        });
      }
    } catch (err) {
      console.error('Error setting MainButton color:', err);
    }
  }, [webApp, isReady]);

  // Функция для проверки поддержки BackButton
  const isBackButtonSupported = useCallback(() => {
    try {
      // Проверяем, доступен ли WebApp и его BackButton
      const hasBackButton = webApp && isReady && typeof webApp.BackButton !== 'undefined';
      
      // На iOS и Android BackButton поддерживается всегда, если WebApp доступен
      // На веб-платформе нужна дополнительная проверка
      if (platform === 'ios' || platform === 'android') {
        return webApp && isReady;
      }
      
      return hasBackButton;
    } catch (err) {
      console.error('Error checking BackButton support:', err);
      return false;
    }
  }, [webApp, isReady, platform]);

  // Функция для отображения BackButton
  const showBackButton = useCallback(() => {
    try {
      if (webApp && isReady && isBackButtonSupported()) {
        webApp.BackButton.show();
      }
    } catch (err) {
      console.error('Error showing BackButton:', err);
    }
  }, [webApp, isReady, isBackButtonSupported]);

  // Функция для скрытия BackButton
  const hideBackButton = useCallback(() => {
    try {
      if (webApp && isReady && isBackButtonSupported()) {
        webApp.BackButton.hide();
      }
    } catch (err) {
      console.error('Error hiding BackButton:', err);
    }
  }, [webApp, isReady, isBackButtonSupported]);

  // Функция для настройки BackButton
  const onBackButtonClicked = useCallback((callback: () => void) => {
    try {
      if (webApp && isReady && isBackButtonSupported()) {
        // Сначала удаляем все предыдущие обработчики
        if (backButtonCallbackRef.current) {
          webApp.BackButton.offClick(backButtonCallbackRef.current);
        }
        
        // Сохраняем ссылку на новый callback
        backButtonCallbackRef.current = callback;
        
        // Затем устанавливаем новый обработчик
        webApp.BackButton.onClick(callback);
      }
    } catch (err) {
      console.error('Error setting BackButton callback:', err);
    }
  }, [webApp, isReady, isBackButtonSupported]);

  // Функция для установки темы приложения (светлая/темная)
  const setThemeParams = useCallback(() => {
    try {
      if (webApp && isReady) {
        const colorScheme = webApp.colorScheme;
        document.documentElement.setAttribute('data-theme', colorScheme);
        return colorScheme;
      }
      return 'light'; // Возвращаем значение по умолчанию
    } catch (err) {
      console.error('Error setting theme params:', err);
      return 'light'; // Возвращаем значение по умолчанию в случае ошибки
    }
  }, [webApp, isReady]);

  // Функция для получения user data из Telegram
  const getUserData = useCallback(() => {
    try {
      if (webApp && isReady) {
        console.log('WebApp.initDataUnsafe:', webApp.initDataUnsafe);
        const user = webApp.initDataUnsafe?.user;
        console.log('WebApp.initDataUnsafe.user:', user);
        
        // Проверяем, запущено ли приложение в Telegram WebApp
        const isTelegramWebApp = !!webApp.initData;
        console.log('isTelegramWebApp (based on WebApp.initData):', isTelegramWebApp);
        
        return {
          id: user?.id,
          firstName: user?.first_name,
          lastName: user?.last_name,
          username: user?.username,
          isTelegramWebApp: isTelegramWebApp
        };
      }
      
      // Возвращаем данные по умолчанию, если WebApp недоступен
      return {
        id: undefined,
        firstName: undefined,
        lastName: undefined,
        username: undefined,
        isTelegramWebApp: false
      };
    } catch (err) {
      console.error('Error getting user data:', err);
      // Возвращаем данные по умолчанию в случае ошибки
      return {
        id: undefined,
        firstName: undefined,
        lastName: undefined,
        username: undefined,
        isTelegramWebApp: false
      };
    }
  }, [webApp, isReady]);

  // Функция для открытия внешних ссылок
  const openLink = useCallback((url: string) => {
    try {
      console.log('Попытка открытия внешней ссылки:', url);
      
      // Проверяем и нормализуем URL
      let finalUrl = url;
      
      // Проверяем, что URL начинается с https:// или http://
      if (!url.startsWith('https://') && !url.startsWith('http://') && !url.startsWith('tg://')) {
        // Если URL не начинается с https:// или http://, добавляем https://
        finalUrl = `https://${url}`;
        console.log('Добавление https:// к URL, итоговый URL:', finalUrl);
      }
      
      // Проверяем, является ли URL внешним (не внутренним маршрутом приложения)
      const isExternalUrl = (urlToCheck: string) => {
        // Проверяем, содержит ли URL домен (например, "example.com")
        return urlToCheck.includes('://') && !urlToCheck.startsWith('http://localhost') && !urlToCheck.startsWith('https://localhost');
      };
      
      // Проверяем, является ли URL платежным
      const isPaymentUrl = (urlToCheck: string) => {
        return urlToCheck.includes('pay.xrocket.tg') || 
               urlToCheck.includes('xrocket.tg') || 
               urlToCheck.includes('ton-rocket.com');
      };
      
      // Если это внутренний URL приложения, используем навигацию React Router
      if (!isExternalUrl(finalUrl) && (finalUrl.includes('/payment') || finalUrl.includes('/checkout'))) {
        console.log('Обнаружен внутренний URL приложения, используем React Router');
        // Для внутренних URL используем window.location.href
        window.location.href = finalUrl;
        return true;
      }
      
      // Проверяем, доступен ли Telegram WebApp API
      if (webApp && isReady) {
        console.log('Открытие внешней ссылки через Telegram WebApp:', finalUrl);
        
        // Для платежных URL используем особый подход
        if (isPaymentUrl(finalUrl)) {
          console.log('Обнаружен платежный URL, используем специальный подход для открытия');
          
          try {
            // Для платежных URL в Telegram используем webApp.openLink
            webApp.openLink(finalUrl);
            console.log('Платежный URL успешно открыт через Telegram WebApp.openLink');
            return true;
          } catch (webAppError) {
            console.error('Ошибка при открытии платежного URL через Telegram WebApp:', webAppError);
            
            // Если не удалось открыть через Telegram WebApp, пробуем через window.open
            try {
              const newWindow = window.open(finalUrl, '_blank');
              
              if (newWindow && !newWindow.closed && typeof newWindow.closed !== 'undefined') {
                console.log('Платежный URL успешно открыт через window.open');
                return true;
              } else {
                console.log('Не удалось открыть платежный URL через window.open, пробуем через location.href');
                window.location.href = finalUrl;
                return true;
              }
            } catch (windowError) {
              console.error('Ошибка при открытии платежного URL через window.open:', windowError);
              window.location.href = finalUrl;
              return true;
            }
          }
        }
        
        // Для обычных внешних URL
        try {
          webApp.openLink(finalUrl);
          console.log('Ссылка успешно открыта через Telegram WebApp');
          return true;
        } catch (webAppError) {
          console.error('Ошибка при открытии ссылки через Telegram WebApp:', webAppError);
          
          // Если не удалось открыть через Telegram WebApp, пробуем через window.open
          try {
            const newWindow = window.open(finalUrl, '_blank');
            
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
              console.log('Не удалось открыть ссылку через window.open, пробуем через location.href');
              window.location.href = finalUrl;
            }
            
            return true;
          } catch (windowError) {
            console.error('Ошибка при открытии ссылки через window.open:', windowError);
            window.location.href = finalUrl;
            return true;
          }
        }
      } else {
        console.log('Telegram WebApp недоступен, открываем ссылку через window.open');
        
        // Пробуем открыть ссылку через window.open
        try {
          const newWindow = window.open(finalUrl, '_blank');
          
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.log('Не удалось открыть ссылку через window.open, пробуем через location.href');
            window.location.href = finalUrl;
          }
          
          return true;
        } catch (windowError) {
          console.error('Ошибка при открытии ссылки через window.open:', windowError);
          window.location.href = finalUrl;
          return true;
        }
      }
    } catch (err) {
      console.error('Ошибка при открытии ссылки:', err);
      
      // В случае ошибки пробуем открыть ссылку через window.location.href
      try {
        console.log('Пробуем открыть ссылку через window.location.href после ошибки');
        window.location.href = url;
        return true;
      } catch (locationError) {
        console.error('Не удалось открыть ссылку даже через window.location.href:', locationError);
        return false;
      }
    }
  }, [webApp, isReady]);

  return {
    close,
    showMainButton,
    hideMainButton,
    setMainButtonColor,
    showBackButton,
    hideBackButton,
    onBackButtonClicked,
    isBackButtonSupported,
    setThemeParams,
    getUserData,
    openLink,
    colorScheme: webApp?.colorScheme || 'light',
    themeParams: webApp?.themeParams || {},
    viewportHeight: webApp?.viewportHeight || window.innerHeight,
    viewportStableHeight: webApp?.viewportStableHeight || window.innerHeight,
    isReady,
    error,
    platform
  };
}
