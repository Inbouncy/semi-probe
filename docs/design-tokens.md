# SemiProbe Design Tokens

Extracted from Figma `hncStujO2oDCc3Q4Wvlrrw` via the Figma MCP (`get_variable_defs`, `get_design_context`). Values are verbatim from the file, not inferred from screenshots.

## Typeface

**Mulish** throughout. No secondary family — the design carries its hierarchy entirely on weight, which is unusual and worth preserving faithfully.

| Weight | Shopify handle | Used for |
|---|---|---|
| ExtraLight 200 | `mulish_n2` | H1 |
| Light 300 | `mulish_n3` | Hero body copy |
| Regular 400 | `mulish_n4` | Body default |
| SemiBold 600 | `mulish_n6` | Buttons, stat line, labels |
| Bold 700 | `mulish_n7` | Eyebrow |

> ⚠️ **Unverified:** Mulish must exist in Shopify's font library for the `font_picker` settings to resolve. `snippets/fonts.liquid` relies on `settings.type_*_font | font_url`, so an invalid handle yields no custom font (it falls back silently rather than erroring). Confirm Mulish appears in the theme editor's font picker before setting these.

The live theme currently runs **Inter** 400/500/700 with **Bricolage Grotesque** accent — stock Horizon, unrelated to this design.

## Color

| Figma variable | Value | Role |
|---|---|---|
| `color/core/white` | `#ffffff` | Page and card ground |
| `color/core/dark` | `#23252c` | Dark bands, headings |
| `color/core/body` | `#55585d` | Body copy, stat line |
| `color/accent/orange` | `#e59a2a` | Primary CTA fill |
| — orange hover | `#de8b24` | Primary CTA hover |
| `color/accent/maroon` | `#661320` | Secondary CTA fill, outline border |
| — maroon hover | `#4d0e18` | Secondary CTA hover |
| `color/neutral/300` | `#cccccc` | Dividers, card borders |
| `color/neutral/500` | `#b0afaf` | Eyebrow text |
| `color/neutral/600` | `#a09f9f` | Muted captions |
| `radius/pill` | `24px` | All buttons |

The live theme's palette is stock Horizon — every color across all seven schemes is black, white or grey, with `#1d3686` appearing once as a border. **The two systems have nothing in common.** New schemes are required.

## Buttons

Three variants, all `border-radius: 24px`, padding `12px 22px`, label Mulish SemiBold 14px / line-height 20px, labels rendered **uppercase**.

| Variant | Fill | Label | Border | Hover |
|---|---|---|---|---|
| **Primary** (`218:385`) | `#e59a2a` | white | none | fill → `#de8b24` |
| **Secondary** (`218:397`) | `#661320` | white | none | fill → `#4d0e18` |
| **Outline** (`218:403`) | `#ffffff` | `#661320` | 1px `#661320` | fill → maroon, label → white |

Secondary carries an **optional trailing arrow** (12×12 SVG, 8px gap) — used on the product family cards ("VIEW PRODUCT →").

### Mapping to Horizon

`blocks/button.liquid` exposes three `style_class` options: `button`, `button-secondary`, `link`.

| Figma | Horizon | Source of color |
|---|---|---|
| Primary | `button` | scheme `primary_button_*` |
| Secondary | `button-secondary` | scheme `secondary_button_*` |
| Outline | **none — needs a 4th option** | derive from `--color-secondary-button-background` |

Add `button-outline` to the `style_class` select plus a scoped CSS rule. Additive schema change, keeps the variant client-selectable in the editor.

## Hero type scale (`68:3027`)

| Element | Font | Size / line-height | Color |
|---|---|---|---|
| Eyebrow "SemiProbe Online Store" | Mulish Bold 700 | 12 / 18 | `#b0afaf` |
| H1 "Semiconductor Probing Accessories" | Mulish **ExtraLight 200** | 50 / 60 | `#23252c` |
| Body paragraph | Mulish Light 300 | 16 / 28 | `#23252c` |
| Stat line "8 Product Families · 57 Configurations" | Mulish SemiBold 600 | 14 / 22 | `#55585d` |

Section padding `72px` top / `82px` bottom / `80px` sides. Hero row `gap: 64px`, vertically centered. Content column `690px`; media `520×360`, `border-radius: 8px`, `object-fit: cover`. CTA row `gap: 14px`.

## Layout

| | Desktop 1440 | Tablet 1024 | Mobile 390 |
|---|---|---|---|
| Page gutter | 80 | 48 | 24 |
| Content width | 1280 | 928 | 342 |
| Header height | 134 | 134 | 110 |

### Grids

| Section | Desktop | Tablet | Mobile |
|---|---|---|---|
| Product Families | 4 × 2 · card 305×450 · gap 20/25 | 2 × 4 · card 455×410 · gap 18 | 1 × 8 · card 342×420 · gap 16 |
| Why SemiProbe | 4 × 1 · card 300×280 · gap 22 | 2 × 2 · card 455×250 · gap 18 | 1 × 4 · card 342×250 · gap 16 |
| Applications | 3 × 2 · card 410.67×410 · gap 24 | 2 × 3 · card 455×410 · gap 18 | 1 × 6 · card 342×420 · gap 16 |
| Hero | 2-col 690/520 | **2-col** 500/396 | stacked, image 342×240 |
| Inquiry form | 2-col 730/510 | **2-col** 570/~340 | stacked |

Mobile Product Families is a **vertical stack, not a carousel** — the Figma is explicit.

### Breakpoints

Horizon's own breakpoint is `750px` (used throughout `base.css`). The design implies a second break near `1100px` for the 4→2 column shifts. Use Horizon's 750 for mobile and add one project breakpoint at 1100 rather than inventing a third system. Prefer `repeat(auto-fit, minmax(…, 1fr))` so grids degrade between the three designed widths.

## Hero image

The Figma hero is a full probe-station photograph (SA-12 system with monitors and instrument rack). **Nothing in the Shopify catalog matches it** — the catalog holds isolated component shots only. Closest existing asset is `manipulator_joystick.jpg` (5086×3491) as a working stand-in.

Required output: `1040×720` (2× of 520×360), WebP with JPEG fallback. Marketing asset → Shopify Files, **not** product media.

## Logos

| Asset | Figma node | Required |
|---|---|---|
| Brand/Logo | `211:19` | 278×45, SVG |
| Brand/Logo Inverse | `211:20` | 212×34, SVG |

> ⚠️ **Not yet obtained.** Figma asset URLs are blocked by the container network policy. Both nodes also report embedded raster `rawImages`, which suggests the Figma logo is a **placed bitmap rather than vector paths** — in which case an SVG export would just wrap a PNG. The canonical vector logo should come from SemiProbe directly.

## Images still required

| Asset | Count | Output size | Note |
|---|---|---|---|
| Hero | 1 | 1040×720 | Nothing comparable in catalog |
| Applications editorial | 6 | 720×224 | None exist — largest gap |
| Air Compressors card | 1 | 538×300 | Current file is 128×136, unusable |
| Probe Tips card | 1 | 538×300 | Current file is 234×242, marginal |

Two more need no new photography — just promoting a higher-resolution file already on the product to featured:

| Product | Current featured | Better existing file |
|---|---|---|
| Manual Manipulators | 400×257 | `MA9000_COAX_MB.jpg` 2902×1797 |
| Probe Arms | 400×370 | `3_KV_Triax.jpg` 3256×2177 |

Both are store-scoped edits that change live product pages — defer to launch.
