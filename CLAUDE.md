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

### Verifying rendered output

The storefront is password-protected and `shopifypreview.com` subdomains are not in the
environment's allowed domains, but `semiprobe.myshopify.com` is. So render verification goes
through the storefront password on the allowed host, not through a share-preview link:

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
curl -sS -o /dev/null -c cj.txt -b cj.txt -A "$UA" https://semiprobe.myshopify.com/password
curl -sS -o /dev/null -c cj.txt -b cj.txt -A "$UA" \
  --data-urlencode form_type=storefront_password \
  --data-urlencode "utf8=✓" \
  --data-urlencode "password=$STOREFRONT_PASSWORD" \
  https://semiprobe.myshopify.com/password
curl -sS -o staging.html -L -c cj.txt -b cj.txt -A "$UA" \
  "https://semiprobe.myshopify.com/?preview_theme_id=148248461430"
```

Confirm the response is the staging theme by checking `Shopify.theme` in the HTML for
`"id":148248461430` and `"role":"unpublished"`.

**The password is never committed.** Ask the user for it, or read it from Online Store →
Preferences → Password protection.

Network access is **Limited**, allowing `www.figma.com`, `semiprobe.myshopify.com`,
`shopifypreview.com` (exact host only — subdomains are not matched) and
`fonts.googleapis.com`. The allowlist matches exact hostnames, not subdomains.

### Verified token state (staging, 2026-10-12)

Read back from the rendered page, not assumed:

| | |
|---|---|
| `--font-heading--family/weight` | `Muli` / **200** |
| `--font-body--family/weight` | `Muli` / **300** |
| `--font-subheading--family/weight` | `Muli` / **600** |
| `--font-accent--family/weight` | `Muli` / **700** |
| `--font-size--h2` | `2.5rem` = 40px — exactly the design |
| `--font-size--h1` | `clamp(2.75rem, 4.8vw, 3rem)` = 44–48px; hero H1 needs 50px pinned on its block |
| primary button | `#e59a2a`, radius 24px, uppercase, weight 600 |
| secondary button | `#661320`, radius 24px, uppercase, weight 600 |

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
