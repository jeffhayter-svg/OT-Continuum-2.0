// ============================================================================
// Signup Page
// Create new user account with professional industrial SaaS styling
// ============================================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/api-client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Normalize inputs
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      // Validation
      if (normalizedPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (normalizedPassword !== confirmPassword.trim()) {
        setError('Passwords do not match');
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
        options: {
          data: {
            name: fullName.trim(),
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        // User-friendly error messages
        if (signUpError.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (signUpError.message.includes('Password')) {
          setError('Password must be at least 8 characters and contain a mix of letters and numbers.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        // If user.identities is empty, email confirmation is required
        const needsEmailConfirmation = !data.user.identities || data.user.identities.length === 0;
        
        console.log('[Signup] User created:', {
          id: data.user.id,
          email: data.user.email,
          confirmed_at: data.user.confirmed_at,
          identities: data.user.identities,
          needsEmailConfirmation,
        });

        if (needsEmailConfirmation || !data.user.confirmed_at) {
          // Email verification required - route to verify email screen
          navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
        } else {
          // Email confirmed (or confirmation disabled) - redirect to login
          navigate('/login?signup=success');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" data-testid="signup-page">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-slate-900 mb-2" data-testid="signup-title">
            OT Continuum
          </h1>
          <p className="text-slate-600">
            Create your account
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-slate-900 mb-6" data-testid="form-title">
            Sign Up
          </h2>

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6"
              data-testid="error-message"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm text-slate-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="name-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="email-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="password-input"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="confirm-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              data-testid="signup-button"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium" data-testid="login-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm text-blue-900 mb-2">After signup</h3>
          <p className="text-xs text-blue-800">
            Your account will be created with basic access. An administrator will need to 
            assign you to a tenant organization and grant appropriate roles and site permissions 
            before you can access operational data.
          </p>
          
          {/* Debug Info - Dev Only */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 pt-3 border-t border-blue-300" data-testid="debug-info">
              <p className="text-xs text-blue-700 font-mono mb-1">
                Supabase URL: https://{projectId}.supabase.co
              </p>
              <p className="text-xs text-blue-700 font-mono mb-1">
                Anon Key: {publicAnonKey.substring(0, 20)}...
              </p>
              <p className="text-xs text-blue-600 mt-2">
                ℹ️ Using official @supabase/supabase-js client
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}