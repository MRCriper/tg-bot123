// Типы данных для всего приложения

// Тип для продукта (звезд в Telegram)
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  stars: number; // Количество звезд
}

// Тип для элемента корзины
export interface CartItem {
  product: Product;
  quantity: number;
}

// Тип для корзины
export interface Cart {
  items: CartItem[];
  totalPrice: number;
}

// Тип для пользовательских данных
export interface UserData {
  telegramUsername: string; // Telegram юзернейм для перевода звезд
  name?: string; // Опциональные поля оставлены для совместимости с существующим кодом
  phone?: string;
  email?: string;
}

// Тип для заказа
export interface Order {
  id: string;
  items: CartItem[];
  totalPrice: number;
  userData: UserData;
  status: OrderStatus;
  createdAt: string;
}

// Статусы заказа
export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED"
}

// Тип для платежных данных Paysto
export interface PaystoPaymentData {
  orderId: string;
  amount: number;
  description: string;
  customerEmail: string;
  redirectUrl: string;
}

// Тип для ответа от Paysto
export interface PaystoResponse {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

// Тип для темы приложения
export enum Theme {
  LIGHT = "light",
  DARK = "dark"
}
