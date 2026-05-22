# Celo Tactics — Technical Documentation

> Auto-battler roguelike berbasis grid, dibangun di atas Next.js 16 + React 19 + Zustand 5 + Canvas 2D.  
> Target platform: MiniPay (Opera) mobile browser, Celo L2.

---

## 1. Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| UI | React | 19.2.4 |
| State | Zustand | 5.0.13 |
| Rendering | Canvas 2D (native) | — |
| Styling | Tailwind CSS | v4 |
| Language | TypeScript | ^5 |
| Audio (planned) | Howler.js | 2.2.4 |

> **Note:** `pixi.js` dan `@pixi/react` terdaftar di `package.json` tapi belum digunakan. Renderer saat ini murni Canvas 2D.

---

## 2. Struktur Direktori

```
celo-chess/
├── app/
│   ├── layout.tsx          # Root layout, font Geist, metadata
│   ├── globals.css         # Design tokens, utility classes, animasi
│   ├── page.tsx            # Home screen (/)
│   └── game/
│       └── page.tsx        # Game screen (/game) — client-only via dynamic()
│
├── src/
│   ├── game/
│   │   ├── entities/
│   │   │   └── unitDefs.ts         # Pure data: definisi 4 unit
│   │   ├── core/
│   │   │   ├── types.ts            # Semua TypeScript interfaces & types
│   │   │   └── unitFactory.ts      # makeUnit() — factory tanpa side effect
│   │   ├── systems/
│   │   │   ├── boardSystem.ts      # Grid logic: placement, counting
│   │   │   ├── shopSystem.ts       # Shop: generate, buy, merge
│   │   │   └── combatSystem.ts     # Battle: movement, attack, projectile
│   │   ├── state/
│   │   │   └── gameStore.ts        # Zustand store — single source of truth
│   │   ├── assets/
│   │   │   └── spriteRegistry.ts   # URL map semua sprite sheet
│   │   └── renderer/
│   │       └── PixiBoard.tsx       # Canvas 2D renderer (React component)
│   │
│   └── ui/
│       ├── GameHUD.tsx             # Orchestrator utama game UI
│       ├── TopBar.tsx              # HUD: HP, gold, ronde, phase badge
│       ├── EnemyIntel.tsx          # Panel intel musuh (prep phase)
│       ├── Bench.tsx               # 8 slot bangku cadangan
│       ├── Shop.tsx                # 5 kartu unit toko
│       ├── Controls.tsx            # Tombol prep / timer battle
│       ├── BattleLog.tsx           # Log event pertempuran
│       └── RoundModal.tsx          # Modal hasil ronde
│
└── public/
    └── assets/
        ├── units/
        │   ├── blue/               # Sprite sheet ally (warrior/archer/lancer/pawn)
        │   └── red/                # Sprite sheet enemy (sama, warna berbeda)
        ├── terrain/                # Tilemap arena, rocks, bushes
        ├── fx/                     # Explosion, dust, fire
        └── ui/
            ├── avatars/            # 25 avatar karakter (256×256px)
            └── icons/              # 12 icon UI (64×64px)
```

---

## 3. Arsitektur Layer

Proyek mengikuti **strict layer separation**:

```
entities  →  core  →  systems  →  state  →  renderer / ui
(data)      (types)   (logic)    (store)    (visual)
```

- **entities**: Pure data, tidak import apapun dari layer lain.
- **core**: Types dan factory. Tidak tahu rendering atau state.
- **systems**: Pure functions. Input → output, tidak ada side effect.
- **state**: Zustand store. Menggunakan systems, tidak tahu renderer.
- **renderer**: Canvas 2D. Membaca state via props/refs, tidak menulis ke store.
- **ui**: React components. Membaca store, memanggil actions, merender renderer.

---

## 4. Data Model

### 4.1 UnitDef (entities/unitDefs.ts)

Definisi statis setiap tipe unit. Tidak berubah saat runtime.

