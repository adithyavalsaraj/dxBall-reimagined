
export class SoundService {
  private ctx: AudioContext | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playBrickHit() {
    this.playTone(440 + Math.random() * 200, 'square', 0.1, 0.05);
  }

  playPaddleHit() {
    this.playTone(220, 'sine', 0.15, 0.1);
  }

  playWallHit() {
    this.playTone(150, 'sine', 0.05, 0.05);
  }

  playLoseLife() {
    if (!this.ctx) return;
    this.playTone(300, 'sawtooth', 0.3, 0.1);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.4, 0.1), 100);
  }

  playGameOver() {
    this.playTone(100, 'sawtooth', 1.0, 0.15);
  }

  playLevelStart() {
    this.playTone(523.25, 'sine', 0.1, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1), 100); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.1), 200); // G5
  }
}

export const soundService = new SoundService();
