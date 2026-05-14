# EcoAmazônia — Design System (Source of Truth)

> Repositório: `github.com/bielmotaa/landign-page-eco-amazonia`
> Stack: React 19 + Vite 8 + Tailwind 3.4 + Framer Motion 12 + Zustand 5
> Arquitetura: MVVM (Model → Store → ViewModel → View)
> Idioma: pt-BR | Color scheme: light-only

---

## 1. Dependências Exatas

```json
{
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "framer-motion": "^12.38.0",
  "lucide-react": "^1.14.0",
  "zustand": "^5.0.13",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.6.0",
  "tailwindcss": "^3.4.19",
  "autoprefixer": "^10.5.0",
  "postcss": "^8.5.14",
  "typescript": "~6.0.2",
  "vite": "^8.0.10",
  "@vitejs/plugin-react": "^6.0.1"
}
```

---

## 2. Tailwind Config (real — tailwind.config.js)

```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          clin: '#579D67',
          light: '#268C8C',
          base: '#155B5B',
          dark: '#0A2E2E',
        },
        accent: {
          light: '#F2C4B3',
          base: '#D97D65',
          dark: '#B35A45',
        },
        background: '#F6F5F7',
        shape: '#EDE9F2',
        gray: {
          100: '#ADADAD',
          200: '#949494',
          300: '#666666',
          400: '#3D3D3D',
          500: '#1D1D1D',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter Display"', '"Inter"', 'ui-sans-serif', 'system-ui'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(10, 46, 46, 0.08)',
        soft: '0 20px 60px -20px rgba(10, 46, 46, 0.18)',
        elevated: '0 30px 80px -30px rgba(10, 46, 46, 0.35)',
        ring: '0 0 0 1px rgba(255,255,255,0.6) inset, 0 30px 80px -30px rgba(10, 46, 46, 0.35)',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgba(21,91,91,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(21,91,91,0.06) 1px, transparent 1px)',
        'radial-fade':
          'radial-gradient(80% 60% at 50% 0%, rgba(38,140,140,0.15), transparent 60%)',
        'mesh-eco':
          'radial-gradient(circle at 20% 20%, rgba(87,157,103,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(38,140,140,0.30), transparent 50%), radial-gradient(circle at 50% 90%, rgba(217,125,101,0.25), transparent 55%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'float-slow': 'float 7s ease-in-out infinite',
        'float-slower': 'float 11s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'gradient-pan': 'gradientPan 12s ease infinite',
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientPan: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## 3. Paleta de Cores (constants/colors.ts)

```ts
export const colors = {
  primary: {
    clin:  '#579D67',  // Verde floresta — CTA success, natureza
    light: '#268C8C',  // Teal médio — hovers, accents, eyebrow dots
    base:  '#155B5B',  // Teal escuro — cor principal, botões ghost
    dark:  '#0A2E2E',  // Quase-preto esverdeado — texto, botões dark
  },
  accent: {
    light: '#F2C4B3',  // Coral claro — gradientes warm
    base:  '#D97D65',  // Terracota — contraste quente, badges
    dark:  '#B35A45',  // Terracota escuro
  },
  white:      '#FFFFFF',
  background: '#F6F5F7',  // Off-white levemente lilás
  shape:      '#EDE9F2',  // Superfícies neutras
  danger:     '#DC3545',
  success:    '#28A745',
  warning:    '#FFC107',
  gray: {
    100: '#ADADAD',  // Texto terciário
    200: '#949494',  // Borders
    300: '#666666',  // Texto secundário / descriptions
    400: '#3D3D3D',  // Placeholders
    500: '#1D1D1D',  // Quase preto
  },
} as const;
```

---

## 4. Fontes

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&family=Inter+Tight:wght@400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');
```

| Token Tailwind | Font Stack | Uso |
|---|---|---|
| `font-sans` | `Inter, ui-sans-serif, system-ui, sans-serif` | Body, UI, parágrafos |
| `font-display` | `Inter Display, Inter, ui-sans-serif, system-ui` | Headings (h1–h6) |
| `font-serif` | `Instrument Serif, ui-serif, Georgia, serif` | Highlight editorial (itálico) |
| `font-mono` | `ui-monospace, SFMono-Regular, Menlo, …` | Labels técnicos |

### Regras globais

```css
h1–h6 { @apply font-display tracking-tighter; }
body  { @apply font-sans antialiased text-primary-dark; }
```

### Font features usados

```css
font-feature-settings: 'liga', 'calt';
font-feature-settings: 'ss01';
```

---

## 5. CSS Custom Completo (index.css)

### 5.1 CSS Variables

