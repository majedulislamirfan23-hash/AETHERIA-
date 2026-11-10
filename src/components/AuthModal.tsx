/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount } from '../types/game';
import { accountManager } from '../systems/account';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Cloud, 
  LogOut, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface AuthModalProps {
  activeUser: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  activeUser,
  onUserChange,
  onClose,
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'cloud'>(activeUser ? 'cloud' : 'login');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState('#38bdf8');
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const avatarColors = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f43f5e', '#a855f7'];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = accountManager.login(email, password);
    if (!res.success) {
      setFeedback({ text: res.error || 'Failed to login', error: true });
    } else {
      soundEngine.playLevelUp();
      const updated = accountManager.getActiveUser();
      onUserChange(updated);
      setFeedback({ text: 'Signed in successfully!' });
      setTimeout(() => {
        setTab('cloud');
        setFeedback(null);
      }, 1000);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const res = accountManager.signUp(username, email, password, avatarColor);
    if (!res.success) {
      setFeedback({ text: res.error || 'Failed to sign up', error: true });
    } else {
      soundEngine.playLevelUp();
      const updated = accountManager.getActiveUser();
      onUserChange(updated);
      setFeedback({ text: 'Account created and secured!' });
      setTimeout(() => {
        setTab('cloud');
        setFeedback(null);
      }, 1000);
    }
  };

  const handleLogout = () => {
    soundEngine.playUiClick();
    accountManager.logout();
    onUserChange(null);
    setTab('login');
    setFeedback({ text: 'Logged out. Now running in local guest mode.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCloudSync = () => {
    setIsSyncing(true);
    soundEngine.playCoinJingle();
    setTimeout(() => {
      const res = accountManager.triggerCloudSync();
      setIsSyncing(false);
      setFeedback({ text: `Cloud Backup Synced! Token: ${res.syncToken.substring(0, 14)}...` });
      setTimeout(() => setFeedback(null), 4000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">AETHERIA CLOUD ACCOUNT</h2>
              <div className="text-[11px] text-slate-400 font-mono">
                Secure cross-device profile & world backup
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950 px-6 pt-2">
          {!activeUser ? (
            <>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setTab('login');
                  setFeedback(null);
                }}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'border-sky-400 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setTab('signup');
                  setFeedback(null);
                }}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  tab === 'signup'
                    ? 'border-sky-400 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                soundEngine.playUiClick();
                setTab('cloud');
              }}
              className="flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-sky-400 text-sky-400"
            >
              Account & Cloud Sync
            </button>
          )}
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                feedback.error
                  ? 'bg-rose-950/70 border border-rose-500/60 text-rose-300'
                  : 'bg-emerald-950/70 border border-emerald-500/60 text-emerald-300'
              }`}
            >
              {feedback.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="hero@aetheria.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
              >
                Log In & Sync Worlds
              </button>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Hero Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="ValiantKnight"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="hero@aetheria.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Select Emblem Color
                </label>
                <div className="flex gap-2">
                  {avatarColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                        avatarColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Create Account & Enable Cloud
              </button>
            </form>
          )}

          {tab === 'cloud' && activeUser && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-base text-slate-950"
                    style={{ backgroundColor: activeUser.avatarColor }}
                  >
                    {activeUser.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{activeUser.username}</div>
                    <div className="text-xs text-slate-400 font-mono">{activeUser.email}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                  <div>Cloud Status: <span className="text-emerald-400 font-bold">Synchronized</span></div>
                  <div>Saved Realms: <span className="text-white">{activeUser.worlds.length} worlds</span></div>
                  <div>Member Since: {new Date(activeUser.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCloudSync}
                  disabled={isSyncing}
                  className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Backup'}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
