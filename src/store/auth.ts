import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  telegramId: string | null; // null для обычных пользователей (логин/пароль)
  username: string; // Обязательный логин для всех пользователей
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Действия
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  
  // API helpers
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => {
        set({ 
          user, 
          token,
          isAuthenticated: true 
        });
      },
      
      logout: () => {
        // Вызываем API logout
        const token = get().token;
        if (token) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).catch(console.error);
        }
        
        set({ 
          user: null,
          token: null, 
          isAuthenticated: false 
        });
      },
      
      // Helper для запросов с авторизацией
      fetchWithAuth: async (url: string, options: RequestInit = {}) => {
        const token = get().token;
        
        if (!token) {
          throw new Error('No auth token');
        }
        
        const headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        
        const response = await fetch(url, {
          ...options,
          headers,
        });
        
        // Если 401 - выходим
        if (response.status === 401) {
          get().logout();
        }
        
        return response;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
