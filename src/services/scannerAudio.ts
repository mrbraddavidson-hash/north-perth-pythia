// Web Audio & Synthesizer Engine for North Perth Public Safety Radio Scanner

class ScannerRadioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private carrierGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private volume: number = 0.7;
  private isMuted: boolean = false;
  private isRunning: boolean = false;
  private periodicTimer: number | null = null;
  private onTransmissionChange: ((transmitting: boolean, text: string) => void) | null = null;
  private currentChannelId: string = 'opp-perth';

  private DISPATCH_CALLS: Record<string, string[]> = {
    'opp-perth': [
      'Perth OPP Dispatch to 1-Echo-14, 10-4 on Highway 86 westbound patrol.',
      'Perth OPP to 1-Sierra-22, traffic stop on Road 164 north of Listowel.',
      'Perth OPP 1-Oscar-12, report of disabled vehicle on Highway 23 near Monkton.',
      'Perth OPP Dispatch, road patrol reports surface bare and dry through Atwood.',
      'Perth OPP to 1-Echo-14, 10-8 in North Perth sector.',
    ],
    'np-fire': [
      'North Perth Fire Station 1 Listowel, testing pagers and radio check.',
      'North Perth Fire Station 2 Atwood, 10-4 standing by on tactical one.',
      'North Perth Fire Command, burn permit inspection complete on Line 87.',
      'North Perth Pumper 1, returning to quarters on Wallace Ave.',
      'North Perth Fire, Tanker 2 back in service.',
    ],
    'perth-ems': [
      'Perth County Paramedics Medic 3, respond to medical assist Listowel sector.',
      'Perth EMS Medic 2, clear of Listowel Memorial Hospital, back in service.',
      'Perth Paramedics 4-Bravo, staging at Mitchell sector station.',
      'Perth Paramedic dispatch, transfer unit approaching North Perth county line.',
    ],
    'ornge-air': [
      'Ornge 779 inbound to Listowel Memorial CPN5, request helipad wind check.',
      'Ornge 779 descending through 2,500 feet for Listowel Hospital pad.',
      'Ornge 779 on final approach to CPN5, surface wind 310 at 10 knots.',
      'Ornge Medevac 779 wheels down at Listowel helipad, emergency transfer.',
    ],
  };

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setTransmissionCallback(cb: (transmitting: boolean, text: string) => void) {
    this.onTransmissionChange = cb;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.audioCtx.currentTime);
    }
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public setChannel(channelId: string) {
    this.currentChannelId = channelId;
    if (this.isRunning) {
      // Play channel change squelch click
      this.playSquelchTail();
      // Immediately schedule a transmission for the new channel after 800ms
      setTimeout(() => {
        if (this.isRunning && !this.isMuted) {
          this.triggerRandomTransmission();
        }
      }, 700);
    }
  }

  // Generate white noise buffer
  private createNoiseBuffer(seconds = 1.5): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Play realistic VHF squelch tail burst ("pshh-kt")
  public playSquelchTail() {
    try {
      const ctx = this.getContext();
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 2.2;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Motorola MDC-1200 style pre-transmission data chirp
  public playMdcChirp(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1800, now + 0.03);
        osc.frequency.setValueAtTime(1200, now + 0.06);

        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.09);

        setTimeout(resolve, 100);
      } catch {
        resolve();
      }
    });
  }

  // Fire Department 2-Tone Pager Alert (Station 1 Listowel tones)
  public playPagerTones(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // Tone A: 645 Hz, Tone B: 871 Hz
        osc.frequency.setValueAtTime(645, now);
        osc.frequency.setValueAtTime(871, now + 0.3);

        gain.gain.setValueAtTime(0.25 * this.volume, now);
        gain.gain.setValueAtTime(0.25 * this.volume, now + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.75);

        setTimeout(resolve, 800);
      } catch {
        resolve();
      }
    });
  }

  // Subtle continuous VHF background receiver carrier noise floor
  private startCarrierFloor() {
    try {
      const ctx = this.getContext();
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(3);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 3.0;

      this.carrierGain = ctx.createGain();
      // Keep carrier faint, around 2-3%
      this.carrierGain.gain.setValueAtTime(0.02 * this.volume, ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.carrierGain);
      if (this.masterGain) this.carrierGain.connect(this.masterGain);

      noise.start();
      this.noiseSource = noise;
    } catch (e) {
      console.warn('Carrier noise error', e);
    }
  }

  private stopCarrierFloor() {
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // ignore
      }
      this.noiseSource = null;
    }
  }

  // Speak a tactical dispatch transmission using speech synthesis + radio sound envelope
  public async triggerTransmission(messageText?: string) {
    if (this.isMuted) return;

    const calls = this.DISPATCH_CALLS[this.currentChannelId] || this.DISPATCH_CALLS['opp-perth'];
    const text = messageText || calls[Math.floor(Math.random() * calls.length)];

    if (this.onTransmissionChange) {
      this.onTransmissionChange(true, text);
    }

    // Play preamble tones
    if (this.currentChannelId === 'np-fire') {
      await this.playPagerTones();
    } else {
      await this.playMdcChirp();
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.08; // slightly brisk tactical tempo
      utterance.pitch = 1.02;

      // Pick an English voice
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith('en')) || null;
      if (enVoice) utterance.voice = enVoice;

      utterance.onend = () => {
        this.playSquelchTail();
        if (this.onTransmissionChange) {
          this.onTransmissionChange(false, '');
        }
      };

      utterance.onerror = () => {
        this.playSquelchTail();
        if (this.onTransmissionChange) {
          this.onTransmissionChange(false, '');
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if no speech synthesis
      setTimeout(() => {
        this.playSquelchTail();
        if (this.onTransmissionChange) {
          this.onTransmissionChange(false, '');
        }
      }, 1200);
    }
  }

  public triggerRandomTransmission() {
    this.triggerTransmission();
  }

  public start() {
    this.isRunning = true;
    this.getContext();
    this.playSquelchTail();
    this.startCarrierFloor();

    // Trigger initial transmission after 600ms
    setTimeout(() => {
      if (this.isRunning && !this.isMuted) {
        this.triggerRandomTransmission();
      }
    }, 600);

    // Schedule periodic radio transmissions (every 14-25 seconds)
    const scheduleNext = () => {
      if (!this.isRunning) return;
      const delay = Math.floor(Math.random() * 11000) + 14000;
      this.periodicTimer = window.setTimeout(() => {
        if (this.isRunning && !this.isMuted) {
          this.triggerRandomTransmission();
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  public stop() {
    this.isRunning = false;
    if (this.periodicTimer) {
      clearTimeout(this.periodicTimer);
      this.periodicTimer = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.stopCarrierFloor();
    this.playSquelchTail();
    if (this.onTransmissionChange) {
      this.onTransmissionChange(false, '');
    }
  }
}

export const scannerEngine = new ScannerRadioEngine();
