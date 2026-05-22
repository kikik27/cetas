/**
 * Sprite sheet animation engine.
 * Pure logic — no React, no DOM. Works with HTMLImageElement loaded externally.
 */

import type { AnimState, AnimClip } from '../assets/spriteRegistry'

export interface AnimatorState {
  currentAnim: AnimState
  frame: number
  elapsed: number
  /** true when a non-looping clip has finished its last frame */
  done: boolean
}

export function createAnimator(initial: AnimState = 'idle'): AnimatorState {
  return { currentAnim: initial, frame: 0, elapsed: 0, done: false }
}

/**
 * Advance the animator by `deltaMs` milliseconds.
 * Returns a new state (immutable update).
 */
export function tickAnimator(
  state: AnimatorState,
  clip: AnimClip,
  deltaMs: number,
): AnimatorState {
  if (state.done && !clip.loop) return state

  let elapsed = state.elapsed + deltaMs
  let frame = state.frame
  let done = false

  while (elapsed >= clip.fps) {
    elapsed -= clip.fps
    frame++
    if (frame >= clip.frames) {
      if (clip.loop) {
        frame = 0
      } else {
        frame = clip.frames - 1
        done = true
        break
      }
    }
  }

  return { ...state, frame, elapsed, done }
}

/**
 * Transition to a new animation state.
 * If already in that state and it's looping, no-op.
 */
export function transitionAnim(
  state: AnimatorState,
  next: AnimState,
  clip: AnimClip,
): AnimatorState {
  if (state.currentAnim === next && !state.done) return state
  return { currentAnim: next, frame: 0, elapsed: 0, done: false }
}

/**
 * Draw one frame of a sprite sheet onto a canvas context.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: number,
  frameW: number,
  frameH: number,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  flipX = false,
) {
  ctx.save()
  if (flipX) {
    ctx.translate(destX + destW, destY)
    ctx.scale(-1, 1)
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, 0, 0, destW, destH)
  } else {
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, destX, destY, destW, destH)
  }
  ctx.restore()
}
