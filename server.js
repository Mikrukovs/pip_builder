const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Инициализация Socket.IO
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware для аутентификации
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      // Используем NEXTAUTH_SECRET, как и в auth.ts
      const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development-secret-please-change';
      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      console.error('WebSocket auth error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  // Функция для получения уникальных пользователей в комнате
  const getUsersInRoom = (roomName) => {
    const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
    if (!socketsInRoom) return [];
    
    const userMap = new Map();
    
    // Собираем уникальных пользователей
    for (const socketId of socketsInRoom) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.userId && socket.userInfo) {
        userMap.set(socket.userId, socket.userInfo);
      }
    }
    
    return Array.from(userMap.values());
  };

  // Обработка подключений
  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Присоединение к комнате проекта
    socket.on('join-project', (data) => {
      const { projectId, userInfo } = data;
      const roomName = `project:${projectId}`;
      
      // Сохраняем информацию о пользователе
      socket.userInfo = userInfo;
      
      socket.join(roomName);
      console.log(`User ${socket.userId} (${userInfo.firstName}) joined project ${projectId}`);
      
      // Получаем список всех пользователей в комнате
      const usersInRoom = getUsersInRoom(roomName);
      
      // Отправляем всем в комнате обновленный список пользователей
      io.to(roomName).emit('users-update', { users: usersInRoom });
    });

    // Покидание комнаты проекта
    socket.on('leave-project', (projectId) => {
      const roomName = `project:${projectId}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left project ${projectId}`);
      
      // Отправляем обновленный список пользователей
      const usersInRoom = getUsersInRoom(roomName);
      io.to(roomName).emit('users-update', { users: usersInRoom });
    });

    // Изменения в проекте
    socket.on('project-update', (data) => {
      const roomName = `project:${data.projectId}`;
      
      // Отправляем изменения всем в комнате, кроме отправителя
      socket.to(roomName).emit('project-updated', {
        userId: socket.userId,
        changes: data.changes,
        timestamp: Date.now(),
      });
    });

    // Курсор пользователя
    socket.on('cursor-move', (data) => {
      const roomName = `project:${data.projectId}`;
      
      socket.to(roomName).emit('cursor-moved', {
        userId: socket.userId,
        x: data.x,
        y: data.y,
        screenId: data.screenId,
      });
    });

    // Блокировка слота
    socket.on('slot-lock', (data) => {
      const roomName = `project:${data.projectId}`;
      
      socket.to(roomName).emit('slot-locked', {
        userId: socket.userId,
        slotId: data.slotId,
      });
    });

    // Разблокировка слота
    socket.on('slot-unlock', (data) => {
      const roomName = `project:${data.projectId}`;
      
      socket.to(roomName).emit('slot-unlocked', {
        userId: socket.userId,
        slotId: data.slotId,
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      
      // Находим все комнаты, в которых был пользователь, и обновляем списки
      const rooms = Array.from(socket.rooms).filter(room => room.startsWith('project:'));
      rooms.forEach(roomName => {
        const usersInRoom = getUsersInRoom(roomName);
        io.to(roomName).emit('users-update', { users: usersInRoom });
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
