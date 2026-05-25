'use client'

import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/src/lib/utils'

const buttonVariants = cva(
  // Base — NO border-none here so variants can add their own borders
  'inline-flex items-center justify-center gap-1.5 font-bold tracking-wide cursor-pointer select-none whitespace-nowrap rounded-lg transition-[transform,filter,box-shadow] duration-75 active:scale-95 active:brightness-85 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none',
  {
    variants: {
      variant: {
        /* ── Solid gold — primary CTA ── */
        gold: 'border-2 border-[#8a6010] bg-gradient-to-b from-[#f5d878] via-[#d4a030] to-[#9a6818] text-[#1a0e04] font-black [box-shadow:inset_0_1px_0_rgba(255,248,200,0.7),inset_0_-2px_0_rgba(0,0,0,0.25),0_3px_0_#5a3a08,0_6px_20px_rgba(200,146,42,0.4)] hover:brightness-110 active:translate-y-[1px] active:[box-shadow:inset_0_1px_0_rgba(255,248,200,0.7),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_0_#5a3a08]',

        /* ── Danger red ── */
        red: 'border-2 border-[#6e1414] bg-gradient-to-b from-[#e05050] to-[#a82424] text-[#fff0f0] [box-shadow:inset_0_1px_0_rgba(255,180,180,0.3),0_3px_0_#6e1414,0_6px_16px_rgba(168,36,36,0.4)] active:translate-y-[1px] active:[box-shadow:inset_0_1px_0_rgba(255,180,180,0.3),0_1px_0_#6e1414]',

        /* ── Blue ── */
        blue: 'border-2 border-[#1a3f70] bg-gradient-to-b from-[#5aabff] to-[#2460a8] text-[#e8f4ff] [box-shadow:inset_0_1px_0_rgba(180,220,255,0.3),0_3px_0_#1a3f70,0_6px_16px_rgba(36,96,168,0.35)] active:translate-y-[1px] active:[box-shadow:inset_0_1px_0_rgba(180,220,255,0.3),0_1px_0_#1a3f70]',

        /* ── Ghost ── */
        ghost: 'border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.08)]',

        /* ── Danger subtle ── */
        danger: 'border-2 border-[#6a2f1f] bg-gradient-to-b from-[#cf6d52] to-[#a24c35] text-[#fff3ee] [box-shadow:inset_0_1px_0_rgba(255,200,180,0.25),0_3px_0_#6a2f1f] active:translate-y-[1px] active:[box-shadow:inset_0_1px_0_rgba(255,200,180,0.25),0_1px_0_#6a2f1f]',

        /* ── Pixel Gold — main action ── */
        pixelGold: 'rounded-none border-2 border-[#5c3b0f] bg-gradient-to-b from-[#f5d878] to-[#c88a20] text-[#1a0e04] [box-shadow:inset_-2px_-2px_0_#8a5510,inset_2px_2px_0_#fff5c0,0_4px_0_#5c3b0f,0_6px_16px_rgba(200,146,42,0.3)] active:translate-y-[2px] active:[box-shadow:inset_-2px_-2px_0_#8a5510,inset_2px_2px_0_#fff5c0,0_2px_0_#5c3b0f]',

        /* ── Pixel Blue ── */
        pixelBlue: 'rounded-none border-2 border-[#173a67] bg-gradient-to-b from-[#82bfff] to-[#2a5ea0] text-[#eef7ff] [box-shadow:inset_-2px_-2px_0_#1a3f70,inset_2px_2px_0_#c8e8ff,0_4px_0_#173a67,0_6px_16px_rgba(36,96,168,0.3)] active:translate-y-[2px] active:[box-shadow:inset_-2px_-2px_0_#1a3f70,inset_2px_2px_0_#c8e8ff,0_2px_0_#173a67]',

        /* ── Pixel Danger ── */
        pixelDanger: 'rounded-none border-2 border-[#5b1f17] bg-gradient-to-b from-[#ea8d7a] to-[#b44735] text-[#fff3ef] [box-shadow:inset_-2px_-2px_0_#8a2f20,inset_2px_2px_0_#ffd2c8,0_4px_0_#6a2f1f,0_6px_16px_rgba(168,48,36,0.3)] active:translate-y-[2px] active:[box-shadow:inset_-2px_-2px_0_#8a2f20,inset_2px_2px_0_#ffd2c8,0_2px_0_#6a2f1f]',

        /* ── Pixel Ghost ── */
        pixelGhost: 'rounded-none border-2 border-[rgba(200,146,42,0.4)] bg-[rgba(200,146,42,0.06)] text-[var(--text-2)] [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3),inset_2px_2px_0_rgba(255,220,100,0.08),0_4px_0_rgba(0,0,0,0.4)] active:translate-y-[2px] active:[box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.3),inset_2px_2px_0_rgba(255,220,100,0.08),0_2px_0_rgba(0,0,0,0.4)]',
      },
      size: {
        sm: 'h-9  px-3 text-xs  rounded-lg',
        md: 'h-11 px-4 text-sm  rounded-xl',
        lg: 'h-14 px-6 text-base rounded-2xl',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
