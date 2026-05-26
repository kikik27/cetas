'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useGameStore } from '../game/state/gameStore'
import { getBoardUnitCount } from '../game/systems/boardSystem'
import PixiBoard from '../game/renderer/PixiBoard'
import TopBar from './TopBar'
import EnemyIntel from './EnemyIntel'
import Bench from './Bench'
import Shop from './Shop'
import Controls from './Controls'
import BattleLog from './BattleLog'
import RoundModal from './RoundModal'
import { audioManager } from '@/src/lib/audioManager'
import { BATTLE_LIMIT_MS, BATTLE_TICK_CAP, PHASE } from '@/src/game/constants'
import { useWallet } from '@/src/providers/WalletProvider'
import { usePlayer } from '@/src/hooks/usePlayer'
import { cn } from '@/src/lib/utils'
import { LoadingState } from '@/src/components/ui/LoadingState'
import { AlertTriangle, ScrollText, Shield, ShoppingBag } from 'lucide-react'

type TrayId = 'shop' | 'bench' | 'intel' | 'log'

export default function GameHUD() {
  const { authStatus } = useWallet()
  const { data: player, isLoading: playerLoading } = usePlayer(authStatus === 'authenticated')
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
  const lastBattleResult = useGameStore(s => s.lastBattleResult)

  const setSavedStage  = useGameStore(s => s.setSavedStage)
  const setSavedProgress = useGameStore(s => s.setSavedProgress)
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
    if (player?.gameProgress) {
      setSavedProgress(player.gameProgress)
      return
    }
    if (player?.endlessStage) setSavedStage(player.endlessStage)
  }, [player?.endlessStage, player?.gameProgress, setSavedProgress, setSavedStage])

  useEffect(() => {
    if (!battleRunning) {
      cancelAnimationFrame(rafRef.current)
      lastTsRef.current = 0
      return
    }
    function loop(ts: number) {
      const delta = lastTsRef.current ? Math.min(ts - lastTsRef.current, BATTLE_TICK_CAP) : 16
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
  const [activeTray, setActiveTray] = useState<TrayId>('shop')

  useEffect(() => {
    if (phase !== 'battle' || battleRunning || !lastBattleResult) return
    const result = lastBattleResult
    const showResultModal = async () => {
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
        buttonLabel: `Stage ${round + 1} ->`,
      })
    } else {
      setModal({
        show: true,
        title: 'Defeat!',
        titleColor: 'var(--warn)',
        description: `-${result.hpLost} HP. Remaining HP: ${hp}. Slot unlocked!`,
        buttonLabel: hp <= 0 ? 'Play Again' : `Stage ${round + 1} ->`,
      })
    }
    }
    void showResultModal()
  }, [battleRunning, hp, lastBattleResult, phase, round])

  const boardCount = getBoardUnitCount(board)
  const isPrep = phase === PHASE.PREP
  const isProfileLoading = authStatus === 'authenticated' && playerLoading && !player
  const visibleTray: TrayId = isPrep || activeTray === 'bench' ? activeTray : 'log'
  const trayTabs: Array<{ id: TrayId; label: string; icon: ComponentType<{ className?: string }> }> = isPrep
    ? [
        { id: 'shop', label: 'Shop', icon: ShoppingBag },
        { id: 'bench', label: 'Bench', icon: Shield },
        { id: 'intel', label: 'Intel', icon: AlertTriangle },
        { id: 'log', label: 'Log', icon: ScrollText },
      ]
    : [
        { id: 'log', label: 'Log', icon: ScrollText },
        { id: 'bench', label: 'Bench', icon: Shield },
      ]

  function handleBuyUnit(idx: number) {
    buyUnit(idx)
    setActiveTray('bench')
  }

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
    <div className="game-hud-shell relative z-10 flex select-none flex-col gap-1.5 px-2 [padding-top:max(env(safe-area-inset-top),8px)] [padding-bottom:max(env(safe-area-inset-bottom),8px)]">
      <h1 className="sr-only">Celo Tactics</h1>
      {isProfileLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(1,8,18,0.72)] px-8 backdrop-blur-sm">
          <LoadingState compact label="Loading run" className="w-full max-w-[220px]" />
        </div>
      )}

      {/* 1 ── Top HUD */}
      <TopBar
        round={round} hp={hp} gold={gold}
        boardUnitCount={boardCount} maxBoardSlots={maxBoardSlots}
        phase={phase}
      />

      {/* 2 ── Board */}
      <div className="board-frame game-board-frame">
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

      {/* 3 ── Controls / timer */}
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

      {/* 4 ── One visible tray only, keeping the miniapp viewport fixed. */}
      <div className="game-bottom-dock flex flex-col gap-1.5">
        <div className={cn(
          'grid gap-1 rounded-xl border border-[var(--border)] bg-[rgba(4,16,33,0.74)] p-1',
          isPrep ? 'grid-cols-4' : 'grid-cols-2'
        )}>
          {trayTabs.map(tab => (
            <TrayButton
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={visibleTray === tab.id}
              onClick={() => setActiveTray(tab.id)}
            />
          ))}
        </div>

        <div className="game-tray-panel">
          {visibleTray === 'shop' && isPrep && <Shop shop={shop} onBuy={handleBuyUnit} />}
          {visibleTray === 'bench' && <Bench bench={bench} selected={selected} onSlotClick={clickBenchSlot} />}
          {visibleTray === 'intel' && isPrep && <EnemyIntel enemies={enemyPreview} round={round} />}
          {visibleTray === 'log' && <BattleLog log={log} />}
        </div>
      </div>

      {/* 8 ── Round result modal */}
      <RoundModal
        show={modal.show}
        title={modal.title}
        titleColor={modal.titleColor}
        description={modal.description}
        buttonLabel={modal.buttonLabel}
        onNext={() => { setModal(m => ({ ...m, show: false })); setActiveTray('shop'); nextRound() }}
      />
    </div>
  )
}

function TrayButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-8 items-center justify-center gap-1 rounded-lg font-display text-[9px] font-bold uppercase tracking-wider transition-all',
        active
          ? 'border border-[rgba(228,200,122,0.62)] bg-[rgba(228,200,122,0.14)] text-[var(--gold-hi)] shadow-[0_0_14px_rgba(228,200,122,0.12)]'
          : 'text-[var(--text-3)] hover:bg-white/[0.04] hover:text-[var(--text-1)]'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden min-[380px]:inline">{label}</span>
    </button>
  )
}
