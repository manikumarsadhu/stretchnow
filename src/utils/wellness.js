import { calculateWellnessScore } from './wellnessScore.js';

export { calculateWellnessScore };

export function calculateWaterPercentage(waterCount, dailyGoal = 8) {
  if (!dailyGoal || dailyGoal <= 0) return 0;
  return Math.min(100, Math.round((waterCount / dailyGoal) * 100));
}

export function calculateBreakGoalPercentage(completed, goal = 6) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((completed / goal) * 100));
}

export function getMotivationalTip(completedBreaks, streak) {
  if (completedBreaks === 0) {
    return "Ready to kickstart your day? Take your first 2-minute posture break!";
  }
  if (completedBreaks >= 6) {
    return "🎉 Outstanding posture work today! Your spine and body thank you.";
  }
  if (streak >= 5) {
    return `🔥 You're on a ${streak}-day streak! Keep up the healthy momentum.`;
  }
  return "Remember to loosen your shoulders and uncross your legs while sitting.";
}