```css
:root {
  color-scheme: light;
  --background: #F6F5F7;
  --foreground: #0A2E2E;
}
```

### 5.2 @layer base

```css
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
html, body, #root { min-height: 100%; }
body {
  @apply font-sans antialiased text-primary-dark;
  background: #F6F5F7;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}
::selection { background: rgba(38, 140, 140, 0.18); color: #0A2E2E; }
h1, h2, h3, h4, h5, h6 { @apply font-display tracking-tighter; }

/* Scrollbar */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(21,91,91,0.25); border-radius: 999px;
  border: 2px solid transparent; background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(21,91,91,0.45); background-clip: padding-box;
}
```

### 5.3 @layer components

```css
.glass {
  background: rgba(255,255,255,0.55);
  backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid rgba(255,255,255,0.5);
}

.glass-dark {
  background: rgba(10,46,46,0.55);
  backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
}

.text-gradient-eco {
  background: linear-gradient(120deg, #155B5B 0%, #268C8C 45%, #579D67 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.text-gradient-warm {
  background: linear-gradient(120deg, #D97D65 0%, #F2C4B3 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.btn-primary {
  @apply inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white;
  background: linear-gradient(180deg, #268C8C 0%, #155B5B 100%);
  box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset,
              0 -10px 24px rgba(10,46,46,0.35) inset,
              0 14px 30px -10px rgba(10,46,46,0.55);
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
}
.btn-primary:hover {
  transform: translateY(-1px); filter: brightness(1.05);
  box-shadow: 0 1px 0 rgba(255,255,255,0.45) inset,
              0 -10px 24px rgba(10,46,46,0.4) inset,
              0 20px 40px -14px rgba(10,46,46,0.65);
}

.btn-ghost {
  @apply inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-primary-base;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(21,91,91,0.12);
  backdrop-filter: blur(12px); transition: all 0.25s ease;
}
.btn-ghost:hover {
  background: rgba(255,255,255,0.95);
  border-color: rgba(21,91,91,0.25); transform: translateY(-1px);
}

.chip {
  @apply inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(21,91,91,0.14);
  color: #155B5B; backdrop-filter: blur(8px);
}

.hairline {
  background: linear-gradient(90deg, transparent, rgba(21,91,91,0.18), transparent);
  height: 1px;
}

.grid-bg {
  background-image: linear-gradient(rgba(21,91,91,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(21,91,91,0.05) 1px, transparent 1px);
  background-size: 56px 56px;
}

.noise::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  opacity: 0.6; mix-blend-mode: overlay;
}
```

### 5.4 @layer utilities

```css
.mask-fade-b { mask-image: linear-gradient(180deg, black 60%, transparent 100%); }
.mask-fade-r { mask-image: linear-gradient(90deg, black 80%, transparent 100%); }
.text-balance { text-wrap: balance; }
.text-pretty  { text-wrap: pretty; }
```

---

## 6. Framer Motion Presets (utils/motion.ts)

```ts
const EASE = [0.22, 1, 0.36, 1]; // signature easing

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.65, ease: EASE } },
};

export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show:   { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const viewportOnce = { once: true, amount: 0.2 } as const;
```

---

## 7. Utility: cn()

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

---

## 8. Componentes UI Primitivos

### 8.1 Button (ui/Button.tsx)

4 variantes × 3 tamanhos. Todas `rounded-full`.

| Variant | Estilo |
|---|---|
| `primary` | `bg-gradient-to-b from-primary-light to-primary-base` + bevel inset shadow, hover:brightness-105 |
| `dark` | `bg-gradient-to-b from-primary-base to-primary-dark` + deep bevel, hover:brightness-110 |
| `ghost` | `bg-white/70 border-primary-base/15 backdrop-blur-md` → hover:bg-white |
| `outline` | `border-primary-dark/15` → hover:bg-primary-dark/5 |

| Size | Classes |
|---|---|
| `sm` | `px-4 py-2 text-sm` |
| `md` | `px-5 py-2.5 text-sm` |
| `lg` | `px-6 py-3.5 text-base` |

Base: `group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap`

### 8.2 Container (ui/Container.tsx)

```ts
sizes: { sm: 'max-w-3xl', md: 'max-w-5xl', lg: 'max-w-6xl', xl: 'max-w-7xl' }
base: 'mx-auto w-full px-4 xs:px-5 sm:px-8 lg:px-10'
default: 'xl'
```

### 8.3 GlassCard (ui/GlassCard.tsx)

| Tone | Estilo |
|---|---|
| `light` | `bg-white/70 border-white/60` + inset white shadow + soft outer |
| `dark` | `bg-primary-dark/80 text-white border-white/10` + deep shadow |
| `subtle` | `bg-white/40 border-white/40` + subtle shadow |

