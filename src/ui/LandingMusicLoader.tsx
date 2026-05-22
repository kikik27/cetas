'use client'

import dynamic from 'next/dynamic'

const LandingMusic = dynamic(() => import('./LandingMusic'), { ssr: false })

export default function LandingMusicLoader() {
  return <LandingMusic />
}
