  import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
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

const ButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
  justify-content: center;
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
  // Удаляем неиспользуемую переменную navigate
  const { showMainButton, hideMainButton, getUserData } = useTelegram();
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
              Для оплаты вы будете перенаправлены на защищенную платежную страницу Rocket Pay. Для оплаты с помощью карты пополните свой xrocket-кошелёк на нужную сумму ton.
            </PaymentDescription>
            
            {/* Кнопки от приложения полностью удалены, используется только кнопка от Telegram */}
          </>
        )}
        
        {paymentError && (
          <ErrorMessage>
            <div>Произошла ошибка: {paymentError}</div>
            
            {/* Расширенные инструкции в зависимости от типа ошибки */}
            {paymentError.includes('Network Error') || paymentError.includes('сети') || paymentError.includes('соединение') || paymentError.includes('интернет') ? (
              <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                <p>Возможно, проблема с подключением к платежной системе. Проверьте соединение с интернетом и попробуйте снова.</p>
                <p style={{ marginTop: '4px' }}>Рекомендации:</p>
                <ul style={{ marginTop: '4px', paddingLeft: '20px', textAlign: 'left' }}>
                  <li>Убедитесь, что у вас стабильное интернет-соединение</li>
                  <li>Попробуйте переключиться с Wi-Fi на мобильный интернет (или наоборот)</li>
                  <li>Перезапустите приложение Telegram</li>
                  <li>Проверьте, не блокирует ли ваш провайдер или VPN доступ к платежной системе</li>
                  <li>Отключите VPN или прокси, если они используются</li>
                  <li>Если проблема сохраняется, попробуйте позже</li>
                </ul>
                <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Техническая информация:</p>
                <p style={{ fontSize: '0.8rem' }}>
                  Ошибка возникает при попытке соединения с сервером платежной системы XRocket. 
                  Система автоматически выполнила несколько попыток подключения, но все они не удались.
                </p>
              </div>
            ) : paymentError.includes('недоступен') || paymentError.includes('сервер') ? (
              <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                <p>Сервер платежной системы временно недоступен. Пожалуйста, попробуйте позже или выберите другой способ оплаты.</p>
                <p style={{ marginTop: '4px' }}>Рекомендации:</p>
                <ul style={{ marginTop: '4px', paddingLeft: '20px', textAlign: 'left' }}>
                  <li>Подождите несколько минут и попробуйте снова</li>
                  <li>Проверьте статус платежной системы на официальном сайте</li>
                  <li>Если проблема сохраняется, свяжитесь с поддержкой</li>
                </ul>
              </div>
            ) : paymentError.includes('таймаут') || paymentError.includes('timeout') || paymentError.includes('время') ? (
              <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                <p>Превышено время ожидания ответа от платежной системы. Пожалуйста, попробуйте снова.</p>
                <p style={{ marginTop: '4px' }}>Рекомендации:</p>
                <ul style={{ marginTop: '4px', paddingLeft: '20px', textAlign: 'left' }}>
                  <li>Проверьте скорость вашего интернет-соединения</li>
                  <li>Попробуйте переключиться на более стабильное соединение</li>
                  <li>Подождите несколько минут и попробуйте снова</li>
                </ul>
              </div>
            ) : null}
            
            <ButtonsContainer>
              <RetryButton onClick={() => window.location.reload()}>
                Попробовать снова
              </RetryButton>
            </ButtonsContainer>
          </ErrorMessage>
        )}
      </PaymentCard>
    </PaymentContainer>
  );
};

export default PaymentForm;
