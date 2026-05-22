import { ARROW_SPRITES, FX, SPRITE_SHEETS, TERRAIN } from '../assets/spriteRegistry'

const imageCache = new Map<string, HTMLImageElement>()

export function loadImg(url: string): HTMLImageElement {
  if (imageCache.has(url)) return imageCache.get(url)!
  const img = new Image()
  img.src = url
  imageCache.set(url, img)
  return img
}

export function preloadAllGameImages() {
  for (const sheet of Object.values(SPRITE_SHEETS)) {
    for (const clip of Object.values(sheet.clips)) {
      loadImg(clip.url)
      if (clip.effectUrl) loadImg(clip.effectUrl)
    }
  }
  Object.values(TERRAIN).forEach(loadImg)
  Object.values(FX).forEach(f => loadImg(f.url))
  Object.values(ARROW_SPRITES).forEach(loadImg)
}
