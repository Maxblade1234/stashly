import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireServiceKey } from './middleware/auth';
import { getDb } from './db';
import cardsRouter from './routes/cards';
import adminRouter from './routes/admin';
import { startReservationExpiryJob } from './reservation';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use(requireServiceKey);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/cards', cardsRouter);
app.use('/admin', adminRouter);

getDb();
startReservationExpiryJob();

app.listen(PORT, () => {
  console.log(`Inventory service running on port ${PORT}`);
});

export default app;
