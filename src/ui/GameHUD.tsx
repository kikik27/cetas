'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../game/state/gameStore'
import { getBoardUnitCount } from '../game/systems/boardSystem'
import { evaluateBattleEnd } from '../game/systems/combatSystem'
import PixiBoard from '../game/renderer/PixiBoard'
import TopBar from './TopBar'
import EnemyIntel from './EnemyIntel'
import Bench from './Bench'
import Shop from './Shop'
import Controls from './Controls'
import BattleLog from './BattleLog'
import RoundModal from './RoundModal'
import { audioManager } from '@/src/lib/audioManager'

const BATTLE_LIMIT_MS = 30_000

export default function GameHUD() {
  const round         = useGameStore(s => s.round)
  const hp            = useGameStore(s => s.hp)
  const gold          = useGameStore(s => s.gold)
  const phase         = useGameStore(s => s.phase)
  const maxBoardSlots = useGameStore(s => s.maxBoardSlots)
  const board         = useGameStore(s => s.board)
  const bench         = useGameStore(s => s.bench)
  const shop          = useGameStore(s => s.shop)
  const selected      = useGameStore(s => s.selected)
  const battleRunning = useGameStore(s => s.battleRunning)
  const battleTimeMs  = useGameStore(s => s.battleTimeMs)
  const speedUp       = useGameStore(s => s.speedUp)
  const enemyPreview  = useGameStore(s => s.enemyPreview)
  const log           = useGameStore(s => s.log)
  const projectiles   = useGameStore(s => s.projectiles)

  const clickBoardCell = useGameStore(s => s.clickBoardCell)
  const clickBenchSlot = useGameStore(s => s.clickBenchSlot)
  const buyUnit        = useGameStore(s => s.buyUnit)
  const reroll         = useGameStore(s => s.reroll)
  const sellSelected   = useGameStore(s => s.sellSelected)
  const startBattle    = useGameStore(s => s.startBattle)
  const tickBattle     = useGameStore(s => s.tickBattle)
  const nextRound      = useGameStore(s => s.nextRound)

  // ── Battle RAF loop ───────────────────────────────────────────────────────
  const tickRef   = useRef(tickBattle)
  const rafRef    = useRef<number>(0)
  const lastTsRef = useRef<number>(0)
  useEffect(() => { tickRef.current = tickBattle }, [tickBattle])

  useEffect(() => {
    if (!battleRunning) {
      cancelAnimationFrame(rafRef.current)
      lastTsRef.current = 0
      return
    }
    function loop(ts: number) {
      const delta = lastTsRef.current ? Math.min(ts - lastTsRef.current, 100) : 16
      lastTsRef.current = ts
      tickRef.current(delta)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(rafRef.current); lastTsRef.current = 0 }
  }, [battleRunning])

  const secondsLeft = speedUp ? 0 : Math.max(0, Math.ceil((BATTLE_LIMIT_MS - battleTimeMs) / 1000))

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState({
    show: false, title: '', titleColor: '', description: '', buttonLabel: '',
  })

  useEffect(() => {
    if (phase !== 'battle' || battleRunning) return
    const result = evaluateBattleEnd(board, round)
    if (hp <= 0) {
      setModal({
        show: true,
        title: 'Game Over',
        titleColor: 'var(--enemy)',
        description: 'HP depleted! The battle is over.',
        buttonLabel: 'Play Again',
      })
    } else if (result.win) {
      setModal({
        show: true,
        title: 'Victory!',
        titleColor: 'var(--ok)',
        description: `${result.aliveCount} units survived! +${result.goldEarned} gold. Slot unlocked!`,
        buttonLabel: round >= 5 ? 'Play Again' : `Round ${round + 1} →`,
      })
    } else {
      setModal({
        show: true,
        title: 'Defeat!',
        titleColor: 'var(--warn)',
        description: `−${result.hpLost} HP. Remaining HP: ${Math.max(0, hp - result.hpLost)}. Slot unlocked!`,
        buttonLabel: round >= 5 ? 'Play Again' : `Round ${round + 1} →`,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleRunning, phase])

  const boardCount = getBoardUnitCount(board)
  const isPrep     = phase === 'prep'

  // ── Music: main on prep, battle on battle ─────────────────────────────────
  useEffect(() => {
    if (!audioManager.enabled) return
    audioManager.play(battleRunning ? 'battle' : 'main')
  }, [battleRunning])

  // Switch to main track when game page mounts (landing → game transition)
  useEffect(() => {
    if (audioManager.enabled) audioManager.play('main')
  }, [])

  return (
    <div className="relative z-10 flex flex-1 select-none flex-col gap-2 px-2.5 [padding-top:max(env(safe-area-inset-top),10px)] [padding-bottom:max(env(safe-area-inset-bottom),10px)]">
      <h1 className="sr-only">Celo Tactics</h1>

      {/* 1 ── Top HUD */}
      <TopBar
        round={round} hp={hp} gold={gold}
        boardUnitCount={boardCount} maxBoardSlots={maxBoardSlots}
        phase={phase}
      />

      {/* 2 ── Enemy intel (prep only) */}
      {isPrep && (
        <EnemyIntel enemies={enemyPreview} round={round} />
      )}

      {/* 3 ── Board */}
      <div className="board-frame flex-shrink-0">
        <PixiBoard
          board={board}
          phase={phase}
          selected={selected}
          maxBoardSlots={maxBoardSlots}
          speedUp={speedUp}
          projectiles={projectiles}
          onCellClick={clickBoardCell}
        />
      </div>

      {/* 4 ── Bench */}
      <Bench bench={bench} selected={selected} onSlotClick={clickBenchSlot} />

      {/* 5 ── Shop (prep only) */}
      {isPrep && (
        <Shop shop={shop} onBuy={buyUnit} />
      )}

      {/* 6 ── Controls / timer */}
      <Controls
        phase={phase}
        hasSelected={selected !== null}
        battleRunning={battleRunning}
        secondsLeft={secondsLeft}
        speedUp={speedUp}
        onReroll={reroll}
        onSell={sellSelected}
        onBattle={startBattle}
      />

      {/* 7 ── Battle log */}
      <BattleLog log={log} />

      {/* 8 ── Round result modal */}
      <RoundModal
        show={modal.show}
        title={modal.title}
        titleColor={modal.titleColor}
        description={modal.description}
        buttonLabel={modal.buttonLabel}
        onNext={() => { setModal(m => ({ ...m, show: false })); nextRound() }}
      />
    </div>
  )
}