```typescript
interface UnitDef {
  id: string           // 'warrior' | 'archer' | 'knight' | 'rogue'
  name: string         // Nama tampilan (Bahasa Indonesia)
  cost: number         // Harga beli di toko (1–3 koin)
  atk: number          // Base attack damage
  hp: number           // Base HP
  spd: number          // Serangan per detik (attack timer accumulation rate)
  trait: UnitTrait     // 'melee' | 'ranged' | 'tank'
  spriteType: SpriteType // 'warrior' | 'archer' | 'lancer' | 'pawn'
  avatarIndex: string  // '01'–'25' untuk avatar UI
  traitLabel: string   // Label tampilan: 'Melee' | 'Ranged' | 'Tank' | 'Assassin'
  attackRange: number  // Jarak serang dalam sel (Chebyshev distance)
  moveSpd: number      // Sel per detik saat bergerak
  body: number[][]     // 5×4 pixel art fallback
}
```

**4 unit yang tersedia:**

| ID | Nama | Cost | ATK | HP | SPD | Range | MoveSpd | Trait |
|---|---|---|---|---|---|---|---|---|
| warrior | Prajurit | 1 | 28 | 120 | 1.0/s | 1 | 0.6/s | Melee |
| archer | Pemanah | 1 | 22 | 75 | 1.3/s | 3 | 0.4/s | Ranged |
| knight | Ksatria | 2 | 18 | 200 | 0.65/s | 1 | 0.4/s | Tank |
| rogue | Pencuri | 1 | 38 | 65 | 1.6/s | 1 | 0.9/s | Assassin |

**Star multiplier:**
- ⭐1: ×1.0
- ⭐2: ×1.8 (ATK & HP)
- ⭐3: ×3.2 (ATK & HP)

### 4.2 Unit (core/types.ts)

Instance unit yang hidup di board atau bench. Extends UnitDef dengan runtime state.

```typescript
interface Unit {
  uid: number          // Auto-increment unique ID
  // ... semua field dari UnitDef (di-copy saat makeUnit) ...
  maxHp / curHp        // HP maksimum dan saat ini
  atkVal               // ATK setelah star multiplier
  stars: 1 | 2 | 3
  enemy: boolean       // true = musuh (red team)
  dead: boolean        // Mati sementara (revive di ronde berikutnya)

  // Combat timers
  attackTimer: number  // Akumulasi detik; serangan saat >= 1
  moveTimer: number    // Akumulasi detik; gerak 1 sel saat >= 1

  // Animation state (dikelola renderer)
  animState: 'idle' | 'run' | 'attack' | 'hurt' | 'death'
  animFrame / animElapsed / animDone

  // Visual interpolation (dikelola renderer)
  visualX / visualY    // Posisi piksel saat ini (smooth movement)
  targetRow / targetCol

  floats: FloatText[]  // Damage numbers melayang
}
```

### 4.3 GameState (core/types.ts)

```typescript
interface GameState {
  round: number          // 1–5
  hp: number             // HP pemain (mulai 100)
  gold: number           // Koin (max 20)
  phase: 'prep' | 'battle'
  maxBoardSlots: number  // Slot aktif di board (mulai 3, max 7)
  board: BoardGrid       // (Unit | null)[4][8]
  bench: BenchSlots      // (Unit | null)[8]
  shop: ShopItem[]       // 5 item toko
  selected: SelectedSource | null
  battleRunning: boolean
  battleTimeMs: number   // Elapsed ms sejak battle mulai
  speedUp: boolean       // true setelah 30 detik
  enemyPreview: EnemyPreview[]  // Preview musuh untuk prep phase
  projectiles: Projectile[]     // Arrow projectile aktif
  log: string[]          // Max 5 pesan terakhir
}
```

### 4.4 Board Layout

```
Row 0: [ enemy zone ]  ← musuh ditempatkan di sini saat battle dimulai
Row 1: [ enemy zone ]
Row 2: [ ally zone  ]  ← pemain menempatkan unit di sini
Row 3: [ ally zone  ]
Col:    0  1  2  3  4  5  6  7   (8 kolom)
```

---

## 5. Game Systems

### 5.1 boardSystem.ts

Pure functions untuk manipulasi grid.

```typescript
COLS = 8, ROWS = 4

getBoardUnitCount(board)          // Hitung unit ally di rows 2-3
emptyBoard()                      // Buat board kosong 4×8
getAllUnits(board)                 // Array semua unit + posisi {u, r, c}
placeOnBoard(board, bench, selected, targetRow, targetCol, maxSlots)
placeOnBench(board, bench, selected, targetIdx)
```

