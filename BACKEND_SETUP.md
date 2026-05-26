# Backend Setup — Celo Tactics

## Stack
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma 7 (with `@prisma/adapter-pg` driver adapter)
- **API**: Next.js Route Handlers (`app/api/`)
- **Client**: TanStack Query v5

---

## 1. Buat Supabase Project

1. Buka https://supabase.com → New Project
2. Catat:
   - **Project URL**: `https://xxxx.supabase.co`
   - **Anon Key**: dari Settings → API
   - **Database Password**: yang kamu set saat buat project

---

## 2. Isi `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Transaction mode (port 6543) — untuk runtime app
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Session mode (port 5432) — untuk migrations
DIRECT_URL=postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

> Ambil connection strings dari: Supabase → Project Settings → Database → Connection string

---

## 3. Jalankan Migration

```bash
# Push schema ke database (development)
npm run db:push

# ATAU buat migration file (production-ready)
npm run db:migrate
```

---

## 4. Seed Task Definitions

```bash
npm run db:seed
```

---

## 5. Cek Database (opsional)

```bash
npm run db:studio
```

---

## API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/player?wallet=0x...` | Fetch/create player profile |
| POST | `/api/player` | Update name/avatar |
| GET | `/api/tasks?wallet=0x...` | Fetch tasks + progress hari ini |
| POST | `/api/tasks/progress` | Increment task progress |
| POST | `/api/tasks/claim` | Claim task reward |
| GET | `/api/daily-claim?wallet=0x...` | Status daily chest |
| POST | `/api/daily-claim` | Buka daily chest |
| GET | `/api/friends?wallet=0x...` | List friends/referrals |
| POST | `/api/friends/claim` | Claim referral reward |
| POST | `/api/friends/referral` | Submit referral code |
| GET | `/api/leaderboard?limit=50` | Top players |

---

## TanStack Query Hooks

```ts
import { usePlayer }           from '@/src/hooks/usePlayer'
import { useTasks }            from '@/src/hooks/useTasks'
import { useDailyClaimStatus } from '@/src/hooks/useDailyClaim'
import { useFriends }          from '@/src/hooks/useFriends'
import { useLeaderboard }      from '@/src/hooks/useLeaderboard'
import { useWallet }           from '@/src/providers/WalletProvider'

// Contoh penggunaan:
const { wallet, connected, isMiniPay } = useWallet()
const { data: player, isLoading } = usePlayer(wallet)
const { data: tasks } = useTasks(wallet)
```

---

## Wallet Integration (MiniPay)

Stack: **wagmi v3 + viem** — sesuai docs.minipay.xyz

| File | Fungsi |
|------|--------|
| `src/lib/wagmi.ts` | Config wagmi (injected connector, Celo chains) |
| `src/providers/WagmiProvider.tsx` | Wagmi context wrapper |
| `src/providers/WalletProvider.tsx` | Exposes `useWallet()` hook |
| `src/hooks/useAutoConnect.ts` | Auto-connect on mount (MiniPay requirement) |
| `src/ui/MiniPayGate.tsx` | Guard component — shows error jika bukan di MiniPay |

**Rules MiniPay:**
- ✅ Auto-connect on page load — JANGAN tampilkan tombol "Connect Wallet"
- ✅ `window.ethereum` diinjeksi otomatis oleh MiniPay
- ✅ Cek `window.ethereum?.isMiniPay` untuk deteksi environment
- ✅ Jangan minta user sign message untuk autentikasi
- ✅ Dev mode: fallback ke mock wallet via localStorage

**Penggunaan MiniPayGate:**
```tsx
// Wrap halaman yang butuh wallet
<MiniPayGate>
  <HomeClient />
</MiniPayGate>
```

---

## Data yang Tetap On-Chain vs Off-Chain

| Data | Storage | Alasan |
|------|---------|--------|
| Unit NFT ownership | On-chain (ERC-1155) | Aset pemain, harus trustless |
| Match entry fee | On-chain (cUSD) | Uang nyata |
| Battle result | On-chain | Trustless settlement |
| Player profile | Supabase | Non-financial, bisa off-chain |
| Daily tasks | Supabase | Game state, tidak perlu on-chain |
| Leaderboard | Supabase | Derived data |
| Friends/referral | Supabase | Social graph |