Base: `rounded-3xl border backdrop-blur-xl backdrop-saturate-150 overflow-hidden transition-all duration-500`
Hoverable: `hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_rgba(10,46,46,0.4)]`

### 8.4 SectionHeader (ui/SectionHeader.tsx)

Padrão usado em TODAS as seções:

```
eyebrow:     .chip com dot (size-1.5 bg-primary-light shadow-[0_0_8px_rgba(38,140,140,0.7)])
title:       font-display tracking-tightest text-primary-dark text-balance
             text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.04]
description: text-gray-300 text-base sm:text-lg leading-relaxed text-pretty max-w-2xl
```

Suporta `highlight` (.text-gradient-eco) e `highlightSerif` (font-serif italic font-normal tracking-tight).

### 8.5 Logo (ui/Logo.tsx)

```
"Eco" → font-semibold
"Amazônia" → font-light text-primary-light (dark) ou text-white/70 (light)
font-display tracking-tighter
```

### 8.6 Background (ui/Background.tsx)

| Variant | Composição |
|---|---|
| `hero` | bg-background + grid-bg opacity-60 mask-fade-b + mesh-eco orb 1200px blur-3xl animate-gradient-pan + 2 colored orbs blur-[120px]/[140px] |
| `soft` | bg-background + bg-radial-fade opacity-60 |
| `dark` | gradient primary-dark→primary-base→primary-dark + mesh-eco mix-blend-screen opacity-50 + grid-bg opacity-[0.08] |
| `mesh` | bg-background + 2 blurred orbs |

---

## 9. Phone Mockup (mockups/PhoneFrame.tsx)

Anatomia do frame:

```
Wrapper: rounded-[44px] bg-gradient from-[#1a1a1d] via-[#0c0c0e] to-[#1a1a1d] p-[3px]
├── Bevel: bg-gradient-to-br from-white/15 via-transparent (pointer-events-none)
├── Inner shell: rounded-[42px] bg-gradient from-[#2a2a2d] to-[#0a0a0c] (pointer-events-none)
├── Screen: rounded-[40px] overflow-hidden bg-black
│   ├── Dynamic Island: h-6 w-20 rounded-full bg-black centered z-30 mt-2
│   │   └── Camera dot: size-1.5 rounded-full bg-[#3a3a3d]
│   └── Screenshot: object-cover object-position center-bottom
├── Side buttons left: 3 divs rounded-l-full bg-[#3a3a3d] w-[3px]
└── Side button right: 1 div rounded-r-full bg-[#3a3a3d] w-[3px]
```

Shadow: `0 30px 80px -30px rgba(10,46,46,0.55), 0 8px 24px -8px rgba(0,0,0,0.45)`
Floor shadow: `bg-primary-dark/40 blur-2xl opacity-30 rounded-[50%]`

| Size | Mobile | sm | md | lg |
|---|---|---|---|---|
| `sm` | 180×380 | 210×440 | 220×460 | — |
| `md` | 210×440 | 240×500 | 260×540 | — |
| `lg` | 240×500 | 270×560 | 290×600 | 300×620 |

---

## 10. Estrutura de Seções (App.tsx)

```tsx
<Navbar />
<Hero />              // bg: hero
<About />             // #about — bg: soft
<Features />          // #features — bg: soft
<AppShowcase />       // #app — bg: dark
<WasteTypes />        // #waste-types — bg: soft
<Sustainability />    // bg: soft
<Impact />            // #impact — bg: soft
<Stats />             // bg: soft
<TechStack />         // #tech — bg: dark
<Team />              // #team — bg: soft
<CTA />               // bg: dark
<Footer />            // bg: dark gradient
```

---

## 11. Navegação (constants/navigation.ts)

```ts
navLinks: [
  { id: 'about',       label: 'O Projeto',       href: '#about' },
  { id: 'features',    label: 'Funcionalidades',  href: '#features' },
  { id: 'app',         label: 'Aplicativo',       href: '#app' },
  { id: 'waste-types', label: 'Resíduos',         href: '#waste-types' },
  { id: 'impact',      label: 'Impacto',          href: '#impact' },
  { id: 'tech',        label: 'Stack',            href: '#tech' },
  { id: 'team',        label: 'Equipe',           href: '#team' },
]

footerLinks: {
  produto:  ['Sobre', 'Funcionalidades', 'Aplicativo', 'Roadmap'],
  recursos: ['Documentação', 'API', 'Changelog', 'Status'],
  empresa:  ['Equipe', 'Impacto', 'Contato', 'Privacidade'],
}
```

