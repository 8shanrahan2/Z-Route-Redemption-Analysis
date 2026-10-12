# Z Route: Redemption — Shop Value Analyzer

A dependency-free static web app for comparing the **Diamond**, **Alliance**, **VIP**, **Trial**, and **Honor** shops in Z Route: Redemption.

## Features

- Compare 77 screenshot-derived offers from five shops, with purchase limits, restock schedules, searchable catalog and evidence markers.
- Calculate **implied diamond purchasing power per 1,000 shop currency** from matching diamond-priced items; the **Value rankings** tab orders offers within each currency by that benchmark.
- Enter your own *subjective* diamond value per 1,000 Alliance / Trial / Honor currency units to see normalized costs and the least-expensive accessible shop. These are opportunity-cost assumptions, **not actual exchange rates**.
- Choose between the regular Diamond shop baseline or the cheapest eligible Diamond/VIP offer as the item reference price.
- Set VIP level to see known VIP unlock gates (VIP 8–11). Items without a displayed lock are **not** proven available at VIP 0.
- Edit benchmark prices, add new shop offers, download JSON data, and import them back. Edits stay in browser localStorage.
- All original screenshot observations are tagged. Item labels are marked provisional if the item name cannot be confidently identified from its icon.

## Run and deploy

No build tools or dependencies. Open `index.html` locally, or serve the root folder using any static HTTP server.

**GitHub Pages (not enabled through this app):** Repository → Settings → Pages → **Deploy from a branch** → `main` → `/ (root)` → Save. Once enabled, the app is at `https://8shanrahan2.github.io/Z-Route-Redemption-Analysis/`.

## Smoke tests

Run `node tests/smoke.cjs` (Node 18+, no dependencies). Checks item integrity, cross-shop equivalences, VIP gates and the rendering of all five app sections. The UI/data smoke tests were also run using a JavaScript runtime against the GitHub-committed source.

## Sources and caveats

- 10 user-supplied game screenshots from October 12, 2026. Numbering in `data/shop-data.js` corresponds to the upload order (1=Diamond, 2–4=Alliance, 5–7=VIP, 8–9=Trial, 10=Honor).
- A sold-out Alliance Fighter Part has **no visible price**. The 1,000 Alliance Coin price is a user-provided estimate / prior guide report, not verified in the screenshot. It is flagged `reported`.
- The VIP 8 (2-hour speedup), VIP 9 (gray item), VIP 10 (8-hour speedup), VIP 11 (gold shard) gates are visible; others are unknown. The separately published [Japanese VIP guide](https://gamesakidori.com/z-route/vip-guide/) reports gated offerings between levels 4–11 but does not publish a complete unlock-to-item list.
- The [ZR Reference project](https://github.com/JeffxLabs/zrouteredemption) publishes progression data, but no canonical shop-price dataset as of the source review.
- Icon-only product identifications are intentionally tentative and should be corrected by in-game item-detail screenshots. **Similar-looking gold tickets and metal gears are different items**; do not merge them. Universal speedups are also tracked separately from construction/research/training speedups. Two relocation icons with visually matching designs are linked across Diamond and Alliance/VIP shops.
- The **VIP shop** is diamond-priced but weekly discounted; it isn't a separate currency. Source figures are not guaranteed to remain fixed after game updates.

## Data fields

`data/shop-data.js` holds `items` (stable IDs and labels), `offers` (`shop`, `currency`, `price`, `quantity`, `limit`, optional `minVip`, `evidence`, `source`), and `shops` (resets). Missing `price` means it could not be read, not zero. `reported` means not visually verified. `minVip=null` means *unknown*, not VIP 0.

The benchmark is the screenshot-observed Diamond item unit price (or best allowed VIP price). The comparison rate shown for another currency is: `benchmark diamond price per unit ÷ price in that currency per unit × 1000`. Matching names/items are required; items without a diamond benchmark cannot be scored unless the user supplies one. **No price ratio alone establishes which purchase is most useful for gameplay.**
