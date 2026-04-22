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
   * 启动 / 切换 BGM。正常关卡是 C 大调 I-V-vi-IV（「Axis of Awesome」循环），
   * boss 关切成 A 小调仍保持欢快的八拍琶音节奏。
   */
  startAmbient(mode: 'normal' | 'boss'): void {
    if (!this.ctx || !this.musicBus) return
    if (this.bgmMode === mode) return
    this.stopAmbient()
    this.bgmMode = mode

    const isBoss = mode === 'boss'

    // 调性：normal = C3 (C 大调)；boss = A2 (A 小调，自然小调的主音)
    const rootHz = isBoss ? 110 : 130.81

    // 和弦进行 - 半音相对 root
    // 大调（欢快）：Cmaj7 - G7 - Am7 - Fmaj7
    // 小调（boss）：Am7 - Em7 - Fmaj7 - G7（自然小调级数 i-v-VI-VII，不使人毛骨悚然）
    const progressionMajor = [
      [0, 4, 7, 11],    // Cmaj7
      [7, 11, 14, 17],  // G7
      [9, 12, 16, 19],  // Am7
      [5, 9, 12, 16]    // Fmaj7
    ]
    const progressionMinor = [
      [0, 3, 7, 10],    // Am7
      [7, 10, 14, 17],  // Em7
      [8, 12, 15, 19],  // Fmaj7 (from A: F is +8 semitones)
      [10, 14, 17, 20]  // G7 (from A: G is +10 semitones)
    ]
    const progression = isBoss ? progressionMinor : progressionMajor

    // 每个和弦的根音（写相对 root 的半音）
    const bassSemisMajor = [0, 7, 9, 5]
    const bassSemisMinor = [0, 7, 8, 10]
    const bassSemis = isBoss ? bassSemisMinor : bassSemisMajor

    // 每和弦 3.0 秒（约 80 BPM，4 拍一和弦）；boss 节奏加快一点
    const chordDuration = isBoss ? 2.6 : 3.0
    const beatsPerChord = 8

    // 琶音谱面 [和弦音索引, 八度偏移]
    const arpPatternNormal: [number, number][] = [
      [0, 1], [2, 1], [1, 2], [3, 1],
      [2, 1], [0, 2], [1, 1], [3, 1]
    ]
    const arpPatternBoss: [number, number][] = [
      [0, 1], [2, 1], [3, 1], [1, 2],
      [3, 1], [2, 2], [1, 1], [0, 1]
    ]
    const arpPattern = isBoss ? arpPatternBoss : arpPatternNormal

    let step = 0

    const tick = () => {
      if (this.bgmMode !== mode || !this.ctx || !this.musicBus) return

      const chordIdx = step % progression.length
      const chord = progression[chordIdx]
      const bassSemi = bassSemis[chordIdx]

      // 低音：根音降一个八度，柔软三角波
      const bassFreq = rootHz * Math.pow(2, (bassSemi - 12) / 12)
      this.playSoftVoice(bassFreq, chordDuration * 1.1, {
        type: 'triangle', peak: 0.09, attack: 0.2, release: 0.7
      })
      // 弱八度叠加（让低频更饱满，不空洞）
      this.playSoftVoice(bassFreq * 2, chordDuration * 1.1, {
        type: 'sine', peak: 0.028, attack: 0.25, release: 0.7
      })

      // 垫音（Pad）：同时拉住和弦所有音
      for (const semi of chord) {
        const freq = rootHz * Math.pow(2, semi / 12)
        this.playSoftVoice(freq, chordDuration * 1.05, {
          type: 'triangle',
          peak: 0.028,
          attack: 0.45,
          release: 0.85,
          filterFreq: 1800
        })
      }

      // 琶音：像音乐盒一样叮咚的旋律
      for (let i = 0; i < beatsPerChord; i++) {
        const [toneIdx, octOffset] = arpPattern[i % arpPattern.length]
        const semi = chord[toneIdx % chord.length] + 12 * octOffset
        const freq = rootHz * Math.pow(2, semi / 12)
        const delayMs = i * chordDuration * 1000 / beatsPerChord
        setTimeout(() => {
          if (this.bgmMode === mode) this.playBellTone(freq, 0.9)
        }, delayMs)
      }

      // 偶发高音铃铛点缀（让音乐有「惊喜」感）
      if (Math.random() < 0.35) {
        const sparkleSemi = chord[Math.floor(Math.random() * chord.length)] + 24
        const sparkleFreq = rootHz * Math.pow(2, sparkleSemi / 12)
        setTimeout(() => {
          if (this.bgmMode === mode) this.playBellTone(sparkleFreq, 1.3)
        }, chordDuration * 1000 * (0.5 + Math.random() * 0.4))
      }

      step++
      this.bgmTimer = window.setTimeout(tick, chordDuration * 1000)
    }

    // 轻微预热延迟
    this.bgmTimer = window.setTimeout(tick, 200)
  }

  /**
   * 带 ADSR 包络的柔和持续音，用于 BGM 的 pad / 低音。
   */
  private playSoftVoice(
    freq: number,
    duration: number,
    opts: {
      type?: OscillatorType
      peak?: number
      attack?: number
      release?: number
      filterFreq?: number
    }
  ): void {
    if (!this.ctx || !this.musicBus) return
    const ctx = this.ctx
    const bus = this.musicBus
    const now = ctx.currentTime

    const peak = opts.peak ?? 0.05
    const attack = opts.attack ?? 0.3
    const release = opts.release ?? 0.6
    const sustain = Math.max(0.05, duration - attack - release)

    const osc = ctx.createOscillator()
    osc.type = opts.type ?? 'triangle'
    osc.frequency.value = freq

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak, now + attack)
    gain.gain.setValueAtTime(peak, now + attack + sustain)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + sustain + release)

    osc.connect(gain)

    if (opts.filterFreq) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = opts.filterFreq
      filter.Q.value = 0.7
      gain.connect(filter)
      filter.connect(bus)
    } else {
      gain.connect(bus)
    }

    osc.start(now)
    osc.stop(now + duration + 0.2)
  }

  /** 音乐盒 / 钟琴音：三层谐波叠加，略带金属质感但柔和 */
  private playBellTone(freq: number, duration: number): void {
    if (!this.ctx || !this.musicBus) return
    const ctx = this.ctx
    const bus = this.musicBus
    const now = ctx.currentTime

    // 基频（暖正弦）
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = freq
    const gain1 = ctx.createGain()
    gain1.gain.setValueAtTime(0.0001, now)
    gain1.gain.exponentialRampToValueAtTime(0.075, now + 0.003)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc1.connect(gain1)
    gain1.connect(bus)
    osc1.start(now)
    osc1.stop(now + duration + 0.05)

    // 二次谐波（闪光）
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2.005  // 轻微失调制造闪烁
    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0.0001, now)
    gain2.gain.exponentialRampToValueAtTime(0.024, now + 0.006)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.65)
    osc2.connect(gain2)
    gain2.connect(bus)
    osc2.start(now)
    osc2.stop(now + duration + 0.05)

    // 三次谐波（音乐盒质感）
    const osc3 = ctx.createOscillator()
    osc3.type = 'sine'
    osc3.frequency.value = freq * 3.0
    const gain3 = ctx.createGain()
    gain3.gain.setValueAtTime(0.0001, now)
    gain3.gain.exponentialRampToValueAtTime(0.010, now + 0.004)
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.4)
    osc3.connect(gain3)
    gain3.connect(bus)
    osc3.start(now)
    osc3.stop(now + duration + 0.05)
  }

  stopAmbient(): void {
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer)
      this.bgmTimer = null
    }
    this.bgmMode = 'none'
    // 新版 BGM 是一次性计划的 voice，靠 release 包络自然衰减，不再需要追踪 bgmNodes。
    // 但兼容旧实现中残留的持续 oscillator：淡出后停止。
    if (this.ctx) {
      const now = this.ctx.currentTime
      for (const node of this.bgmNodes) {
        try {
          node.gain.gain.cancelScheduledValues(now)
          node.gain.gain.linearRampToValueAtTime(0.0001, now + 0.5)
          node.osc.stop(now + 0.55)
          node.lfo?.stop(now + 0.55)
        } catch { /* ignore */ }
      }
    }
    this.bgmNodes = []
  }
}

export const sound = new SoundEngine()