---

## 12. State Management (Zustand)

```ts
interface UiModelState {
  isMobileMenuOpen: boolean;
  activeSection: string;     // scroll spy
  scrollProgress: number;    // 0–1
  hasScrolled: boolean;      // navbar background trigger
}
```

ViewModels: `useNavbarViewModel`, `useStatsViewModel` (animated counters), `useWasteTypesViewModel` (tab selection).

---

## 13. Tipografia — Escala Responsiva

### Hero title
```
text-2xl → xs:text-4xl → sm:!text-[3.75rem] → md:!text-[4.75rem] → lg:!text-[5.5rem] → xl:!text-[6.25rem]
leading-[0.92]–[0.96] | tracking-tightest (-0.04em)
```

### Section titles (SectionHeader)
```
text-3xl → sm:text-4xl → md:text-5xl → lg:text-[3.25rem]
leading-[1.04] | tracking-tightest (-0.04em)
```

### Body
```
text-base → sm:text-lg | leading-relaxed (1.625) | text-gray-300
```

### Eyebrows
```
.chip → text-xs font-medium + glow dot
```

---

## 14. Gradientes Categóricos

### Waste Types

| Categoria | gradient | glow |
|---|---|---|
| Orgânico | `from-emerald-300 via-emerald-500 to-emerald-700` | `rgba(40,167,69,0.45)` |
| Reciclável | `from-sky-300 via-cyan-500 to-blue-700` | `rgba(38,140,140,0.45)` |
| Especial | `from-amber-300 via-orange-500 to-amber-700` | `rgba(255,193,7,0.45)` |
| Hospitalar | `from-rose-300 via-red-500 to-rose-700` | `rgba(220,53,69,0.45)` |

### Tech Stack Icons

| Tech | gradient |
|---|---|
| React Native / ReactJS | `from-sky-400 to-cyan-500` |
| Expo | `from-zinc-700 to-zinc-950` |
| TypeScript | `from-blue-500 to-blue-700` |
| Zustand | `from-amber-400 to-orange-500` |
| Yup | `from-purple-500 to-fuchsia-600` |
| React Query | `from-rose-400 to-red-600` |
| SQLite | `from-slate-500 to-slate-700` |
| Tailwind | `from-cyan-400 to-sky-600` |
| Node.js | `from-emerald-500 to-green-700` |
| NestJS | `from-rose-500 to-red-700` |

---

## 15. Hover & Transition Patterns

```
hover:-translate-y-px   → micro-lift (buttons)
hover:-translate-y-1    → card lift
hover:brightness-105    → primary button
hover:brightness-110    → dark button
hover:bg-white          → ghost button solid
hover:bg-primary-dark/5 → outline button

group-hover:scale-[1.03] → card image zoom sutil
group-hover:scale-[1.06] → card image zoom agressivo
group-hover:-translate-y-2 → card lift extra

shadow-soft → hover:shadow-elevated (cards)

transition-all duration-300  (default)
transition-all duration-500  (glass cards)
```

---

## 16. Conteúdo / Copy

### Brand (constants/brand.ts)
```ts
name:      'EcoAmazônia'
shortName: 'Eco'
tagline:   'Tecnologia que transforma a cidade em ecossistema.'
legalName: 'EcoAmazônia · Projeto Integrador'
domain:    'ecoamazonia.app'
```

### Hero (constants/hero.ts)
```ts
title: 'A floresta começa na sua rua.'
subtitle: 'Um aplicativo aberto para registrar focos de resíduos urbanos e transformar consciência ambiental em coleta orientada — em tempo real.'
primaryCta:   'Ver aplicativo'    → #app
secondaryCta: 'Ver como funciona' → #features
ambient.live:     '27 cidades ativas'
ambient.resolved: 'Av. Constantino · 36h'
```

### KPIs (constants/stats.ts)

| value | suffix | label | sub |
|---|---|---|---|
| 12480 | `+` | Pontos mapeados | cidadãos ativos |
| 32 | — | Cidades-piloto | em 5 estados |
| 24 | `h` | Tempo médio de resposta | após registro |
| 42 | `%` | Redução de focos | em áreas críticas |

### Features (6 cards)
`register` (camera), `offline` (wifi-off), `map` (map), `monitor` (activity), `notify` (bell), `dashboard` (layout-dashboard)

### App Screens (4 telas)
`home` (Dashboard), `register` (Reportar), `map` (Mapa), `occurrences` (Ocorrências)

### About Pillars (4)
`tech` (cpu), `access` (accessibility), `impact` (leaf), `data` (line-chart)

