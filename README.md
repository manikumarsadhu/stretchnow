# StretchNow 🧘‍♂️

> Transform your workday posture, keep repetitive strains at bay, and build healthy micro-habits right from your desk.

![StretchNow Banner](./public/screenshots/stretchnow_banner.png)

StretchNow is a responsive, installable Progressive Web App (PWA) serving as a physical wellness companion. Designed for software engineers, designers, and office workers, it triggers non-intrusive timed break alerts, guides you through equipment-free office stretches with custom visual canvas animations, tracks daily water intake & sedentary trends, and seamlessly synchronizes your wellness stats to the cloud.

---

## ✨ Features Overview

### 1. ⚙️ Smart Work Schedule & Adaptive Reminders
* **Active Work Hours**: Set your start/end workday bounds (e.g., `09:00 - 17:00`) and reminder intervals.
* **Adaptive Interval Scheduling**: Automatically adjusts future break frequencies based on your snooze and completion patterns.
* **Meeting Mode (DND)**: Quick toggle in settings to silence all notifications during calls or deep focus work.
* **Lunch Break Pause & Weekend Mode**: Automatically pauses reminders during specified lunch windows or non-working weekend days.
* **Rotated Alerts**: Features fresh, rotating motivational prompts (e.g., *"Your spine needs you 😊"*, *"Screen fatigue? 👀"*).

### 2. ⚡ Gamification & Motivation
* **Level & XP Progress**: Earn **+50 XP** for each completed stretching break. Track your level progression live on the dashboard.
* **Daily Streak Counter**: Keeps track of consecutive active days maintaining posture health.
* **Weekly Challenges**: Complete structured milestones like *Stretch Master Weekly* (15 breaks/week) or *Hydration Regular* (5 water goals/week).
* **Achievement Badges**: Unlock dynamic trophies (*7-Day Streak*, *Posture Starter*, *Early Bird*, *Hydration Hero*) based on your activity.

### 3. ⏱️ Interactive Guided Stretch Poses & Canvas Animations
* **2-Minute Desk Breaks**: 3 targeted equipment-free poses (40 seconds each) designed to release desk-bound neck, shoulder, and back tension.
* **Custom Procedural Animations**: Interactive canvas component (`StretchAnimation.svelte`) guiding movement posture.
* **Audio Cues & Synthesized Soundscapes**: Gentle chimes for pose transitions and synthesized relaxation soundscapes (Ocean waves, Raindrops, Whistling wind, White noise) playing directly during breaks.

### 4. ☁️ Appwrite Cloud Sync & Offline-First Engine
* **Cloud Sync**: Securely sync your streaks, XP, custom preferences, and break history using Appwrite authentication and database services.
* **Offline-First Queue**: Action queue records changes while offline and automatically flushes them when network connection resumes.
* **Conflict Resolution Wizard**: Interactive merge wizard (`MergeWizardModal.svelte`) resolves conflicts between local and remote state.
* **Live Sync Status**: Persistent status pill (`SyncStatus.svelte`) indicating real-time connection and sync health.

### 5. 🤖 AI Posture & Ergonomics Coach
* **AI Insights**: Integrated AI service (`aiCoach.js`) powered by Hugging Face APIs providing personalized ergonomic tips, posture adjustments, and break advice based on your sedentary trends.

### 6. 🌍 Multilingual Support (i18n)
* **Localization**: Full internationalization engine supporting **English**, **Hindi (हिंदी)**, and **Telugu (తెలుగు)**.

### 7. 🎨 Themes & Custom Accessibility
* **Color Schemes**: Seamlessly switch between **Light**, **Dark**, **System Default**, **Ocean Blue**, and **Forest Green** themes.
* **Large Text Mode**: Scales typography up by 12% for enhanced readability.
* **High Contrast Mode**: Boosts element contrast ratios and borders to comply with WCAG accessibility guidelines.

### 8. 📊 Wellness Analytics & PDF Export
* **Wellness Score**: Star rating calculated daily based on break completion, water intake, streaks, and sitting thresholds.
* **Visual Charts**: Interactive trend visualizations (`Chart.svelte`) for break counts, posture goals, water intake, and sedentary hours.
* **Export PDF**: Print-optimized stylesheet for saving or printing weekly wellness reports.

---

## 🛠️ Tech Stack

