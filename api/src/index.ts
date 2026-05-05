import './env';
import express from 'express';
import cors from 'cors';
import reviewRoutes from './routes/reviews';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.API_PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
