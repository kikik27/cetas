'use client'

/**
 * useAutoConnect — MiniPay requirement.
 *
 * MiniPay Mini Apps MUST auto-connect on page load.
 * Never show a "Connect Wallet" button.
 *
 * Fixes:
 * - Check isConnected before attempting connect to avoid ConnectorAlreadyConnectedError
 * - Use hasAttempted flag to prevent multiple connection attempts
 */
import { useEffect, useRef, useState } from 'react'
import { useConnect, useConnectors, useConnection } from 'wagmi'

export function useAutoConnect() {
  const connectors                    = useConnectors()
  const { connect, error, isPending } = useConnect()
  const { isConnected }               = useConnection()
  const [hasAttempted, setHasAttempted] = useState(false)
  const attemptingRef = useRef(false)

  useEffect(() => {
    // Already connected or already attempted — skip
    if (isConnected || hasAttempted || attemptingRef.current) return
    if (connectors.length === 0) return

    attemptingRef.current = true

    const attemptConnect = async () => {
      try {
        await connect({ connector: connectors[0] })
      } catch (err: unknown) {
        // ConnectorAlreadyConnectedError is benign — wagmi is already connected
        const msg = err instanceof Error ? err.message : String(err)
        if (!msg.includes('AlreadyConnected') && !msg.includes('already connected')) {
          console.warn('[useAutoConnect] Could not connect:', err)
        }
      } finally {
        setHasAttempted(true)
        attemptingRef.current = false
      }
    }

    attemptConnect()
  }, [connectors, connect, isConnected, hasAttempted])

  return { error, isPending }
}
