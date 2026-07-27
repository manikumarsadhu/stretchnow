export const BADGES = [
  {
    id: 'streak-7',
    title: '7-Day Streak',
    description: 'Maintain a daily stretch streak for 7 consecutive days.',
    icon: 'workspace_premium',
    color: '#cd7f32', // Bronze
    category: 'streak'
  },
  {
    id: 'streak-30',
    title: '30-Day Consistency',
    description: 'Maintain a daily stretch streak for 30 consecutive days.',
    icon: 'workspace_premium',
    color: '#c0c0c0', // Silver
    category: 'streak'
  },
  {
    id: 'stretches-10',
    title: 'Posture Starter',
    description: 'Complete 10 stretch sessions in total.',
    icon: 'emoji_events',
    color: '#854d0e',
    category: 'milestone'
  },
  {
    id: 'stretches-100',
    title: 'Stretch Master',
    description: 'Complete 100 stretch sessions in total.',
    icon: 'emoji_events',
    color: '#eab308', // Gold
    category: 'milestone'
  },
  {
    id: 'water-goal',
    title: 'Hydration Hero',
    description: 'Reach your daily water goal today.',
    icon: 'local_activity',
    color: '#06b6d4',
    category: 'water'
  },
  {
    id: 'early-stretch',
    title: 'Early Bird',
    description: 'Complete a stretch session before 10:00 AM.',
    icon: 'wb_sunny',
    color: '#f59e0b',
    category: 'time'
  },
  {
    id: 'night-stretch',
    title: 'Night Owl',
    description: 'Complete a stretch session after 6:00 PM.',
    icon: 'dark_mode',
    color: '#6366f1',
    category: 'time'
  }
];

export function getBadgeById(id) {
  return BADGES.find(b => b.id === id);
}
