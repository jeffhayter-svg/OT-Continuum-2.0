import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase-client';
import { dbClient } from '../lib/db-client';
import type { User } from '@supabase/supabase-js';
import type { TenantContext as TenantContextType } from '../pages/TenantResolver';
import { isFigmaPreviewMode, getPreviewSession } from '../lib/preview-mode';

interface TenantContextValue {
  user: User | null;
  userId: string | null; // SINGLE SOURCE OF TRUTH
  tenantContext: TenantContextType | null;
  loading: boolean;
  setTenantContext: (context: TenantContextType | null) => void;
  clearAuth: () => void;
  redirectToLogin: () => void;
  redirectToResolver: () => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // SINGLE SOURCE OF TRUTH
  const [tenantContext, setTenantContextState] = useState<TenantContextType | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if running in Figma Preview Mode
  const isPreviewMode = isFigmaPreviewMode();

  useEffect(() => {
    // In preview mode, set mock user and skip auth
    if (isPreviewMode) {
      console.log('[TenantContext] Preview mode - setting mock user');
      const previewSession = getPreviewSession();
      setUser(previewSession.user as User);
      setUserId(previewSession.user.id);
      setLoading(false);
      return;
    }

    console.log('[TenantContext] Initializing - checking for existing session');
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[TenantContext] Session error:', error);
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        console.log('[TenantContext] ✓ Session found - User ID:', session.user.id);
        setUser(session.user);
        setUserId(session.user.id); // SINGLE SOURCE OF TRUTH
      } else {
        console.log('[TenantContext] ✗ No session found');
        setUser(null);
        setUserId(null); // SINGLE SOURCE OF TRUTH
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[TenantContext] Auth state changed:', event);
      
      if (session?.user) {
        console.log('[TenantContext] User authenticated - User ID:', session.user.id);
        setUser(session.user);
        setUserId(session.user.id); // SINGLE SOURCE OF TRUTH
      } else {
        console.log('[TenantContext] User logged out');
        setUser(null);
        setUserId(null); // SINGLE SOURCE OF TRUTH
      }
      
      // Clear tenant context on logout
      if (!session) {
        setTenantContextState(null);
        dbClient.clearTenantContext();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load tenant context from localStorage on mount (only after user is set)
  useEffect(() => {
    if (loading) return; // Wait for auth to resolve
    
    if (user && !tenantContext) {
      const stored = localStorage.getItem('ot_tenant_context');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('[TenantContext] Restored from localStorage:', parsed);
          
          // Ensure userId is present in context
          if (!parsed.userId && user.id) {
            console.log('[TenantContext] Adding user_id to restored context');
            parsed.userId = user.id;
          }
          
          setTenantContextState(parsed);
          
          // Initialize dbClient with restored context (ensure userId is set)
          const userId = parsed.userId || user.id;
          console.log('[TenantContext] Initializing dbClient with tenantId:', parsed.tenantId, 'userId:', userId);
          dbClient.setTenantContext(parsed.tenantId, userId);
        } catch (err) {
          console.error('[TenantContext] Failed to parse stored context:', err);
          localStorage.removeItem('ot_tenant_context');
        }
      }
    }
  }, [user, loading]);

  function setTenantContext(context: TenantContextType | null) {
    console.log('[TenantContext] Setting tenant context:', context);
    setTenantContextState(context);
    
    if (context) {
      // Ensure userId is present
      if (!context.userId && user?.id) {
        console.log('[TenantContext] Adding user_id to context before saving');
        context.userId = user.id;
      }
      
      localStorage.setItem('ot_tenant_context', JSON.stringify(context));
      
      // Initialize dbClient with tenant context (ensure userId is set)
      const userId = context.userId || user?.id;
      if (!userId) {
        console.error('[TenantContext] ERROR: Cannot initialize dbClient - userId is missing!');
        return;
      }
      
      console.log('[TenantContext] Initializing dbClient with tenantId:', context.tenantId, 'userId:', userId);
      dbClient.setTenantContext(context.tenantId, userId);
    } else {
      localStorage.removeItem('ot_tenant_context');
      dbClient.clearTenantContext();
    }
  }

  function clearAuth() {
    console.log('[TenantContext] Clearing auth');
    setUser(null);
    setUserId(null); // SINGLE SOURCE OF TRUTH
    setTenantContextState(null);
    localStorage.removeItem('ot_tenant_context');
    dbClient.clearTenantContext();
  }

  function redirectToLogin() {
    console.log('[TenantContext] Redirecting to login');
    window.location.href = '/';
  }

  function redirectToResolver() {
    console.log('[TenantContext] Redirecting to tenant resolver');
    window.location.href = '/?resolver=true';
  }

  return (
    <TenantContext.Provider
      value={{
        user,
        userId, // SINGLE SOURCE OF TRUTH
        tenantContext,
        loading,
        setTenantContext,
        clearAuth,
        redirectToLogin,
        redirectToResolver,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
}