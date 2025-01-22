import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { authenticateUser } from './middleware/auth';
import { weatherRouter } from './routes/weather';
import { authRouter } from './routes/auth';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Redis setup
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not defined');
}
const redis = new Redis(process.env.REDIS_URL);

// Routes
app.use('/auth', authRouter);
app.use('/api/weather', authenticateUser, weatherRouter);

