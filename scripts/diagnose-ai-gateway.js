/**
 * AI Gateway Diagnostic Script
 * 
 * Run this in your browser console to diagnose why AI Gateway isn't working
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Copy and paste this entire script
 * 3. Run: diagnoseAIGateway()
 */

async function diagnoseAIGateway() {
  console.clear();
  console.log('🔍 AI Gateway Diagnostic Script\n');
  console.log('=' .repeat(60));
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // ============================================================================
  // Test 1: Check if supabase client exists
  // ============================================================================
  console.log('\n📋 Test 1: Supabase Client');
  console.log('-'.repeat(60));
  
  if (typeof supabase === 'undefined') {
    console.error('❌ FAIL: supabase client not found');
    console.log('   Make sure @supabase/supabase-js is loaded');
    results.failed.push('Supabase client not initialized');
    return results;
  } else {
    console.log('✅ PASS: supabase client found');
    results.passed.push('Supabase client initialized');
  }

  // ============================================================================
  // Test 2: Check environment variables
  // ============================================================================
  console.log('\n📋 Test 2: Environment Variables');
  console.log('-'.repeat(60));
  
  const supabaseUrl = process?.env?.NEXT_PUBLIC_SUPABASE_URL || import.meta?.env?.VITE_SUPABASE_URL;
  const anonKey = process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta?.env?.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ FAIL: SUPABASE_URL not found');
    console.log('   Set NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL');
    results.failed.push('SUPABASE_URL not configured');
  } else {
    console.log('✅ PASS: SUPABASE_URL =', supabaseUrl);
    results.passed.push('SUPABASE_URL configured');
  }
  
  if (!anonKey) {
    console.error('❌ FAIL: ANON_KEY not found');
    console.log('   Set NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
    results.failed.push('ANON_KEY not configured');
  } else {
    console.log('✅ PASS: ANON_KEY =', anonKey.slice(0, 20) + '...');
    results.passed.push('ANON_KEY configured');
  }

  if (!supabaseUrl || !anonKey) {
    console.log('\n⚠️  Cannot continue without environment variables');
    return results;
  }

  // ============================================================================
  // Test 3: Check authentication session
  // ============================================================================
  console.log('\n📋 Test 3: Authentication Session');
  console.log('-'.repeat(60));
  
  let accessToken = null;
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ FAIL: Error getting session:', error.message);
      results.failed.push(`Session error: ${error.message}`);
      return results;
    }
    
    if (!data.session) {
      console.error('❌ FAIL: No active session');
      console.log('   User is not logged in');
      console.log('   Sign in first, then run this script again');
      results.failed.push('No active session (user not logged in)');
      return results;
    }
    
    accessToken = data.session.access_token;
    console.log('✅ PASS: Active session found');
    console.log('   User:', data.session.user.email);
    console.log('   JWT prefix:', accessToken.slice(0, 20) + '...');
    console.log('   Expires:', new Date(data.session.expires_at * 1000).toLocaleString());
    results.passed.push('User authenticated');
    
  } catch (err) {
    console.error('❌ FAIL: Exception getting session:', err.message);
    results.failed.push(`Session exception: ${err.message}`);
    return results;
  }

  // ============================================================================
  // Test 4: Test Edge Function endpoint (OPTIONS - CORS preflight)
  // ============================================================================
  console.log('\n📋 Test 4: CORS Preflight (OPTIONS)');
  console.log('-'.repeat(60));
  
  const functionUrl = `${supabaseUrl}/functions/v1/ai_gateway`;
  console.log('URL:', functionUrl);
  
  try {
    const optionsRes = await fetch(functionUrl, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type, apikey',
      }
    });
    
    console.log('Status:', optionsRes.status);
    console.log('Headers:', Object.fromEntries(optionsRes.headers.entries()));
    
    if (optionsRes.status === 204 || optionsRes.status === 200) {
      console.log('✅ PASS: CORS preflight successful');
      results.passed.push('CORS configured correctly');
    } else {
      console.warn('⚠️  WARNING: Unexpected CORS response status:', optionsRes.status);
      results.warnings.push(`CORS status ${optionsRes.status} (expected 204)`);
    }
  } catch (err) {
    console.error('❌ FAIL: CORS preflight failed:', err.message);
    results.failed.push(`CORS preflight failed: ${err.message}`);
  }

  // ============================================================================
  // Test 5: Test Edge Function endpoint (POST - actual call)
  // ============================================================================
  console.log('\n📋 Test 5: Edge Function Call (POST)');
  console.log('-'.repeat(60));
  
  try {
    const payload = {
      tenant_id: 'test-diagnostic-tenant-00000000-0000-0000-0000-000000000000',
      mode: 'chat',
      use_case: 'signal_assistant',
      input: {
        question: 'Diagnostic test - please return a short response'
      }
    };
    
    console.log('Payload:', payload);
    console.log('Calling Edge Function...');
    
    const startTime = performance.now();
    const postRes = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log('Status:', postRes.status, postRes.statusText);
    console.log('Duration:', duration + 'ms');
    console.log('Headers:', Object.fromEntries(postRes.headers.entries()));
    
    const responseText = await postRes.text();
    
    if (postRes.ok) {
      console.log('✅ PASS: Edge Function responded successfully!');
      
      try {
        const responseJson = JSON.parse(responseText);
        console.log('Response:', responseJson);
        
        if (responseJson.ok) {
          console.log('✅ PASS: AI Gateway returned ok=true');
          console.log('   Provider:', responseJson.provider);
          console.log('   Model:', responseJson.model);
          console.log('   Output length:', responseJson.output?.length || 0, 'chars');
          results.passed.push('AI Gateway working correctly');
        } else {
          console.warn('⚠️  WARNING: AI Gateway returned ok=false');
          results.warnings.push('AI Gateway returned ok=false');
        }
      } catch (err) {
        console.warn('⚠️  WARNING: Response is not valid JSON');
        console.log('Response text:', responseText);
        results.warnings.push('Response not valid JSON');
      }
      
    } else {
      console.error('❌ FAIL: Edge Function returned error status');
      console.error('Response:', responseText);
      results.failed.push(`Edge Function error: ${postRes.status} ${responseText}`);
      
      // Try to parse error details
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.error) {
          console.error('Error details:', errorJson.error);
          
          // Specific error guidance
          if (errorJson.error.includes('GEMINI_API_KEY')) {
            console.log('\n💡 FIX: Set GEMINI_API_KEY secret:');
            console.log('   npx supabase secrets set GEMINI_API_KEY=your-key-here');
          }
          if (errorJson.error.includes('tenant')) {
            console.log('\n💡 FIX: Use a valid tenant_id from your database');
          }
          if (errorJson.error.includes('unauthorized') || errorJson.error.includes('JWT')) {
            console.log('\n💡 FIX: Check RLS policies on tenant table');
          }
        }
      } catch (err) {
        // Not JSON, already logged above
      }
    }
    
  } catch (err) {
    console.error('❌ FAIL: Exception calling Edge Function:', err.message);
    console.error('Stack:', err.stack);
    results.failed.push(`Edge Function exception: ${err.message}`);
    
    if (err.message.includes('CORS')) {
      console.log('\n💡 FIX: CORS error - check Edge Function returns correct headers');
    }
    if (err.message.includes('fetch')) {
      console.log('\n💡 FIX: Network error - check URL is correct');
    }
  }

  // ============================================================================
  // Test 6: Check callAIGateway function exists
  // ============================================================================
  console.log('\n📋 Test 6: callAIGateway Function');
  console.log('-'.repeat(60));
  
  if (typeof callAIGateway === 'undefined') {
    console.warn('⚠️  WARNING: callAIGateway function not found in global scope');
    console.log('   This is OK if it\'s imported in your components');
    results.warnings.push('callAIGateway not in global scope (might be in module)');
  } else {
    console.log('✅ PASS: callAIGateway function found');
    results.passed.push('callAIGateway function available');
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Passed: ${results.passed.length}`);
  results.passed.forEach(item => console.log('   •', item));
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
    results.warnings.forEach(item => console.log('   •', item));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(item => console.log('   •', item));
  }
  
  // Overall status
  console.log('\n' + '='.repeat(60));
  if (results.failed.length === 0) {
    console.log('🎉 AI GATEWAY IS WORKING!');
    console.log('You should now see activity in Supabase logs.');
  } else {
    console.log('❌ AI GATEWAY HAS ISSUES');
    console.log('Fix the failed tests above, then run this script again.');
  }
  console.log('='.repeat(60));
  
  return results;
}

// Export for use
if (typeof window !== 'undefined') {
  window.diagnoseAIGateway = diagnoseAIGateway;
  console.log('✅ Diagnostic script loaded!');
  console.log('Run: diagnoseAIGateway()');
}
