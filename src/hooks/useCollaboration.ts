import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';

interface UseCollaborationOptions {
  projectId: number;
  onProjectUpdate?: (changes: any, userId: number) => void;
  onUserJoined?: (userId: number) => void;
  onUserLeft?: (userId: number) => void;
  onCursorMove?: (data: { userId: number; x: number; y: number; screenId: string }) => void;
  onSlotLocked?: (data: { userId: number; slotId: string }) => void;
  onSlotUnlocked?: (data: { userId: number; slotId: string }) => void;
}

export function useCollaboration({
  projectId,
  onProjectUpdate,
  onUserJoined,
  onUserLeft,
  onCursorMove,
  onSlotLocked,
  onSlotUnlocked,
}: UseCollaborationOptions) {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);

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
      
      // Присоединяемся к комнате проекта
      socket.emit('join-project', projectId);
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
    socket.on('user-joined', (data) => {
      console.log('User joined:', data.userId);
      onUserJoined?.(data.userId);
      setActiveUsers((prev) => prev + 1);
    });

    socket.on('user-left', (data) => {
      console.log('User left:', data.userId);
      onUserLeft?.(data.userId);
      setActiveUsers((prev) => Math.max(0, prev - 1));
    });

    socket.on('active-users', (data) => {
      setActiveUsers(data.users);
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
  }, [projectId, token]);

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
