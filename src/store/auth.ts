import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TelegramUser } from '@/types/user';

interface AuthState {
  user: TelegramUser | null;
  isAuthenticated: boolean;
  
  // Действия
  setUser: (user: TelegramUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: true 
        });
      },
      
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
