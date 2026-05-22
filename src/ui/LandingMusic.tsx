'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * Landing page background music.
 *
 * Strategy:
 * - Try autoplay immediately on mount (works if user already interacted with the page).
 * - If autoplay is blocked (common on first visit), attach a one-time listener on the
 *   document for any user gesture (click / keydown / touchstart) and start then.
 * - Show a mute/unmute toggle button so the user always has control.
 */
export default function LandingMusic() {
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const [muted,   setMuted]   = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = new Audio('/assets/music/main_soundtrack.mp3')
    audio.loop   = true
    audio.volume = 0.35   // gentle background level
    audioRef.current = audio

    // Attempt autoplay
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => {
        // Autoplay blocked — wait for first user gesture
        const unlock = () => {
          audio.play()
            .then(() => { setPlaying(true); cleanup() })
            .catch(() => {/* still blocked, give up silently */})
        }
        const cleanup = () => {
          document.removeEventListener('click',      unlock)
          document.removeEventListener('keydown',    unlock)
          document.removeEventListener('touchstart', unlock)
        }
        document.addEventListener('click',      unlock, { once: true })
        document.addEventListener('keydown',    unlock, { once: true })
        document.addEventListener('touchstart', unlock, { once: true })
      })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    if (muted) {
      audio.volume = 0.35
      setMuted(false)
    } else {
      audio.volume = 0
      setMuted(true)
    }
  }

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Aktifkan musik' : 'Matikan musik'}
      aria-label={muted ? 'Aktifkan musik' : 'Matikan musik'}
      className="fixed bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(200,146,42,0.35)] bg-[rgba(14,10,24,0.85)] text-[var(--gold-mid)] shadow-[0_0_16px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all hover:border-[var(--gold-mid)] hover:bg-[rgba(200,146,42,0.12)] active:scale-90"
    >
      {muted || !playing
        ? <VolumeX className="h-4 w-4" />
        : <Volume2 className="h-4 w-4" />
      }
    </button>
  )
}
