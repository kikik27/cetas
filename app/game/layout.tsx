/**
 * Layout for /game — full-screen, no header, no nav.
 *
 * Mirrors hub layout structure exactly (app-frame-outer → mobile-shell)
 * so the column width, centering, and scroll behaviour are identical.
 * The only difference: no AppHeader, no BottomNav.
 *
 * Structure:
 *   app-frame-outer  — full viewport centering wrapper
 *   └─ mobile-shell  — max-w-[430px], flex col, min-h-dvh, game-bg
 *       ├─ curtain   — black fade-in overlay
 *       └─ {page}    — GameHUD content, fills remaining space
 */
export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame-outer">
      <div className="mobile-shell game-bg game-scroll">
        {/* Black curtain fades out on mount — same as hub pages */}
        <div className="curtain" aria-hidden />
        {children}
      </div>
    </div>
  )
}
