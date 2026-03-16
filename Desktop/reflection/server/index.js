import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registerAuthRoutes } from './routes/auth.js';
import { registerUserRoutes } from './routes/users.js';
import { registerReviewRoutes } from './routes/reviews.js';
import { registerVoteRoutes } from './routes/votes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.BASE_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'reflection-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

registerAuthRoutes(app);
registerUserRoutes(app);
registerReviewRoutes(app);
registerVoteRoutes(app);

app.listen(PORT, () => {
  console.log(`Reflection API running at http://localhost:${PORT}`);
});
