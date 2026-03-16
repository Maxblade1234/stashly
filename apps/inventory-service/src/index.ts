import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireServiceKey } from './middleware/auth';
import { getDb } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use(requireServiceKey);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes will be added in Task 5

// Initialize DB on startup
getDb();

app.listen(PORT, () => {
  console.log(`Inventory service running on port ${PORT}`);
});

export default app;
