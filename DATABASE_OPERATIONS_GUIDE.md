# Database Operations Guide

## Automatic Tenant Scoping & RLS Error Handling

This guide explains how to perform database operations with automatic `tenant_id` and `created_by` fields, while relying on Row Level Security (RLS) policies for data isolation.

---

## Overview

The `dbClient` provides a wrapper around Supabase that:

1. **Automatically adds `tenant_id` and `created_by`** on all inserts
2. **Never queries cross-tenant data** (relies on RLS)
3. **Handles RLS errors gracefully** (401/403) with user-friendly messages
4. **Logs errors to AuthDebugPanel** in development mode

---

## Setup

The `dbClient` is automatically initialized when a user logs in and tenant context is resolved:

```typescript
// This happens automatically in TenantContext.tsx
import { dbClient } from './lib/db-client';

// After tenant resolution:
dbClient.setTenantContext(tenantId, userId);

// On logout:
dbClient.clearTenantContext();
```

---

## Usage in Components

### Import the dbClient

```typescript
import { dbClient } from '../lib/db-client';
// Or use the hook:
import { useDbClient } from '../lib/db-client';
```

---

## Database Operations

### 1. SELECT - Reading Data

**✅ CORRECT**: No tenant filtering needed

```typescript
// ✅ Let RLS handle tenant scoping
const { data, error } = await dbClient.select<Asset>('assets');

if (error) {
  if (error.isRlsError) {
    console.error('Permission denied:', error.message);
    // Show user-friendly error
  } else {
    console.error('Database error:', error.message);
  }
}

// data only contains records for current tenant
```

**❌ WRONG**: Don't manually filter by tenant_id

```typescript
// ❌ DON'T DO THIS - RLS already handles it!
const { data } = await supabase
  .from('assets')
  .select('*')
  .eq('tenant_id', myTenantId); // Redundant!
```

---

### 2. INSERT - Creating Records

**✅ CORRECT**: No tenant_id or created_by needed

```typescript
// ✅ dbClient automatically adds tenant_id and created_by
const { data, error } = await dbClient.insert<Asset>('assets', {
  site_id: 'site-uuid',
  name: 'New PLC Controller',
  asset_type: 'plc',
  status: 'operational',
  // tenant_id → automatically set to current tenant
  // created_by → automatically set to current user
});

if (error) {
  if (error.isRlsError) {
    setError('You don\'t have permission to create assets.');
  } else {
    setError(`Failed: ${error.message}`);
  }
}
```

**Manual override** (if needed):

```typescript
// If you need to override (rare):
const { data, error } = await dbClient.insert<Asset>('assets', {
  name: 'Asset',
  tenant_id: 'specific-tenant-id', // Will use this instead
  created_by: 'specific-user-id',  // Will use this instead
  // ... other fields
});
```

---

### 3. INSERT MANY - Batch Insert

```typescript
const newAssets = [
  { name: 'Sensor A', asset_type: 'sensor', status: 'operational', site_id: 'site-1' },
  { name: 'Sensor B', asset_type: 'sensor', status: 'operational', site_id: 'site-1' },
  { name: 'Sensor C', asset_type: 'sensor', status: 'operational', site_id: 'site-1' },
];

// ✅ All records automatically get tenant_id and created_by
const { data, error } = await dbClient.insertMany<Asset>('assets', newAssets);

if (error) {
  console.error('Batch insert failed:', error);
}

console.log(`Created ${data?.length} assets`);
```

---

### 4. UPDATE - Modifying Records

```typescript
// ✅ Update by ID - RLS ensures tenant scoping
const { data, error } = await dbClient.update<Asset>('assets', assetId, {
  status: 'maintenance',
  updated_at: new Date().toISOString(), // Optional
});

if (error) {
  if (error.isRlsError) {
    setError('You can\'t update assets from another tenant.');
  } else {
    setError(`Update failed: ${error.message}`);
  }
}
```

**RLS Protection**: If the asset doesn't belong to your tenant, RLS will block the update and return a permission error.

---

### 5. DELETE - Removing Records

```typescript
// ✅ Delete by ID - RLS ensures tenant scoping
const { error } = await dbClient.delete('assets', assetId);

if (error) {
  if (error.isRlsError) {
    setError('You can\'t delete assets from another tenant.');
  } else {
    setError(`Delete failed: ${error.message}`);
  }
}
```

