# Privacy Policy

Last updated: July 27, 2026

At StretchNow, we prioritize your privacy and are committed to protecting your personal data. This privacy policy explains how data is managed, stored, and utilized within the StretchNow application.

---

## 🔒 100% Local-First Data Storage

By default, StretchNow is designed to be **local-first**. All of your physical wellness progress, daily logs, and preferences are kept on your local device:
1. **Streaks, XP, and Level Progress**: Kept locally in your browser's `localStorage`.
2. **Hydration Log (Water cups)**: Kept locally.
3. **Smart Scheduling & Profile**: Your name, work hours, and calendar preferences are stored strictly on your device.
4. **No Tracking Cookies**: We do not use third-party tracking pixels, marketing scripts, or advertising networks.

---

## 🤖 AI Wellness Coach Data Usage

StretchNow includes an **AI Wellness Coach** feature that analyzes your desk habits and generates custom suggestions (e.g. reminding you to stretch your neck if sitting hours are high).

When the AI Wellness Coach is triggered:
* The app sends an anonymized query to the AI inference provider (utilizing the application's api key).
* **Anonymized Payload**: The query includes only general numeric stats (e.g., *"Desk worker who sat for 8 hours and completed 2 breaks"*).
* **No PII Transmission**: No personally identifiable information (such as your email address, real name, IP address, or specific geolocations) is ever sent to the AI API endpoint.
* **API Key Security**: The API key is securely handled client-side and never exposed to tracking services.

---

## ☁️ Cloud Sync (Appwrite Cloud)

For users who explicitly choose to connect their Appwrite Cloud account (via Settings):
* Your progress data (water counts, completed breaks today, streaks, and total score) will sync to the database collection hosted securely on Appwrite Cloud.
* This allows you to retain streaks across multiple devices.
* You can sign out and delete your cloud data or clear your local cache at any time via the Settings screen.

---

## 📄 Contact & Questions

Since StretchNow stores all data locally on your device, we do not collect or store your files on any external servers. If you have questions about how the local sandboxed storage works in your browser, feel free to inspect the open-source code inside [storage.js](file:///e:/mani-entrepreneur/stretchnow/src/utils/storage.js).
