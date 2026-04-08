// Express application setup
// Configure middleware and routes here

import express from 'express';
import { authRoutes } from './routes/index.js';

const app = express();

// Parse JSON request bodies (so we can read email/password)
app.use(express.json());

// Mount auth routes at /api/auth
// This means POST /api/auth/login will work
app.use('/api/auth', authRoutes);

export default app;
