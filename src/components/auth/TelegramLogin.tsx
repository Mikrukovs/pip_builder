'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { TelegramUser } from '@/types/user';

interface TelegramLoginProps {
  botName: string; // Имя вашего Telegram бота (без @)
  onAuth?: (user: TelegramUser) => void;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: TelegramUser) => void;
    };
  }
}

export function TelegramLogin({ botName, onAuth }: TelegramLoginProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setUser = useAuthStore((state) => state.setUser);

  // Если botName не указан, показываем предупреждение
  if (!botName) {
    return (
      <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
        <p className="font-medium">Telegram авторизация не настроена</p>
        <p className="text-yellow-600 mt-0.5">См. TELEGRAM_SETUP.md</p>
      </div>
    );
  }

  useEffect(() => {
    // Функция callback для Telegram Widget
    const handleTelegramAuth = async (user: TelegramUser) => {
      try {
        // Проверяем, что данные не устарели (не старше 24 часов)
        const authDate = user.auth_date;
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = currentTime - authDate;
        
        if (timeDiff > 86400) { // 24 часа
          throw new Error('Authentication data expired');
        }

        // Сохраняем пользователя в store
        // Примечание: В production окружении рекомендуется верифицировать hash на сервере
        // Для этого проекта (static export) делаем упрощенную авторизацию
        setUser(user);
        onAuth?.(user);
      } catch (error) {
        console.error('Telegram authentication error:', error);
        alert('Ошибка авторизации. Попробуйте снова.');
      }
    };

    // Делаем функцию доступной глобально для Telegram Widget
    (window as any).onTelegramAuth = handleTelegramAuth;

    // Загружаем скрипт Telegram Widget
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      
      containerRef.current.appendChild(script);
    }

    return () => {
      // Очищаем глобальную функцию при размонтировании
      delete (window as any).onTelegramAuth;
    };
  }, [botName, setUser, onAuth]);

  return (
    <div 
      ref={containerRef}
      className="flex justify-center items-center"
    />
  );
}
