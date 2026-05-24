# CaraBase Realtime Integration Guide

This guide demonstrates how to use CaraBase's Server-Sent Events (SSE) capabilities to build live, reactive user interfaces in React.

## 1. Prerequisites

Make sure you have initialized the `carabase-js` client as shown in the [React Integration Guide](./react-integration.md).

```typescript
// src/carabase.ts
import { createClient } from 'carabase-js';

export const cb = createClient(
  import.meta.env.VITE_CARABASE_URL,
  import.meta.env.VITE_CARABASE_ANON_KEY
);
```

## 2. Setting up a Realtime Subscription

The `.realtime.subscribe()` method allows you to listen to specific database events (`INSERT`, `UPDATE`, `DELETE`, or `*` for all) on a specific table.

Here is an example of a component that maintains a live feed of activities. When another user (or another browser window) inserts a row into the `activities` table, this component will immediately update.

```tsx
// src/components/LiveActivityFeed.tsx
import React, { useEffect, useState } from 'react';
import { cb } from '../carabase';

interface Activity {
  id: number;
  user_name: string;
  action: string;
  created_at: string;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    // 1. Fetch initial data
    const fetchInitialData = async () => {
      const { data, error } = await cb
        .from('activities')
        .select('*')
        .order('id', { ascending: false });
        
      if (!error && data) {
        setActivities(data);
      }
    };

    fetchInitialData();

    // 2. Set up the Realtime Subscription
    // We subscribe to all changes ('*') on the 'activities' table
    const subscription = cb.realtime.subscribe('activities', '*', (payload) => {
      console.log('Realtime event received!', payload);
      
      if (payload.action === 'INSERT') {
        // Add new record to the top of the list
        setActivities(prev => [payload.record as Activity, ...prev]);
      } 
      else if (payload.action === 'UPDATE') {
        // Update the existing record in the list
        setActivities(prev => 
          prev.map(activity => 
            activity.id === payload.record.id ? (payload.record as Activity) : activity
          )
        );
      } 
      else if (payload.action === 'DELETE') {
        // Remove the record from the list
        setActivities(prev => prev.filter(activity => activity.id !== payload.old_record.id));
      }
    });

    setConnectionStatus('Connected (Live Feed Active)');

    // 3. Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      setConnectionStatus('Disconnected');
    };
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Live Activity Feed</h2>
        <span style={{ 
          fontSize: '0.8rem', 
          color: connectionStatus.includes('Connected') ? 'green' : 'gray',
          backgroundColor: '#f0fdf4',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          ● {connectionStatus}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activities.map(activity => (
          <div 
            key={activity.id} 
            style={{ 
              padding: '12px', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px',
              animation: 'highlight 1s ease-out' 
            }}
          >
            <strong>{activity.user_name}</strong> {activity.action}
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              {new Date(activity.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      
      {activities.length === 0 && <p>No recent activity.</p>}
    </div>
  );
}
```

## How It Works

1. **Initial State**: Always fetch the initial state of the table using standard `.select()` before or while the subscription connects.
2. **Payload Structure**: The payload received in the callback contains:
   - `action`: `'INSERT'`, `'UPDATE'`, or `'DELETE'`
   - `record`: The full new row data (for `INSERT` and `UPDATE`).
   - `old_record`: The old row data containing primary keys (for `DELETE` and `UPDATE`).
3. **Immutability**: Always use React's functional state updates (`setActivities(prev => ...)`) to ensure you are modifying the most current list when events fire in rapid succession.
4. **Cleanup**: Returning `subscription.unsubscribe()` in the `useEffect` cleanup function is critical to prevent memory leaks and duplicate event listeners when components re-render or unmount.
