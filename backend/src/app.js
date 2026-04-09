// Express application setup
// Configure middleware and routes

import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

export default app;
