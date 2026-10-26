import { describe, expect, it } from 'vitest'
import { buildPalette, contrast, grade, hslToRgb, paletteCss, parseHex, rgbToHsl, suggestForeground, toHex } from './color'

const white = parseHex('#fff')!
const black = parseHex('#000')!

describe('color', () => {
  it('lê hex curto, longo e sem #', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255])
    expect(parseHex('0a8f5c')).toEqual([10, 143, 92])
    expect(parseHex('#xyz')).toBeNull()
    expect(parseHex('#12345')).toBeNull()
  })

  it('toHex é o inverso de parseHex', () => {
    expect(toHex(parseHex('#0a8f5c')!)).toBe('#0a8f5c')
  })

  it('contraste preto/branco é 21', () => {
    expect(contrast(black, white)).toBeCloseTo(21, 5)
    expect(contrast(white, white)).toBeCloseTo(1, 5)
  })

  it('#777 sobre branco fica em 4.48 (reprova AA normal)', () => {
    const r = contrast(parseHex('#777777')!, white)
    expect(r).toBeCloseTo(4.48, 2)
    expect(grade(r).aaNormal).toBe(false)
    expect(grade(r).aaLarge).toBe(true)
  })

  it('níveis de conformidade nos limites', () => {
    expect(grade(4.5)).toEqual({ aaNormal: true, aaLarge: true, aaaNormal: false, aaaLarge: true, ui: true })
    expect(grade(7).aaaNormal).toBe(true)
    expect(grade(2.9).aaLarge).toBe(false)
  })

  it('HSL faz ida e volta', () => {
    const rgb = parseHex('#0a8f5c')!
    const back = hslToRgb(rgbToHsl(rgb)).map(Math.round)
    expect(back).toEqual(rgb)
  })

  it('sugestão de texto atinge o alvo e mantém a cor se já passa', () => {
    const fg = parseHex('#9aa5b1')!
    const s = suggestForeground(fg, white, 4.5)!
    expect(contrast(s, white)).toBeGreaterThanOrEqual(4.5)
    expect(suggestForeground(black, white)).toEqual(black)
  })

  it('sugestão clareia o texto em fundo escuro', () => {
    const s = suggestForeground(parseHex('#444444')!, parseHex('#111111')!, 4.5)!
    expect(contrast(s, parseHex('#111111')!)).toBeGreaterThanOrEqual(4.5)
    expect(rgbToHsl(s)[2]).toBeGreaterThan(rgbToHsl(parseHex('#444444')!)[2])
  })

  it('paleta tem 10 tons, base no 500 e do claro ao escuro', () => {
    const p = buildPalette(parseHex('#0b6b5d')!)
    expect(p).toHaveLength(10)
    expect(p[5].hex).toBe('#0b6b5d')
    expect(p[0].vsWhite).toBeLessThan(p[9].vsWhite)
    expect(paletteCss('brand', p)).toContain('--brand-500: #0b6b5d;')
  })
})
