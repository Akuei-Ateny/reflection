import * as db from '../db/index.js';

function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

export function registerVoteRoutes(app) {
  app.post('/api/reviews/:id/vote', requireAuth, (req, res) => {
    const reviewId = req.params.id;
    const userId = req.session.userId;
    const vote = req.body?.vote;
    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ error: 'vote must be 1 or -1' });
    }
    const review = db.getReviewById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.reviewer_user_id === userId) {
      return res.status(400).json({ error: 'Cannot vote on your own review' });
    }
    db.setReviewVote(reviewId, userId, vote);
    const reviews = db.getReviewsForUser(review.reviewed_user_id, userId);
    const updated = reviews.find((r) => r.id === reviewId);
    res.json({ score: updated?.score ?? 0, myVote: vote });
  });
}
