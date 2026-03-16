import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../reflection.sqlite');

export const db = new Database(dbPath);

export function getUserByNetid(netid) {
  return db.prepare('SELECT * FROM users WHERE netid = ?').get(netid);
}

export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function createUser(netid) {
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO users (id, netid) VALUES (?, ?)'
  ).run(id, netid);
  return getUserById(id);
}

export function updateUserProfile(id, data) {
  const { name, profile_picture, major, class_year, residential_college } = data;
  db.prepare(`
    UPDATE users SET
      name = ?, profile_picture = ?, major = ?, class_year = ?, residential_college = ?,
      onboarding_complete = 1
    WHERE id = ?
  `).run(name ?? null, profile_picture ?? null, major ?? null, class_year ?? null, residential_college ?? null, id);
  return getUserById(id);
}

export function getUsersForBrowse(filters = {}) {
  let sql = 'SELECT * FROM users WHERE onboarding_complete = 1';
  const params = [];
  if (filters.major) {
    sql += ' AND major = ?';
    params.push(filters.major);
  }
  if (filters.class_year) {
    sql += ' AND class_year = ?';
    params.push(filters.class_year);
  }
  if (filters.residential_college) {
    sql += ' AND residential_college = ?';
    params.push(filters.residential_college);
  }
  if (filters.search) {
    sql += ' AND (name LIKE ? OR major LIKE ? OR residential_college LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }
  sql += ' ORDER BY name ASC';
  return db.prepare(sql).all(...params);
}

export function getAverageRating(userId) {
  const row = db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE reviewed_user_id = ? AND moderated = 1'
  ).get(userId);
  return { average: row?.avg ?? 0, count: row?.count ?? 0 };
}

export function getReviewsForUser(userId, currentUserId = null) {
  const rows = db.prepare(
    'SELECT id, rating, comment, created_at FROM reviews WHERE reviewed_user_id = ? AND moderated = 1 ORDER BY created_at DESC'
  ).all(userId);
  return rows.map((r) => {
    const scoreRow = db.prepare('SELECT COALESCE(SUM(vote), 0) as score FROM review_votes WHERE review_id = ?').get(r.id);
    const score = scoreRow?.score ?? 0;
    let myVote = null;
    if (currentUserId) {
      const v = db.prepare('SELECT vote FROM review_votes WHERE review_id = ? AND user_id = ?').get(r.id, currentUserId);
      if (v) myVote = v.vote;
    }
    return { ...r, score, myVote };
  });
}

export function createReview(reviewedUserId, reviewerUserId, rating, comment) {
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO reviews (id, reviewed_user_id, reviewer_user_id, rating, comment, moderated) VALUES (?, ?, ?, ?, ?, 0)'
  ).run(id, reviewedUserId, reviewerUserId, rating, comment ?? '');
  return id;
}

export function setReviewModerated(reviewId, approved) {
  db.prepare('UPDATE reviews SET moderated = ? WHERE id = ?').run(approved ? 1 : -1, reviewId);
}

export function getPendingReviews() {
  return db.prepare('SELECT * FROM reviews WHERE moderated = 0').all();
}

export function getAISummary(userId) {
  return db.prepare('SELECT * FROM ai_summaries WHERE user_id = ?').get(userId);
}

export function setAISummary(userId, summary) {
  db.prepare(
    'INSERT INTO ai_summaries (user_id, summary, updated_at) VALUES (?, ?, datetime("now")) ON CONFLICT(user_id) DO UPDATE SET summary = ?, updated_at = datetime("now")'
  ).run(userId, summary, summary);
}

export function getAIGrowth(userId) {
  return db.prepare('SELECT * FROM ai_growth WHERE user_id = ?').get(userId);
}

export function setAIGrowth(userId, growthFeedback, resources) {
  const resourcesJson = typeof resources === 'string' ? resources : JSON.stringify(resources || []);
  db.prepare(
    'INSERT INTO ai_growth (user_id, growth_feedback, resources, updated_at) VALUES (?, ?, ?, datetime("now")) ON CONFLICT(user_id) DO UPDATE SET growth_feedback = ?, resources = ?, updated_at = datetime("now")'
  ).run(userId, growthFeedback, resourcesJson, growthFeedback, resourcesJson);
}

export function hasUserReviewed(reviewerUserId, reviewedUserId) {
  const row = db.prepare(
    'SELECT 1 FROM reviews WHERE reviewer_user_id = ? AND reviewed_user_id = ? AND moderated IN (0, 1)'
  ).get(reviewerUserId, reviewedUserId);
  return !!row;
}

export function getReviewById(reviewId) {
  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
}

export function setReviewVote(reviewId, userId, vote) {
  if (vote !== 1 && vote !== -1) return;
  db.prepare(
    'INSERT INTO review_votes (review_id, user_id, vote) VALUES (?, ?, ?) ON CONFLICT(review_id, user_id) DO UPDATE SET vote = excluded.vote'
  ).run(reviewId, userId, vote);
}

/** Permanently delete a user and all related data. Uses a transaction so failures roll back. */
export function deleteUser(userId) {
  const run = db.transaction(() => {
    db.prepare('DELETE FROM review_votes WHERE user_id = ?').run(userId);
    const reviewIds = db.prepare(
      'SELECT id FROM reviews WHERE reviewed_user_id = ? OR reviewer_user_id = ?'
    ).all(userId, userId);
    for (const row of reviewIds) {
      db.prepare('DELETE FROM review_votes WHERE review_id = ?').run(row.id);
    }
    db.prepare('DELETE FROM reviews WHERE reviewed_user_id = ? OR reviewer_user_id = ?').run(userId, userId);
    db.prepare('DELETE FROM ai_summaries WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM ai_growth WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  run();
}
