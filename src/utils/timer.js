let timerInterval = null;

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function startTimer(onTick, onComplete) {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    onTick((prevRemaining) => {
      if (prevRemaining <= 1) {
        clearInterval(timerInterval);
        timerInterval = null;
        if (onComplete) onComplete();
        return 0;
      }
      return prevRemaining - 1;
    });
  }, 1000);
}

export function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