### Sustainability Pillars (3)
`water` (−42% em focos), `air` (+3,2x agilidade), `biodiversity` (24h resposta)

### Impact Steps
`01 Captura → 02 Sincronização → 03 Análise → 04 Ação`

### Tech Stack Domains

| # | Domain | Arch | Techs |
|---|---|---|---|
| 01 | Mobile | MVVM | RN, Expo, TS, Zustand, Yup, React Query, SQLite, Tailwind |
| 02 | Backend | DDD | Node.js, NestJS, TypeScript |
| 03 | Web | Modular | ReactJS, TS, Tailwind, Zustand, Yup, React Query |

---

## 17. Equipe (constants/team.ts)

| Nome | Roles | Tracks | GitHub |
|---|---|---|---|
| Gabriel Mota | UX/UI · Mobile Lead, Front-end Web | design, mobile, web | bielmotaa |
| Dave Songnata | Web Lead, Backend Lead | web, backend | DaveSongnata |
| Davi Brasil | Mobile Engineer | mobile | Davibrasil05 |
| Thiago Massa | Web Engineer | web | — |
| Raymond | Backend Engineer | backend | RayStackDev |
| Victor Matthaus | Backend Engineer | backend | — |
| Enzo | Backend Engineer | backend | enzoleiva07 |

Team Track tabs: `UX/UI · Design` (sparkles), `Mobile` (smartphone), `Web` (globe), `Backend` (server)

---

## 18. Assets

### Screenshots (src/assets/screenshots/)
```
screen-home.jpeg, screen-maps.jpeg, screen-resgiter.jpeg,
screen-my-occurrences.jpeg, screen-info-organico.jpeg,
screen-info-reciclaveis.jpeg, screen-info-lixo-especiais.jpeg,
screen-info-my-occurrences.jpeg, screen-infos-register.jpeg,
screen-profile.jpeg, screen-slide.png
```

### Team Photos (src/assets/team/)
```
Gabriel-Mota.jpeg, Dave-Songnata.jpeg, Davi-Brasil.png,
Enzo-leiva.jpeg, Raymond-Lugo.jpeg, Thiago-Massa.png, Victor-Matthaus.png
```

### Logo
```
src/assets/logo/logosemfundo.png  (transparente)
public/logo.png                    (favicon/og)
public/favicon.svg
```

### Icons customizados (public/icons/)
```
yup.svg, zustand.svg
```

Todos os demais vêm do `lucide-react`.

---

## 19. Meta & SEO

```html
<html lang="pt-BR">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0A2E2E">
<meta name="description" content="EcoAmazônia — Plataforma inteligente para registrar, monitorar e combater o acúmulo irregular de resíduos em áreas urbanas da Amazônia.">
<meta property="og:title" content="EcoAmazônia · Tecnologia que transforma a cidade em ecossistema">
<meta property="og:description" content="Mapeie, registre e monitore áreas afetadas por resíduos. Uma plataforma offline-first construída para a Amazônia.">
<meta property="og:type" content="website">
<title>EcoAmazônia · Monitoramento Urbano Sustentável</title>
```

---

## 20. Estrutura de Diretórios

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── assets/
│   ├── logo/logosemfundo.png
│   ├── screenshots/          (11 screenshots)
│   └── team/                 (7 fotos)
├── components/
│   ├── layout/               Navbar.tsx, Footer.tsx
│   ├── mockups/              PhoneFrame.tsx, Screenshot.tsx
│   ├── sections/             Hero, About, Features, AppShowcase, WasteTypes,
│   │                         Sustainability, Impact, Stats, TechStack, Team, CTA
│   └── ui/                   Background, BrandIcons, Button, Container,
│                             GlassCard, Logo, SectionHeader
├── constants/                brand, colors, navigation, hero, about, features,
│                             appScreens, wasteTypes, sustainability, stats,
│                             techStack, team, cta, assets
├── models/UiModel.ts
├── stores/uiStore.ts
├── types/index.ts
├── utils/cn.ts, motion.ts
└── viewmodels/               useNavbarViewModel, useStatsViewModel,
                              useWasteTypesViewModel
```

---

## 21. CTA & Contatos (constants/cta.ts)

```ts
contacts: [
  { name: 'Gabriel Mota',  phone: '+55 92 99453-6158', wa: '5592994536158' },
  { name: 'Dave Songnata', phone: '+55 92 9446-6994',  wa: '559294466994' },
]

footerContent.copyright: 'Todos os direitos reservados - Gabriel Mota'
footerContent.newsletterTitle: 'Receba novidades do projeto'
```

---

*Extraído do source code real do repositório `bielmotaa/landign-page-eco-amazonia` em maio/2026.*
