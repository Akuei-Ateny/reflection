import * as db from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import multer from 'multer';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `profile-${uuidv4()}${path.extname(file.originalname) || '.jpg'}`)
});
export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

export function registerUserRoutes(app) {
  app.delete('/api/me', requireAuth, (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    try {
      db.deleteUser(userId);
    } catch (e) {
      console.error('deleteUser error:', e);
      return res.status(500).json({ error: e.message || 'Could not delete profile.' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('session.destroy error:', err);
        return res.status(500).json({ error: 'Failed to end session' });
      }
      res.status(200).json({ success: true });
    });
  });

  app.put('/api/me/profile', requireAuth, upload.single('profile_picture'), (req, res) => {
    const userId = req.session.userId;
    const { name, major, class_year, residential_college } = req.body || {};
    const profile_picture = req.file ? `/uploads/${req.file.filename}` : undefined;
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.updateUserProfile(userId, {
      name: name || user.name,
      profile_picture: profile_picture || user.profile_picture,
      major: major ?? user.major,
      class_year: class_year ?? user.class_year,
      residential_college: residential_college ?? user.residential_college
    });
    const updated = db.getUserById(userId);
    res.json(sanitizeUser(updated));
  });

  app.get('/api/users', (req, res) => {
    const { major, class_year, residential_college, search } = req.query;
    const users = db.getUsersForBrowse({
      major: major || undefined,
      class_year: class_year || undefined,
      residential_college: residential_college || undefined,
      search: search || undefined
    });
    const withRating = users.map(u => ({
      ...sanitizeUser(u),
      averageRating: db.getAverageRating(u.id)
    }));
    res.json(withRating);
  });

  app.get('/api/users/:id', (req, res) => {
    const user = db.getUserById(req.params.id);
    if (!user || !user.onboarding_complete) return res.status(404).json({ error: 'Not found' });
    const rating = db.getAverageRating(user.id);
    let reviews = db.getReviewsForUser(user.id, req.session?.userId);
    reviews = reviews.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const summary = db.getAISummary(user.id);
    const isOwner = req.session?.userId === user.id;
    let growth = null;
    if (isOwner) {
      const g = db.getAIGrowth(user.id);
      if (g) growth = { growth_feedback: g.growth_feedback, resources: parseResources(g.resources) };
    }
    const hasReviewed = req.session?.userId ? db.hasUserReviewed(req.session.userId, user.id) : false;
    res.json({
      ...sanitizeUser(user),
      averageRating: rating,
      reviews,
      aiSummary: summary?.summary || null,
      aiGrowth: growth,
      hasReviewed
    });
  });

  app.get('/api/options/majors', (req, res) => {
    const rows = db.db.prepare('SELECT DISTINCT major FROM users WHERE major IS NOT NULL AND major != "" ORDER BY major').all();
    res.json(rows.map(r => r.major));
  });

  app.get('/api/options/colleges', (req, res) => {
    const rows = db.db.prepare('SELECT DISTINCT residential_college FROM users WHERE residential_college IS NOT NULL AND residential_college != "" ORDER BY residential_college').all();
    res.json(rows.map(r => r.residential_college));
  });

  app.get('/api/options/years', (req, res) => {
    const rows = db.db.prepare('SELECT DISTINCT class_year FROM users WHERE class_year IS NOT NULL AND class_year != "" ORDER BY class_year').all();
    res.json(rows.map(r => r.class_year));
  });
}

function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function sanitizeUser(u) {
  if (!u) return u;
  const { onboarding_complete, ...rest } = u;
  return { ...rest, onboardingComplete: !!u.onboarding_complete };
}

function parseResources(str) {
  if (!str) return [];
  try {
    const a = JSON.parse(str);
    return Array.isArray(a) ? a : [];
  } catch (_) {
    return [];
  }
}
