/**
 * Route-specific SEO metadata dictionary
 * @type {Record<string, {title: string, description: string}>}
 */
export const ROUTE_METADATA = {
  splash: {
    title: 'StretchNow | Healthy Work Break & Ergonomic Stretching Reminder',
    description: 'StretchNow helps developers, office workers, and remote employees stay healthy with desk stretch reminders, water intake tracking, posture guidance, and wellness insights.'
  },
  welcome: {
    title: 'Welcome to StretchNow | Personal Desk Stretch & Posture Coach',
    description: 'Get started with StretchNow to combat desk fatigue, prevent stiffness, and build healthy daily stretching habits.'
  },
  onboarding: {
    title: 'Personalize Your Stretch Schedule | StretchNow',
    description: 'Customize your work hours, reminder intervals, and daily break goals for a tailored ergonomic routine.'
  },
  login: {
    title: 'Sign In | StretchNow Account Sync',
    description: 'Sign in to sync your stretching progress, streaks, and custom settings across all your devices.'
  },
  home: {
    title: 'StretchNow | Personal Wellness Dashboard',
    description: 'Track your daily break goals, hydration levels, current streaks, and quick micro-stretch routines.'
  },
  break: {
    title: 'Guided Micro-Break Session | StretchNow',
    description: 'Follow step-by-step guided desk stretches with timer intervals to relieve neck, wrist, back, and eye strain.'
  },
  library: {
    title: 'Desk Stretch & Posture Library | StretchNow',
    description: 'Browse our collection of ergonomic exercises for neck, shoulders, wrists, lower back, and hips.'
  },
  statistics: {
    title: 'Wellness Analytics & Habit Progress | StretchNow',
    description: 'View your stretching consistency, break trends, hydration stats, and long-term health progress.'
  },
  settings: {
    title: 'Preferences & Reminder Schedule | StretchNow',
    description: 'Configure notification preferences, sound alerts, theme settings, and cloud data backups.'
  },
  notfound: {
    title: '404 Page Not Found | StretchNow',
    description: 'The requested page or section could not be found.'
  }
};

/**
 * Get SEO metadata for a given route name
 * @param {string} route
 */
export function getRouteMetadata(route) {
  return ROUTE_METADATA[route] || ROUTE_METADATA.home;
}
