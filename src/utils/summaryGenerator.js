/**
 * Prepares the structure of daily summaries and reflections.
 * Tracks events for the active workday timeline.
 */

export function getWorkdayTimeline(timeline = []) {
  // Return sorted timeline logs for today
  return [...timeline].sort((a, b) => a.time.localeCompare(b.time));
}

export function formatTimelineTime(date = new Date()) {
  return date.toTimeString().slice(0, 5); // "HH:MM"
}

export function compileDailySummary(progress, user, wellnessScore) {
  const breaksCompleted = progress.completedBreaksToday || 0;
  const breakGoal = user.dailyBreakGoal || 6;
  const waterCount = progress.water || 0;
  const waterGoal = user.dailyWaterGoal || 8;
  
  // Calculate average sitting
  const todayIndex = (new Date().getDay() + 6) % 7;
  const sittingHours = progress.sittingHoursToday !== undefined ? progress.sittingHoursToday : 8;

  let recommendation = "Maintain current stretching frequency.";
  if (breaksCompleted < breakGoal) {
    recommendation = `Try scheduling ${breakGoal - breaksCompleted} more stretch breaks tomorrow to offset desk load.`;
  } else if (waterCount < waterGoal) {
    recommendation = `Increase hydration by ${waterGoal - waterCount} cups tomorrow to support muscle elasticity.`;
  } else {
    recommendation = "Outstanding wellness day! Add an advanced Seated Spinal Twist tomorrow to expand flexibility.";
  }

  return {
    breaksCompleted,
    breakGoal,
    waterCount,
    waterGoal,
    sittingHours,
    wellnessScore,
    xpEarned: breaksCompleted * 50 + (progress.tutorialCompleted ? 0 : 0), // Base XP
    streak: progress.streak || 1,
    recommendation
  };
}
