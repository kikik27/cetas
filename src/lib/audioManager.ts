/**
 * Global singleton audio manager.
 * Handles track switching with crossfade so music never overlaps.
 */

type TrackKey = 'main' | 'battle' | null

const TRACKS: Record<NonNullable<TrackKey>, string> = {
  main:   '/assets/music/main_soundtrack.mp3',
  battle: '/assets/music/battle_soundtrack.mp3',
}

const FADE_STEPS = 20
const FADE_INTERVAL_MS = 40   // 800ms total fade

class AudioManager {
  private audio: HTMLAudioElement | null = null
  private current: TrackKey = null
  private fadeTimer: ReturnType<typeof setInterval> | null = null
  private _enabled = false

  get enabled() { return this._enabled }

  enable() {
    this._enabled = true
  }

  disable() {
    this._enabled = false
    this.stop()
  }

  play(track: TrackKey, volume = 0.35) {
    if (!this._enabled || track === null) { this.stop(); return }
    if (this.current === track && this.audio && !this.audio.paused) return

    this._fadeOut(() => this._startTrack(track, volume))
  }

  stop() {
    this._fadeOut(() => {})
  }

  private _startTrack(track: NonNullable<TrackKey>, volume: number) {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
    }
    const audio = new Audio(TRACKS[track])
    audio.loop   = true
    audio.volume = 0
    this.audio   = audio
    this.current = track

    audio.play().catch(() => {/* blocked */})

    // Fade in
    let step = 0
    const target = volume
    const timer = setInterval(() => {
      step++
      if (!this.audio || this.audio !== audio) { clearInterval(timer); return }
      this.audio.volume = Math.min(target, (step / FADE_STEPS) * target)
      if (step >= FADE_STEPS) clearInterval(timer)
    }, FADE_INTERVAL_MS)
  }

  private _fadeOut(onDone: () => void) {
    if (this.fadeTimer) clearInterval(this.fadeTimer)

    if (!this.audio || this.audio.paused || this.audio.volume === 0) {
      this.current = null
      onDone()
      return
    }

    const audio  = this.audio
    const start  = audio.volume
    const step   = start / FADE_STEPS
    let   count  = 0

    this.fadeTimer = setInterval(() => {
      count++
      const next = start - step * count
      if (next <= 0 || count >= FADE_STEPS) {
        audio.pause()
        audio.volume = 0
        this.current = null
        clearInterval(this.fadeTimer!)
        this.fadeTimer = null
        onDone()
      } else {
        audio.volume = next
      }
    }, FADE_INTERVAL_MS)
  }
}

// Singleton — safe to import anywhere
export const audioManager = new AudioManager()
