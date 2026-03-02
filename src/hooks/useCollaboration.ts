import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';

interface CollaborationUser {
  id: number;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  username: string;
}

interface UseCollaborationOptions {
  projectId: number;
  onProjectUpdate?: (changes: any, userId: number) => void;
  onUsersUpdate?: (users: CollaborationUser[]) => void;
  onCursorMove?: (data: { userId: number; x: number; y: number; screenId: string }) => void;
  onSlotLocked?: (data: { userId: number; slotId: string }) => void;
  onSlotUnlocked?: (data: { userId: number; slotId: string }) => void;
}

export function useCollaboration({
  projectId,
  onProjectUpdate,
  onUsersUpdate,
  onCursorMove,
  onSlotLocked,
  onSlotUnlocked,
}: UseCollaborationOptions) {
  const { token, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);

  useEffect(() => {
    if (!token || !projectId) return;

    // Создаем соединение
    const socket = io({
      path: '/api/socket',
      auth: { token },
    });

    socketRef.current = socket;

    // События подключения
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Присоединяемся к комнате проекта с информацией о пользователе
      if (user) {
        socket.emit('join-project', {
          projectId,
          userInfo: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            photoUrl: user.photoUrl,
            username: user.username,
          },
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // События проекта
    socket.on('users-update', (data) => {
      console.log('Users in room:', data.users);
      setActiveUsers(data.users);
      onUsersUpdate?.(data.users);
    });

    socket.on('project-updated', (data) => {
      console.log('Project updated by user:', data.userId);
      onProjectUpdate?.(data.changes, data.userId);
    });

    socket.on('cursor-moved', (data) => {
      onCursorMove?.(data);
    });

    socket.on('slot-locked', (data) => {
      onSlotLocked?.(data);
    });

    socket.on('slot-unlocked', (data) => {
      onSlotUnlocked?.(data);
    });

    // Cleanup при размонтировании
    return () => {
      if (socket.connected) {
        socket.emit('leave-project', projectId);
      socket.disconnect();
    }
  };
}, [projectId, token, user]);

  // Методы для отправки событий
  const sendProjectUpdate = (changes: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('project-update', {
        projectId,
        changes,
      });
    }
  };

  const sendCursorMove = (x: number, y: number, screenId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-move', {
        projectId,
        x,
        y,
        screenId,
      });
    }
  };

  const lockSlot = (slotId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('slot-lock', {
        projectId,
        slotId,
      });
    }
  };

  const unlockSlot = (slotId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('slot-unlock', {
        projectId,
        slotId,
      });
    }
  };

  return {
    isConnected,
    activeUsers,
    sendProjectUpdate,
    sendCursorMove,
    lockSlot,
    unlockSlot,
  };
}
