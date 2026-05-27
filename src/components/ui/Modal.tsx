'use client'

import { cn } from '@/src/lib/utils'
import { useEffect, useRef } from 'react'

interface ModalProps {
  show: boolean
  onClose?: () => void
  children: React.ReactNode
  /** If true, clicking backdrop does NOT close */
  persistent?: boolean
  ariaLabel?: string
  ariaLabelledBy?: string
}

export function Modal({ show, onClose, children, persistent = false, ariaLabel, ariaLabelledBy }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!show) return
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Only focus the panel if nothing inside it is already focused
    window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      if (!panel.contains(document.activeElement)) {
        panel.focus()
      }
    }, 0)

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose?.()
      if (e.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) {
        e.preventDefault()
        panelRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = previousOverflow
      openerRef.current?.focus()
    }
  }, [show, onClose, persistent])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(2,8,20,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={persistent ? undefined : onClose}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : 'Dialog')}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        className={cn(
          'rpg-modal anim-pop w-full max-w-[320px] overflow-hidden outline-none',
        )}
      >
        {children}
      </div>
    </div>
  )
}
