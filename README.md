# SemiProbe Storefront — Shopify Horizon

Homepage build from the approved Figma design into the SemiProbe Shopify storefront.

| | |
|---|---|
| Store | `semiprobe.myshopify.com` |
| Base theme | Horizon |
| Staging theme | `148248461430` (unpublished) |
| Preview | https://semiprobe.myshopify.com/?preview_theme_id=148248461430 |

## Repository shape

This repo holds **only the theme files this project authors or modifies** — not a full Horizon mirror. Files are deployed to the staging theme with Shopify Admin GraphQL `themeFilesUpsert`.

```
assets/      static assets added by this project
blocks/      custom + modified theme blocks
config/      settings_data.json (color schemes, typography)
sections/    custom + modified sections
snippets/    shared markup extracted for reuse
templates/   index.json (homepage composition)
docs/        design tokens and build notes
```

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — build rules, environment, architecture, editability contract
- [`docs/design-tokens.md`](docs/design-tokens.md) — extracted Figma specification

## Non-negotiables

1. The live theme (`135210434678`) is never written to.
2. Publishing requires explicit approval each time.
3. The client must be able to edit all homepage content through the Theme Editor — no Liquid, CSS, JS or Git.
4. Navigation menus use `sp-` handles; `main-menu` is never touched, because menus are store-scoped and would change the live site.
