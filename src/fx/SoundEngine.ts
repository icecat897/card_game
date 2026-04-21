/**
 * SoundEngine - 用 Web Audio API 代码合成音效 + 程序化 BGM（无外部素材）
 * SFX 一次性触发；BGM 为持续运行的 pad + bass + 随机琶音。
 */
export class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private muted: boolean = false
  private musicMuted: boolean = false

  // 持续音源（BGM）
  private bgmNodes: { osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode; lfoGain?: GainNode }[] = []
  private bgmTimer: number | null = null
  private bgmMode: 'none' | 'normal' | 'boss' = 'none'

  init(): void {
    if (this.ctx) return
    try {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      const Ctor = AC.AudioContext || AC.webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)
      this.sfxBus = this.ctx.createGain()
      this.sfxBus.gain.value = 0.28
      this.sfxBus.connect(this.master)
      this.musicBus = this.ctx.createGain()
      this.musicBus.gain.value = 0.22
      this.musicBus.connect(this.master)
    } catch {
      /* ignore audio unavailable */
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { /* ignore */ })
    }
  }

  setMuted(m: boolean): void {
    this.muted = m
    if (this.sfxBus) this.sfxBus.gain.value = m ? 0 : 0.28
  }
  isMuted(): boolean { return this.muted }

  setMusicMuted(m: boolean): void {
    this.musicMuted = m
    if (this.musicBus) this.musicBus.gain.value = m ? 0 : 0.22
  }
  isMusicMuted(): boolean { return this.musicMuted }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', attack = 0.008, peakGain = 1): void {
    if (!this.ctx || !this.sfxBus || this.muted) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
    osc.connect(gain)
    gain.connect(this.sfxBus)
    const now = this.ctx.currentTime
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peakGain, now + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  private sweep(f1: number, f2: number, duration: number, type: OscillatorType = 'sine', peakGain = 0.7): void {
    if (!this.ctx || !this.sfxBus || this.muted) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    const now = this.ctx.currentTime
    osc.frequency.setValueAtTime(f1, now)
    osc.frequency.exponentialRampToValueAtTime(f2, now + duration)
    osc.connect(gain)
    gain.connect(this.sfxBus)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  private noise(duration: number, peakGain = 0.2): void {
    if (!this.ctx || !this.sfxBus || this.muted) return
    const bufferSize = Math.floor(this.ctx.sampleRate * duration)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxBus)
    const now = this.ctx.currentTime
    gain.gain.setValueAtTime(peakGain, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    src.start(now)
    src.stop(now + duration)
  }

  // === SFX ===

  playMove(): void {
    // 轻微随机化让连续移动不会单调
    const base = 480 + Math.random() * 80
    this.tone(base, 0.06, 'triangle', 0.005, 0.5)
  }
  playFlip(): void { this.tone(720, 0.08, 'sine', 0.005, 0.6); this.noise(0.04, 0.08) }
  playDrop(): void { this.tone(320, 0.06, 'triangle', 0.005, 0.4) }
  playReject(): void { this.tone(140, 0.18, 'sawtooth', 0.01, 0.4) }

  playClear(): void {
    const base = 440
    const steps = [0, 4, 7, 12]
    steps.forEach((semi, i) => {
      setTimeout(() => this.tone(base * Math.pow(2, semi / 12), 0.14, 'sine', 0.005, 0.55), i * 55)
    })
  }

  playBigClear(): void {
    const base = 330
    const semis = [0, 3, 7, 10, 12, 15, 19, 24]
    semis.forEach((s, i) => {
      setTimeout(() => this.tone(base * Math.pow(2, s / 12), 0.18, 'sine', 0.005, 0.55), i * 45)
    })
    setTimeout(() => this.sweep(200, 1200, 0.45, 'triangle', 0.35), 0)
    setTimeout(() => this.noise(0.35, 0.14), 380)
  }

  playCombo(streak: number): void {
    const base = 440
    const semi = Math.min(streak, 12)
    this.tone(base * Math.pow(2, semi / 12), 0.08, 'triangle', 0.005, 0.55)
  }

  playCoin(): void { this.tone(1200, 0.04, 'sine', 0.002, 0.4); this.tone(1800, 0.05, 'sine', 0.003, 0.3) }

  playCashOut(): void {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.tone(800 + Math.random() * 900, 0.05, 'sine', 0.002, 0.4)
      }, i * 40)
    }
  }

  playButton(): void { this.tone(680, 0.04, 'sine', 0.002, 0.3) }
  playPotion(): void { this.sweep(400, 1600, 0.3, 'triangle', 0.4) }
  playScroll(): void { this.sweep(600, 1200, 0.25, 'sine', 0.4); this.noise(0.15, 0.06) }
  playBoss(): void {
    this.sweep(140, 80, 0.8, 'sawtooth', 0.4)
    setTimeout(() => this.noise(0.3, 0.3), 400)
  }
  playWin(): void {
    const semis = [0, 4, 7, 12]
    semis.forEach((s, i) => {
      setTimeout(() => this.tone(440 * Math.pow(2, s / 12), 0.3, 'sine', 0.01, 0.5), i * 90)
    })
  }
  playLose(): void { this.sweep(400, 80, 0.7, 'sawtooth', 0.35) }

  // === 程序化 BGM ===

  /**
   * 启动 / 切换 BGM。不会重复启动相同的 mode。
   *  - normal：阴沉 D 小调 drone + pad + 随机钟琴琶音
   *  - boss：低两度（C# 小调）+ 更扭曲的波形
   */
  startAmbient(mode: 'normal' | 'boss'): void {
    if (!this.ctx || !this.musicBus) return
    if (this.bgmMode === mode) return
    this.stopAmbient()
    this.bgmMode = mode

    const ctx = this.ctx
    const musicBus = this.musicBus
    const now = ctx.currentTime

    // 主调参数
    const isBoss = mode === 'boss'
    const rootHz = isBoss ? 34.65 : 36.71  // C#1 / D1
    // 和弦按半音偏移（相对 root）：根、五度、小七、九度
    const voiceSemis = [0, 7, 10, 14]

    // 低频 drone（正弦 + 次谐波振动）
    const droneOsc = ctx.createOscillator()
    droneOsc.type = 'sine'
    droneOsc.frequency.value = rootHz
    const droneGain = ctx.createGain()
    droneGain.gain.value = 0
    droneGain.gain.linearRampToValueAtTime(0.42, now + 3)
    // LFO 颤音
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.12
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 1.4
    lfo.connect(lfoGain)
    lfoGain.connect(droneOsc.frequency)
    droneOsc.connect(droneGain)
    droneGain.connect(musicBus)
    droneOsc.start(now)
    lfo.start(now)
    this.bgmNodes.push({ osc: droneOsc, gain: droneGain, lfo, lfoGain })

    // Pad 和声（三个不同八度的声部）
    voiceSemis.forEach((semi, i) => {
      const padOsc = ctx.createOscillator()
      padOsc.type = isBoss ? 'sawtooth' : 'triangle'
      // 主 pad 放在 3~4 八度
      const octave = i === 0 ? 3 : 4
      padOsc.frequency.value = rootHz * Math.pow(2, octave) * Math.pow(2, semi / 12)
      // 轻微失调制造合唱感
      padOsc.detune.value = (i - 1.5) * 6

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = isBoss ? 650 : 900
      filter.Q.value = 2

      const padGain = ctx.createGain()
      padGain.gain.value = 0
      const targetVol = isBoss ? 0.07 : 0.05
      padGain.gain.linearRampToValueAtTime(targetVol, now + 4 + i * 0.4)

      // pad 各自的呼吸 LFO
      const breatheLfo = ctx.createOscillator()
      breatheLfo.frequency.value = 0.07 + i * 0.03
      const breatheGain = ctx.createGain()
      breatheGain.gain.value = targetVol * 0.4
      breatheLfo.connect(breatheGain)
      breatheGain.connect(padGain.gain)
      breatheLfo.start(now)

      padOsc.connect(filter)
      filter.connect(padGain)
      padGain.connect(musicBus)
      padOsc.start(now)
      this.bgmNodes.push({ osc: padOsc, gain: padGain, lfo: breatheLfo, lfoGain: breatheGain })
    })

    // 随机琶音（钟/水滴）
    const scale = isBoss ? [0, 3, 5, 6, 8, 11] : [0, 3, 5, 7, 10, 12, 15]
    const arpTick = () => {
      if (!this.ctx || !this.musicBus) return
      if (this.bgmMode !== mode) return
      const chance = isBoss ? 0.4 : 0.55
      if (Math.random() < chance) {
        const count = 1 + Math.floor(Math.random() * 3)
        for (let i = 0; i < count; i++) {
          const semi = scale[Math.floor(Math.random() * scale.length)]
          const octave = 5 + Math.floor(Math.random() * 2)
          const f = rootHz * Math.pow(2, octave) * Math.pow(2, semi / 12)
          setTimeout(() => this.playBellTone(f, isBoss ? 0.7 : 1.1), i * 220 + Math.random() * 180)
        }
      }
      const nextDelay = 4200 + Math.random() * 3500
      this.bgmTimer = window.setTimeout(arpTick, nextDelay)
    }
    this.bgmTimer = window.setTimeout(arpTick, 2500)
  }

  /** 环境钟琴音（比 SFX 更衰减得长） */
  private playBellTone(freq: number, duration: number): void {
    if (!this.ctx || !this.musicBus) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain)
    gain.connect(this.musicBus)
    osc.start(now)
    osc.stop(now + duration + 0.02)

    // 轻微二次谐波增加金属质感
    const osc2 = this.ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2.01
    const gain2 = this.ctx.createGain()
    gain2.gain.setValueAtTime(0.0001, now)
    gain2.gain.exponentialRampToValueAtTime(0.025, now + 0.01)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.8)
    osc2.connect(gain2)
    gain2.connect(this.musicBus)
    osc2.start(now)
    osc2.stop(now + duration + 0.02)
  }

  stopAmbient(): void {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    for (const node of this.bgmNodes) {
      try {
        node.gain.gain.cancelScheduledValues(now)
        node.gain.gain.linearRampToValueAtTime(0.0001, now + 0.8)
        node.osc.stop(now + 0.9)
        node.lfo?.stop(now + 0.9)
      } catch { /* ignore */ }
    }
    this.bgmNodes = []
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer)
      this.bgmTimer = null
    }
    this.bgmMode = 'none'
  }
}

export const sound = new SoundEngine()
