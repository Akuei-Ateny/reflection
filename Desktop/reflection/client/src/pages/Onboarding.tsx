import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const COLLEGES = ['Butler', 'NCW', 'Yeh', 'Forbes', 'Whitman', 'Mathey', 'Rockefeller'];
const YEARS = ['2026', '2027', '2028', '2029'];

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [major, setMajor] = useState(user?.major ?? '');
  const [classYear, setClassYear] = useState(user?.class_year ?? '');
  const [residentialCollege, setResidentialCollege] = useState(user?.residential_college ?? '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profile_picture ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhotoFile(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('major', major.trim());
      formData.set('class_year', classYear);
      formData.set('residential_college', residentialCollege);
      if (photoFile) formData.set('profile_picture', photoFile);
      const res = await fetch('/api/me/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save profile.');
        return;
      }
      await refreshUser();
      navigate('/browse', { replace: true });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto px-4 py-12"
    >
      <h1 className="font-serif text-3xl text-text dark:text-white mb-1">Complete your profile</h1>
      <p className="text-text-muted dark:text-gray-400 mb-8">This will be visible on Reflection’s browse page.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">Profile photo</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden text-primary hover:ring-2 ring-primary/40 transition"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">+</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <span className="text-sm text-text-muted dark:text-gray-500">Tap to upload</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Smith"
            className="w-full px-4 py-3 rounded-button border border-gray-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-white placeholder:text-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">Class year</label>
          <select
            value={classYear}
            onChange={(e) => setClassYear(e.target.value)}
            className="w-full px-4 py-3 rounded-button border border-gray-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>Class of {y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">Residential college</label>
          <select
            value={residentialCollege}
            onChange={(e) => setResidentialCollege(e.target.value)}
            className="w-full px-4 py-3 rounded-button border border-gray-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select college</option>
            {COLLEGES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">Major</label>
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="e.g. Computer Science, Economics"
            className="w-full px-4 py-3 rounded-button border border-gray-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-text dark:text-white placeholder:text-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-4 rounded-button bg-primary hover:bg-primary-dark text-white font-medium disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Continue to Reflection'}
        </motion.button>
      </form>
    </motion.div>
  );
}
