import '@fontsource-variable/instrument-sans'
import './styles/base.css'
import './styles/app.css'
import { buildPalette, contrast, grade, paletteCss, parseHex, suggestForeground, toHex, type RGB } from './lib/color'
import { countTo, initMotion } from './motion'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const input = (id: string) => $<HTMLInputElement>(id)

const state = { fg: parseHex('#0b6b5d')!, bg: parseHex('#f3eee4')!, base: parseHex('#0b6b5d')! }

/** Liga o seletor nativo ao campo de texto hex e chama onChange com a cor válida. */
function bindColor(key: keyof typeof state, prefix: string, onChange: () => void) {
  const picker = input(`${prefix}-c`)
  const text = input(`${prefix}-t`)
  picker.addEventListener('input', () => {
    state[key] = parseHex(picker.value)!
    text.value = picker.value
    text.removeAttribute('aria-invalid')
    onChange()
  })
  text.addEventListener('input', () => {
    const rgb = parseHex(text.value)
    if (!rgb) return text.setAttribute('aria-invalid', 'true')
    text.removeAttribute('aria-invalid')
    state[key] = rgb
    picker.value = toHex(rgb)
    onChange()
  })
}

function setColor(key: keyof typeof state, prefix: string, rgb: RGB) {
  state[key] = rgb
  input(`${prefix}-c`).value = toHex(rgb)
  input(`${prefix}-t`).value = toHex(rgb)
  input(`${prefix}-t`).removeAttribute('aria-invalid')
}

const rows: [keyof ReturnType<typeof grade>, string, string][] = [
  ['aaNormal', 'AA · texto normal', '4.5:1'],
  ['aaLarge', 'AA · texto grande', '3:1'],
  ['aaaNormal', 'AAA · texto normal', '7:1'],
  ['aaaLarge', 'AAA · texto grande', '4.5:1'],
  ['ui', 'Componentes de interface', '3:1'],
]

function updateContrast() {
  const { fg, bg } = state
  const preview = $('preview')
  preview.style.background = toHex(bg)
  preview.style.color = toHex(fg)

  const ratio = contrast(fg, bg)
  countTo($('ratio'), ratio, (n) => `${n.toFixed(2).replace('.', ',')}:1`)

  const g = grade(ratio)
  $('grades').innerHTML = rows
    .map(
      ([k, label, min]) =>
        `<li class="${g[k] ? 'pass' : 'fail'}"><span class="mark" aria-hidden="true">${g[k] ? '✓' : '✕'}</span><div><strong>${label}</strong><small>${g[k] ? 'Passa' : 'Reprova'} · mínimo ${min}</small></div></li>`,
    )
    .join('')

  const box = $('suggest')
  if (g.aaNormal) {
    box.innerHTML = ''
    return
  }
  const s = suggestForeground(fg, bg, 4.5)
  box.innerHTML = s
    ? `<div class="suggest"><p>Texto <b><span class="chip" style="background:${toHex(s)}"></span>${toHex(s)}</b> atinge AA (${contrast(s, bg).toFixed(2).replace('.', ',')}:1) mantendo o matiz.</p><button class="btn ghost" id="apply" type="button">Usar sugestão</button></div>`
    : '<div class="suggest"><p>Nenhum tom dessa cor atinge AA sobre este fundo. Mude também o fundo.</p></div>'
  $('apply')?.addEventListener('click', () => {
    if (!s) return
    setColor('fg', 'fg', s)
    updateContrast()
  })
}

function updatePalette() {
  const name = input('pal-name').value.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'brand'
  const p = buildPalette(state.base)
  $('swatches').innerHTML = p
    .map((s) => {
      const best = s.on === '#000000' ? s.vsBlack : s.vsWhite
      return `<li class="sw" style="background:${s.hex};color:${s.on}">
        <strong>${s.step}</strong>
        <div><span>${s.hex}</span><span class="ratio">${best.toFixed(1).replace('.', ',')}:1 ${s.on === '#000000' ? 'preto' : 'branco'}${best >= 4.5 ? ' · AA' : ''}</span></div>
      </li>`
    })
    .join('')
  $('code').textContent = paletteCss(name, p)
}

bindColor('fg', 'fg', updateContrast)
bindColor('bg', 'bg', updateContrast)
bindColor('base', 'base', updatePalette)
input('pal-name').addEventListener('input', updatePalette)

$('swap').addEventListener('click', () => {
  const { fg, bg } = state
  setColor('fg', 'fg', bg)
  setColor('bg', 'bg', fg)
  updateContrast()
})

$('copy').addEventListener('click', async () => {
  const status = $('copy-status')
  try {
    await navigator.clipboard.writeText($('code').textContent ?? '')
    status.textContent = 'CSS copiado.'
  } catch {
    status.textContent = 'Não foi possível copiar. Selecione o texto e use Ctrl+C.'
  }
})

updateContrast()
updatePalette()
initMotion()