`placeOnBoard` mendukung **swap**: jika target cell sudah ada unit ally, keduanya ditukar.

### 5.2 shopSystem.ts

```typescript
generateShop()           // 5 item acak dari pool 3× UNIT_DEFS
checkMerge(bench)        // Cek 3-of-a-kind → merge ke bintang lebih tinggi (rekursif)
buyUnit(item, bench, gold)  // Validasi gold & slot, return BuyResult
```

**Merge logic:** Setiap kali unit dibeli, `checkMerge` dipanggil. Jika ada 3 unit dengan `id` dan `stars` sama di bench, ketiganya dihapus dan diganti 1 unit dengan `stars + 1`. Proses rekursif sampai tidak ada merge lagi.

**Sell price:** `Math.max(1, Math.floor(unit.cost / 2))` — selalu minimum 1 koin, tidak dipengaruhi stars.

### 5.3 combatSystem.ts

Inti simulasi pertempuran. Semua pure functions.

#### generateEnemyPreview(round, maxBoardSlots)
Menghasilkan preview musuh deterministik (tanpa random) untuk ditampilkan di EnemyIntel saat prep phase. Digunakan untuk strategi pemain.

#### generateEnemies(board, round, maxBoardSlots)
Menempatkan musuh secara acak di rows 0-1. Scaling:
- `count = min(2 + round, maxBoardSlots + 1, 6)`
- `tier = min(floor(round / 2), 2)` → pool unit dengan `cost <= 1 + tier`
- Round ≥ 4: 35% chance unit bintang 2

#### runBattleStep(board, deltaMs, speedMult)

Dipanggil setiap RAF frame. Satu tick = satu frame.

**Algoritma per tick:**

1. **Build position map** `pos: Map<uid, {r,c}>` dari board saat ini
2. **Tick animation state machine** — reset `attack`/`hurt` ke `idle` jika `animDone`
3. **Per unit (for loop):**
   - Cari musuh terdekat via **Chebyshev distance** dari `pos` map
   - Jika **di luar range**: akumulasi `moveTimer += moveSpd * seconds`. Saat `>= 1`, gerak 1 sel via `stepToward()`, update `pos` map dan board copy `b`
   - Jika **dalam range**: akumulasi `attackTimer += spd * seconds`. Saat `>= 1`, pilih target acak dalam range, hitung damage, spawn projectile jika `trait === 'ranged'`
4. **Cek ongoing**: `ongoing = allies.alive > 0 && enemies.alive > 0`

**stepToward():** Preferensi diagonal → row-only → col-only. Skip jika sel terblokir.

**Damage formula:** `max(1, atkVal + random(-4..+4))`

**Speed-up mode:** `speedMult = 3` → `effectiveDelta = deltaMs * 3` → semua timer 3× lebih cepat. Satu step per frame tetap, tapi waktu simulasi berjalan 3× lebih cepat.

#### evaluateBattleEnd(board, round)
```
win = enemiesAlive === 0
goldEarned = win ? 3 + round : 0
hpLost = win ? 0 : 10 + enemiesAlive * 6
```

---

## 6. State Management (Zustand)

`gameStore.ts` adalah single source of truth. Semua game actions ada di sini.

### Kenapa Zustand?
- Ringan, tidak perlu Provider
- `get()` selalu membaca state terbaru (tidak stale closure)
- Cocok untuk game loop yang memanggil `set()` 60× per detik

### Actions

| Action | Deskripsi |
|---|---|
| `clickBoardCell(row, col)` | Prep: select unit atau place unit ke cell |
| `clickBenchSlot(idx)` | Prep: select atau swap unit di bench |
| `buyUnit(shopIdx)` | Beli unit dari toko, trigger checkMerge |
| `reroll()` | −2 koin, generate shop baru |
| `sellSelected()` | Jual unit terpilih, +50% base cost |
| `startBattle()` | Generate musuh, set phase = 'battle' |
| `tickBattle(deltaMs)` | Satu frame combat: runBattleStep + advance projectiles |
| `endBattle()` | Hitung hasil, +1 slot selalu (win atau lose) |
| `nextRound()` | Revive semua unit mati, heal 25% survivor, +5 gold |
| `resetGame()` | Kembali ke initialState |

