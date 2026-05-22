'use client'

import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/src/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-bold tracking-wide border-none cursor-pointer rounded-lg transition-[transform,filter] duration-75 active:scale-93 active:brightness-85 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        gold: 'relative bg-[linear-gradient(180deg,#f7d67a_0%,#e8bf57_40%,#bf8b2d_100%)] text-[#241706] shadow-[inset_0_1px_0_rgba(255,249,205,0.7),0_2px_0_#7b5518,0_10px_24px_rgba(212,168,66,0.45)] border border-[rgba(255,224,130,0.55)] hover:brightness-110',
        red: 'bg-gradient-to-b from-[var(--enemy)] to-[#a82424] text-[#fff0f0] shadow-[0_2px_0_#6e1414,0_4px_12px_rgba(168,36,36,0.35)] border border-[rgba(255,120,120,0.18)]',
        blue: 'bg-gradient-to-b from-[var(--ally)] to-[#2460a8] text-[#e8f4ff] shadow-[0_2px_0_#1a3f70,0_4px_12px_rgba(36,96,168,0.3)] border border-[rgba(100,180,255,0.2)]',
        ghost: 'bg-white/5 text-[var(--text-2)] border border-[var(--border)] hover:bg-white/9',
        danger: 'bg-gradient-to-b from-[#cf6d52] to-[#a24c35] text-[#fff3ee] shadow-[0_2px_0_#6a2f1f] border border-[rgba(255,140,120,0.2)]',
        pixelGold: 'rounded-none border-2 border-[#5c3b0f] bg-[linear-gradient(180deg,#ffe59a_0%,#e8b847_100%)] text-[#2b1a07] shadow-[inset_-2px_-2px_0_#9f6a1d,inset_2px_2px_0_#fff1c7,0_4px_0_#6d4714] active:translate-y-[2px] active:shadow-[inset_-2px_-2px_0_#9f6a1d,inset_2px_2px_0_#fff1c7,0_2px_0_#6d4714]',
        pixelBlue: 'rounded-none border-2 border-[#173a67] bg-[linear-gradient(180deg,#82bfff_0%,#3c78bc_100%)] text-[#eef7ff] shadow-[inset_-2px_-2px_0_#24548d,inset_2px_2px_0_#cde5ff,0_4px_0_#1a3f70] active:translate-y-[2px] active:shadow-[inset_-2px_-2px_0_#24548d,inset_2px_2px_0_#cde5ff,0_2px_0_#1a3f70]',
        pixelDanger: 'rounded-none border-2 border-[#5b1f17] bg-[linear-gradient(180deg,#ea8d7a_0%,#b44735_100%)] text-[#fff3ef] shadow-[inset_-2px_-2px_0_#8a2f20,inset_2px_2px_0_#ffd2c8,0_4px_0_#6a2f1f] active:translate-y-[2px] active:shadow-[inset_-2px_-2px_0_#8a2f20,inset_2px_2px_0_#ffd2c8,0_2px_0_#6a2f1f]',
        pixelGhost: 'rounded-none border-2 border-[rgba(120,74,22,0.5)] bg-[rgba(255,248,228,0.7)] text-[var(--text-2)] shadow-[inset_-2px_-2px_0_rgba(160,120,60,0.25),inset_2px_2px_0_rgba(255,255,245,0.7),0_4px_0_rgba(95,58,16,0.35)] active:translate-y-[2px] active:shadow-[inset_-2px_-2px_0_rgba(160,120,60,0.25),inset_2px_2px_0_rgba(255,255,245,0.7),0_2px_0_rgba(95,58,16,0.35)]',
      },
      size: {
        sm: 'h-9 px-3 text-xs rounded-lg',
        md: 'h-11 px-4 text-sm rounded-xl',
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
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
