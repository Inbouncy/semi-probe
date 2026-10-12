# SemiProbe Storefront — Shopify Horizon Theme

Homepage build from the approved Figma design into the SemiProbe Shopify storefront.

## Hard rules

1. **Never write to the live theme.** Live is `gid://shopify/OnlineStoreTheme/135210434678` (Horizon, role `MAIN`). All development goes to the staging theme only.
2. **Never publish.** `themePublish` requires explicit approval from Ebarak Hossain (Inbouncy) on each occasion.
3. **Client editability is a hard requirement**, not a preference. See "Editability contract" below.
4. **Never append to `assets/base.css`.** It is 98 KB of Shopify-maintained code and is overwritten on theme upgrade. Use scoped `{% stylesheet %}` blocks inside each section or block — Horizon's own convention.
5. **Menus use `sp-` handles only.** Navigation is store-scoped, so creating `main-menu` would change the live storefront. Never create or edit `main-menu`.

## Environment

| | |
|---|---|
| Store | `semiprobe.myshopify.com` (Basic plan, USD, US-only market) |
| Live theme | `135210434678` — Horizon, `MAIN` — **read-only** |
| Staging theme | `148248461430` — "SemiProbe - Staging (Claude Build)", `UNPUBLISHED` |
| Preview | `https://semiprobe.myshopify.com/?preview_theme_id=148248461430` |
| Figma | `hncStujO2oDCc3Q4Wvlrrw` — pages `0:1` (Homepage), `211:2` (Components) |
| Deploy | Shopify Admin GraphQL `themeFilesUpsert` via the Shopify connector |

### Known environment limits

- `www.figma.com` and `semiprobe.myshopify.com` are **denied by the container network policy**. Figma asset downloads and storefront render verification are not possible from inside a session until that policy is widened. Figma MCP tools still work (they route through the MCP proxy); only direct HTTP to those hosts is blocked.
- Consequence: **visual QA must be performed by a human on the preview URL.** Do not claim a section renders correctly without a human confirming it.
- `fonts.googleapis.com` is reachable.

## Store/theme boundary

Theme-scoped changes are safe. Store-scoped changes appear on the **live** storefront immediately.

| Theme-scoped (safe) | Store-scoped (affects live) |
|---|---|
| `sections/`, `blocks/`, `snippets/`, `assets/` | Products, variants, images, descriptions |
| `templates/index.json` | Collections |
| `config/settings_data.json` | Navigation menus |
| `sections/header-group.json`, `footer-group.json` | Customers, discounts, metafields |

## Catalog facts

8 products, 57 variants, 2 collections. **Nothing needs to be created.** All eight Figma product families map 1:1 to existing products, and the variant counts already match the Figma labels exactly.

| Figma family | Product handle | Variants |
|---|---|---|
| Manual Manipulators | `manual-manipulators` | 21 |
| Programmable Manipulators | `programmable-manipulators` | 6 |
| Probe Arms | `probe-arms` | 6 |
| Wafer Chucks | `wafer-chucks` | 10 |
| Probe Tips | `probe-tips` | 8 |
| Packaged Part Holders | `packaged-part-holders` | 2 |
| Vacuum Pumps | `vacuum-pumps` | 2 |
| Air Compressors | `air-compressors` | 2 |

Cards link directly to product pages. **Do not create collections for these** — the catalog is already family-shaped.

## Editability contract

The client must be able to make normal homepage edits without touching Liquid, CSS, JavaScript or GitHub.

**Must be a Theme Editor setting:**
- every heading, eyebrow, body paragraph, button label and button link
- every image
- which products appear in the families grid, their order, display titles and descriptions
- FAQ questions *and* answers — add, remove, reorder
- application cards — add, remove, reorder
- section order, and show/hide per section
- color scheme and top/bottom padding per section

**Must NOT be exposed** (so it cannot be broken): grid math, card internals, breakpoints, font families, per-element padding.

**Every custom section MUST declare `presets`.** Without it, a section the client deletes cannot be re-added without a developer editing JSON.

Blocks get explicit `name` and sensible `limit` values so the editor reads clearly.

## Architecture

Four of the eight homepage sections are stock Horizon, configured rather than written:

| Section | Approach |
|---|---|
| Header | `sections/header.liquid` + two small insertion points (utility menu, CTA) |
| Hero | `sections/media-with-content.liquid`, preset `image_with_text` |
| Product Families | **new** `sections/semiprobe-product-families.liquid` + `product_family` block |
| Why SemiProbe | `sections/section.liquid`, preset `icons_with_text` |
| Applications | **new** `sections/semiprobe-applications.liquid` + `application` block |
| FAQ | `sections/section.liquid`, preset `faq_section` (+ `accordion`, `_accordion-row`) |
| Product Inquiry | **new** `sections/semiprobe-product-inquiry.liquid` |
| Footer | `sections/footer.liquid`, native blocks + 4 `sp-` menus |

**Zero new JavaScript.** Every interaction in the design is already implemented in Horizon (sticky header, predictive search, cart drawer, mobile drawer, accordion) or is pure CSS.

`header.liquid` is the only Shopify-maintained file we modify. Keep insertions minimal and clearly commented.

## Design tokens

See [`docs/design-tokens.md`](docs/design-tokens.md) for the full extracted specification — typeface, weights, per-element type scale, colors with hover states, button variants, spacing and breakpoints.

## Deploy

Theme files are authored here and pushed to the staging theme with `themeFilesUpsert`. This repo is the source of truth; the staging theme is a deployment target, not a workspace. If the two diverge, the repo wins.
