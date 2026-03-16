import { motion } from 'framer-motion';

type TigerLoginProps = {
  onClick: () => void;
};

/** Stylized Princeton-style tiger face SVG — left-facing (mirror for right). */
function TigerFace({ mirror = false }: { mirror?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={`w-full h-full ${mirror ? 'scale-x-[-1]' : ''}`}
      fill="none"
      aria-hidden
    >
      {/* Face circle */}
      <circle cx="40" cy="40" r="36" fill="#E77500" stroke="#1a1a1a" strokeWidth="2" />
      {/* Stripes */}
      <path d="M28 28 Q32 38 28 52" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity={0.9} />
      <path d="M34 24 Q38 40 34 56" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.8} />
      <path d="M40 22 Q44 40 40 58" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.7} />
      {/* Ears */}
      <ellipse cx="18" cy="22" rx="10" ry="12" fill="#E77500" stroke="#1a1a1a" strokeWidth="1.5" />
      <ellipse cx="62" cy="22" rx="10" ry="12" fill="#E77500" stroke="#1a1a1a" strokeWidth="1.5" />
      <ellipse cx="18" cy="22" rx="5" ry="6" fill="#1a1a1a" />
      <ellipse cx="62" cy="22" rx="5" ry="6" fill="#1a1a1a" />
      {/* Eyes */}
      <ellipse cx="28" cy="38" rx="6" ry="8" fill="#1a1a1a" />
      <ellipse cx="52" cy="38" rx="6" ry="8" fill="#1a1a1a" />
      <circle cx="29" cy="36" r="2" fill="white" />
      <circle cx="53" cy="36" r="2" fill="white" />
      {/* Nose */}
      <path d="M38 48 L40 54 L42 48 Z" fill="#1a1a1a" />
      {/* Whiskers */}
      <path d="M22 42 L8 40" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity={0.8} />
      <path d="M22 46 L6 46" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity={0.8} />
      <path d="M22 50 L8 52" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity={0.8} />
      <path d="M58 42 L72 40" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity={0.8} />
      <path d="M58 46 L74 46" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity={0.8} />
      <path d="M58 50 L72 52" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity={0.8} />
    </svg>
  );
}

export default function TigerLogin({ onClick }: TigerLoginProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:ring-offset-dark-bg rounded-full py-2"
      aria-label="Sign in with Princeton CAS"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative flex items-center justify-center gap-2 sm:gap-4">
        {/* Left tiger — breathing in */}
        <motion.div
          className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex-shrink-0"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(231,117,0,0.35))' }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.95, 1, 0.95]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <TigerFace />
        </motion.div>

        {/* Center hint */}
        <motion.span
          className="text-primary font-medium text-xs sm:text-sm max-w-[4rem] sm:max-w-none text-center"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          tap to sign in
        </motion.span>

        {/* Right tiger — breathing out of phase */}
        <motion.div
          className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex-shrink-0"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(231,117,0,0.35))' }}
          animate={{
            scale: [1.08, 1, 1.08],
            opacity: [1, 0.95, 1]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <TigerFace mirror />
        </motion.div>
      </div>

      <motion.span
        className="text-sm font-medium text-text-muted dark:text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Sign in with Princeton CAS
      </motion.span>
    </motion.button>
  );
}
