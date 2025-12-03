import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// import logger from './config/logger.js';
import { router } from './routes/auth.js';
import { socketRouter } from './routes/socket.js';
import { verifySocketToken } from './middlewares/verifyToken.js';
import { registerSocketHandlers } from './controllers/socketController.js';

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

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}))

io.use((socket, next) => {
  verifySocketToken(socket, next);
});

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', router);
app.use('/api/v1/socket', socketRouter);

export default server;