### Battle Loop Pattern

```
GameHUD (React)
  └── useEffect [battleRunning]
        └── requestAnimationFrame loop
              └── tickRef.current(delta)   ← via ref, tidak stale
                    └── gameStore.tickBattle(delta)
                          └── runBattleStep(board, delta, speedMult)
                                └── set({ board: newBoard, projectiles: [...] })
```

**Kenapa `tickRef`?** Zustand actions di-recreate setiap render. Jika RAF loop capture `tickBattle` langsung via closure, ia akan memanggil versi lama yang punya snapshot board lama. `useRef` memastikan selalu memanggil versi terbaru.

### Round Lifecycle

```
initialState()
  → prep phase (round 1)
    → [player buys, places units]
    → startBattle()
      → battle phase
        → tickBattle() × N frames
          → endBattle()
            → prep phase (round 2)
              → nextRound()
                → [revive dead units, heal survivors]
                → [+5 gold, new shop, +1 slot]
```

**Unit mati = temporary:** `dead: true` hanya berlaku dalam satu ronde. `nextRound()` set `dead: false` dan `curHp = maxHp` untuk semua unit mati.

---

## 7. Renderer (PixiBoard.tsx)

Canvas 2D renderer. Tidak tahu game logic — hanya menggambar apa yang diberikan via props.

### Desain Kunci: Single Persistent RAF Loop

```typescript
useEffect(() => {
  function loop(ts) {
    // Baca state terbaru via refs — TIDAK via closure
    const curBoard = boardRef.current
    // ... draw ...
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
  return () => cancelAnimationFrame(...)
}, [])  // ← empty deps: loop TIDAK pernah restart
```

**Kenapa?** Jika loop di-restart setiap kali `board` berubah (60×/detik), animasi akan choppy karena setiap restart = 1 frame terlewat. Dengan refs, loop berjalan terus-menerus dan selalu membaca state terbaru.

### Smooth Movement Interpolation

Unit bergerak secara logis (teleport antar sel) di `combatSystem`, tapi renderer menginterpolasi posisi visual:

```typescript
const MOVE_PX_PER_SEC = 105  // 84px/cell ÷ 0.8s = ~105px/s
const maxStep = MOVE_PX_PER_SEC * (deltaMs / 1000)

// Setiap frame: gerakkan visual position menuju logical position
const dist = Math.hypot(targetX - vp.x, targetY - vp.y)
if (dist > 0.5) {
  vp.x += (dx / dist) * Math.min(dist, maxStep)
  vp.y += (dy / dist) * Math.min(dist, maxStep)
}
```

`visualPos` Map disimpan di luar React (module-level) — tidak menyebabkan re-render.

### Animation Clock

Setiap unit punya `Clock { frame, elapsed, lastState }` di Map module-level.

```typescript
clock.elapsed += deltaMs
while (clock.elapsed >= clip.fps) {
  clock.elapsed -= clip.fps
  clock.frame++
  if (frame >= clip.frames) {
    if (clip.loop) frame = 0
    else { frame = clip.frames - 1; unit.animDone = true }
  }
}
```

`animDone = true` adalah sinyal ke `combatSystem` untuk transisi state (attack → idle, hurt → idle).

### Sprite Sheet Format

Semua sprite sheet adalah **horizontal strip** PNG:
- Frame width × frame count = total width
- Semua unit: 192×192px per frame (kecuali Lancer: 320×320px)
- Enemies di-flip horizontal (`ctx.scale(-1, 1)`) agar menghadap ke kiri

### Projectile Rendering

```typescript
const curX = p.x + (p.tx - p.x) * p.progress
const curY = p.y + (p.ty - p.y) * p.progress
const angle = Math.atan2(p.ty - p.y, p.tx - p.x)
ctx.translate(curX, curY)
ctx.rotate(angle)
ctx.drawImage(arrowImg, -size/2, -size/2, size, size)
```

Progress diadvance di `gameStore.tickBattle()` berdasarkan `speed = 600 px/s`.

---

## 8. Asset Registry (spriteRegistry.ts)