**RLS Protection**: If the asset doesn't belong to your tenant, RLS will block the delete.

---

### 6. RPC Calls

```typescript
const { data, error } = await dbClient.rpc<MyReturnType>('my_function_name', {
  param1: 'value1',
  param2: 'value2',
});

if (error) {
  console.error('RPC failed:', error);
}
```

---

## Error Handling

### Error Object Structure

```typescript
interface DbError {
  code: string;           // Postgres error code (e.g., '42501')
  message: string;        // Human-readable message
  details?: string;       // Additional details
  hint?: string;          // Postgres hint
  table?: string;         // Table name
  action?: string;        // Operation (insert, update, delete, select)
  isRlsError: boolean;    // True if this is an RLS permission error
}
```

### Detecting RLS Errors

The `dbClient` automatically detects RLS errors based on:
- Error code `42501` (insufficient_privilege)
- Error code `PGRST301` (JWT expired)
- Error messages containing: "permission denied", "policy", "row level security", "rls", "not authorized", "forbidden"

### Handling Errors in UI

```typescript
async function loadData() {
  const { data, error } = await dbClient.select<Asset>('assets');
  
  if (error) {
    if (error.isRlsError) {
      // Show user-friendly permission error
      setError('You don\'t have permission to view this data. Please contact your administrator.');
      
      // Log details for debugging
      console.error('[RLS Error]', {
        table: error.table,
        action: error.action,
        code: error.code,
        message: error.message,
      });
    } else {
      // Show generic error
      setError(`Failed to load data: ${error.message}`);
    }
    return;
  }
  
  // Success
  setAssets(data || []);
}
```

---

## RLS Error Logging

All RLS errors are automatically logged to the **AuthDebugPanel** in development mode:

```
🚫 RLS Errors
┌─────────────────────────────────┐
│ assets • insert                 │
│ permission denied for table     │
│ Code: 42501                     │
│ 12:34:56 PM                     │
└─────────────────────────────────┘

💡 Check that RLS policies are applied and GRANTs are executed
```

The debug panel shows:
- Table name
- Action (insert, update, delete, select)
- Error code
- Error message
- Timestamp

---

## Tables That Require Tenant Scoping

Always use `dbClient` for these tables:

- ✅ `assets` - Asset inventory
- ✅ `risk_register` - Risk assessments
- ✅ `risk_events` - Risk event history
- ✅ `signals` - Signal/telemetry data
- ✅ `sites` - Site/facility data
- ✅ `work_items` - Work orders and tasks
- ✅ Any custom tables with `tenant_id` column

---

## Example: Complete CRUD Component

```typescript
import React, { useState, useEffect } from 'react';
import { dbClient } from '../lib/db-client';

interface Risk {
  id: string;
  tenant_id: string;
  title: string;
  severity: string;
  status: string;
  created_by: string;
}

export function RiskManager() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load risks on mount
  useEffect(() => {
    loadRisks();
  }, []);

  async function loadRisks() {
    const { data, error } = await dbClient.select<Risk>('risk_register');
    
    if (error) {
      if (error.isRlsError) {
        setError('Permission denied. Contact your admin.');
      } else {
        setError(`Failed to load risks: ${error.message}`);
      }
      return;
    }
    
    setRisks(data || []);
  }

  async function createRisk(title: string, severity: string) {
    const { data, error } = await dbClient.insert<Risk>('risk_register', {
      title,
      severity,
      status: 'open',
      // tenant_id and created_by added automatically
    });
    
    if (error) {
      if (error.isRlsError) {
        setError('You can\'t create risks in this organization.');
      } else {
        setError(`Failed to create risk: ${error.message}`);
      }
      return;
    }
    
    // Refresh list
    loadRisks();
  }

  async function updateRisk(id: string, updates: Partial<Risk>) {
    const { data, error } = await dbClient.update<Risk>('risk_register', id, updates);
    
    if (error) {
      if (error.isRlsError) {
        setError('You can\'t update this risk.');
      } else {
        setError(`Failed to update: ${error.message}`);
      }
      return;
    }
    
    loadRisks();
  }

  async function deleteRisk(id: string) {
    const { error } = await dbClient.delete('risk_register', id);
    
    if (error) {
      if (error.isRlsError) {
        setError('You can\'t delete this risk.');
      } else {
        setError(`Failed to delete: ${error.message}`);
      }
      return;
    }
    
    loadRisks();
  }

  return (
    <div className="p-8">
      <h1>Risk Register</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      <button onClick={() => createRisk('New Risk', 'high')}>
        Create Risk
      </button>
      
      <div className="space-y-2 mt-4">
        {risks.map(risk => (
          <div key={risk.id} className="border p-4 rounded">
            <h3>{risk.title}</h3>
            <p>Severity: {risk.severity}</p>
            <button onClick={() => updateRisk(risk.id, { status: 'closed' })}>
              Close
            </button>
            <button onClick={() => deleteRisk(risk.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Common Patterns

### Pattern 1: Load data with filters

```typescript
// For simple filters, use Supabase directly but with RLS
const { data } = await supabase
  .from('assets')
  .select('*')
  .eq('site_id', siteId)    // ✅ OK - filtering by site
  .eq('status', 'active');   // ✅ OK - filtering by status
  // .eq('tenant_id', ...)   // ❌ NO - RLS handles this!
