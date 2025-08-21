import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// import logger from './config/logger.js';
import { router } from './routes/auth.js';
import { verifyToken } from './middlewares/verifyToken.js';

const app = express();
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true
  },
  cookie: true
});

app.use(cookieParser());

io.engine.use(helmet());
io.engine.use(cookieParser());

io.use((socket, next) => {
  verifyToken(socket, next);
});

io.on('connection', (socket) => {
  socket.emit("some", "value")

  socket.on('message', (msg) => {
    io.emit('message', msg)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected.');
  });
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', router);

export default server;
