'use client'

import dynamic from 'next/dynamic'

// Client-only — avoids hydration mismatch from Math.random() in generateShop
const GameHUD = dynamic(() => import('../../src/ui/GameHUD'), { ssr: false })

export default function GamePage() {
  return (
    <div className="page-bg game-scroll">
      <GameHUD />
    </div>
  )
}
