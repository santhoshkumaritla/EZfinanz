import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { getDatabaseUri, getJwtSecret } from './config/runtime.js';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/application.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.deploy' : '.env.local';
dotenv.config({ path: envFile });
dotenv.config();

process.env.MONGODB_URI = process.env.MONGODB_URI || getDatabaseUri();
process.env.JWT_SECRET = process.env.JWT_SECRET || getJwtSecret();
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'EZfinanz API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
