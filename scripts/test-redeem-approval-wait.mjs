import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/ui/RedeemClient.tsx', import.meta.url), 'utf8')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

assert(
  source.includes('approvalHash') && source.includes('approvalReceipt'),
  'RedeemClient must track approval hash and receipt separately from swap receipt',
)

const effectIndex = source.indexOf('if (!approvalHash || !approvalReceipt || approvalDoneRef.current) return')
const refetchIndex = source.indexOf('await refetchAllowance()', effectIndex)
const swapIndex = source.indexOf('await executeSwap()', effectIndex)

assert(refetchIndex !== -1, 'allowance must refetch after approval receipt arrives')
assert(swapIndex !== -1, 'swap must start after approval receipt arrives')
assert(
  effectIndex < refetchIndex && refetchIndex < swapIndex,
  'approval flow must wait for on-chain approval receipt, then refetch allowance, then swap',
)

assert(
  source.includes("step === 'approving'") && source.includes('disabled={needsChainSwitch ? false : (!canSwap || isBusy)}'),
  'approval UX must stay busy and prevent double-submit while approval confirms',
)
