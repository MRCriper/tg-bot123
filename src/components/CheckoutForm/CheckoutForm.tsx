import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTelegram } from '../../hooks/useTelegram';
import { Cart, UserData } from '../../types';

// Стилизованные компоненты
const FormContainer = styled.div`
  padding: 16px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.hasError ? 'var(--error)' : 'var(--input-border)'};
  background-color: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? 'var(--error)' : 'var(--accent)'};
  }
`;

const ErrorMessage = styled.span`
  color: var(--error);
  font-size: 0.8rem;
  margin-top: 4px;
`;

const OrderSummary = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px var(--shadow);
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 1rem;
  color: var(--text-primary);
`;

const TotalRow = styled(SummaryRow)`
  font-weight: 700;
  font-size: 1.2rem;
  margin-top: 16px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
`;

const SubmitButton = styled.button`
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

// Пропсы для компонента CheckoutForm
interface CheckoutFormProps {
  cart: Cart;
  onSubmit: (userData: UserData) => void;
  isLoading?: boolean;
}

// Компонент формы оформления заказа
const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  cart, 
  onSubmit, 
  isLoading = false 
}) => {
  const navigate = useNavigate();
  const { getUserData, showMainButton, hideMainButton } = useTelegram();
  
  // Инициализация react-hook-form
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid },
    setValue
  } = useForm<UserData>({
    mode: 'onChange',
    defaultValues: {
      telegramUsername: ''
    }
  });

  // При монтировании компонента пытаемся получить данные пользователя из Telegram
  React.useEffect(() => {
    try {
      const telegramUser = getUserData();
      if (telegramUser) {
        // Если есть имя пользователя, устанавливаем его в форму
        if (telegramUser.firstName) {
          const fullName = [telegramUser.firstName, telegramUser.lastName].filter(Boolean).join(' ');
          setValue('name', fullName);
        }
      }
    } catch (error) {
      console.error('Ошибка при получении данных пользователя из Telegram:', error);
    }
    
    // Показываем кнопку оплаты в Telegram
    showMainButton('Оплатить заказ', () => {
      if (isValid) {
        handleSubmit(onFormSubmit)();
      }
    });
    
    return () => {
      hideMainButton();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getUserData, showMainButton, hideMainButton, isValid]);

  // Обработчик отправки формы
  const onFormSubmit: SubmitHandler<UserData> = (data) => {
    onSubmit(data);
  };

  // Форматирование цены
  const formatPrice = (price: number): string => {
    return `${price.toLocaleString('ru-RU')} ₽`;
  };

  // Расчет количества товаров
  const itemsCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  
  // Расчет общего количества звезд
  const totalStars = cart.items.reduce((acc, item) => acc + (item.product.stars * item.quantity), 0);

  return (
    <FormContainer>
      <Form onSubmit={handleSubmit(onFormSubmit)}>
        
        <FormGroup>
          <Label htmlFor="telegramUsername">Ваш Telegram-аккаунт</Label>
          <Input 
            id="telegramUsername"
            type="text" 
            placeholder="@username"
            hasError={!!errors.telegramUsername}
            {...register('telegramUsername', { 
              required: 'Telegram username обязателен для заполнения',
              pattern: {
                value: /^@?[a-zA-Z0-9_]{5,32}$/,
                message: 'Введите корректный Telegram username (5-32 символа)'
              }
            })}
          />
          {errors.telegramUsername && <ErrorMessage>{errors.telegramUsername.message}</ErrorMessage>}
        </FormGroup>
        
        <OrderSummary>
          <SummaryRow>
            <span>Товары ({itemsCount})</span>
            <span>{formatPrice(cart.totalPrice)}</span>
          </SummaryRow>
          <SummaryRow>
            <span>Количество звезд</span>
            <span>{totalStars} ⭐</span>
          </SummaryRow>
          <TotalRow>
            <span>Итого к оплате</span>
            <span>{formatPrice(cart.totalPrice)}</span>
          </TotalRow>
        </OrderSummary>
        
        <SubmitButton type="submit" disabled={!isValid || isLoading}>
          {isLoading ? 'Обработка заказа...' : 'Оплатить заказ'}
        </SubmitButton>
      </Form>
    </FormContainer>
  );
};

export default CheckoutForm;
