'use client'

import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { audioManager } from '@/src/lib/audioManager'

export default function LandingMusic() {
  const [muted, setMuted] = useState(false)

  const toggleMute = () => {
    if (muted) {
      audioManager.play('main')
      setMuted(false)
    } else {
      audioManager.stop()
      setMuted(true)
    }
  }

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Unmute music' : 'Mute music'}
      aria-label={muted ? 'Unmute music' : 'Mute music'}
      className="fixed bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(200,146,42,0.35)] bg-[rgba(14,10,24,0.85)] text-[var(--gold-mid)] shadow-[0_0_16px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all hover:border-[var(--gold-mid)] hover:bg-[rgba(200,146,42,0.12)] active:scale-90"
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  )
}