Centralized URL map untuk semua asset. Tidak ada hardcoded path di renderer.

### Sprite Sheet Keys

Format: `{team}-{spriteType}` → `'blue-warrior'`, `'red-archer'`, dll.

```typescript
getSpriteKey(spriteType: string, isEnemy: boolean): string
// isEnemy=false → 'blue-warrior'
// isEnemy=true  → 'red-warrior'
```

### Clip Definitions

| Unit | Idle | Run | Attack | Hurt | Death |
|---|---|---|---|---|---|
| warrior | 8f/120ms | 6f/80ms | 4f/70ms | 6f/55ms (hurt.png) | 6f/90ms |
| archer | 6f/120ms | 4f/80ms | 8f/70ms | 4f/55ms (run fallback) | 4f/90ms |
| lancer | 12f/120ms | 6f/80ms | 3f/70ms | 6f/55ms (run fallback) | 6f/90ms |
| pawn | 8f/120ms | 6f/80ms | 4f/70ms | 6f/55ms (run fallback) | 6f/90ms |

> Warrior adalah satu-satunya unit dengan `hurt.png` dedicated. Unit lain fallback ke `run.png` dengan fps lebih lambat.

---

## 9. UI Components

### GameHUD.tsx

Orchestrator utama. Membaca store via individual selectors (bukan `useGameStore()` satu kali) untuk menghindari unnecessary re-render.

```typescript
// BENAR — hanya re-render jika field ini berubah
const round = useGameStore(s => s.round)
const board = useGameStore(s => s.board)

// SALAH — re-render setiap kali state apapun berubah
const store = useGameStore()
```

### EnemyIntel.tsx

Ditampilkan **hanya saat prep phase**. Menampilkan preview musuh yang akan dihadapi di ronde ini, memungkinkan pemain menyusun strategi sebelum battle.

Data dari `enemyPreview` di store — di-generate saat `initialState()` dan setiap `nextRound()`.

### Controls.tsx

Context-aware: tampilan berbeda untuk prep vs battle phase.
- **Prep**: Reroll (−2🪙), Sell (contextual, muncul jika ada unit terpilih), Battle
- **Battle**: Timer bar dengan countdown 30s → speed-up indicator

### TopBar.tsx

Menampilkan: back button, title, gold, HP (dengan bar), ronde, phase badge.

---

## 10. Routing

| Route | File | SSR | Deskripsi |
|---|---|---|---|
| `/` | `app/page.tsx` | ✅ Server | Home screen, static |
| `/game` | `app/game/page.tsx` | ❌ Client-only | Game screen via `dynamic(..., { ssr: false })` |

**Kenapa `/game` client-only?** `generateShop()` menggunakan `Math.random()`. Jika dijalankan di server, hasilnya berbeda dengan client → hydration mismatch. `ssr: false` memastikan store hanya diinisialisasi di browser.

---

## 11. Design System (globals.css)

### CSS Custom Properties

```css
--bg: #0a0810          /* Background utama */
--bg-panel: #12101c    /* Surface panel */
--bg-card: #1a1728     /* Card background */
--gold: #d4aa50        /* Gold mid */
--gold-hi: #f0cc70     /* Gold highlight */
--gold-lo: #7a5e28     /* Gold shadow */
--ally: #4a9eff        /* Warna tim biru (ally) */
--enemy: #ff5a5a       /* Warna tim merah (enemy) */
--text: #ede8d8        /* Teks utama */
--text-2: #8a8070      /* Teks sekunder */
--text-3: #4a4540      /* Teks muted/label */
```

### Utility Classes

| Class | Deskripsi |
|---|---|
| `.surface` | Panel gelap dengan border tipis |
| `.surface-gold` | Panel dengan border gold gradient |
| `.label` | Section header: 9px, uppercase, letter-spacing |
| `.btn` | Base button: flex, transition, tap feedback |
| `.btn-gold / .btn-red / .btn-blue / .btn-ghost` | Varian button |
| `.pixel` | `image-rendering: pixelated` untuk sprite |
| `.scroll-x` | Horizontal scroll tanpa scrollbar |
| `.game-scroll` | Full-height vertical scroll container |

### Animasi

