'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface LandingMusicProps {
  /** Already-playing audio element from LandingClient */
  audioEl?: HTMLAudioElement | null
}

export default function LandingMusic({ audioEl }: LandingMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(audioEl ?? null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    // Only create + autoplay if no audio was passed in
    if (audioRef.current) return

    const audio = new Audio('/assets/music/main_soundtrack.mp3')
    audio.loop   = true
    audio.volume = 0.35
    audioRef.current = audio
    audio.play().catch(() => {})

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
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  )
}
