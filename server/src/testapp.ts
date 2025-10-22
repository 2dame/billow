import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware';

// Routes
import authRoutes from './routes/auth';
import tasksRoutes from './routes/tasks';
import reflectionsRoutes from './routes/reflections';
import snapshotsRoutes from './routes/snapshots';
import digestsRoutes from './routes/digests';
import insightsRoutes from './routes/insights';

const app = express();

// Security & Parsing
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (no rate limiting for tests)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use('/reflections', reflectionsRoutes);
app.use('/snapshots', snapshotsRoutes);
app.use('/digests', digestsRoutes);
app.use('/insights', insightsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

