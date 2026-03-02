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

  // Обработка подключений
  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Присоединение к комнате проекта
    socket.on('join-project', (projectId) => {
      const roomName = `project:${projectId}`;
      socket.join(roomName);
      console.log(`User ${socket.userId} joined project ${projectId}`);
      
      // Уведомляем других о новом участнике
      socket.to(roomName).emit('user-joined', {
        userId: socket.userId,
      });
      
      // Отправляем список активных пользователей в комнате
      const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
      const activeUsers = socketsInRoom ? Array.from(socketsInRoom) : [];
      socket.emit('active-users', { users: activeUsers.length });
    });

    // Покидание комнаты проекта
    socket.on('leave-project', (projectId) => {
      const roomName = `project:${projectId}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left project ${projectId}`);
      
      socket.to(roomName).emit('user-left', {
        userId: socket.userId,
      });
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
