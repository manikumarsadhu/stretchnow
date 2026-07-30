let audioCtx = null;
let noiseSource = null;
let filterNode = null;
let gainNode = null;
let lfoOsc = null;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || /** @type {any} */(window).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function createNoiseBuffer(color = 'white') {
  if (!audioCtx) return null;
  const bufferSize = 4 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  if (color === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (color === 'brown') {
    // Brown noise (deeper, warmer)
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate gain
    }
  } else if (color === 'pink') {
    // Pink noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // Compensate gain
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

export function playRelaxationSound(type) {
  try {
    stopRelaxationSound();
    initAudioContext();

    if (!audioCtx) return;

    // CreateNodes
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // keep background sound gentle

    filterNode = audioCtx.createBiquadFilter();

    let buffer = null;

    if (type === 'white_noise') {
      buffer = createNoiseBuffer('white');
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(1000, audioCtx.currentTime);
    } else if (type === 'ocean') {
      // Ocean waves: modulated brown noise
      buffer = createNoiseBuffer('brown');
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(400, audioCtx.currentTime);

      // Low frequency oscillator for wave swells (0.1 Hz = 10s wave interval)
      lfoOsc = audioCtx.createOscillator();
      lfoOsc.frequency.setValueAtTime(0.1, audioCtx.currentTime);

      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0.04, audioCtx.currentTime); // swelling depth

      // Connect LFO -> gainNode gain value to simulate wave swells
      lfoOsc.connect(lfoGain);
      lfoGain.connect(gainNode.gain);
      lfoOsc.start();
    } else if (type === 'rain') {
      // Rain: low-passed pink noise with higher cut-off
      buffer = createNoiseBuffer('pink');
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(1200, audioCtx.currentTime);
    } else if (type === 'forest') {
      // Forest/Wind: Bandpass filtered white noise modulated by a very slow random LFO
      buffer = createNoiseBuffer('white');
      filterNode.type = 'bandpass';
      filterNode.Q.setValueAtTime(3.0, audioCtx.currentTime);
      filterNode.frequency.setValueAtTime(450, audioCtx.currentTime);

      // Modulate frequency of bandpass filter to sound like blowing wind
      lfoOsc = audioCtx.createOscillator();
      lfoOsc.frequency.setValueAtTime(0.07, audioCtx.currentTime); // slow swell

      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(150, audioCtx.currentTime); // frequency swing size

      lfoOsc.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);
      lfoOsc.start();
    }

    if (!buffer) return;

    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Connect source -> filter -> gain -> destination
    noiseSource.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start();
  } catch (error) {
    console.error("Synthesizer failed to start sound:", error);
  }
}

export function stopRelaxationSound() {
  try {
    if (noiseSource) {
      noiseSource.stop();
      noiseSource.disconnect();
      noiseSource = null;
    }
    if (lfoOsc) {
      lfoOsc.stop();
      lfoOsc.disconnect();
      lfoOsc = null;
    }
    if (filterNode) {
      filterNode.disconnect();
      filterNode = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  } catch (error) {
    console.warn("Error stopping relaxation sound:", error);
  }
}
