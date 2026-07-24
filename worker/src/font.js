// Runtime text renderer for the profile GIF. Reads the pre-rendered
// JetBrains Mono glyph atlas (font-atlas.generated.js — see
// scripts/build-font-atlas.mjs) and alpha-blends each glyph's real
// coverage data against the caller's background color.
//
// This replaced a hand-drawn bitmap font that only had glyphs for
// whatever characters someone remembered to add — which is exactly
// why `"` and en-dash `–` were rendering as broken filled boxes.
// The atlas now covers full printable ASCII plus every extra
// character actually used across the profile, generated straight
// from a real font file, so there's no per-character gap to hit.

import { CELL_WIDTH, CELL_HEIGHT, GLYPHS } from './font-atlas.generated.js'

export { CELL_WIDTH, CELL_HEIGHT }

const FALLBACK_CHAR = '?' // guaranteed present (full ASCII is in the atlas)

function blend(bg, fg, alpha) {
  return [
    Math.round(bg[0] + (fg[0] - bg[0]) * alpha),
    Math.round(bg[1] + (fg[1] - bg[1]) * alpha),
    Math.round(bg[2] + (fg[2] - bg[2]) * alpha)
  ]
}

/**
 * @param ctx     frame context from previewGif.js (has .fillRect(x,y,w,h,color))
 * @param text    string to draw
 * @param x, y    top-left origin
 * @param fg      [r,g,b] text color
 * @param bg      [r,g,b] the background color text sits on, needed to
 *                anti-alias glyph edges correctly (this frame buffer only
 *                supports opaque pixels, so we pre-blend instead of using
 *                real alpha compositing).
 */
export function drawText(ctx, text, x, y, fg, bg) {
  let cursor = x
  for (const ch of text) {
    if (ch === '\n') {
      cursor = x
      continue
    }
    const packed = GLYPHS[ch] || GLYPHS[FALLBACK_CHAR]
    for (let row = 0; row < CELL_HEIGHT; row++) {
      for (let col = 0; col < CELL_WIDTH; col++) {
        const idx = (row * CELL_WIDTH + col) * 2
        const alpha = parseInt(packed.substr(idx, 2), 16) / 255
        if (alpha <= 0.02) continue
        ctx.fillRect(cursor + col, y + row, 1, 1, blend(bg, fg, alpha))
      }
    }
    cursor += CELL_WIDTH
  }
}

export function textWidth(text) {
  let width = 0
  for (const ch of text) {
    if (ch === '\n') continue
    width += CELL_WIDTH
  }
  return width
}
