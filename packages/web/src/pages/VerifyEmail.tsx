// ============================================================================
// Verify Email Page
// Email verification instructions and resend functionality
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/api-client';

export function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // If no email provided, redirect to signup
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  async function handleResendEmail() {
    try {
      setResending(true);
      setResendError(null);
      setResendSuccess(false);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('[VerifyEmail] Resend error:', error);
        setResendError(error.message || 'Failed to resend verification email');
        return;
      }

      console.log('[VerifyEmail] Verification email resent to:', email);
      setResendSuccess(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('[VerifyEmail] Unexpected error:', err);
      setResendError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setResending(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
      data-testid="verify-email-page"
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-slate-900 mb-2" data-testid="verify-email-title">
            Verify Your Email
          </h1>
          <p className="text-slate-600">
            Check your inbox to activate your account
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          {/* Success Message */}
          {resendSuccess && (
            <div 
              className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6"
              data-testid="resend-success-message"
              role="alert"
            >
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Verification email sent!</p>
                  <p className="text-sm mt-1">Check your inbox and spam folder.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {resendError && (
            <div 
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6"
              data-testid="resend-error-message"
              role="alert"
            >
              {resendError}
            </div>
          )}

          {/* Main Message */}
          <div className="mb-6">
            <p className="text-slate-900 mb-2">
              We sent a verification email to:
            </p>
            <p className="text-blue-600 font-medium mb-4" data-testid="email-display">
              {email}
            </p>
            <p className="text-sm text-slate-600">
              Please check your inbox and click the verification link to activate your account. 
              After verifying, you can sign in to OT Continuum.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Resend Email Button */}
            <button
              onClick={handleResendEmail}
              disabled={resending || resendSuccess}
              className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              data-testid="resend-email-button"
            >
              {resending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resending...
                </span>
              ) : resendSuccess ? (
                'Email Sent ✓'
              ) : (
                'Resend Verification Email'
              )}
            </button>

            {/* Email Instructions Toggle */}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full border border-slate-300 text-slate-700 py-2.5 rounded-md hover:bg-slate-50 transition-colors"
              data-testid="instructions-toggle-button"
            >
              {showInstructions ? 'Hide' : 'Show'} Email Instructions
            </button>

            {/* I've Verified - Sign In */}
            <Link
              to="/login"
              className="block w-full text-center border border-slate-300 text-slate-700 py-2.5 rounded-md hover:bg-slate-50 transition-colors"
              data-testid="go-to-login-button"
            >
              I've Verified — Sign In
            </Link>
          </div>

          {/* Email Instructions (Collapsible) */}
          {showInstructions && (
            <div 
              className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200"
              data-testid="email-instructions"
            >
              <h3 className="text-sm text-slate-900 mb-3">Email Not Arriving?</h3>
              
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 mt-0.5">•</span>
                  <span><strong>Check spam/junk folder:</strong> Sometimes verification emails are filtered.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 mt-0.5">•</span>
                  <span><strong>Wait a few minutes:</strong> Email delivery can take 1-5 minutes.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 mt-0.5">•</span>
                  <span><strong>Check the email address:</strong> Make sure {email} is correct.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 mt-0.5">•</span>
                  <span><strong>Add to safe senders:</strong> Add noreply@supabase.io to your contacts.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 mt-0.5">•</span>
                  <span><strong>Resend:</strong> Use the button above to request a new verification email.</span>
                </li>
              </ul>

              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Important:</strong> You must verify your email before you can sign in to OT Continuum. 
                  This is a security requirement to ensure your account is secure.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wrong Email? */}
        <div className="text-center">
          <p className="text-sm text-slate-600">
            Wrong email address?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium" data-testid="back-to-signup-link">
              Sign up again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
