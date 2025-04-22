import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { TelegramProvider } from './TelegramProvider';

// Создаем клиент для react-query
const queryClient = new QueryClient();

// Провайдер для обертывания всего приложения
interface AppProvidersProps {
  children: ReactNode;
}

// Компонент, оборачивающий приложение в необходимые провайдеры
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        {children}
      </TelegramProvider>
    </QueryClientProvider>
  );
};
