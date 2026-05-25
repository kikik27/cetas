'use client'

import dynamic from 'next/dynamic'

const GameHUD = dynamic(() => import('../../src/ui/GameHUD'), { ssr: false })

export default function GamePage() {
  return <GameHUD />
}
