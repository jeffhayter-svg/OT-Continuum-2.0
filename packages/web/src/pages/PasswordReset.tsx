// ============================================================================
// Password Reset Page
// Send password reset email via Supabase Auth
// ============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from "../lib/supabase";

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
      data-testid="password-reset-page"
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-slate-900 mb-2" data-testid="page-title">
            Reset Password
          </h1>
          <p className="text-slate-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          {success ? (
            <div data-testid="success-message">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded mb-6">
                <p className="mb-1">Reset link sent!</p>
                <p className="text-sm">
                  Check your email for a password reset link. If you don't see it, check your spam folder.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <button
                  onClick={() => setSuccess(false)}
                  className="text-slate-600 hover:text-slate-900 text-sm"
                  data-testid="send-another-button"
                >
                  Send another link
                </button>
                
                <div>
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    data-testid="back-to-login-link"
                  >
                    â† Back to Login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4"
                  data-testid="error-message"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-6">
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
                    className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="email-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="reset-button"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-slate-600 hover:text-slate-900"
                  data-testid="back-link"
                >
                  â† Back to Login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="bg-slate-100 rounded-lg p-4">
          <p className="text-xs text-slate-700">
            <strong>Note:</strong> Password reset links are valid for 1 hour. 
            If the link expires, you can request a new one.
          </p>
        </div>
      </div>
    </div>
  );
}


