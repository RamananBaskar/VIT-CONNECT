import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { api } from '../utils/api';

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authUser,
    setAuthUser,
    logout,
    canPostEvents,
    setPostEventOpen,
  } = useCampus();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin users list
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (authModalOpen && authUser?.role === 'admin') {
      setLoadingUsers(true);
      api
        .getUsers()
        .then((res) => setUsers(res.users || []))
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  }, [authModalOpen, authUser]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      setLoading(true);
      if (mode === 'login') {
        const res = await api.login(email, password);
        localStorage.setItem('vit_connect_token', res.token);
        setAuthUser(res.user);
      } else {
        const res = await api.register({ name, email, password, clubName });
        localStorage.setItem('vit_connect_token', res.token);
        setAuthUser(res.user);
        setMessage(res.message || 'Registered! Pending Admin approval.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveToggle = async (u) => {
    try {
      const res = await api.approveUser(u.id, !u.isApproved);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? res.user : item))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md hud-glass rounded-2xl p-5 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            {authUser?.role === 'admin' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <User className="w-5 h-5 text-blue-400" />
            )}
            <h2 className="text-base font-bold text-white">
              {authUser ? 'Campus Account' : 'Club & Admin Portal'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {authUser ? (
          <div className="mt-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{authUser.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {authUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{authUser.email}</p>
              {authUser.clubName && (
                <p className="text-xs text-blue-300 font-medium">{authUser.clubName}</p>
              )}

              <div className="pt-1.5">
                {authUser.role === 'admin' || authUser.isApproved ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approved to post campus events
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Admin approval to post events
                  </span>
                )}
              </div>
            </div>

            {canPostEvents && (
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(false);
                  setPostEventOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post New Event</span>
              </button>
            )}

            {/* Admin Club Member Approval Panel */}
            {authUser.role === 'admin' && (
              <div className="pt-2 border-t border-slate-700/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Admin: Club Member Approvals
                </h3>
                {loadingUsers ? (
                  <p className="text-xs text-slate-400">Loading users...</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {users
                      .filter((u) => u.role !== 'admin')
                      .map((u) => (
                        <div
                          key={u.id}
                          className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {u.clubName || u.email}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApproveToggle(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 ${
                              u.isApproved
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300'
                                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                            }`}
                          >
                            {u.isApproved ? 'Approved' : 'Approve'}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                Register Club
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Full Name</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Club Name</label>
                    <input
                      required
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      placeholder="e.g. IEEE Computer Society"
                      className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="club@vit.ac.in"
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Submit for Approval'}
              </button>
            </form>

            {mode === 'login' && (
              <div className="mt-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Demo Credentials:</div>
                <div>
                  Admin:{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@vit.ac.in');
                      setPassword('Admin@123');
                    }}
                    className="text-blue-400 hover:underline cursor-pointer"
                  >
                    admin@vit.ac.in / Admin@123
                  </button>
                </div>
                <div>
                  Club:{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('club@vit.ac.in');
                      setPassword('Club@123');
                    }}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    club@vit.ac.in / Club@123
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
