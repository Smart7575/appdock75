/**
 * iOS Dev Hub - Authentication Modal & Social Sign-In
 * Fully implements PRD Section 5.1:
 * - Email + Password with >= 8 characters and strength indicator
 * - Sign in with Google & Sign in with Apple
 * - Password reset & Remember Me
 */

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Check,
  AlertCircle,
  Apple,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const {
    loginWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signInWithApple,
    requestPasswordReset,
    loginAsDemo,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { level: 'Weak', percent: 25, color: 'bg-rose-500', text: 'text-rose-400' };
    if (score <= 3) return { level: 'Fair', percent: 50, color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 4) return { level: 'Good', percent: 75, color: 'bg-blue-500', text: 'text-blue-400' };
    return { level: 'Strong', percent: 100, color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password, rememberMe);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Login failed. Please verify credentials.');
        }
      } else if (mode === 'register') {
        if (password.length < 8) {
          setError('Password must contain at least 8 characters.');
          setIsSubmitting(false);
          return;
        }
        const res = await registerWithEmail(name, email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Registration failed.');
        }
      } else if (mode === 'forgot') {
        const res = await requestPasswordReset(email);
        setSuccessMessage(res.message);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Google sign in failed');
      }
    } catch {
      setError('Google sign in encountered an issue. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await signInWithApple();
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Apple sign in failed');
      }
    } catch {
      setError('Apple sign in encountered an issue. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {mode === 'login' && 'Sign in to AppDock75'}
            {mode === 'register' && 'Create Your AppDock75 Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Access your iOS ideas, projects, Kanban boards, and releases.'}
            {mode === 'register' && 'Start organizing your complete iOS app lifecycle in one place.'}
            {mode === 'forgot' && 'Enter your registered email to receive reset instructions.'}
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Linked to Firebase Database: appdock75</span>
          </div>
        </div>

        {/* Tab switch for Login / Register */}
        {mode !== 'forgot' && (
          <div className="flex p-1 bg-slate-800/80 rounded-lg mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Social Logins: Google on top, Apple directly underneath on both screens */}
        {mode !== 'forgot' && (
          <div className="space-y-2 mb-5">
            {/* 1. Google Sign-in */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>

            {/* 2. Apple Sign-in (strictly situated underneath Google) */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAppleSignIn}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-black hover:bg-neutral-900 text-white border border-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Apple className="w-4 h-4 fill-current shrink-0" />
              <span>{mode === 'login' ? 'Sign in with Apple' : 'Sign up with Apple'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="px-2 bg-slate-900 text-slate-500">or with email</span>
              </div>
            </div>
          </div>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="developer@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator (PRD requirement 5.1) */}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Password strength:</span>
                    <span className={`font-medium ${strength.text}`}>{strength.level}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Minimum 8 characters. Mix uppercase letters, numbers & symbols for best security.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Remember me checkbox */}
          {mode === 'login' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-400 select-none cursor-pointer">
                Remember me on this browser
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/10"
          >
            {isSubmitting
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In to Workspace'
              : mode === 'register'
              ? 'Create Free Account'
              : 'Send Reset Link'}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className="w-full text-center py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </form>

        {/* Demo Fast-Track Option */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center space-y-2">
          <p className="text-[11px] text-slate-400">
            Need to test immediately? You can also explore as the preset indie developer account without typing credentials.
          </p>
          <button
            type="button"
            onClick={() => {
              loginAsDemo();
              onClose();
            }}
            className="w-full py-2 px-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Continue as Demo Developer (Alex Vance)</span>
          </button>
        </div>

        {/* Firebase Connected Status Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Firebase Database: appdock75</span>
          </div>
          <span className="text-slate-500">Firestore Cloud Sync</span>
        </div>
      </div>
    </div>
  );
};
