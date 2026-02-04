// Данные пользователя Telegram
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Состояние авторизации
export interface AuthState {
  user: TelegramUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
