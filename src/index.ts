import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { authenticateUser } from './middleware/auth';
import { weatherRouter } from './routes/weather';
import { authRouter } from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);


// Security middleware
app.use(helmet());

app.use(cors({
  origin: '*', // During development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => {
    return (req.headers['x-forwarded-for'] || req.ip || '').toString();
  }
});
app.use(limiter);

// Redis setup
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not defined');
}
const redis = new Redis(process.env.REDIS_URL);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRouter);
app.use('/api/weather', authenticateUser, weatherRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server...');
  redis.disconnect();
  process.exit(0);
});