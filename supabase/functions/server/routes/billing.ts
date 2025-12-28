import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getAuthenticatedUser } from '../utils/auth.ts';

const billing = new Hono();

// List billing plans
billing.get('/plans', async (c) => {
  try {
    const { user, supabase, error } = await getAuthenticatedUser(c);
    if (error || !user) return error;

    const { data, error: dbError } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (dbError) {
      console.error('Failed to fetch billing plans:', dbError);
      return c.json({
        error: 'Internal Server Error',
        message: 'Failed to fetch billing plans',
      }, 500);
    }

    return c.json({ data: data || [] });
  } catch (error) {
    console.error('List billing plans exception:', error);
    return c.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default billing;
