/**
 * Automated Appwrite Collection Setup Script for StretchNow
 * 
 * Usage:
 *   APPWRITE_API_KEY="your_admin_api_key" node scripts/setup-appwrite-collections.js
 */

import { Client, Databases, Permission, Role } from 'node-appwrite';

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a5e1ace0000d7425757';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '6a5e1dd9003a5437c98e';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.log('\n❌ APPWRITE_API_KEY environment variable is missing.');
  console.log('To run this automated script, pass your Appwrite Admin API Key:');
  console.log('  $env:APPWRITE_API_KEY="your_key"; node scripts/setup-appwrite-collections.js\n');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const COLLECTIONS = [
  {
    id: 'profiles',
    name: 'User Profiles',
    attributes: [
      { key: 'userId', type: 'string', size: 128, required: true },
      { key: 'displayName', type: 'string', size: 128, required: false },
      { key: 'email', type: 'string', size: 256, required: false },
      { key: 'language', type: 'string', size: 16, required: false },
      { key: 'theme', type: 'string', size: 32, required: false },
      { key: 'occupation', type: 'string', size: 128, required: false },
      { key: 'timezone', type: 'string', size: 64, required: false },
      { key: 'updatedAt', type: 'string', size: 64, required: false }
    ]
  },
  {
    id: 'settings',
    name: 'User Settings',
    attributes: [
      { key: 'reminderInterval', type: 'integer', required: false },
      { key: 'workStart', type: 'string', size: 16, required: false },
      { key: 'workEnd', type: 'string', size: 16, required: false },
      { key: 'weekendMode', type: 'boolean', required: false },
      { key: 'lunchStart', type: 'string', size: 16, required: false },
      { key: 'lunchEnd', type: 'string', size: 16, required: false },
      { key: 'notificationEnabled', type: 'boolean', required: false },
      { key: 'waterGoal', type: 'integer', required: false },
      { key: 'breakGoal', type: 'integer', required: false },
      { key: 'largeText', type: 'boolean', required: false },
      { key: 'highContrast', type: 'boolean', required: false },
      { key: 'updatedAt', type: 'string', size: 64, required: false }
    ]
  },
  {
    id: 'daily_logs',
    name: 'Daily Activity Logs',
    attributes: [
      { key: 'userId', type: 'string', size: 128, required: true },
      { key: 'date', type: 'string', size: 32, required: true },
      { key: 'breaksCompleted', type: 'integer', required: false },
      { key: 'breaksSkipped', type: 'integer', required: false },
      { key: 'stretchMinutes', type: 'integer', required: false },
      { key: 'waterCups', type: 'integer', required: false },
      { key: 'sittingMinutes', type: 'integer', required: false },
      { key: 'wellnessScore', type: 'integer', required: false },
      { key: 'xpEarned', type: 'integer', required: false },
      { key: 'mood', type: 'string', size: 32, required: false },
      { key: 'notes', type: 'string', size: 1024, required: false },
      { key: 'updatedAt', type: 'string', size: 64, required: false }
    ]
  },
  {
    id: 'achievements',
    name: 'User Achievements',
    attributes: [
      { key: 'userId', type: 'string', size: 128, required: true },
      { key: 'badgeId', type: 'string', size: 64, required: true },
      { key: 'unlockedAt', type: 'string', size: 64, required: false }
    ]
  },
  {
    id: 'statistics',
    name: 'User Statistics',
    attributes: [
      { key: 'totalBreaks', type: 'integer', required: false },
      { key: 'totalWater', type: 'integer', required: false },
      { key: 'totalXP', type: 'integer', required: false },
      { key: 'level', type: 'integer', required: false },
      { key: 'currentStreak', type: 'integer', required: false },
      { key: 'longestStreak', type: 'integer', required: false },
      { key: 'updatedAt', type: 'string', size: 64, required: false }
    ]
  },
  {
    id: 'user_progress',
    name: 'User Progress',
    attributes: [
      { key: 'water', type: 'integer', required: false },
      { key: 'completedBreaksToday', type: 'integer', required: false },
      { key: 'score', type: 'integer', required: false },
      { key: 'streak', type: 'integer', required: false }
    ]
  }
];

async function setup() {
  console.log(`🚀 Starting Appwrite collection setup for Database '${DATABASE_ID}'...`);

  for (const col of COLLECTIONS) {
    try {
      console.log(`\n📁 Creating collection: ${col.id} (${col.name})...`);
      await databases.createCollection(
        DATABASE_ID,
        col.id,
        col.name,
        [Permission.read(Role.any()), Permission.create(Role.users())],
        true
      );
      console.log(`   ✅ Collection '${col.id}' created.`);
    } catch (err) {
      if (err?.code === 409) {
        console.log(`   ℹ️ Collection '${col.id}' already exists.`);
      } else {
        console.error(`   ❌ Failed to create collection '${col.id}':`, err?.message || err);
      }
    }

    for (const attr of col.attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(DATABASE_ID, col.id, attr.key, attr.size, attr.required);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(DATABASE_ID, col.id, attr.key, attr.required);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(DATABASE_ID, col.id, attr.key, attr.required);
        }
        console.log(`     + Attribute '${attr.key}' (${attr.type}) added.`);
      } catch (attrErr) {
        if (attrErr?.code === 409) {
          // Attribute already exists
        } else {
          console.warn(`     ! Could not add attribute '${attr.key}':`, attrErr?.message || attrErr);
        }
      }
    }
  }

  console.log('\n🎉 Appwrite Database Setup Complete!');
}

setup().catch((err) => console.error('Setup script failed:', err));