* **Frontend Framework**: [Svelte 5](https://svelte.dev/)
* **Build Tool & Bundler**: [Vite 8](https://vitejs.dev/)
* **PWA Engine**: `vite-plugin-pwa` with ServiceWorker caching
* **Styling & System**: [Pico CSS](https://picocss.com/) + Custom CSS Variables & Animations
* **Backend & Cloud Sync**: [Appwrite Web SDK](https://appwrite.io/)
* **Visualization**: [Chart.js](https://www.chartjs.org/)
* **Type Safety & Diagnostics**: JavaScript with JSDoc annotations, TypeScript type definitions (`checkJs: true`), and `svelte-check`

---

## 📂 Project Directory Structure

```
stretchnow/
├── public/                    # Static assets (PWA icons, manifest, banner graphics)
│   └── screenshots/           # Application screenshots
│
├── src/
│   ├── components/            # Reusable Svelte UI Components
│   │   ├── AdaptiveIntervalModal.svelte # Dynamic break schedule adjustment modal
│   │   ├── AlarmModal.svelte            # Triggered break reminder dialog
│   │   ├── AuthModal.svelte             # Appwrite login/register modal
│   │   ├── BadgesList.svelte            # Achievement badge display grid
│   │   ├── MergeWizardModal.svelte      # Cloud/local sync conflict resolution
│   │   ├── SnoozeBanner.svelte          # Active snooze banner indicator
│   │   ├── StretchAnimation.svelte      # Canvas-rendered stretch pose guide
│   │   ├── SyncStatus.svelte            # Real-time online/sync status badge
│   │   └── WellnessSummaryModal.svelte  # End-of-day wellness report
│   │
│   ├── routes/                # Screen views & pages
│   │   ├── Break.svelte                 # Active guided stretching routine
│   │   ├── Home.svelte                  # Main dashboard, stats, & action feed
│   │   ├── Library.svelte               # Pose library, search, & detail modal
│   │   ├── Onboarding.svelte            # Setup wizard & goal configuration
│   │   ├── Settings.svelte              # Preferences, Cloud Sync, & Diagnostics
│   │   └── Statistics.svelte            # Analytics charts & wellness score logs
│   │
│   ├── services/              # Business logic & external API layers
│   │   ├── aiCoach.js                   # Hugging Face AI posture coach service
│   │   ├── backup.js                    # Local JSON export/import handlers
│   │   ├── diagnostics.js               # System permissions & PWA status checks
│   │   └── scheduler.js                 # Reminder timer calculations
│   │
│   ├── sync/                  # Cloud synchronization engine
│   │   ├── manager.js                   # Appwrite sync coordinator
│   │   ├── merge.js                     # State merging algorithm
│   │   ├── queue.js                     # Offline action queue persistence
│   │   └── status.js                    # Sync state store
│   │
│   ├── stores/                # Reactive state management
│   │   └── app.js                       # Core application state & LocalStorage sync
│   │
│   ├── utils/                 # Utilities & helper modules
│   │   ├── i18n.js                      # Internationalization translator
│   │   ├── notifications.js             # Web Notifications API dispatcher
│   │   ├── sounds.js                    # Synthesized audio soundscapes
│   │   ├── storage.js                   # LocalStorage wrapper
│   │   └── wellnessScore.js             # Daily wellness rating algorithms
│   │
│   ├── locales/               # Dictionary files for i18n (en, hi, te)
│   ├── global.d.ts            # Global TypeScript definitions & extensions
│   ├── App.svelte             # Root shell & navigation layout
│   └── main.js                # Application entry point
│
├── jsconfig.json              # Compiler & type checking configuration
├── svelte.config.js           # Svelte preprocessor configuration
└── vite.config.js             # Vite bundler & PWA configuration
```

---

## ⌨️ Active Break Keyboard Shortcuts

During an active stretching session, you can navigate hands-free:

| Key | Action |
| :--- | :--- |
| **`Space`** | Play / Pause active timer (toggles ambient background audio simultaneously) |
| **`S`** | Skip current stretch pose and advance to the next step |
| **`R`** | Restart active break timer from the beginning |
| **`Escape`** | Exit active break and return to main dashboard |

---

## 🛠️ Local Development & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* npm (comes bundled with Node.js)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/stretchnow.git
cd stretchnow
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Type Checking & Diagnostics
```bash
npx svelte-check
```

### 4. Build for Production
```bash
npm run build
```
The compiled output will be generated in the `/dist` directory, complete with PWA service worker manifests.

---

## 🚀 Release Milestones & Roadmap

* **Version 1.0 (Current)**: 
  * Adaptive break scheduling & smart notification triggers.
  * Gamified XP system, streak counter, and dynamic achievement badges.
  * Interactive canvas stretch guides with audio & ambient soundscapes.
  * Cloud synchronization via Appwrite with offline queueing & state merge wizard.
  * Multilingual support (English, Hindi, Telugu).
  * AI-assisted ergonomic recommendations.
  * Wellness Analytics with PDF export capabilities.
* **Version 1.1 (Upcoming)**:
  * Expanded library of stretches (desk yoga, eye relaxation exercises).
  * Custom audio soundscape volume mixer.
  * Health platform integrations (Google Fit, Apple Health).

---

## 📖 Architecture & Engineering Blueprint

For an in-depth breakdown of state machines, data schemas, sync conflict resolution, and architectural constraints, refer to [PORTFOLIO_ENGINEERING.md](file:///e:/mani-entrepreneur/stretchnow/PORTFOLIO_ENGINEERING.md).

---

## 🤝 Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](file:///e:/mani-entrepreneur/stretchnow/CONTRIBUTING.md) for development guidelines and pull request procedures.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
