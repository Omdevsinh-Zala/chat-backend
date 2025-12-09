import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// import logger from './config/logger.js';
import { router } from './routes/auth.js';
import { verifySocketToken } from './middlewares/verifyToken.js';
import { registerSocketHandlers } from './controllers/socketController.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';
import { userRouter } from './routes/user.js';

const app = express();
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    credentials: true
  },
  cookie: true
});

app.use(cookieParser());

io.engine.use(helmet());
io.engine.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

const socketIO = io.of('/api/v1/socket');

socketIO.use((socket, next) => {
  verifySocketToken(socket, next);
});

socketIO.on('connection', (socket) => {
  registerSocketHandlers(socketIO, socket);
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static("public"));

app.use('/api/v1/auth', router);
app.use('/api/v1/users', userRouter);

app.use(globalErrorHandler);

export default server;
