// ============================================================================
// JWT Debug Panel
// Displays current JWT tokens and session information for debugging
// Only renders in development mode
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase, apiClient } from '../lib/api-client';
import { decodeJWT, validateJWT, logJWT } from '../lib/jwt-debug-utils';
import { publicAnonKey } from '../../../../utils/supabase/info';

export function JWTDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Only show in development - always show since this is a dev prototype
  const isDevelopment = true; // Always enabled for development

  useEffect(() => {
    if (!isDevelopment) return;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserToken(session?.access_token || null);
      setSessionInfo(session);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserToken(session?.access_token || null);
      setSessionInfo(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDevelopment]);

  if (!isDevelopment) {
    return null;
  }

  const userDecoded = userToken ? decodeJWT(userToken) : null;
  const userValidation = userToken ? validateJWT(userToken) : null;
  const anonDecoded = decodeJWT(publicAnonKey);

  const copyToClipboard = (text: string, label: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert(`${label} copied to clipboard!`))
        .catch(() => {
          // Fallback if Clipboard API fails
          fallbackCopy(text, label);
        });
    } else {
      // Use fallback for browsers that don't support Clipboard API
      fallbackCopy(text, label);
    }
  };

  const fallbackCopy = (text: string, label: string) => {
    // Create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    try {
      textarea.select();
      document.execCommand('copy');
      alert(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Show the text in a prompt as last resort
      prompt(`Copy this ${label}:`, text);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const logToConsole = () => {
    console.clear();
    console.log('='.repeat(80));
    console.log('🔐 JWT DEBUG INFORMATION');
    console.log('='.repeat(80));
    
    if (publicAnonKey) {
      logJWT(publicAnonKey, 'Supabase Anon Key (Public)');
    }
    
    if (userToken) {
      logJWT(userToken, 'User Access Token');
      console.log('\n✅ Validation:', userValidation);
    } else {
      console.warn('⚠️  No user session found');
    }
    
    console.log('\n📋 Session Info:', sessionInfo);
    console.log('='.repeat(80));
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const result = await apiClient.testConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({ 
        ok: false, 
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: userToken ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        🔐 JWT Debug {userToken ? '✅' : '❌'}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            right: 0,
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '500px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '16px' }}>🔐 JWT Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* Actions */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={logToConsole}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              📋 Log to Console
            </button>
            <button
              onClick={() => {
                localStorage.setItem('DEBUG_JWT', 'true');
                alert('Full JWT debugging enabled! Refresh the page and check console.');
              }}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🔬 Enable Full Debug
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('DEBUG_JWT');
                alert('Full JWT debugging disabled.');
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Disable Full Debug
            </button>
            <button
              onClick={testConnection}
              style={{
                backgroundColor: '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* User Token Section */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>👤 User Access Token</h4>
            {userToken ? (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: userDecoded?.isExpired ? '#ef4444' : '#10b981' }}>
                    {userDecoded?.isExpired ? '❌ EXPIRED' : '✅ VALID'}
                  </span>
                </div>
                {userDecoded && (
                  <>
                    <div style={{ marginBottom: '5px' }}><strong>User ID:</strong> {userDecoded.payload.sub}</div>
                    <div style={{ marginBottom: '5px' }}><strong>Email:</strong> {userDecoded.payload.email || 'N/A'}</div>
                    <div style={{ marginBottom: '5px' }}><strong>Role:</strong> {userDecoded.payload.role}</div>
                    <div style={{ marginBottom: '5px' }}><strong>Issued:</strong> {userDecoded.issuedAt?.toLocaleString()}</div>
                    <div style={{ marginBottom: '10px' }}><strong>Expires:</strong> {userDecoded.expiresAt?.toLocaleString()}</div>
                  </>
                )}
                {userValidation && (
                  <>
                    {userValidation.errors.length > 0 && (
                      <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
                        <strong>❌ Errors:</strong>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                          {userValidation.errors.map((err, i) => (
                            <li key={i} style={{ color: '#991b1b' }}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {userValidation.warnings.length > 0 && (
                      <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px' }}>
                        <strong>⚠️ Warnings:</strong>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                          {userValidation.warnings.map((warn, i) => (
                            <li key={i} style={{ color: '#92400e' }}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ 
                    backgroundColor: '#1f2937', 
                    color: '#10b981', 
                    padding: '10px', 
                    borderRadius: '4px',
                    wordBreak: 'break-all',
                    fontSize: '10px',
                    marginBottom: '5px',
                  }}>
                    {userToken}
                  </div>
                  <button
                    onClick={() => copyToClipboard(userToken, 'User Token')}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    📋 Copy Token
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: '#ef4444' }}>❌ No user session found. Please log in.</div>
            )}
          </div>

          {/* Anon Key Section */}
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>🔑 Supabase Anon Key</h4>
            {anonDecoded && (
              <>
                <div style={{ marginBottom: '5px' }}><strong>Role:</strong> {anonDecoded.payload.role}</div>
                <div style={{ marginBottom: '5px' }}><strong>Project:</strong> {anonDecoded.payload.ref}</div>
                <div style={{ marginBottom: '10px' }}><strong>Expires:</strong> {anonDecoded.expiresAt?.toLocaleString()}</div>
              </>
            )}
            <div style={{ marginTop: '10px' }}>
              <div style={{ 
                backgroundColor: '#1f2937', 
                color: '#60a5fa', 
                padding: '10px', 
                borderRadius: '4px',
                wordBreak: 'break-all',
                fontSize: '10px',
                marginBottom: '5px',
              }}>
                {publicAnonKey}
              </div>
              <button
                onClick={() => copyToClipboard(publicAnonKey, 'Anon Key')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                📋 Copy Key
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#eff6ff', borderRadius: '6px', fontSize: '11px' }}>
            <strong>💡 Tips:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Click "Log to Console" to see detailed JWT information</li>
              <li>Enable "Full Debug" to see complete tokens in API requests</li>
              <li>Copy tokens to test in API clients like Postman</li>
              <li>Check expiration times to debug session timeout issues</li>
            </ul>
          </div>

          {/* Connection Status */}
          {connectionStatus && (
            <div
              style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: connectionStatus.ok ? '#ecfdf5' : '#fef3c7',
                borderRadius: '6px',
                fontSize: '11px',
                color: connectionStatus.ok ? '#16a34a' : '#92400e',
              }}
            >
              <strong>🌐 Connection Status:</strong> {connectionStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}