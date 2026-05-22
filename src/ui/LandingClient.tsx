'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Modal } from '@/src/components/ui/Modal'
import { Button } from '@/src/components/ui/Button'
import { Volume2 } from 'lucide-react'

const LandingMusic = dynamic(() => import('./LandingMusic'), { ssr: false })

const MODAL_DELAY_MS = 2200

export default function LandingClient() {
  const [showModal,    setShowModal]    = useState(false)
  const [musicEnabled, setMusicEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio('/assets/music/main_soundtrack.mp3')
    audio.loop    = true
    audio.volume  = 0.35
    audio.preload = 'auto'
    audioRef.current = audio

    const t = setTimeout(() => setShowModal(true), MODAL_DELAY_MS)

    return () => {
      clearTimeout(t)
      audio.pause()
      audio.src = ''
    }
  }, [])

  const handleEnter = () => {
    // Directly inside onClick — browser always allows play() here
    audioRef.current?.play().catch(err => console.warn('Audio play failed:', err))
    setShowModal(false)
    setMusicEnabled(true)
  }

  const handleSkip = () => {
    setShowModal(false)
  }

  return (
    <>
      <Modal show={showModal} persistent>
        <div className="rpg-modal-bar" />

        <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-7 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(200,146,42,0.35)] bg-[rgba(200,146,42,0.08)]">
            <Volume2 className="h-7 w-7 text-[var(--gold-mid)]" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[16px] font-bold uppercase tracking-[0.18em] text-[var(--gold-hi)]">
              Background Music
            </h2>
            <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
              Enable music for a more epic<br />battle experience?
            </p>
          </div>

          <div className="divider-gold w-full" />

          <div className="flex w-full flex-col gap-2">
            <Button
              onClick={handleEnter}
              variant="pixelGold"
              size="md"
              className="w-full font-black tracking-wider"
            >
              <Volume2 className="h-4 w-4" />
              Enable Music
            </Button>
            <Button
              onClick={handleSkip}
              variant="pixelGhost"
              size="md"
              className="w-full text-[12px]"
            >
              Skip
            </Button>
          </div>
        </div>
      </Modal>

      {musicEnabled && audioRef.current && (
        <LandingMusic audioEl={audioRef.current} />
      )}
    </>
  )
}
