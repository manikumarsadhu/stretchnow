/**
 * Dynamically computes a daily Wellness Score index from 0 to 100.
 * Weights: Completed Breaks (40%), Water logs (25%), Streaks consistency (20%), Sitting Time limits (15%).
 */
export function calculateWellnessScore(progress, user, statistics = {}) {
  const breakGoal = user.dailyBreakGoal || 6;
  const waterGoal = user.dailyWaterGoal || 8;
  
  const completedBreaks = progress.completedBreaksToday || 0;
  const completedWater = progress.water || 0;
  const streak = progress.streak || 1;
  
  // 1. Breaks Contribution (40%)
  const breakRatio = Math.min(1, completedBreaks / breakGoal);
  const breakPoints = breakRatio * 40;
  
  // 2. Water Contribution (25%)
  const waterRatio = Math.min(1, completedWater / waterGoal);
  const waterPoints = waterRatio * 25;
  
  // 3. Streak Contribution (20%)
  const streakRatio = Math.min(1, streak / 10);
  const streakPoints = streakRatio * 20;
  
  // 4. Sitting time bounds (15%)
  const todayIndex = (new Date().getDay() + 6) % 7;
  const sittingHoursList = statistics.sittingHours || [7.5, 8, 7, 8.5, 6.5, 5, 6];
  const todaySittingHours = sittingHoursList[todayIndex] !== undefined ? sittingHoursList[todayIndex] : 8;
  
  // Target: <= 6 hours sitting. Over 12 hours sits yields 0 points.
  const sittingRatio = Math.max(0, Math.min(1, (12 - todaySittingHours) / 6));
  const sittingPoints = sittingRatio * 15;
  
  const totalScore = Math.round(breakPoints + waterPoints + streakPoints + sittingPoints);
  return Math.max(0, Math.min(100, totalScore));
}
