import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { AppView } from '../types';

interface AuthProps {
  onSuccess: () => void;
  onViewChange: (view: AppView) => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess, onViewChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConfirmationSent(false);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
            onSuccess();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // If signup is successful but no session, it means email confirmation is required
        if (data.user && !data.session) {
            setConfirmationSent(true);
        } else if (data.session) {
            onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
      return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-gray-500 mb-6">
                    We've sent a confirmation link to <strong>{email}</strong>.<br/>
                    Please click the link to activate your account.
                </p>
                <button 
                    onClick={() => { setIsLogin(true); setConfirmationSent(false); }}
                    className="text-emerald-600 font-medium hover:text-emerald-700"
                >
                    Back to Login
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-gray-500">
            {isLogin ? 'Login to save your history permanently.' : 'Sign up to sync your data across devices.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
            <div className="mt-0.5"><Lock size={14} /></div>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
           <button onClick={() => onViewChange(AppView.DASHBOARD)} className="text-gray-400 text-sm hover:text-gray-600 flex items-center justify-center gap-1 mx-auto">
             Continue as Guest <ArrowRight size={14} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;