```

### Pattern 2: Creating related records

```typescript
// Create a risk and log an event
const { data: risk, error } = await dbClient.insert('risk_register', {
  title: 'Critical Risk',
  severity: 'high',
});

if (!error && risk) {
  // Both get automatic tenant_id and created_by
  await dbClient.insert('risk_events', {
    risk_id: risk.id,
    event_type: 'created',
    notes: 'Risk identified',
  });
}
```

### Pattern 3: Conditional error messages

```typescript
if (error) {
  const friendlyMessages = {
    insert: 'You don\'t have permission to create records.',
    update: 'You don\'t have permission to modify this record.',
    delete: 'You don\'t have permission to delete this record.',
    select: 'You don\'t have permission to view this data.',
  };
  
  if (error.isRlsError) {
    setError(friendlyMessages[error.action as keyof typeof friendlyMessages] || 'Permission denied.');
  } else {
    setError(`Operation failed: ${error.message}`);
  }
}
```

---

## Debugging RLS Issues

### Check Debug Panel

Open the **AuthDebugPanel** (purple bug icon) to see:
- Recent RLS errors
- Table and action that failed
- Error code and message
- Timestamp

### Verify Tenant Context

```typescript
import { dbClient } from './lib/db-client';

// Check if tenant context is set
console.log('Tenant context:', dbClient['tenantId'], dbClient['userId']);
```

### Test RLS Policies in SQL

```sql
-- Set role to authenticated user
SET ROLE authenticated;
SET request.jwt.claims.sub = '<user-id>';

-- Try inserting without tenant_id (should fail or use default)
INSERT INTO assets (name, asset_type) VALUES ('Test', 'sensor');

-- Try selecting (should only see current tenant's data)
SELECT * FROM assets;
```

---

## Best Practices

### ✅ DO

- Use `dbClient` for all tenant-scoped tables
- Let RLS handle tenant filtering on SELECT queries
- Handle RLS errors gracefully with user-friendly messages
- Log detailed error info to console for debugging
- Test with multiple tenant accounts to verify isolation

### ❌ DON'T

- Don't manually filter by `tenant_id` in queries
- Don't manually set `tenant_id` on inserts (let dbClient handle it)
- Don't show raw error messages to users (security risk)
- Don't assume errors are always RLS-related (check `isRlsError` flag)
- Don't bypass dbClient for tenant-scoped tables

---

## Reference

- **DbClient API**: `/lib/db-client.ts`
- **Example Component**: `/components/ExampleDbOperations.tsx`
- **Tenant Context**: `/contexts/TenantContext.tsx`
- **Debug Panel**: `/components/AuthDebugPanel.tsx`
- **RLS Policies**: See database migration files in `/supabase/migrations/`

---

## Troubleshooting

### Error: "Tenant context not set"

**Cause**: Trying to use dbClient before tenant context is initialized.

**Fix**: Ensure user is logged in and tenant is resolved. Check TenantContext.

### Error: "permission denied for table"

**Cause**: RLS policy is blocking the operation.

**Fix**: 
1. Verify RLS policies are applied (`supabase/migrations/`)
2. Run GRANT scripts (`APPLY_GRANTS.sql`)
3. Check user's role has necessary permissions

### Records not visible after insert

**Cause**: RLS SELECT policy might be too restrictive.

**Fix**: Check that SELECT policy allows users to see their own inserts.

---

**Last Updated**: Database Operations & RLS Error Handling Complete
**Status**: ✅ Production-Ready
