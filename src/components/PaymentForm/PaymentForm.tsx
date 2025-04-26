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


const ErrorMessage = styled.div`
  color: var(--error);
  background-color: var(--error-light, rgba(255, 59, 48, 0.1));
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RetryButton = styled.button`
  background-color: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  margin-top: 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--accent-dark, #0056b3);
  }
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
  const { showMainButton, hideMainButton, getUserData, openLink, isReady } = useTelegram();
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
      // Вызываем getUserData() для проверки доступности Telegram API
      getUserData();
      console.log('PaymentForm - Telegram API доступен');
    } catch (error) {
      console.error('Ошибка при получении данных пользователя из Telegram:', error);
    }
  }, [getUserData]);

  // Удаляем автоматическое перенаправление при получении URL оплаты
  // Теперь перенаправление будет происходить только при нажатии на кнопку "Оплатить"

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
            <div>Произошла ошибка: {paymentError}</div>
            {paymentError.includes('Network Error') || paymentError.includes('CORS') ? (
              <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                Возможно, проблема с подключением к платежной системе. Проверьте соединение с интернетом и попробуйте снова.
              </div>
            ) : null}
            <RetryButton onClick={() => window.location.reload()}>
              Попробовать снова
            </RetryButton>
          </ErrorMessage>
        )}
      </PaymentCard>
    </PaymentContainer>
  );
};

export default PaymentForm;
