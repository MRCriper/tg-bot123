import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

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
      {children}
    </QueryClientProvider>
  );
};
