# StretchNow — Project Overview

StretchNow is a modern, responsive web application designed to combat the negative health effects of a sedentary lifestyle. It serves as a personal wellness companion for desk-bound professionals, offering automated reminders, interactive guided stretching breaks, hydration tracking, and personal wellness analytics.

---

## 🎯 Project Goal

The primary goal of **StretchNow** is to transform the workday experience of modern professionals by integrating health habits directly into their workflows. 

### Core Problems Solved:
1. **Sedentary Strain**: Sitting for prolonged hours leading to posture deterioration, muscle stiffness, and chronic back/neck pain.
2. **Repetitive Strain Injuries (RSI)**: Muscle fatigue in hands, wrists, and forearms from persistent keyboard and mouse usage.
3. **Digital Eye Strain**: Constant screen-time resulting in ciliary muscle fatigue, headaches, and dry eyes.
4. **Mental & Cognitive Fatigue**: Lack of cognitive resets throughout the workday leading to lower productivity and elevated stress levels.

---

## 💼 Target Market Analysis

StretchNow is designed specifically for **desk-bound professionals** who spend 6+ hours per day in front of a computer screen.

| Target Segment | Specific Pain Points | How StretchNow Helps |
| :--- | :--- | :--- |
| **Software Engineers & Developers** | High risk of carpal tunnel/wrist fatigue, severe upper back tension, and long hyper-focused coding sessions. | Scheduled wrist extensions, shoulder rolls, and desktop notification reminders to prompt breaks. |
| **Product & Graphic Designers** | Prolonged screen focusing leading to eye fatigue, neck stiffness, and poor sitting posture. | "20-20-20 Eye Rest" routines and gentle neck release guided stretches. |
| **Finance, Accounting & Admin** | Intense typing and data input, high mental stress during closing seasons, and minimal physical movements. | "Box Breathing" for mental calm, spinal twists, and daily water-tracking to keep energy levels stable. |
| **Students & Researchers** | Extended study sessions, studying with suboptimal posture at home, and lack of routine. | Custom onboarding to set daily goals and study schedules, along with progressive streaks. |

---

## ✨ Key Product Features

StretchNow is built as a complete wellness companion, combining micro-breaks with active tracking:

### 1. Personalized Onboarding & Goals
Users are onboarded with a simple, high-fidelity wizard that tailors the app to their specific work schedule and physical goals.
* **Role Specificity**: Customizes settings for Software Engineers, Designers, Students, etc.
* **Goal Setting**: Set daily break limits (e.g., 6 breaks) and hydration goals (e.g., 8 cups).
* **Smart Reminders**: Select break intervals (every 30, 45, 60, or 90 minutes) during active work hours.

### 2. Interactive 2-Minute Guided Breaks
A seamless, countdown-driven active interface that guides users through a series of stretches.
* **Timed Routines**: 3 targeted steps (40 seconds each) totaling exactly 2 minutes.
* **Audio Cues**: Chimes play at step transitions and break completion to keep users on track.
* **Action Controls**: Options to play, pause, reset, or skip steps.
* **XP Rewards**: Earn wellness points upon successful break completion, fostering habit formation.

### 3. Custom SVG CSS-Animated Visual Guides
Rather than using heavy, distraction-prone video tutorials, StretchNow utilizes lightweight vector animations.
* **Real-time Movement**: SVG animations demonstrate the correct physical motion (e.g. neck tilts, shoulder blade rolls, spinal twists) utilizing CSS keyframe transitions.
* **Aesthetic Consistency**: Fully compatible with light and dark mode styling.

### 4. Categorized Stretch Library
A library categorizing office-friendly routines requiring zero equipment:
* 🧘 **Neck & Shoulders**: Gentle Neck Release, Shoulder Blade Rolls.
* 🪵 **Spine & Back**: Seated Spinal Twist.
* 🤚 **Hands & Wrists**: Wrist & Forearm Extension (Crucial for RSI prevention).
* 🦵 **Hips & Legs**: Seated Figure-4 Hip Opener.
* 👁️ **Eye Strain Relief**: 20-20-20 Eye Rest (Refreshes visual focus).
* 💨 **Mindful Breathing**: Reset Box Breathing (Calms the parasympathetic nervous system).

### 5. Day-to-Day Hydration Tracker
* Seamlessly log daily water consumption.
* Real-time progress bar shows hydration percentage relative to the user's daily goal.

### 6. Interactive Analytics Dashboard
Uses highly visual, custom-designed charts to track health habits over a 7-day period:
* **Daily Breaks Tracked** (Bar Chart): Tracks daily physical break frequency.
* **Weekly Posture Goal Progress** (Line Chart): Displays goal completion percentage.
* **Daily Water Intake** (Bar Chart): Tracks hydration logs.
* **Sedentary Sitting Time** (Line Chart): Monitors hours spent sitting to flag high-risk days.

---

## 🛠️ Technical Implementation

### Frontend Framework
* **Svelte + Vite**: Lightweight, reactive, compile-time framework offering lightning-fast loads, state updates, and a modular architecture.

### Centralized Store & Persistence
* Uses a custom Svelte writable store (`appStore`) that automatically synchronizes user profile settings, day-to-day streaks, water intake, and historical statistics to `localStorage` for offline persistence.

### Responsive Modern Styling
* Custom vanilla CSS variables governing a beautiful, glassmorphic design system.
* Built-in support for dynamic dark mode.
* Smooth micro-animations, transitions, and hover states creating a premium, native-app feel.
