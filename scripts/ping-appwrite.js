import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually to avoid external dependencies
const envPath = path.join(__dirname, '../.env.local');
let projectId = '6a5e1ace0000d7425757';
let endpoint = 'https://fra.cloud.appwrite.io/v1';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_APPWRITE_PROJECT_ID=')) {
      projectId = trimmed.split('=')[1].trim();
    }
    if (trimmed.startsWith('VITE_APPWRITE_ENDPOINT=')) {
      endpoint = trimmed.split('=')[1].trim();
    }
  }
}

async function pingAppwrite() {
  console.log(`Pinging Appwrite project (${projectId}) at ${endpoint}/ping ...`);
  try {
    const res = await fetch(`${endpoint}/ping`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': projectId
      }
    });
    const text = await res.text();
    console.log(`Status Code: ${res.status}`);
    console.log('Response:', text);
    if (res.ok) {
      console.log('✅ Appwrite project is ACTIVE and operational!');
    } else if (res.status === 403 && text.includes('project_paused')) {
      console.log('⚠️ Appwrite project is currently PAUSED. Restore it at https://cloud.appwrite.io');
    } else {
      console.log('⚠️ Appwrite returned:', text || res.statusText);
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }
}

pingAppwrite();
