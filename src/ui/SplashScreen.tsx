'use client'

import { useState, useEffect, useRef } from 'react'

interface SplashScreenProps {
  onEnter: () => void
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [visible, setVisible]   = useState(true)
  const [leaving, setLeaving]   = useState(false)
  const [loaded,  setLoaded]    = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Pre-create audio object so it's ready to play on tap
  useEffect(() => {
    const audio = new Audio('/assets/music/main_soundtrack.mp3')
    audio.loop   = true
    audio.volume = 0.35
    audioRef.current = audio

    // Small delay so the splash feels intentional, not a flash
    const t = setTimeout(() => setLoaded(true), 300)
    return () => {
      clearTimeout(t)
      // Don't destroy audio here — it's passed up via onEnter
    }
  }, [])

  const handleEnter = () => {
    if (leaving) return
    setLeaving(true)

    // Start music immediately on this user gesture — guaranteed to work
    audioRef.current?.play().catch(() => {/* ignore */})

    // Fade out splash, then unmount and trigger intro
    setTimeout(() => {
      setVisible(false)
      onEnter()
    }, 700)
  }

  if (!visible) return null

  return (
    <div
      onClick={handleEnter}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleEnter()}
      role="button"
      tabIndex={0}
      aria-label="Tap untuk masuk"
      className={`splash ${leaving ? 'splash-leave' : ''}`}
    >
      {/* Background — same landing image, heavily darkened */}
      <div className="splash-bg" />

      {/* Center content */}
      <div className={`splash-content ${loaded ? 'splash-content-in' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="CETAS"
          className="splash-logo"
        />

        <div className="splash-divider" />

        <p className="splash-tap">
          ✦ TAP TO ENTER ✦
        </p>

        <p className="splash-sub">
          Aktifkan suara untuk pengalaman terbaik
        </p>
      </div>

      {/* Corner ornaments */}
      <div className="splash-corner tl" aria-hidden />
      <div className="splash-corner tr" aria-hidden />
      <div className="splash-corner bl" aria-hidden />
      <div className="splash-corner br" aria-hidden />
    </div>
  )
}
