import React, { useState } from 'react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthScreen = ({ onAuthSuccess }: AuthScreenProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { email, password, companyName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await res.json();
      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4">
            I
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invoicer</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase">Company Name</label>
              <input
                className="input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <button type="submit" className="btn-primary w-full py-3 mt-4">
            {isLogin ? 'Sign In' : 'Get Started'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-zinc-900 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
