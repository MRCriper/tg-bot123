import React, { useCallback } from 'react';
import styled from 'styled-components';
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

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.$hasError ? 'var(--error)' : 'var(--input-border)'};
  background-color: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? 'var(--error)' : 'var(--accent)'};
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


  // Флаг для отслеживания, был ли уже установлен username
  const usernameSetRef = React.useRef<boolean>(false);

  // При монтировании компонента пытаемся получить данные пользователя из Telegram
  React.useEffect(() => {
    try {
      // Всегда считаем, что мы в Telegram WebApp, чтобы избежать двойных кнопок
      console.log('CheckoutForm - Forcing isTelegramWebApp to true');
      
      // Устанавливаем данные пользователя только при первом рендере
      if (!usernameSetRef.current) {
        const telegramUser = getUserData();
        
        if (telegramUser) {
          // Если есть имя пользователя, устанавливаем его в форму
          if (telegramUser.firstName) {
            const fullName = [telegramUser.firstName, telegramUser.lastName].filter(Boolean).join(' ');
            setValue('name', fullName);
          }
          
          // Если есть username, устанавливаем его в форму только один раз
          if (telegramUser.username) {
            setValue('telegramUsername', `@${telegramUser.username}`);
            usernameSetRef.current = true;
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при получении данных пользователя из Telegram:', error);
    }
  }, [getUserData, setValue]);

  // Обработчик отправки формы
  const onFormSubmit: SubmitHandler<UserData> = useCallback((data) => {
    onSubmit(data);
  }, [onSubmit]);

  // Настраиваем кнопку Telegram
  React.useEffect(() => {
    // Показываем кнопку оплаты в Telegram
    const handleMainButtonClick = () => {
      // Вызываем handleSubmit напрямую, который сам проверит валидность формы
      handleSubmit(onFormSubmit)();
      
      // Добавляем логирование для отладки
      console.log('CheckoutForm - Кнопка "Оплатить заказ" нажата');
      console.log('CheckoutForm - Форма валидна:', isValid);
      console.log('CheckoutForm - Поля формы:', {
        telegramUsername: (document.getElementById('telegramUsername') as HTMLInputElement)?.value
      });
    };

    showMainButton('Оплатить заказ', handleMainButtonClick);
    
    return () => {
      hideMainButton();
    };
  }, [showMainButton, hideMainButton, handleSubmit, onFormSubmit, isValid]);

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
            $hasError={!!errors.telegramUsername}
            {...register('telegramUsername', { 
              required: 'Telegram username обязателен для заполнения',
              pattern: {
                value: /^@?[a-zA-Z0-9_]{5,32}$/,
                message: 'Введите корректный Telegram username (5-32 символа, только буквы, цифры и _)'
              },
              validate: {
                validUsername: (value) => {
                  // Убираем @ если он есть
                  const username = value.replace('@', '');
                  // Проверяем, что имя пользователя соответствует требованиям Telegram
                  return /^[a-zA-Z0-9_]{5,32}$/.test(username) || 
                    'Некорректный Telegram username. Должен содержать от 5 до 32 символов, только буквы, цифры и _';
                }
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
        
        {/* Кнопка от приложения полностью удалена, используется только кнопка от Telegram */}
      </Form>
    </FormContainer>
  );
};

export default CheckoutForm;
