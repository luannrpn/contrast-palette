# Contrast Palette

Verificador de contraste de cores pelas regras do WCAG 2.x, com sugestão de correção, e gerador de paleta de 10 tons com variáveis CSS.

**Demo:** https://luannrpn.github.io/contrast-palette/

## O que faz

- Calcula a razão de contraste entre texto e fundo e mostra aprovação em AA/AAA (texto normal e grande) e componentes de interface.
- Sugere um tom do texto que atinge AA (4.5:1), preservando matiz e saturação e mudando só a luminosidade.
- Gera 10 tons (50 a 900) a partir de uma cor base, com o contraste de cada um contra preto e branco, e exporta `:root { --brand-500: … }`.

Contraste: `(L1 + 0,05) ÷ (L2 + 0,05)`, onde `L` é a luminância relativa definida no WCAG.

## Rodar localmente

```bash
npm install
npm run dev
npm test
npm run build
```

## Tecnologias

Vite, TypeScript, GSAP + ScrollTrigger, Lenis e [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) (`@fontsource-variable/instrument-sans`, licença OFL).

## Autoria

Autor: **Luann Neves** ([@luannrpn](https://github.com/luannrpn)). Veja [AUTHORS.md](AUTHORS.md), [LICENSE](LICENSE) (MIT) e [CITATION.cff](CITATION.cff).
