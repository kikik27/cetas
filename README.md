# CETAS — Celo Tactics

> Tactical Auto-Battler · Mini App Edition · Built on Celo L2

CETAS is a roguelike auto-battler strategy game running entirely in the browser as a MiniPay Mini App. Build your formation on a grid, recruit units from the shop, merge them to upgrade stars, and face enemies in automated combat.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| Game Renderer | PixiJS 8 + @pixi/react |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Audio | Howler.js |
| UI Components | CVA + Lucide React |

---

## Project Structure

```
app/
├── (hub)/              # Hub pages (home, tasks, leaderboard, friends)
│   ├── home/
│   ├── tasks/
│   ├── leaderboard/
│   └── friends/
├── game/               # Game page (full-screen, no nav)
└── page.tsx            # Landing / onboarding

src/
├── components/ui/      # Shared UI primitives (Button, Modal)
├── game/
│   ├── core/           # Engine-independent logic (types, unitFactory)
│   ├── entities/       # Unit definitions
│   ├── systems/        # Combat & board systems
│   ├── renderer/       # PixiJS rendering (PixiBoard, spriteAnimator)
│   ├── assets/         # Sprite registry
│   └── state/          # Zustand game store
├── lib/                # homeStore, audioManager, utils
└── ui/                 # React HUD & page components
    ├── home/           # PlayerCard, DailyChest, QuestPreview, BottomNav
    ├── hub/            # AppHeader
    ├── leaderboard/    # LeaderboardClient
    └── tasks/          # TaskItem, TaskList

public/assets/
├── units/              # Sprite sheets (blue/red × archer/lancer/pawn/warrior)
├── ui/                 # UI assets (icons, avatars, chest, task, nav icons)
├── terrain/            # Tilemap, rocks, bushes, water
├── fx/                 # Particle effects (leaves, clouds, dust, fire)
├── buildings/          # Building sprites (Blue/Red)
└── music/              # Soundtrack (main, battle)

contract/
├── src/                # Solidity contracts (CeloTactics, GameUnits, RewardToken)
├── script/             # Deploy scripts
└── test/               # Foundry tests
```

---

## Features

**Hub (Mini App Shell)**
- Onboarding — choose name & avatar, persisted in localStorage
- Home — PlayerCard, Daily Reward chest, Daily Quests preview, Play Arena
- Tasks — 6 daily quests with progress tracking & reward claiming
- Leaderboard — player rankings with tier system
- Friends — referral code system, invite & earn rewards

**Game**
- 8×8 grid auto-battler, 5 rounds per session
- Prep phase: buy units, reroll shop, place on grid
- Battle phase: real-time combat animation via PixiJS RAF loop
- Unit system: Pawn, Warrior, Archer, Lancer — each with a trait (Melee / Ranged / Tank / Assassin)
- Merge system: 3 identical units → star upgrade
- Enemy intel: preview enemy lineup before battle

**Design System**
- Gold × Navy Blue theme
- Pixel art rendering (`image-rendering: pixelated`)
- Animations: curtain lift, logo crash, leaf fall, chest shake/bounce
- Mobile-first, max-width 430px

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test inside MiniPay, use ngrok:

```bash
ngrok http 3000
```

Then open the HTTPS URL from ngrok in MiniPay Developer Mode.

---

## Smart Contracts

Contracts are written in Solidity with Foundry, deployed to Celo Sepolia Testnet.

```bash
cd contract
forge build
forge test
forge script script/Deploy.s.sol --rpc-url $CELO_RPC --broadcast
```

---

## Roadmap

- [x] Core game loop (prep + battle phases)
- [x] Hub pages (home, tasks, leaderboard, friends)
- [x] Daily quest & reward system
- [x] Referral code system
- [ ] On-chain integration (smart contracts + session keys)
- [ ] Multiplayer mode
- [ ] Streak shield mechanic
- [ ] Match stakes (entry fee pool)
