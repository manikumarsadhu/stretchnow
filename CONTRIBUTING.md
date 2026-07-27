# Contributing to StretchNow 🧘‍♂️

We welcome community contributions, bug fixes, and feature integrations! Please read through these guidelines to get started.

---

## 🛠️ Local Development Setup

### 1. Prerequisite Installations
Make sure you have Node.js (v18+) and npm installed on your local machine.

### 2. Fork & Clone Repository
Clone the repository onto your system:
```bash
git clone https://github.com/your-username/stretchnow.git
cd stretchnow
```

### 3. Install Packages
Install dependencies:
```bash
npm install
```

### 4. Running Dev Server
Run the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### 5. Compiling Builds
Verify there are no Svelte or Workbox compile errors:
```bash
npm run build
```

---

## 📐 Coding Standards & Code Guidelines

* **Component Separation**: Keep business logic separate from Svelte UI files. Move calculations or service requests to `/src/services/` or `/src/utils/`.
* **CSS Custom Variables**: Avoid writing ad-hoc pixel values or hardcoded color strings. Use CSS variables defined in `/src/app.css` (e.g. `var(--primary)`, `var(--bg-card)`).
* **Keyboard Navigation (A11y)**: When implementing interactive buttons, specify `aria-label` tags and verify focus outlines are visible during tab operations.
* **Storage Schema Integrity**: If you introduce state attributes, update `DEFAULT_STATE` and the schema version fields in [storage.js](file:///e:/mani-entrepreneur/stretchnow/src/utils/storage.js).

---

## 🧪 Testing Checklist (Before opening a Pull Request)

Before submitting a Pull Request, please ensure the following checklist is completed:

* `[ ]` App builds successfully (`npm run build` exits with code 0).
* `[ ]` Storage integrity matches the latest schema format and loads correctly.
* `[ ]` Local Diagnostics run successfully under Settings without console errors.
* `[ ]` App runs offline when network mode is switched to offline in Chrome DevTools.
* `[ ]` High contrast and text scale controls behave correctly on the home screen.
* `[ ]` Nature audio synthesizers play successfully during active breaks.

---

## 📝 Commit Messages
Commit messages should follow semantic conventions (e.g. `feat: add Telugu support`, `fix: correct audio context suspension`). This makes tracking history simple.
