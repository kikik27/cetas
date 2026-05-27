import { createPublicClient, createWalletClient, formatUnits, http, parseUnits, type Abi, type Address, type Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import { CetasPointsABI, MAINNET } from './contracts'

const cetasPointsAbi = CetasPointsABI as Abi

export const celoPublicClient = createPublicClient({
  chain: celo,
  transport: http(process.env.CELO_RPC_URL ?? 'https://forno.celo.org'),
  batch: { multicall: true },
})

export function cetasWeiToNumber(balanceWei: bigint): number {
  return Math.floor(Number(formatUnits(balanceWei, 18)))
}

export async function readCetasBalance(walletAddress: Address): Promise<bigint> {
  return await celoPublicClient.readContract({
    address: MAINNET.CetasPoints,
    abi: cetasPointsAbi,
    functionName: 'balanceOf',
    args: [walletAddress],
  }) as bigint
}

export async function readCetasBalances(walletAddresses: Address[]): Promise<Map<string, number>> {
  const results = await celoPublicClient.multicall({
    allowFailure: true,
    contracts: walletAddresses.map(address => ({
      address: MAINNET.CetasPoints,
      abi: cetasPointsAbi,
      functionName: 'balanceOf',
      args: [address],
    })),
  })

  return new Map(walletAddresses.map((address, index) => {
    const result = results[index]
    const balance = result?.status === 'success' && typeof result.result === 'bigint'
      ? cetasWeiToNumber(result.result)
      : 0
    return [address.toLowerCase(), balance]
  }))
}

function getRewardPrivateKey(): `0x${string}` {
  const key = process.env.CETAS_REWARD_PRIVATE_KEY ?? process.env.GAME_REWARD_PRIVATE_KEY
  if (!key) {
    throw new Error('CETAS_REWARD_PRIVATE_KEY is not configured')
  }
  return key.startsWith('0x') ? key as `0x${string}` : `0x${key}`
}

export async function grantCetasReward(player: Address, amount: number): Promise<Hash[]> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Invalid CETAS reward amount')
  }

  const account = privateKeyToAccount(getRewardPrivateKey())
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(process.env.CELO_RPC_URL ?? 'https://forno.celo.org'),
  })

  const [rewardWei, gameContract] = await Promise.all([
    celoPublicClient.readContract({
      address: MAINNET.CetasPoints,
      abi: cetasPointsAbi,
      functionName: 'winRewardAmount',
    }) as Promise<bigint>,
    celoPublicClient.readContract({
      address: MAINNET.CetasPoints,
      abi: cetasPointsAbi,
      functionName: 'gameContract',
    }) as Promise<Address>,
  ])
  if (rewardWei <= BigInt(0)) throw new Error('On-chain reward amount is zero')
  if (gameContract.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error(
      `Reward signer ${account.address} is not authorized gameContract ${gameContract}. ` +
      `Call CetasPoints.setGameContract(${account.address}) from the contract owner.`
    )
  }

  const targetWei = parseUnits(String(amount), 18)
  if (targetWei % rewardWei !== BigInt(0)) {
    throw new Error(`Configured reward ${amount} CETAS does not match contract winRewardAmount`)
  }

  const calls = Number(targetWei / rewardWei)
  const hashes: Hash[] = []
  for (let i = 0; i < calls; i++) {
    const hash = await walletClient.writeContract({
      address: MAINNET.CetasPoints,
      abi: cetasPointsAbi,
      functionName: 'claimWinReward',
      args: [player],
    })
    const receipt = await celoPublicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') {
      throw new Error(`Reward transaction reverted: ${hash}`)
    }
    hashes.push(hash)
  }
  return hashes
}
