import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  score?: number;
  myVote?: number | null;
};

type ProfileData = {
  id: string;
  name: string | null;
  profile_picture: string | null;
  major: string | null;
  class_year: string | null;
  residential_college: string | null;
  averageRating: { average: number; count: number };
  reviews: ReviewItem[];
  aiSummary: string | null;
  aiGrowth: { growth_feedback: string; resources: { title: string; url: string }[] } | null;
  hasReviewed?: boolean;
};

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [votingId, setVotingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isOwner = me?.id === id;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/users/${id}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  const stars = (n: number) => (
    <span className="text-amber-500">
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </span>
  );

  const handleVote = async (reviewId: string, vote: number) => {
    if (!me || isOwner) return;
    setVotingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) => {
            if (r.id !== reviewId) return r;
            return { ...r, score: data.score ?? r.score ?? 0, myVote: data.myVote ?? vote };
          }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        };
      });
    } finally {
      setVotingId(null);
    }
  };

  const handleDeleteProfile = async () => {
    if (!id || !isOwner) return;
    const confirmed = window.confirm(
      'Are you sure you want to delete your profile? This will permanently remove your profile, reviews you received, and all associated data. You can sign in again with Princeton CAS later to create a new profile.'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/me', { method: 'DELETE', credentials: 'include' });
      const text = await res.text();
      const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
      if (!res.ok) {
        window.alert(data.error || `Could not delete profile (${res.status}).`);
        return;
      }
      window.location.href = '/';
    } catch (e) {
      window.alert('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed_user_id: id, rating, comment: comment.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReviewError(data.error || 'Could not submit review.');
        return;
      }
      setComment('');
      setRating(5);
      const updated = await fetch(`/api/users/${id}`, { credentials: 'include' }).then((r) => r.json());
      setProfile(updated);
    } catch {
      setReviewError('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center bg-background dark:bg-dark-bg">
        <div className="animate-pulse text-text-muted dark:text-gray-400">Loading profile…</div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center bg-background dark:bg-dark-bg">
        <p className="text-text-muted dark:text-gray-400 mb-4">Profile not found.</p>
        <button
          type="button"
          onClick={() => navigate('/browse')}
          className="text-primary dark:text-primary-light font-medium"
        >
          Back to Browse
        </button>
      </div>
    );
  }

  const canReview = !isOwner && me && !profile.hasReviewed;
  const canVote = me && !isOwner;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-16 bg-background dark:bg-dark-bg">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          <div className="w-32 h-32 rounded-3xl overflow-hidden bg-primary/10 dark:bg-primary/20 flex-shrink-0 shadow-card dark:shadow-dark-card">
            {profile.profile_picture ? (
              <img src={profile.profile_picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-5xl text-primary/60 font-serif">
                {profile.name?.[0] ?? '?'}
              </span>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-serif text-3xl text-text dark:text-white">{profile.name || 'Unknown'}</h1>
            <p className="text-text-muted dark:text-gray-400 mt-1">
              {profile.major || '—'} · {profile.residential_college || '—'} · Class of {profile.class_year || '—'}
            </p>
            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
              {stars(Math.round(profile.averageRating.average))}
              <span className="text-sm text-text-muted dark:text-gray-500">
                ({profile.averageRating.count} review{profile.averageRating.count !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {profile.aiSummary && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-sm font-medium text-text-muted dark:text-gray-500 uppercase tracking-wider mb-3">Reflection summary</h2>
          <p className="text-text dark:text-gray-200 leading-relaxed bg-surface dark:bg-dark-surface rounded-card p-5 shadow-card dark:shadow-dark-card border border-gray-100 dark:border-dark-border">
            {profile.aiSummary}
          </p>
        </motion.section>
      )}

      {isOwner && profile.aiGrowth?.growth_feedback && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10 p-5 rounded-card bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30"
        >
          <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Private growth insights</h2>
          <p className="text-text dark:text-gray-200 leading-relaxed mb-4">{profile.aiGrowth.growth_feedback}</p>
          {profile.aiGrowth.resources?.length > 0 && (
            <>
              <p className="text-sm font-medium text-text dark:text-gray-200 mb-2">Suggested resources</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-muted dark:text-gray-400">
                {profile.aiGrowth.resources.map((r, i) => (
                  <li key={i}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-primary-light hover:underline">
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10"
      >
        <h2 className="text-sm font-medium text-text-muted dark:text-gray-500 uppercase tracking-wider mb-3">Anonymous reviews</h2>
        <p className="text-xs text-text-muted dark:text-gray-500 mb-3">Upvote or downvote to show whether you share this sentiment.</p>
        {profile.reviews?.length ? (
          <ul className="space-y-3">
            {profile.reviews.map((r) => (
              <motion.li
                key={r.id}
                layout
                className="bg-surface dark:bg-dark-surface rounded-card p-4 shadow-card dark:shadow-dark-card border border-gray-100 dark:border-dark-border flex gap-3"
              >
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  {canVote ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleVote(r.id, 1)}
                        disabled={votingId === r.id}
                        className={`p-1 rounded transition ${r.myVote === 1 ? 'text-primary bg-primary/10' : 'text-text-muted dark:text-gray-500 hover:text-primary dark:hover:text-primary-light'}`}
                        aria-label="Upvote"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                      </button>
                      <span className="text-sm font-medium text-text dark:text-gray-300 tabular-nums">{r.score ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => handleVote(r.id, -1)}
                        disabled={votingId === r.id}
                        className={`p-1 rounded transition ${r.myVote === -1 ? 'text-primary bg-primary/10' : 'text-text-muted dark:text-gray-500 hover:text-primary dark:hover:text-primary-light'}`}
                        aria-label="Downvote"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-text-muted dark:text-gray-500 tabular-nums">{r.score ?? 0}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-500">{stars(r.rating)}</span>
                    <span className="text-xs text-text-muted dark:text-gray-500">Anonymous</span>
                  </div>
                  {r.comment && <p className="text-text dark:text-gray-200 text-sm">"{r.comment}"</p>}
                </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted dark:text-gray-500 text-sm">No reviews yet.</p>
        )}
      </motion.section>

      {canReview && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-sm font-medium text-text-muted dark:text-gray-500 uppercase tracking-wider mb-3">Write a review</h2>
          <form onSubmit={handleSubmitReview} className="bg-surface dark:bg-dark-surface rounded-card p-5 shadow-card dark:shadow-dark-card border border-gray-100 dark:border-dark-border space-y-4">
            <div>
              <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`text-2xl transition ${rating >= n ? 'text-amber-500' : 'text-gray-200 dark:text-gray-600'}`}
                    aria-label={`${n} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">Comment (optional, anonymous)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Really supportive teammate and easy to collaborate with."
                rows={3}
                className="w-full px-4 py-3 rounded-button border border-gray-200 dark:border-dark-border bg-background dark:bg-dark-bg text-text dark:text-white placeholder:text-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            {reviewError && <p className="text-red-600 dark:text-red-400 text-sm">{reviewError}</p>}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-button bg-primary hover:bg-primary-dark text-white font-medium disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </motion.button>
          </form>
        </motion.section>
      )}

      {isOwner && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-border"
        >
          <h2 className="text-sm font-medium text-text-muted dark:text-gray-500 uppercase tracking-wider mb-2">Account</h2>
          <p className="text-sm text-text-muted dark:text-gray-400 mb-3">
            Permanently delete your profile and all associated data. You can sign in again with Princeton CAS to create a new profile later.
          </p>
          <motion.button
            type="button"
            onClick={handleDeleteProfile}
            disabled={deleting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="px-4 py-2 rounded-button border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition disabled:opacity-60 text-sm font-medium"
          >
            {deleting ? 'Deleting…' : 'Delete my profile'}
          </motion.button>
        </motion.section>
      )}
    </div>
  );
}
