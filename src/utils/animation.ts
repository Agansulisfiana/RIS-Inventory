import confetti from 'canvas-confetti';

/**
 * RIS Inventory Interactive Animation & Sound Utilities
 */

// Colors matching RIS Theme: Blue, Cyan, Emerald, Indigo, Amber
const BRAND_COLORS = ['#0284c7', '#2563eb', '#38bdf8', '#10b981', '#f59e0b', '#6366f1'];

/**
 * Trigger celebratory confetti burst on successful actions (Create DO, Add Product, Print, Checkout Demo)
 */
export const triggerSuccessConfetti = () => {
  if (typeof window === 'undefined') return;

  try {
    // Center-top celebratory burst
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
      zIndex: 99999
    });

    // Secondary subtle cannons from corners
    setTimeout(() => {
      confetti({
        particleCount: 25,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: BRAND_COLORS,
        zIndex: 99999
      });
      confetti({
        particleCount: 25,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: BRAND_COLORS,
        zIndex: 99999
      });
    }, 150);
  } catch {
    // graceful fallback if canvas is restricted
  }
};

/**
 * Micro-burst from a click event position
 */
export const triggerClickParticles = (event?: React.MouseEvent | MouseEvent) => {
  if (typeof window === 'undefined') return;

  try {
    const x = event ? event.clientX / window.innerWidth : 0.5;
    const y = event ? event.clientY / window.innerHeight : 0.5;

    confetti({
      particleCount: 18,
      spread: 45,
      startVelocity: 18,
      ticks: 50,
      origin: { x, y },
      colors: BRAND_COLORS,
      shapes: ['circle'],
      scalar: 0.75,
      disableForReducedMotion: true,
      zIndex: 99999
    });
  } catch {
    // fallback
  }
};

/**
 * Special Logo Interactive Easter Egg Animation
 */
export const triggerLogoCelebration = (event?: React.MouseEvent) => {
  if (typeof window === 'undefined') return;

  try {
    const x = event ? event.clientX / window.innerWidth : 0.2;
    const y = event ? event.clientY / window.innerHeight : 0.2;

    confetti({
      particleCount: 35,
      spread: 60,
      startVelocity: 25,
      ticks: 70,
      origin: { x, y },
      colors: ['#0284c7', '#38bdf8', '#2563eb', '#60a5fa', '#93c5fd'],
      scalar: 0.9,
      zIndex: 99999
    });
  } catch {
    // fallback
  }
};

/**
 * Web Audio API gentle synthesizer for click & action feedback (no audio assets needed)
 */
export const playFeedbackSound = (type: 'click' | 'success' | 'action' = 'click') => {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'action') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 400);
  } catch {
    // Audio might be blocked by browser autoplay policy before gesture
  }
};

