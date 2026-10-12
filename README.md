# Z Route: Redemption — Shop Value Analyzer

A dependency-free static web app for comparing the **Diamond**, **Alliance**, **VIP**, **Trial**, and **Honor** shops in Z Route: Redemption.

## Features

- Compare 77 screenshot- and player-report-derived offers from five shops, with purchase limits, restock schedules, searchable catalog and evidence markers.
- Show **authentic Diamond, Alliance, Trial, and Honor currency icons** extracted from the game's screenshots in the comparison, value ranking and catalog currency columns; the Diamond and VIP shops use the same Diamond icon.
- Show **all four confirmed VIP-gated offers directly in the Full Catalog**, with required VIP levels and prices, even when the selected VIP level is insufficient. Gating is only known for VIP 8–11; earlier unlock requirements must not be guessed.
- Use the **Wide table** tab for a denormalized **one-row-per-item** view with separate **Alliance coins**, **Diamond shop**, **VIP shop**, **Trial medals**, and **Honor medals** price columns. Authentic currency icons appear in the column headers; item icons stay alongside the item names.
- The **Diamond calculator** tab estimates instant completion costs for active queues using the screenshot-fitted `ceil(180 × (remaining hours)^0.9)` model (six exact screenshot matches). It also compares diamond-priced shop speedups capable of covering the same queue, including the effects of overshooting and known VIP/stock restrictions. The different pre-start Upgrade Now price is not modeled.
- The **Wide table** adds a sortable **Instant-rate break-even** column: the **estimated duration where the average instant diamond price per minute falls to the shop speedup's diamonds/minute price**. For example, a VIP 5-minute boost at 8 diamonds (1.6 diamonds/minute) reaches rate parity around **22 days, 9 hours**. Below the threshold, the shop's cost per minute is lower; above it, instant completion is cheaper per minute. Unlike the calculator's separate "finish this queue with items" comparison, rate parity is NOT about buying a single speedup to complete a short timer. Alliance/Trial results require optional subjective diamond-conversion settings. Extremely long estimates extrapolate far beyond the observed 30-hour range and are not verified game behavior. The wide CSV exports these values.
- The **Wide table uses the full available browser width**, while the other tabs keep their narrower reading layout. Clicking a sortable header **preserves vertical table scroll, horizontal table scroll, and page position**, and returns focus to the sorted header without jumping.
- Search and filter that pivoted view, including the option to show only items sold in **two or more shops**. Locked VIP items remain visible with their required level. Missing listings show a dash; unknown prices are distinct; bundles show their quantity (e.g. 1,000 Refined Stones).
- The **Wide table** has three independently sortable normalized-speedup columns: **Diamonds / min** (Diamond + VIP offers), **Alliance coins / min**, and **Trial medals / min**. Click a column header for ascending numeric order; click it again for descending. Sorting uses the lowest listed unrounded cost per minute for that currency, keeps missing rates at the bottom, and retains VIP gate labels (including locked items). Multiple offers in one currency are separated and labeled by shop, with their currency icon after each value. Rates are shop price ÷ (quantity × speedup minutes); e.g. 900 Alliance coins / 60 minutes = **15 coins/min**. Shields, stamina and other non-speedups show a dash.
- **Download wide CSV** to export the currently filtered and sorted rows, including shop prices, quantities, required VIP level, and three separate columns for normalized **Diamonds / min**, **Alliance coins / min**, and **Trial medals / min**, plus **Instant-rate break-even**. Prices are listed per offer; rate columns are separate calculations, not currency exchange rates.
- Calculate **implied diamond purchasing power per 1,000 shop currency** from matching diamond-priced items; the **Value rankings** tab orders offers within each currency by that benchmark.
- Enter your own *subjective* diamond value per 1,000 Alliance / Trial / Honor currency units to see normalized costs and the least-expensive accessible shop. These are opportunity-cost assumptions, **not actual exchange rates**.
- Choose between the regular Diamond shop baseline or the cheapest eligible Diamond/VIP offer as the item reference price.
- Set VIP level to see known VIP unlock gates (VIP 8–11). Items without a displayed lock are **not** proven available at VIP 0.
- Edit benchmark prices, add new shop offers, download JSON data, and import them back. Edits stay in browser localStorage.
- All original screenshot observations are tagged. Item labels are marked provisional if the item name cannot be confidently identified from its icon.

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
