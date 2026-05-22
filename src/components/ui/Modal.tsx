'use client'

import { cn } from '@/src/lib/utils'
import { useEffect } from 'react'

interface ModalProps {
  show: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ show, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!show) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 anim-fade-up" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={cn('w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 text-center anim-pop')}>
        {children}
      </div>
    </div>
  )
}
