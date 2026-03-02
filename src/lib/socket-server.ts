import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './auth';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    (socket as any).userId = decoded.userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log('User connected:', (socket as any).userId);

    // Присоединение к комнате проекта
    socket.on('join-project', (projectId: number) => {
      const roomName = `project:${projectId}`;
      socket.join(roomName);
      console.log(`User ${(socket as any).userId} joined project ${projectId}`);
      
      // Уведомляем других о новом участнике
      socket.to(roomName).emit('user-joined', {
        userId: (socket as any).userId,
      });
    });

    // Покидание комнаты проекта
    socket.on('leave-project', (projectId: number) => {
      const roomName = `project:${projectId}`;
      socket.leave(roomName);
      console.log(`User ${(socket as any).userId} left project ${projectId}`);
      
      // Уведомляем других об уходе
      socket.to(roomName).emit('user-left', {
        userId: (socket as any).userId,
      });
    });

    // Изменения в проекте
    socket.on('project-update', (data: { projectId: number; changes: any }) => {
      const roomName = `project:${data.projectId}`;
      
      // Отправляем изменения всем в комнате, кроме отправителя
      socket.to(roomName).emit('project-updated', {
        userId: (socket as any).userId,
        changes: data.changes,
      });
    });

    // Курсор пользователя
    socket.on('cursor-move', (data: { projectId: number; x: number; y: number; screenId: string }) => {
      const roomName = `project:${data.projectId}`;
      
      socket.to(roomName).emit('cursor-moved', {
        userId: (socket as any).userId,
        x: data.x,
        y: data.y,
        screenId: data.screenId,
      });
    });

    // Блокировка слота (когда пользователь редактирует)
    socket.on('slot-lock', (data: { projectId: number; slotId: string }) => {
      const roomName = `project:${data.projectId}`;
      
      socket.to(roomName).emit('slot-locked', {
        userId: (socket as any).userId,
        slotId: data.slotId,
      });
    });

    // Разблокировка слота
    socket.on('slot-unlock', (data: { projectId: number; slotId: string }) => {
      const roomName = `project:${data.projectId}`;
      
      socket.to(roomName).emit('slot-unlocked', {
        userId: (socket as any).userId,
        slotId: data.slotId,
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', (socket as any).userId);
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}
