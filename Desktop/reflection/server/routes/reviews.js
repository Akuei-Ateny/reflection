import * as db from '../db/index.js';
import { moderateReviewComment } from '../ai.js';
import { generateReflectionSummary } from '../ai.js';
import { generateGrowthInsights } from '../ai.js';

function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

export function registerReviewRoutes(app) {
  app.post('/api/reviews', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const { reviewed_user_id, rating, comment } = req.body || {};
    if (!reviewed_user_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    const reviewed = db.getUserById(reviewed_user_id);
    if (!reviewed) return res.status(404).json({ error: 'User not found' });
    if (reviewed_user_id === userId) return res.status(400).json({ error: 'Cannot review yourself' });
    if (db.hasUserReviewed(userId, reviewed_user_id)) {
      return res.status(400).json({ error: 'You have already submitted a review for this person' });
    }
    const moderation = await moderateReviewComment(comment || '');
    if (!moderation.allowed) {
      return res.status(400).json({
        error: "Your comment could not be posted because it violates Reflection's community standards."
      });
    }
    const id = db.createReview(reviewed_user_id, userId, rating, comment || '');
    const review = db.getReviewById(id);
    db.setReviewModerated(id, true);

    const reviews = db.getReviewsForUser(reviewed_user_id);
    const summary = await generateReflectionSummary(reviews);
    if (summary) db.setAISummary(reviewed_user_id, summary);

    const targetUser = db.getUserById(reviewed_user_id);
    const { feedback, resources } = await generateGrowthInsights(reviews, targetUser?.name?.split(' ')[0]);
    if (feedback) db.setAIGrowth(reviewed_user_id, feedback, resources);

    res.status(201).json({ id, rating: review.rating, comment: review.comment, created_at: review.created_at });
  });
}
