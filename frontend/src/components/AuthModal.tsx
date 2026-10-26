import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  CheckCircle2,
  Sprout,
} from 'lucide-react';
import {
  AuthAccount,
  ADMIN_ROLE_DESCRIPTIONS_BN,
  DivisionEntity,
  DistrictEntity,
  PUBLIC_DEMO_ACCOUNTS,
  UpazilaEntity,
} from '@shared/utils/locationAndAdminRules';
import { CascadingLocationSelector } from './CascadingLocationSelector';
import { authClient } from '../lib/auth-client';

export interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onLoginSuccess: (account: AuthAccount) => void;
  onSignupSuccess?: (account: AuthAccount) => void;
  divisions: DivisionEntity[];
  districts: DistrictEntity[];
  upazilas: UpazilaEntity[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onLoginSuccess,
  onSignupSuccess,
  divisions,
  districts,
  upazilas,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<AuthAccount[]>(PUBLIC_DEMO_ACCOUNTS);
  const [demoAccountsApiAvailable, setDemoAccountsApiAvailable] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  // Sign Up State
  const [signupNameBn, setSignupNameBn] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhoneBn, setSignupPhoneBn] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'কৃষক' | 'ক্রেতা' | 'বিশেষজ্ঞ'>('কৃষক');
  const [signupDivId, setSignupDivId] = useState('div-rajshahi');
  const [signupDistId, setSignupDistId] = useState('dist-bogura');
  const [signupUpzId, setSignupUpzId] = useState('upz-shibganj');

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLoading(false);
      setAuthError(null);
      setDemoAccounts(PUBLIC_DEMO_ACCOUNTS);
      setDemoAccountsApiAvailable(true);
      apiFetch('/api/auth/demo-accounts')
        .then(async (response) => {
          if (!response.ok) throw new Error('ডেমো অ্যাকাউন্ট লোড করা যায়নি।');
          const result: { accounts: AuthAccount[] } = await response.json();
          if (Array.isArray(result.accounts) && result.accounts.length > 0) {
            setDemoAccounts(result.accounts);
          }
        })
        .catch((error) => {
          console.error('Unable to load demo accounts:', error);
          setDemoAccountsApiAvailable(false);
        });
      apiFetch('/api/auth/providers')
        .then(async (response) => {
          if (!response.ok) throw new Error('সাইন-ইন provider তথ্য লোড করা যায়নি।');
          const providers: { google: boolean } = await response.json();
          setGoogleEnabled(providers.google);
        })
        .catch((error) => {
          console.error('Unable to load auth providers:', error);
        });
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!identifier.trim() || !password.trim()) {
      setAuthError('অনুগ্রহ করে ইউজার আইডি/ইমেইল এবং পাসওয়ার্ড উভয়ই লিখুন।');
      return;
    }

    setLoading(true);
    try {
      const cleanId = identifier.trim();
      const result = cleanId.includes('@')
        ? await authClient.signIn.email({
            email: cleanId.toLowerCase(),
            password: password.trim(),
          })
        : await authClient.signIn.username({
            username: cleanId,
            password: password.trim(),
          });
      if (result.error) throw new Error(result.error.message);

      const response = await apiFetch('/api/auth/session');
      if (!response.ok) throw new Error('লগইন সেশন যাচাই করা যায়নি।');
      const sessionResult: { account: AuthAccount } = await response.json();

      const activityResponse = await apiFetch('/api/auth/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login' }),
      });
      if (!activityResponse.ok) throw new Error('লগইন কার্যক্রম সংরক্ষণ করা যায়নি।');

      onLoginSuccess(sessionResult.account);
      onClose();
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'আইডি বা পাসওয়ার্ড সঠিক নয়।'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin,
      });
      if (result.error) throw new Error(result.error.message);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Google দিয়ে লগইন করা যায়নি।'
      );
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!signupNameBn.trim() || !signupUsername.trim() || !signupPassword.trim()) {
      setAuthError('অনুগ্রহ করে আপনার নাম, ইউজার আইডি এবং পাসওয়ার্ড পূরণ করুন।');
      return;
    }

    setLoading(true);
    try {
      const cleanUsername = signupUsername.trim().toLowerCase();
      const role = signupRole;
      const result = await authClient.signUp.email({
        name: signupNameBn.trim(),
        username: cleanUsername,
        email: signupEmail.trim().toLowerCase() || `${cleanUsername}@krishibondhu.bd`,
        phoneBn: signupPhoneBn.trim() || '০১৭০০-০০০০০০',
        password: signupPassword.trim(),
        userRoleBn: role,
        positionTitleBn:
          role === 'ক্রেতা'
            ? 'নিবন্ধিত ক্রেতা'
            : role === 'বিশেষজ্ঞ'
              ? 'কৃষি বিশেষজ্ঞ'
              : 'নিবন্ধিত কৃষক সদস্য',
        divisionId: signupDivId,
        districtId: signupDistId,
        upazilaId: signupUpzId,
      });
      if (result.error) throw new Error(result.error.message);

      const signInResult = await authClient.signIn.email({
        email: signupEmail.trim().toLowerCase() || `${cleanUsername}@krishibondhu.bd`,
        password: signupPassword.trim(),
      });
      if (signInResult.error) throw new Error(signInResult.error.message);

      const response = await apiFetch('/api/auth/session');
      if (!response.ok) throw new Error('নিবন্ধনের পর সেশন যাচাই করা যায়নি।');
      const sessionResult: { account: AuthAccount } = await response.json();

      const activityResponse = await apiFetch('/api/auth/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register' }),
      });
      if (!activityResponse.ok) throw new Error('নিবন্ধিত ব্যবহারকারীর তথ্য সংরক্ষণ করা যায়নি।');

      (onSignupSuccess || onLoginSuccess)(sessionResult.account);
      onClose();
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'নিবন্ধন সম্পন্ন করা যায়নি।'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden">
        {/* Sticky Top Modal Header + Mode Switcher Tabs */}
        <div className="shrink-0 px-5 pt-4 pb-3.5 border-b border-stone-200 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h2 id="auth-modal-heading" className="text-base sm:text-lg font-bold text-[#14532D] leading-snug">
                  {mode === 'signin'
                    ? 'কৃষিবন্ধু অ্যাকাউন্টে সাইন ইন (Sign In)'
                    : 'নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)'}
                </h2>
                <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5">
                  ইউজার আইডি/ইমেইল ও পাসওয়ার্ড ব্যবহার করুন। অনুমোদিত অ্যাডমিন অ্যাকাউন্টে অ্যাডমিন প্যানেল দেখা যাবে।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs: Sign In / Sign Up */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F5F8F1] border border-stone-200 mt-3">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'text-[#173B2A] hover:bg-[#DCFCE7]/60'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>সাইন ইন (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'text-[#173B2A] hover:bg-[#DCFCE7]/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন নিবন্ধন (Sign Up)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {authError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2 font-semibold"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* ===================================================================
              SIGN IN VIEW
             =================================================================== */}
          {mode === 'signin' && (
            <div className="space-y-4">
              <form onSubmit={handleSignInSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="auth-signin-id"
                      className="block text-xs font-bold text-[#173B2A] mb-1"
                    >
                      ইউজার আইডি বা ইমেইল *
                    </label>
                    <input
                      id="auth-signin-id"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="যেমন: superadmin অথবা marketmanager"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm text-[#173B2A] focus:bg-white focus:border-[#166534] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="auth-signin-password"
                      className="block text-xs font-bold text-[#173B2A] mb-1"
                    >
                      পাসওয়ার্ড *
                    </label>
                    <div className="relative">
                      <input
                        id="auth-signin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="পাসওয়ার্ড লিখুন..."
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm text-[#173B2A] focus:bg-white focus:border-[#166534] focus:outline-none font-mono-tabular"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label="পাসওয়ার্ড দেখুন বা লুকান"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#173B2A]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন (Sign In)'}</span>
                </button>
              </form>

              {googleEnabled && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-50 text-[#173B2A] border border-stone-300 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                >
                  <svg aria-hidden="true" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.02 46.98 31.88 46.98 24.55Z" />
                    <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.97-6.19Z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                  </svg>
                  <span>{loading ? 'Google-এ যাচ্ছেন...' : 'Google দিয়ে চালিয়ে যান'}</span>
                </button>
              )}

              {demoAccounts.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#F5F8F1] border border-stone-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#14532D]">
                      <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0" />
                      <span>
                        ডেমো অ্যাকাউন্টের আইডি ও পাসওয়ার্ড
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500">ভূমিকা অনুযায়ী অ্যাডমিন অ্যাক্সেস থাকতে পারে</span>
                  </div>
                  {!demoAccountsApiAvailable && (
                    <p role="status" className="text-[11px] text-amber-800">
                      ডেমো আইডি দেখা যাচ্ছে। সাইন ইন করতে backend সংযুক্ত থাকতে হবে; Vercel frontend project-এ সঠিক VITE_API_BASE_URL সেট করুন।
                    </p>
                  )}

                  <div className="overflow-x-auto bg-white rounded-xl border border-stone-200/80">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50/90 text-stone-600">
                          <th className="py-1.5 px-2.5">ডেমো ভূমিকা</th>
                          <th className="py-1.5 px-2">ইউজার আইডি</th>
                          <th className="py-1.5 px-2">পাসওয়ার্ড</th>
                          <th className="py-1.5 px-2 hidden sm:table-cell">প্রাপ্য অ্যাক্সেস</th>
                          <th className="py-1.5 px-2.5 text-right">ব্যবহার</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200/70">
                        {demoAccounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-[#F5F8F1]/70 transition-colors">
                            <td className="py-1.5 px-2.5">
                              <div className="font-bold text-[#14532D] leading-tight">{acc.positionTitleBn}</div>
                              <div className="text-[10px] text-stone-500 leading-tight mt-0.5">{acc.nameBn}</div>
                            </td>
                            <td className="py-1.5 px-2 font-mono-tabular">
                              <div className="font-bold text-[#173B2A] leading-tight">{acc.username}</div>
                              <div className="text-[10px] text-stone-500 truncate max-w-[135px] leading-tight mt-0.5">{acc.email}</div>
                            </td>
                            <td className="py-1.5 px-2 font-mono-tabular font-bold text-[#166534] whitespace-nowrap">
                              {acc.password}
                            </td>
                            <td className="py-1.5 px-2 text-[11px] text-stone-600 max-w-[210px] hidden sm:table-cell">
                              <div className="line-clamp-2 leading-snug">
                                {acc.adminRole
                                  ? ADMIN_ROLE_DESCRIPTIONS_BN[acc.adminRole]
                                  : 'সাধারণ ওয়েবসাইট ও আমার কৃষি (অ্যাডমিন প্যানেল লুকানো থাকবে)'}
                              </div>
                            </td>
                            <td className="py-1.5 px-2.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setIdentifier(acc.username);
                                  setPassword(acc.password || '');
                                  setAuthError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#14532D] border border-stone-300 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                পূরণ করুন
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              SIGN UP VIEW
             =================================================================== */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-bold text-[#173B2A] mb-1"
                  >
                    আপনার পূর্ণ নাম (বাংলা) *
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={signupNameBn}
                    onChange={(e) => setSignupNameBn(e.target.value)}
                    placeholder="যেমন: মোঃ আব্দুল করিম"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-username"
                    className="block text-xs font-bold text-[#173B2A] mb-1"
                  >
                    ইউজার আইডি (Username) *
                  </label>
                  <input
                    id="signup-username"
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="যেমন: karim_farmer"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-bold text-[#173B2A] mb-1"
                  >
                    ইমেইল (ঐচ্ছিক)
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="karim@krishibondhu.bd"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-phone"
                    className="block text-xs font-bold text-[#173B2A] mb-1"
                  >
                    মোবাইল নম্বর *
                  </label>
                  <input
                    id="signup-phone"
                    type="text"
                    value={signupPhoneBn}
                    onChange={(e) => setSignupPhoneBn(e.target.value)}
                    placeholder="০১৭১১-০০০০০০"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-role"
                    className="block text-xs font-bold text-[#173B2A] mb-1"
                  >
                    সদস্যের ধরন
                  </label>
                  <select
                    id="signup-role"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-semibold"
                  >
                    <option value="কৃষক">কৃষক (Farmer)</option>
                    <option value="ক্রেতা">ক্রেতা / পাইকার (Buyer)</option>
                    <option value="বিশেষজ্ঞ">কৃষি বিশেষজ্ঞ (Agri Expert)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-bold text-[#173B2A] mb-1"
                  >
                    পাসওয়ার্ড তৈরি করুন *
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
                  />
                </div>
              </div>

              <div className="pt-1">
                <CascadingLocationSelector
                  divisions={divisions}
                  districts={districts}
                  upazilas={upazilas}
                  selectedDivisionId={signupDivId}
                  selectedDistrictId={signupDistId}
                  selectedUpazilaId={signupUpzId}
                  onChange={(sel) => {
                    setSignupDivId(sel.divisionId);
                    setSignupDistId(sel.districtId);
                    setSignupUpzId(sel.upazilaId);
                  }}
                  showSearch={false}
                  compact
                  idPrefix="signup-loc"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'নিবন্ধন হচ্ছে...' : 'অ্যাকাউন্ট তৈরি ও লগইন করুন'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
