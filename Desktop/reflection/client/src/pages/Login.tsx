import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TigerLogin from '../components/TigerLogin';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      className="p-2 rounded-button bg-black/5 dark:bg-white/10 text-text dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 transition"
      aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
      )}
    </motion.button>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const error = searchParams.get('error');

  useEffect(() => {
    if (loading) return;
    if (user?.onboardingComplete) {
      navigate('/browse', { replace: true });
      return;
    }
    if (user && !user.onboardingComplete) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleCasLogin = () => {
    window.location.href = '/api/auth/cas/login';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background dark:bg-dark-bg">
        <div className="animate-pulse text-text-muted dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background dark:bg-dark-bg bg-princeton-stripe">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Ambient floating shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-[0.08] dark:opacity-[0.12]"
            style={{
              width: 80 + i * 40,
              height: 80 + i * 40,
              left: `${15 + i * 18}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: 'linear-gradient(135deg, #E77500, #1a1a1a)'
            }}
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.05, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="font-serif text-5xl md:text-6xl text-text dark:text-white tracking-tight">
            Reflection
          </h1>
          <motion.div
            className="h-1 w-24 mx-auto mt-3 rounded-full bg-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{ originX: 0.5 }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-text-muted dark:text-gray-400 text-lg mb-10 max-w-sm mx-auto"
        >
          Understand how others experience you. Anonymous feedback and AI-powered insights for growth.
        </motion.p>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-red-600 dark:text-red-400 text-sm"
          >
            {error === 'invalid_ticket' && 'Login failed. Please try again.'}
            {error === 'no_ticket' && 'No ticket received. Please try again.'}
            {!['invalid_ticket', 'no_ticket'].includes(error) && 'Something went wrong. Please try again.'}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="my-8"
        >
          <TigerLogin onClick={handleCasLogin} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-text-muted dark:text-gray-500"
        >
          Only verified Princeton students can access Reflection.
        </motion.p>
      </motion.div>
    </div>
  );
}
