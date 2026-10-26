export type RGB = [number, number, number]

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Aceita #rgb, #rrggbb (com ou sem #). Retorna null se inválido. */
export function parseHex(input: string): RGB | null {
  let h = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')
}

/** Luminância relativa (WCAG 2.x). */
export function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export interface Grade {
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
  ui: boolean
}

export function grade(ratio: number): Grade {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    ui: ratio >= 3,
  }
}

export function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

export function hslToRgb([h, s, l]: [number, number, number]): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

/**
 * Ajusta só a luminosidade do texto (mantendo matiz e saturação) até atingir `target`.
 * Escolhe a direção que se afasta do fundo. Retorna null se nem preto/branco alcançam.
 */
export function suggestForeground(fg: RGB, bg: RGB, target = 4.5): RGB | null {
  if (contrast(fg, bg) >= target) return fg
  const [h, s, l] = rgbToHsl(fg)
  const darker = luminance(bg) > 0.18
  for (let i = 1; i <= 100; i++) {
    const nl = clamp(l + (darker ? -i : i) / 100, 0, 1)
    const c = hslToRgb([h, s, nl])
    if (contrast(c, bg) >= target) return c.map(Math.round) as RGB
  }
  return null
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export interface Swatch {
  step: number
  hex: string
  vsWhite: number
  vsBlack: number
  /** cor de texto com melhor contraste sobre este tom */
  on: '#ffffff' | '#000000'
}

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

/** 10 tons a partir de uma cor base (a base fica no passo 500). */
export function buildPalette(base: RGB): Swatch[] {
  const white: RGB = [255, 255, 255]
  const black: RGB = [0, 0, 0]
  const tints: Record<number, number> = { 50: 0.92, 100: 0.82, 200: 0.65, 300: 0.45, 400: 0.22 }
  const shades: Record<number, number> = { 600: 0.15, 700: 0.32, 800: 0.5, 900: 0.68 }
  return STEPS.map((step) => {
    const rgb = step === 500 ? base : step < 500 ? mix(base, white, tints[step]) : mix(base, black, shades[step])
    const rounded = rgb.map(Math.round) as RGB
    const vsWhite = contrast(rounded, white)
    const vsBlack = contrast(rounded, black)
    return { step, hex: toHex(rounded), vsWhite, vsBlack, on: vsBlack >= vsWhite ? '#000000' : '#ffffff' }
  })
}

export function paletteCss(name: string, swatches: Swatch[]): string {
  return `:root {\n${swatches.map((s) => `  --${name}-${s.step}: ${s.hex};`).join('\n')}\n}\n`
}
