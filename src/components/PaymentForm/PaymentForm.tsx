  import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { rocketPayService } from '../../services/rocketPayService';

// Стилизованные компоненты
const PaymentContainer = styled.div`
  padding: 16px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ConversionInfo = styled.div`
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  width: 100%;
  text-align: center;
`;

const PaymentCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  margin-top: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px var(--shadow);
  width: 100%;
  text-align: center;
`;

const PaymentTitle = styled.h2`
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 16px;
`;

const PaymentDescription = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 24px;
`;

const PaymentAmount = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  margin: 20px 0;
`;

const PaymentButton = styled.button`
  width: 100%;
  padding: 14px;
  font-size: 1.1rem;
  font-weight: 600;
  background-color: var(--accent);
  color: white;
  border-radius: 10px;
  margin-top: 16px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error);
  background-color: var(--error-light, rgba(255, 59, 48, 0.1));
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  margin: 20px 0;
  border: 4px solid var(--bg-secondary);
  border-top: 4px solid var(--accent);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Иконка безопасности для отображения в форме оплаты
const SecurityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// Пропсы для компонента PaymentForm
interface PaymentFormProps {
  orderId: string | null;
  amount: number;
  isLoading: boolean;
  paymentUrl: string | null;
  paymentError: string | null;
  onRedirectToPayment: () => void;
  onCancel: () => void;
}

// Интерфейс для состояния конвертации
interface ConversionState {
  tonAmount: number | null;
  tonRate: number | null;
  isLoading: boolean;
}

// Компонент формы платежа
const PaymentForm: React.FC<PaymentFormProps> = ({
  orderId,
  amount,
  isLoading,
  paymentUrl,
  paymentError,
  onRedirectToPayment,
  onCancel
}) => {
  const navigate = useNavigate();
  const { showMainButton, hideMainButton, getUserData } = useTelegram();
  const [isTelegramWebApp, setIsTelegramWebApp] = useState<boolean>(false);
  const [conversion, setConversion] = useState<ConversionState>({
    tonAmount: null,
    tonRate: null,
    isLoading: true
  });

  // Получаем информацию о конвертации при загрузке компонента
  useEffect(() => {
    const fetchConversionInfo = async () => {
      try {
        const tonRate = await rocketPayService.getTonToRubRate();
        const tonAmount = await rocketPayService.convertRubToTon(amount);
        
        setConversion({
          tonAmount,
          tonRate,
          isLoading: false
        });
      } catch (error) {
        console.error('Ошибка при получении информации о конвертации:', error);
        setConversion({
          tonAmount: null,
          tonRate: null,
          isLoading: false
        });
      }
    };

    fetchConversionInfo();
  }, [amount]);

  // Проверяем, запущено ли приложение в Telegram WebApp
  useEffect(() => {
    try {
      const telegramUser = getUserData();
      // Всегда считаем, что мы в Telegram WebApp, чтобы избежать двойных кнопок
      setIsTelegramWebApp(true);
      console.log('PaymentForm - Forcing isTelegramWebApp to true');
    } catch (error) {
      console.error('Ошибка при получении данных пользователя из Telegram:', error);
    }
  }, [getUserData]);

  // При наличии URL оплаты, перенаправляем пользователя
  useEffect(() => {
    if (paymentUrl) {
      console.log('PaymentForm - Получен URL для оплаты:', paymentUrl);
      
      // Увеличиваем задержку перед перенаправлением для стабильности
      const redirectTimer = setTimeout(() => {
        try {
          // Проверяем и нормализуем URL
          let finalUrl = paymentUrl;
          
          // Проверяем, что URL начинается с https:// или http://
          if (paymentUrl.startsWith('https://') || paymentUrl.startsWith('http://')) {
            // URL уже в правильном формате
            console.log('PaymentForm - URL в правильном формате, перенаправление на:', finalUrl);
          } else if (paymentUrl.startsWith('tg://')) {
            // Обработка специальных Telegram URL
            console.log('PaymentForm - Обнаружен Telegram URL:', finalUrl);
          } else {
            // Если URL не начинается с https:// или http://, добавляем https://
            finalUrl = `https://${paymentUrl}`;
            console.log('PaymentForm - Добавление https:// к URL, итоговый URL:', finalUrl);
          }
          
          // Используем window.open вместо window.location.href для более надежного перенаправления
          const newWindow = window.open(finalUrl, '_self');
          
          // Если window.open не сработал, пробуем альтернативный метод
          if (!newWindow) {
            console.log('PaymentForm - window.open не сработал, пробуем location.href');
            window.location.href = finalUrl;
            
            // Дополнительная проверка через таймаут
            setTimeout(() => {
              if (document.location.href !== finalUrl) {
                console.log('PaymentForm - Перенаправление через location.href не сработало, пробуем location.replace');
                window.location.replace(finalUrl);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('PaymentForm - Ошибка при перенаправлении на оплату:', error);
          
          // В случае ошибки перенаправляем на страницу статуса заказа
          console.log('PaymentForm - Перенаправление на страницу статуса заказа:', `/payment/success?orderId=${orderId}`);
          navigate(`/payment/success?orderId=${orderId}`);
        }
      }, 1000); // Увеличиваем задержку до 1000 мс для большей стабильности
      
      // Очистка таймера при размонтировании компонента
      return () => clearTimeout(redirectTimer);
    }
  }, [paymentUrl, navigate, orderId]);

  // Настраиваем кнопку Telegram
  useEffect(() => {
    if (!isLoading) {
      showMainButton('Оплатить', onRedirectToPayment);
    } else {
      hideMainButton();
    }
    
    return () => {
      hideMainButton();
    };
  }, [isLoading, showMainButton, hideMainButton, onRedirectToPayment]);

  // Форматирование суммы
  const formatAmount = (amount: number): string => {
    return `${amount.toLocaleString('ru-RU')} ₽`;
  };

  return (
    <PaymentContainer>
      <PaymentCard>
        <SecurityIcon />
        <PaymentTitle>Оплата заказа</PaymentTitle>
        
        <PaymentDescription>
          Заказ №{orderId}
        </PaymentDescription>
        
        <PaymentAmount>
          {formatAmount(amount)}
        </PaymentAmount>
        
        {!conversion.isLoading && conversion.tonAmount && conversion.tonRate && (
          <ConversionInfo>
            ≈ {conversion.tonAmount.toFixed(9)} TON
            <br />
            <small>Курс: 1 TON = {conversion.tonRate.toFixed(2)} ₽</small>
          </ConversionInfo>
        )}
        
        {isLoading ? (
          <>
            <LoadingSpinner />
            <PaymentDescription>Подготовка платежа...</PaymentDescription>
          </>
        ) : (
          <>
            <PaymentDescription>
              Для оплаты вы будете перенаправлены на защищенную платежную страницу Rocket Pay.
            </PaymentDescription>
            
            {/* Кнопки от приложения полностью удалены, используется только кнопка от Telegram */}
          </>
        )}
        
        {paymentError && (
          <ErrorMessage>
            Произошла ошибка: {paymentError}
          </ErrorMessage>
        )}
      </PaymentCard>
    </PaymentContainer>
  );
};

export default PaymentForm;
