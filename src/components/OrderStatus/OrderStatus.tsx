import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { rocketPayService } from '../../services/rocketPayService';

// Стилизованные компоненты
const StatusContainer = styled.div`
  padding: 16px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatusCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  margin-top: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px var(--shadow);
  width: 100%;
  text-align: center;
`;

const StatusTitle = styled.h2`
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 16px;
`;

const StatusDescription = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 24px;
`;

const StatusIcon = styled.div<{ status: string }>`
  margin: 20px auto;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => 
    props.status === 'success' ? 'var(--success)' : 
    props.status === 'pending' ? 'var(--accent)' : 
    props.status === 'error' ? 'var(--error)' : 'var(--text-secondary)'
  };
  color: white;
  font-size: 40px;
`;

const OrderInfo = styled.div`
  margin: 20px 0;
  padding: 16px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--text-primary);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-weight: 600;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  background-color: var(--accent);
  color: white;
  border-radius: 8px;
  margin-top: 16px;
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

// Получение иконки в зависимости от статуса
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return '✓';
    case 'pending':
      return '⏳';
    case 'error':
      return '✕';
    default:
      return '?';
  }
};

// Получение заголовка статуса
const getStatusTitle = (status: string) => {
  switch (status) {
    case 'success':
      return 'Заказ оплачен';
    case 'pending':
      return 'Ожидание оплаты';
    case 'error':
      return 'Ошибка оплаты';
    default:
      return 'Статус заказа';
  }
};

// Получение описания статуса
const getStatusDescription = (status: string) => {
  switch (status) {
    case 'success':
      return 'Ваш заказ успешно оплачен. Звезды Telegram будут начислены на указанный аккаунт в ближайшее время.';
    case 'pending':
      return 'Мы ожидаем подтверждение оплаты от платежной системы. Звезды будут начислены после подтверждения платежа.';
    case 'error':
      return 'К сожалению, возникла проблема с оплатой. Пожалуйста, попробуйте оплатить снова или свяжитесь с нами для помощи.';
    default:
      return 'Проверка статуса заказа...';
  }
};

// Интерфейс для состояния заказа
interface OrderStatusState {
  status: string;
  isLoading: boolean;
  orderDate: string;
  amountRub: number | null;
  amountTon: number | null;
  tonRate: number | null;
}

// Компонент статуса заказа
const OrderStatus: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showMainButton, hideMainButton } = useTelegram();
  
  // Получение orderId из URL параметров
  const orderId = searchParams.get('orderId');
  
  // Состояния
  const [orderState, setOrderState] = useState<OrderStatusState>({
    status: 'loading',
    isLoading: true,
    orderDate: '',
    amountRub: null,
    amountTon: null,
    tonRate: null
  });
  
  // При монтировании компонента получаем статус заказа
  useEffect(() => {
    const checkStatus = async () => {
      if (!orderId) {
        setOrderState(prev => ({
          ...prev,
          status: 'error',
          isLoading: false
        }));
        return;
      }
      
      try {
        // Получаем статус заказа
        // Примечание: в новой версии API мы используем orderId как payload для поиска инвойса
        const result = await rocketPayService.checkPaymentStatus(orderId);
        
        // Получаем курс TON/RUB для отображения
        const tonRate = await rocketPayService.getTonToRubRate();
        
        // Устанавливаем примерную сумму в рублях для демонстрации (в реальном приложении это должно быть сохранено в БД)
        const amountRub = 1000; // Примерная сумма заказа в рублях
        const amountTon = await rocketPayService.convertRubToTon(amountRub);
        
        let newStatus = 'error';
        if (result.success) {
          if (result.status === 'PAID') {
            newStatus = 'success';
          } else if (result.status === 'PENDING') {
            newStatus = 'pending';
          }
        }
        
        // Обновляем состояние заказа
        setOrderState({
          status: newStatus,
          isLoading: false,
          orderDate: new Date().toLocaleDateString('ru-RU'),
          amountRub,
          amountTon,
          tonRate
        });
      } catch (error) {
        console.error('Ошибка при проверке статуса заказа:', error);
        setOrderState(prev => ({
          ...prev,
          status: 'error',
          isLoading: false,
          orderDate: new Date().toLocaleDateString('ru-RU')
        }));
      }
    };
    
    checkStatus();
    
    // Показываем кнопку Telegram для возврата к покупкам
    showMainButton('Вернуться к покупкам', () => navigate('/'));
    
    return () => {
      hideMainButton();
    };
  }, [orderId, showMainButton, hideMainButton, navigate]);

  // Возврат к каталогу
  const handleBackToShopping = () => {
    navigate('/');
  };

  // Пока загружается, показываем спиннер
  if (orderState.isLoading) {
    return (
      <StatusContainer>
        <StatusCard>
          <StatusTitle>Проверка статуса заказа</StatusTitle>
          <LoadingSpinner />
          <StatusDescription>Загрузка информации о заказе...</StatusDescription>
        </StatusCard>
      </StatusContainer>
    );
  }

  return (
    <StatusContainer>
      <StatusCard>
        <StatusIcon status={orderState.status}>
          {getStatusIcon(orderState.status)}
        </StatusIcon>
        
        <StatusTitle>{getStatusTitle(orderState.status)}</StatusTitle>
        <StatusDescription>{getStatusDescription(orderState.status)}</StatusDescription>
        
        {/* Информация о заказе */}
        {orderId && (
          <OrderInfo>
            <InfoRow>
              <InfoLabel>Номер заказа:</InfoLabel>
              <InfoValue>{orderId}</InfoValue>
            </InfoRow>
            {orderState.orderDate && (
              <InfoRow>
                <InfoLabel>Дата заказа:</InfoLabel>
                <InfoValue>{orderState.orderDate}</InfoValue>
              </InfoRow>
            )}
            <InfoRow>
              <InfoLabel>Статус:</InfoLabel>
              <InfoValue>
                {orderState.status === 'success' ? 'Оплачен' : 
                 orderState.status === 'pending' ? 'В обработке' : 
                 'Ошибка'}
              </InfoValue>
            </InfoRow>
            
            {/* Информация о сумме и конвертации */}
            {orderState.amountRub && (
              <InfoRow>
                <InfoLabel>Сумма:</InfoLabel>
                <InfoValue>{orderState.amountRub.toLocaleString('ru-RU')} ₽</InfoValue>
              </InfoRow>
            )}
            
            {orderState.amountTon && orderState.tonRate && (
              <>
                <InfoRow>
                  <InfoLabel>Сумма в TON:</InfoLabel>
                  <InfoValue>{orderState.amountTon.toFixed(9)} TON</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Курс:</InfoLabel>
                  <InfoValue>1 TON = {orderState.tonRate.toFixed(2)} ₽</InfoValue>
                </InfoRow>
              </>
            )}
          </OrderInfo>
        )}
        
        {/* Кнопка возврата к покупкам */}
        <ActionButton onClick={handleBackToShopping}>
          Вернуться к покупкам
        </ActionButton>
        
        {/* Кнопка повторной оплаты при ошибке */}
        {orderState.status === 'error' && (
          <ActionButton 
            onClick={() => navigate('/checkout')}
            style={{ backgroundColor: 'var(--error)', marginLeft: '8px' }}
          >
            Попробовать снова
          </ActionButton>
        )}
      </StatusCard>
    </StatusContainer>
  );
};

export default OrderStatus;
