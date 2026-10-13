# Z Route: Redemption — Shop Value Analyzer

A dependency-free static web app for comparing the **Diamond**, **Alliance**, **VIP**, **Trial**, and **Honor** shops in Z Route: Redemption.

## Features

The interface has **only two tabs**: **Wide table** and **Diamond calculator**. The four top-level statistic cards (shops tracked, shop offers, unique items, and VIP gates) have been removed. The Wide table opens by default, including for browsers that previously saved an older tab.

- **Wide table:** one item per row with five shop-specific price columns, screenshot-derived item/currency icons, known VIP gates, independently sortable speedup cost-per-minute figures, instant-rate parity, and normalized crystal-crafting costs. The table fills the viewport and preserves position while sorting.
- **Alliance Competition scoring:** six days with points per offer and points per currency, with four independent currency sort buttons per day. The event awards points on use, not purchase. Base task scores are from [Z Route Guide](https://zrouteguide.com/events/alliance-competition/event-guide/).
- **Alliance Competition research:** an optional collapsible section in the Wide table exposes levels for all 14 Alliance Competition research nodes. Eight score-boosting nodes have verified per-level values from the game-client [research dataset](https://github.com/JeffxLabs/zrouteredemption/blob/main/research/research_data.js). Levels 1–10 grant +5% per level (where documented), while **Points Buff has 20 levels**, and **Points Buff level 2 grants +10%**. Reward unlocks do not themselves change scoring; four late nodes have no published numeric benefit values and are recorded but not applied.
- **Green research increases:** bonus points, adjusted totals, and points-per-currency values update when levels change. Applicable documented bonuses are modeled as additive; server-side point rounding / stacking isn't verified. General Points Buff affects directly modeled activities (except diamond purchases). Speedup Points Buff affects eligible speedups, and Recruit Points Buff affects Hero recruitment (not Survivor recruitment). Other specialized nodes may affect game tasks not directly scored by catalog items and therefore are not misapplied to unrelated items.
- **Day-by-day details:** six reference summaries show base, research bonus, and projected adjusted points, with an item breakdown for each day. These scenarios assume *one unit of every eligible catalog item* on that day, ignore shop bundle quantities and stock, and are not an estimate of the user's personal weekly score. Daily totals are **not additive** because some items can be used on multiple days.
- **Diamond calculator:** instant completion modeling using the screenshot-fitted `ceil(180 × (remaining hours)^0.9)` curve, and available diamond-priced shop speedup alternatives.
- **Export:** the wide CSV includes the current research-adjusted scores and points-per-currency rates. Research levels, filters, and other previously saved local state persist via localStorage. Removing the old Compare, Rankings, Catalog, VIP, and Data tabs also removes their dedicated editing panels; legacy custom prices remain applied if already saved.

## Run and deploy

No build tools or dependencies. Open `index.html` locally, or serve the root folder using any static HTTP server.

**GitHub Pages (not enabled through this app):** Repository → Settings → Pages → **Deploy from a branch** → `main` → `/ (root)` → Save. Once enabled, the app is at `https://8shanrahan2.github.io/Z-Route-Redemption-Analysis/`.

## Tooltip-confirmed names and quantity corrections (12 Oct 2026)

Additional in-game tooltip screenshots confirmed the official names **Recruit Card**, **Survivor Recruit Ticket**, **UR Omni Hero Shard**, **Mythic Trial Chest**, **Lv.3 Fighter Component Chest**, **Combat Chip**, **UR Gear Blueprint**, **UR Decoration Chest**, **Toxina Shard**, **Conductive Crystal**, **Composite Material**, **Heat-Resistant Gold**, **Refined Stone**, **Convoy Contract**, **Resource Chest**, **SSR Resource Selection Chest**, **UR Resource Selection Chest**, **3-hr Speedup**, and other tooltips.

- Trial Shop: **Combat Chip** displays a pack of **10,000 chips** for **1,000 Trial medals** (not one chip).
- VIP Shop: one **10 Stamina** item costs **36 diamonds**, per the user's report. The tooltip confirms the 10-stamina pack size; the purchase limit and price remain unverified by screenshot. The former duplicate stamina entry was merged.
- VIP 8: the user confirmed the **3-hr Speedup** costs **192 diamonds**, superseding the apparent '2h' text seen on a partly obscured icon.
- The player verified the crafting sequence: **4 Heat-Resistant Gold → 1 Composite Material**, **4 Composite Materials → 1 Conductive Crystal**. Same items from different shops are merged for meaningful price ratios.
- Four remaining labels are tentative: **Lv.1 Fighter Component Chest** and the three VIP resource crate names (Food, Oil, Metal). Other items still have unverified shop prices or purchase limits, as marked.

## Item icons

The site includes a lightweight **52-icon WebP sprite** at `assets/item-icons.webp` (23 KB), cropped from the user-provided shop screenshots. Each of the 52 current item records has an `iconIndex` in `data/shop-data.js`. The site uses the same item icon in **Compare value**, **Value rankings**, **Full catalog**, and **VIP unlocks**.

- Eight columns, 52 × 52 pixels per icon; icon `n` starts at `x = (n % 8) * 52` and `y = floor(n / 8) * 52`.
- The index is tied to the existing `itemRows` order; when adding an item, extend the sprite and maintain the index rather than reordering existing item entries.
- The two VIP locked generic speedup icons use screenshot-derived speedup art with a duration label (3h and 8h) to avoid using the padlock image as the item icon. These two are reconstructed **representations**, not literal unlocked-game screenshots.
- Unknown future items display a `?` fallback rather than reusing another item's art.
- Native Z Route: Redemption game art belongs to the original game's rights holders. This fan-made reference is not affiliated with the publisher.

## Smoke tests

Run `node tests/smoke.cjs` (Node 18+, no dependencies). Checks item integrity, cross-shop equivalences, VIP gates, all four currency icons, and the rendering of all seven app sections, including the 52-row denormalized price table, numeric ascending/descending cost-per-minute sorting by three separate currencies, full-width view state and both table scroll coordinates on sorting, VIP requirements, and bundle quantities. The UI/data smoke tests were also run using a JavaScript runtime against the GitHub-committed source.

## Sources and caveats

- Initial 10 shop-price screenshots and subsequent labeled tooltip screenshots provided by the user on October 12, 2026. The four currency symbols in `assets/currency-icons.webp` are crops from those same screenshots, and `assets/item-icons.webp` contains 52 item icons. Original shop screenshot codes in `data/shop-data.js`: D1=Diamond, A2–A4=Alliance, V5–V7=VIP, T8–T9=Trial, H10=Honor.
- A sold-out Alliance Fighter Part has **no visible price**. The 1,000 Alliance Coin price is a user-provided estimate / prior guide report, not verified in the screenshot. It is flagged `reported`.
- The VIP 8 (3-hr Speedup), VIP 9 (Conductive Crystal), VIP 10 (8-hr Speedup), VIP 11 (UR Omni Hero Shard) gates are established; others are unknown. The separately published [Japanese VIP guide](https://gamesakidori.com/z-route/vip-guide/) reports gated offerings between levels 4–11 but does not publish a complete unlock-to-item list.
- The [ZR Reference project](https://github.com/JeffxLabs/zrouteredemption) publishes progression data, but no canonical shop-price dataset as of the source review.
- Icon-only product identifications are intentionally tentative and should be corrected by in-game item-detail screenshots. **Similar-looking gold tickets and metal gears are different items**; do not merge them. Universal speedups are also tracked separately from construction/research/training speedups. Two relocation icons with visually matching designs are linked across Diamond and Alliance/VIP shops.
- The **VIP shop** is diamond-priced but weekly discounted; it isn't a separate currency. Source figures are not guaranteed to remain fixed after game updates.

## Data fields

`data/shop-data.js` holds `items` (stable IDs and labels), `offers` (`shop`, `currency`, `price`, `quantity`, `limit`, optional `minVip`, `evidence`, `source`), and `shops` (resets). Missing `price` means it could not be read, not zero. `reported` means not visually verified. `minVip=null` means *unknown*, not VIP 0.

The benchmark is the screenshot-observed Diamond item unit price (or best allowed VIP price). The comparison rate shown for another currency is: `benchmark diamond price per unit ÷ price in that currency per unit × 1000`. Matching names/items are required; items without a diamond benchmark cannot be scored unless the user supplies one. **No price ratio alone establishes which purchase is most useful for gameplay.**
