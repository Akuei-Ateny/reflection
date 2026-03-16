import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const showNav = user?.onboardingComplete;

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg flex flex-col transition-colors">
      {showNav && (
        <header className="sticky top-0 z-50 bg-surface/95 dark:bg-dark-surface/95 backdrop-blur border-b border-gray-100 dark:border-dark-border">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/browse" className="flex items-center gap-2 shrink-0" aria-label="Reflection home">
              <img
                src="/reflection.png"
                alt="Reflection"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <nav className="flex items-center gap-3">
              <Link
                to="/browse"
                className="text-sm text-text-muted dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition"
              >
                Browse
              </Link>
              {user && (
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-2 text-sm text-text-muted dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition"
                >
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-primary text-xs font-medium">
                      {user.name?.[0] ?? user.netid[0]}
                    </span>
                  )}
                  My profile
                </Link>
              )}
              <motion.button
                type="button"
                onClick={toggleTheme}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-button bg-gray-100 dark:bg-dark-border text-text-muted dark:text-gray-400 hover:text-text dark:hover:text-white transition"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </motion.button>
              <button
                type="button"
                onClick={logout}
                className="text-sm text-text-muted dark:text-gray-400 hover:text-text dark:hover:text-white transition"
              >
                Log out
              </button>
            </nav>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
