import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// import logger from './config/logger.js';
import { router } from './routes/auth.js';
import { verifySocketToken } from './middlewares/verifyToken.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';
import { userRouter } from './routes/user.js';
import { setupSocketHandlers } from './controllers/socketController.js';
import { config } from './config/app.js';

const app = express();
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: config.origins,
    credentials: true
  },
  cookie: true
});

app.use(cookieParser());

io.engine.use(helmet());
io.engine.use(cookieParser());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (config.origins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

export const socketIO = io.of('/api/v1/socket');

socketIO.use((socket, next) => {
  verifySocketToken(socket, next);
});

// Setup socket handlers after socketIO is initialized
setupSocketHandlers(socketIO);

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
