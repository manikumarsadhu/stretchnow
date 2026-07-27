const API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || "";

/**
 * Generate AI-powered personalized posture and stretch recommendations.
 * Fallback to a smart, heuristic client-side coaching engine if API is unavailable.
 */
export async function getAICoachAdvice(progress, user, statistics) {
  const breaksCompleted = progress.completedBreaksToday || 0;
  const dailyBreakGoal = user.dailyBreakGoal || 6;
  const streak = progress.streak || 1;
  const waterCount = progress.water || 0;
  const dailyWaterGoal = user.dailyWaterGoal || 8;
  const occupation = user.occupation || 'Desk Worker';

  // Get current day's sitting hours
  const todayIndex = (new Date().getDay() + 6) % 7;
  const sittingHoursList = statistics.sittingHours || [7.5, 8, 7, 8.5, 6.5, 5, 6];
  const todaySittingHours = sittingHoursList[todayIndex] !== undefined ? sittingHoursList[todayIndex] : 8;

  try {
    // Attempt request to a free Hugging Face / standard AI endpoint using the key
    const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        inputs: `<s>[INST] You are a physical therapist AI coach. Give a 1-sentence posture recommendation for a ${occupation} who completed ${breaksCompleted}/${dailyBreakGoal} breaks, drank ${waterCount}/${dailyWaterGoal} cups of water, sat for ${todaySittingHours} hours, and has a ${streak}-day streak. Keep it under 20 words. [/INST]`,
        parameters: { max_new_tokens: 60 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.generated_text) {
        // Extract the generated text
        const fullText = data[0].generated_text;
        const answer = fullText.split("[/INST]").pop().trim();
        if (answer) return answer;
      }
    }
  } catch (error) {
    console.warn("AI Coach API error, using smart local heuristics:", error);
  }

  // Smart Heuristic Engine (Highly specific and custom)
  if (todaySittingHours > 8) {
    return `You've been desk-bound for ${todaySittingHours} hours. Start a Seated Figure-4 stretch to release hip pressure and avoid sciatica.`;
  }
  if (breaksCompleted === 0) {
    return `No breaks taken yet today, ${user.name || 'Friend'}. Take a 2-minute posture break to release upper trapezius stiffness!`;
  }
  if (waterCount < dailyWaterGoal / 2) {
    return `Hydration helps keep joint tissues lubricated. Have a cup of water and do a quick wrist extension right now.`;
  }
  if (breaksCompleted < dailyBreakGoal) {
    return `You're at ${breaksCompleted}/${dailyBreakGoal} daily breaks. A 30-second shoulder roll will relieve tension in your rhomboids.`;
  }
  if (streak >= 5) {
    return `Excellent ${streak}-day streak! Keep up the posture habits by doing a Seated Spinal Twist before logging off.`;
  }

  return `Great job maintaining focus today! Keep sitting tall and remember to relax your shoulders away from your ears.`;
}