| Class | Keyframe | Deskripsi |
|---|---|---|
| `.anim-fade-up` | fadeUp 0.28s | Muncul dari bawah |
| `.anim-pop` | popIn 0.22s cubic | Scale dari kecil |
| `.anim-pulse` | pulse 1.2s | Opacity flicker |
| `.anim-glow` | glow 2.2s | Box-shadow pulse |
| `.anim-float` | float 3s | Naik-turun |
| `.anim-shimmer` | shimmer 1s | Opacity shimmer |

---

## 12. Asset Structure

```
public/assets/
├── units/
│   ├── blue/
│   │   ├── warrior/  idle.png run.png attack.png hurt.png
│   │   ├── archer/   idle.png run.png attack.png arrow.png
│   │   ├── lancer/   idle.png run.png attack.png
│   │   └── pawn/     idle.png run.png attack.png
│   └── red/          (struktur sama)
├── terrain/
│   ├── tilemap.png   576×384 — 9×6 grid tile 64×64px
│   ├── rock1-2.png   64×64
│   └── bush1-2.png   1024×128 (8 frame)
├── fx/
│   ├── explosion.png 1536×192 (8 frame, 192×192)
│   ├── dust.png      512×64  (8 frame, 64×64)
│   └── fire.png      512×64  (8 frame, 64×64)
└── ui/
    ├── avatars/      avatar-01.png … avatar-25.png (256×256)
    └── icons/        icon-01.png … icon-12.png (64×64)
```

**Tilemap usage:**
- Enemy zone (rows 0-1): tile col=0, row=1 (dirt)
- Ally zone (rows 2-3): tile col=1, row=0 (grass)

---

## 13. Gameplay Mechanics

### Prep Phase
1. Lihat preview musuh di EnemyIntel
2. Beli unit dari toko (5 slot, refresh dengan Reroll −2🪙)
3. Drag unit dari bench ke board (rows 2-3, max `maxBoardSlots`)
4. Jual unit yang tidak diinginkan (+50% base cost)
5. Tekan BATTLE

### Battle Phase
- Berlangsung real-time, max 30 detik
- Setelah 30 detik: speed-up 3× sampai ada yang menang
- Unit bergerak otomatis menuju musuh terdekat
- Melee/Tank (range 1): harus mendekat sebelum menyerang
- Ranged (range 3): bisa menyerang dari jauh, spawn arrow projectile

### Round End
- **Menang**: +🪙(3 + round), +1 slot
- **Kalah**: −HP (10 + enemies_alive × 6), +1 slot
- **Selalu**: semua unit mati revive ke full HP, survivor heal 25%

### Merge System
- 3 unit sama (id + stars) di bench → otomatis merge ke stars+1
- Max stars: 3
- Merge rekursif (merge bisa trigger merge lagi)

### Gold Economy
- Start: 10🪙
- Per ronde: +5🪙
- Max: 20🪙
- Reroll: −2🪙
- Sell: +floor(cost/2), min 1🪙

---

## 14. Development

```bash
npm run dev    # Development server (localhost:3000)
npm run build  # Production build
npm run start  # Production server
npm run lint   # ESLint
```

### Menjalankan di MiniPay (Development)
1. `npm run dev`
2. `ngrok http 3000` → dapatkan HTTPS URL
3. Buka MiniPay → Developer Mode → masukkan URL ngrok
4. Navigasi ke `/game`

---

## 15. Known Limitations & Next Steps

| Item | Status | Notes |
|---|---|---|
| Smooth movement | ✅ Implemented | 105px/s interpolation |
| Arrow projectile | ✅ Implemented | Archer ranged attack |
| Slot +1 always | ✅ Implemented | Win atau lose |
| Unit revive | ✅ Implemented | Full HP setiap ronde |
| Audio (Howler.js) | ⏳ Planned | Package installed, belum digunakan |
| PIXI.js renderer | ⏳ Planned | Package installed, masih Canvas 2D |
| On-chain integration | ⏳ Planned | Biconomy SDK, ERC-1155 |
| Multiplayer | ⏳ Planned | Colyseus / Nakama |
| More unit types | ⏳ Planned | Monk, Mage, Beast, Golem |
| Leaderboard | ⏳ Planned | UI placeholder sudah ada |
