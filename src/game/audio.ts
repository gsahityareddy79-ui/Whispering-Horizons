/**
 * 100% Procedural Web Audio API soundscape engine for Whispering Horizons
 * Zero external audio files — zero 404 dependencies!
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oceanGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private waterfallGain: GainNode | null = null;
  private isInitialized = false;
  private isMuted = false;
  private masterVol = 0.8;
  private lastFootstepTime = 0;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initOceanSurf();
      this.initCoastalWind();
      this.initWaterfall();
      this.initCampfire();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio could not initialize (user gesture needed):', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(volume: number) {
    this.masterVol = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.masterVol, this.ctx.currentTime, 0.05);
    }
  }

  // 1. Procedural Ocean Surf (Filtered Noise + LFO swell)
  private initOceanSurf() {
    if (!this.ctx || !this.masterGain) return;

    // Buffer with pink-like noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.12;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Low-pass filter for deep rolling water body
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;

    // LFO for rhythmic ocean swell
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.14; // ~7 second wave period

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 280;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.oceanGain = this.ctx.createGain();
    this.oceanGain.gain.value = 0.45;

    whiteNoise.connect(filter);
    filter.connect(this.oceanGain);
    this.oceanGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
  }

  // 2. Procedural Coastal Wind Breeze
  private initCoastalWind() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.06;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 520;
    bandpass.Q.value = 2.5;

    // Wind modulation
    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.value = 0.08;
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.value = 260;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(bandpass.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.28;

    noise.connect(bandpass);
    bandpass.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    noise.start();
    windLfo.start();
  }

  // 3. Procedural Waterfall Roar
  private initWaterfall() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;

    this.waterfallGain = this.ctx.createGain();
    this.waterfallGain.gain.value = 0.0; // Proximity driven

    noise.connect(filter);
    filter.connect(this.waterfallGain);
    this.waterfallGain.connect(this.masterGain);

    noise.start();
  }

  private campfireGain: GainNode | null = null;

  // 4. Procedural Crackling Campfire Ambience
  private initCampfire() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Crackle pops
      const isPop = Math.random() < 0.003;
      data[i] = isPop ? (Math.random() - 0.5) * 0.8 : (Math.random() - 0.5) * 0.04;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1200;
    bandpass.Q.value = 1.8;

    this.campfireGain = this.ctx.createGain();
    this.campfireGain.gain.value = 0.0;

    noise.connect(bandpass);
    bandpass.connect(this.campfireGain);
    this.campfireGain.connect(this.masterGain);

    noise.start();
  }

  /**
   * Update spatial audio (waterfall at 42, 11 and campfire at -16, -26)
   */
  public updatePlayerPosition(px: number, pz: number) {
    if (!this.ctx) return;

    // Waterfall spatial volume
    if (this.waterfallGain) {
      const distW = Math.hypot(px - 42, pz - 11);
      const maxDistW = 55;
      const volW = Math.max(0, 1 - distW / maxDistW);
      this.waterfallGain.gain.setTargetAtTime(volW * volW * 0.55, this.ctx.currentTime, 0.1);
    }

    // Campfire spatial volume
    if (this.campfireGain) {
      const distC = Math.hypot(px - (-16), pz - (-26));
      const maxDistC = 22;
      const volC = Math.max(0, 1 - distC / maxDistC);
      this.campfireGain.gain.setTargetAtTime(volC * volC * 0.35, this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Procedural footstep sound (gentle filtered impulse)
   */
  public playFootstep(isRunning: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const interval = isRunning ? 0.32 : 0.48;
    if (now - this.lastFootstepTime < interval) return;
    this.lastFootstepTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    // Frequency drop creates a soft thud
    const baseFreq = 120 + Math.random() * 30;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);

    filter.type = 'lowpass';
    filter.frequency.value = 400;

    gain.gain.setValueAtTime(isRunning ? 0.14 : 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Harmonic discovery chime for lore notes and landmarks (pentatonic bell arpeggio)
   */
  public playDiscoveryChime() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.09 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 1.3);
    });
  }

  /**
   * Resonant lighthouse foghorn drone
   */
  public playLighthouseFoghorn() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now); // A2

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(164.81, now); // E3 (fifth)

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.3);
    osc2.stop(now + 3.3);
  }
}

export const soundEngine = new SoundEngine();
