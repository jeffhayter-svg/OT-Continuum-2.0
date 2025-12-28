// ============================================================================
// Login Page
// Supabase authentication with professional industrial SaaS styling
// ============================================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, supabaseConfigValid, supabaseUrl } from '../lib/api-client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate configuration on component load
  const configValid = publicAnonKey && publicAnonKey.length > 50;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Normalize inputs FIRST
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      console.group('[Login] 🔐 Sign In Attempt');
      console.log('Email (normalized):', normalizedEmail);
      console.log('Password length:', normalizedPassword.length);
      console.log('Supabase URL:', `https://${projectId}.supabase.co`);
      console.log('Using method: Direct fetch with apikey in URL');
      console.groupEnd();

      // Direct fetch to token endpoint with apikey in URL (not header)
      // This is required because Figma Make preview drops headers
      const tokenUrl = `https://${projectId}.supabase.co/auth/v1/token?grant_type=password&apikey=${publicAnonKey}`;
      
      console.log('[Login] 📡 Making request to:', tokenUrl.replace(publicAnonKey, 'ANON_KEY'));

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      console.log('[Login] 📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.group('[Login] ❌ Sign-in Error');
        console.error('Status:', response.status);
        console.error('Error Data:', errorData);
        console.groupEnd();
        
        // Check if error is due to unverified email
        const errorMessage = errorData.error_description || errorData.message || errorData.error || '';
        const isUnverifiedEmail = 
          errorMessage.includes('Email not confirmed') ||
          errorMessage.includes('email_not_confirmed');

        if (isUnverifiedEmail) {
          console.log('[Login] ⚠️  Email not verified - routing to verify email screen');
          navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
          return;
        }
        
        // Handle other errors with user-friendly messages
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid')) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError('Unable to sign in. Please check your credentials and try again.');
        }
        return;
      }

      const data = await response.json();

      console.group('[Login] ✅ Login Successful');
      console.log('Access Token (preview):', data.access_token?.substring(0, 30) + '...');
      console.log('User ID:', data.user?.id);
      console.log('User Email:', data.user?.email);
      console.groupEnd();

      // Store session in Supabase client
      // This ensures the session is available to the rest of the app
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        console.error('[Login] ❌ Error setting session:', sessionError);
        setError('Failed to establish session. Please try again.');
        return;
      }

      console.log('[Login] ✅ Session established, navigating to /tenant-resolver');
      
      // Successfully logged in - navigate to tenant resolver
      navigate('/tenant-resolver');
    } catch (err) {
      console.group('[Login] ❌ Unexpected Error');
      console.error('Error:', err);
      console.error('Error Type:', err instanceof Error ? err.constructor.name : typeof err);
      console.groupEnd();
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" data-testid="login-page">
      {/* Config Validation Banner */}
      {!configValid && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-3 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold">⚠️ Supabase Configuration Error</p>
                <p className="text-sm">Anon key is missing or invalid - authentication will fail</p>
              </div>
            </div>
            <div className="text-xs font-mono">
              Key length: {publicAnonKey?.length || 0} (need &gt; 50)
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-slate-900 mb-2" data-testid="login-title">
            OT Continuum
          </h1>
          <p className="text-slate-600">
            Operational Technology Risk Management Platform
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-slate-900 mb-6" data-testid="form-title">
            Sign In
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

          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm text-slate-700">
                  Password
                </label>
                <Link 
                  to="/password-reset" 
                  className="text-xs text-blue-600 hover:text-blue-800"
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              data-testid="login-button"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium" data-testid="signup-link">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
          <h3 className="text-sm text-slate-900 mb-2">Development Environment</h3>
          <p className="text-xs text-slate-600">
            This is a prototype system. Create an account to get started, or contact your 
            administrator for access credentials.
          </p>
          
          {/* Debug Info - Dev Only */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 pt-3 border-t border-slate-300" data-testid="debug-info">
              <p className="text-xs text-slate-500 font-mono mb-1">
                Supabase URL: https://{projectId}.supabase.co
              </p>
              <p className="text-xs text-slate-500 font-mono mb-1">
                Anon Key: {publicAnonKey.substring(0, 20)}...
              </p>
              <p className="text-xs text-slate-400 mt-2">
                ℹ️ Using direct fetch with apikey in URL query param
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}