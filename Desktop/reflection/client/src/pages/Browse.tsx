import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CLASS_YEARS = ['2026', '2027', '2028', '2029'];
const RESIDENTIAL_COLLEGES = ['Butler', 'NCW', 'Yeh', 'Forbes', 'Whitman', 'Mathey', 'Rockefeller'];

type UserCard = {
  id: string;
  name: string | null;
  profile_picture: string | null;
  major: string | null;
  class_year: string | null;
  residential_college: string | null;
  averageRating: { average: number; count: number };
};

export default function Browse() {
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [major, setMajor] = useState('');
  const [classYear, setClassYear] = useState('');
  const [college, setCollege] = useState('');
  const [majorOptions, setMajorOptions] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (major) params.set('major', major);
    if (classYear) params.set('class_year', classYear);
    if (college) params.set('residential_college', college);
    setLoading(true);
    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
      })
      .finally(() => setLoading(false));
  }, [search, major, classYear, college]);

  useEffect(() => {
    fetch('/api/options/majors').then((r) => r.json()).then(setMajorOptions);
  }, []);

  const stars = (avg: number) => {
    const full = Math.min(5, Math.round(avg));
    const empty = 5 - full;
    return (
      <span className="text-amber-500">
        {'★'.repeat(full)}
        {'☆'.repeat(empty)}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-background dark:bg-dark-bg">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-3xl text-text dark:text-white mb-6"
      >
        Discover
      </motion.h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 space-y-4"
      >
        <input
          type="search"
          placeholder="Search by name, major, or college…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xl px-4 py-3 rounded-button border border-gray-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-white placeholder:text-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="px-4 py-2 rounded-button border border-gray-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All majors</option>
            {majorOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={classYear}
            onChange={(e) => setClassYear(e.target.value)}
            className="px-4 py-2 rounded-button border border-gray-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All years</option>
            {CLASS_YEARS.map((y) => (
              <option key={y} value={y}>Class of {y}</option>
            ))}
          </select>
          <select
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            className="px-4 py-2 rounded-button border border-gray-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All colleges</option>
            {RESIDENTIAL_COLLEGES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </motion.div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-card bg-gray-100 dark:bg-dark-border animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.ul
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
            hidden: {}
          }}
        >
          <AnimatePresence mode="popLayout">
            {users.map((u) => (
              <motion.li
                key={u.id}
                variants={{
                  visible: { opacity: 1, y: 0 },
                  hidden: { opacity: 0, y: 16 }
                }}
                layout
              >
                <Link to={`/profile/${u.id}`} className="block group">
                  <motion.div
                    className="rounded-card bg-surface dark:bg-dark-surface shadow-card dark:shadow-dark-card overflow-hidden border border-gray-100 dark:border-dark-border"
                    whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(231, 117, 0, 0.15)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="aspect-square relative bg-primary/10 dark:bg-primary/20">
                      {u.profile_picture ? (
                        <img
                          src={u.profile_picture}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-4xl text-primary/60 font-serif">
                          {u.name?.[0] ?? '?'}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-text dark:text-white truncate">{u.name || 'Unknown'}</p>
                      <p className="text-sm text-text-muted dark:text-gray-400 truncate">
                        Class of {u.class_year || '—'} — {u.major || '—'}
                      </p>
                      <p className="mt-2 text-amber-500 text-sm" aria-label={`Rating: ${u.averageRating.average.toFixed(1)} out of 5`}>
                        {stars(u.averageRating.average)}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
      {!loading && users.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-text-muted dark:text-gray-500 text-center py-12"
        >
          No profiles match your filters.
        </motion.p>
      )}
    </div>
  );
}
