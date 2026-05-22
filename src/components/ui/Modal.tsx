'use client'

import { cn } from '@/src/lib/utils'
import { useEffect } from 'react'

interface ModalProps {
  show: boolean
  onClose?: () => void
  children: React.ReactNode
  /** If true, clicking backdrop does NOT close */
  persistent?: boolean
}

export function Modal({ show, onClose, children, persistent = false }: ModalProps) {
  // Escape key
  useEffect(() => {
    if (!show || persistent) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [show, onClose, persistent])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(4,2,10,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={persistent ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        className={cn(
          'rpg-modal anim-pop w-full max-w-[320px] overflow-hidden',
        )}
      >
        {children}
      </div>
    </div>
  )
}
