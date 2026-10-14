import assert from 'node:assert';
import { DEFAULT_STATE } from '../src/utils/storage.js';

console.log('Running notifications self-check...');

// 1. Verify DEFAULT_STATE notifications
assert.ok(Array.isArray(DEFAULT_STATE.notifications), 'DEFAULT_STATE.notifications should be an array');
assert.ok(DEFAULT_STATE.notifications.length > 0, 'DEFAULT_STATE.notifications should have welcome item');
assert.strictEqual(DEFAULT_STATE.notifications[0].unread, true, 'Welcome item should be unread');

// 2. Test notification collection manipulation functions
let state = {
  notifications: [...DEFAULT_STATE.notifications]
};

// Simulate addNotification
function simulateAdd(st, payload) {
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: payload.type || 'break',
    title: payload.title,
    message: payload.message,
    timestamp: Date.now(),
    icon: payload.icon || 'notifications',
    actionRoute: payload.actionRoute || null,
    actionLabel: payload.actionLabel || null,
    unread: true
  };
  return {
    ...st,
    notifications: [newNotif, ...(st.notifications || [])].slice(0, 25)
  };
}

state = simulateAdd(state, {
  type: 'break',
  title: 'Test Reminder',
  message: 'Time for stretch break',
  actionRoute: 'break',
  actionLabel: 'Start Stretch'
});

assert.strictEqual(state.notifications.length, 2, 'Notifications length should now be 2');
const addedId = state.notifications[0].id;
assert.strictEqual(state.notifications[0].title, 'Test Reminder');
assert.strictEqual(state.notifications[0].unread, true);

// Simulate markNotificationAsRead
state = {
  ...state,
  notifications: state.notifications.map(n => n.id === addedId ? { ...n, unread: false } : n)
};
assert.strictEqual(state.notifications.find(n => n.id === addedId).unread, false, 'Targeted notification should be marked read');
assert.strictEqual(state.notifications.find(n => n.id !== addedId).unread, true, 'Other notification should remain unread');

// Simulate markAllNotificationsAsRead
state = {
  ...state,
  notifications: state.notifications.map(n => ({ ...n, unread: false }))
};
assert.ok(state.notifications.every(n => !n.unread), 'All notifications should be marked read');

// Simulate removeNotification
state = {
  ...state,
  notifications: state.notifications.filter(n => n.id !== addedId)
};
assert.strictEqual(state.notifications.length, 1, 'Should have 1 notification after removal');
assert.strictEqual(state.notifications.find(n => n.id === addedId), undefined, 'Removed notification should not exist');

// Test cap at 25 items
for (let i = 0; i < 30; i++) {
  state = simulateAdd(state, { title: `Batch test ${i}`, message: 'cap test' });
}
assert.strictEqual(state.notifications.length, 25, 'Notifications list must be capped at 25');

// Simulate clearAllNotifications
state = {
  ...state,
  notifications: []
};
assert.strictEqual(state.notifications.length, 0, 'Clear all should empty notifications');

console.log('✅ All notification self-checks passed successfully!');
