import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../reflection.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    netid TEXT UNIQUE NOT NULL,
    name TEXT,
    profile_picture TEXT,
    major TEXT,
    class_year TEXT,
    residential_college TEXT,
    onboarding_complete INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    reviewed_user_id TEXT NOT NULL,
    reviewer_user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    moderated INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ai_summaries (
    user_id TEXT PRIMARY KEY,
    summary TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ai_growth (
    user_id TEXT PRIMARY KEY,
    growth_feedback TEXT,
    resources TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_user_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_user_id);

  CREATE TABLE IF NOT EXISTS review_votes (
    review_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    vote INTEGER NOT NULL CHECK(vote IN (1, -1)),
    PRIMARY KEY (review_id, user_id),
    FOREIGN KEY (review_id) REFERENCES reviews(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);
`);

console.log('Database initialized at', dbPath);
db.close();
