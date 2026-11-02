# Z Route: Redemption — Shop Value Analyzer

A dependency-free static web app for comparing the **Diamond**, **Alliance**, **VIP**, **Trial**, **Honor**, and **Devourer event** shops in Z Route: Redemption.

## Features

The interface has **three tabs**: **Wide table**, **Diamond calculator**, and **Combat Lab**. The four top-level statistic cards (shops tracked, shop offers, unique items, and VIP gates) have been removed. The Wide table opens by default, including for browsers that previously saved an older tab.

- **Wide table:** one item per row with six shop-specific price columns, screenshot-derived item/currency icons, known VIP gates, independently sortable speedup cost-per-minute figures, instant-rate parity, and normalized crystal-crafting costs. The table fills the viewport and preserves position while sorting.
- **Defeat the Devourers event:** 13 screenshot-observed offers priced in **Devourer coins**, including two 5-minute specialized speedups, 50-stone and 10-Research-Data bundles, and a sold-out 50 Stamina listing. The 1,904 displayed before each slash was the player’s balance (snapshot 14 Oct 2026), **not** an item price. The Wide table includes a sixth shop price column, a fourth independently sortable cost/min currency, and a fifth sortable points-per-currency option for each of the six Alliance Competition days. Seven new item icons and the event coin symbol come from screenshots. Limits are recorded but do not change theoretical points per coin; sold-out offers remain marked. Stamina consumption is modeled as 155 points per stamina on Day 1.
- **Base-scaled Hero EXP:** Base level selector (defaults to 21; levels 1–30) loads exact SR/SSR/UR chest yields from the datamined [CastleBox Hero EXP data](https://github.com/JeffxLabs/zrouteredemption/blob/main/data/hero_exp.json). The wide table displays EXP per chest and dynamically computes Day 4 Alliance Competition points and points per currency from **1 point per 650 EXP spent**, including configured research bonuses. A chest purchase/open does not itself award points. Selected Base level is saved locally and included in CSV headers.
- **Alliance Competition scoring:** six days with points per offer and points per currency, with five independent currency sort buttons per day. The event awards points on use, not purchase. Base task scores are from [Z Route Guide](https://zrouteguide.com/events/alliance-competition/event-guide/).
- **Alliance Competition research:** an optional collapsible section in the Wide table exposes levels for all 14 Alliance Competition research nodes. Eight score-boosting nodes have verified per-level values from the game-client [research dataset](https://github.com/JeffxLabs/zrouteredemption/blob/main/research/research_data.js). Levels 1–10 grant +5% per level (where documented), while **Points Buff has 20 levels**, and **Points Buff level 2 grants +10%**. Reward unlocks do not themselves change scoring; four late nodes have no published numeric benefit values and are recorded but not applied.
- **Green research increases:** bonus points, adjusted totals, and points-per-currency values update when levels change. Applicable documented bonuses are modeled as additive; server-side point rounding / stacking isn't verified. General Points Buff affects directly modeled activities (except diamond purchases). Speedup Points Buff affects eligible speedups, and Recruit Points Buff affects Hero recruitment (not Survivor recruitment). Other specialized nodes may affect game tasks not directly scored by catalog items and therefore are not misapplied to unrelated items.
- **Day-by-day details:** six reference summaries show base, research bonus, and projected adjusted points, with an item breakdown for each day. These scenarios assume *one unit of every eligible catalog item* on that day, ignore shop bundle quantities and stock, and are not an estimate of the user's personal weekly score. Daily totals are **not additive** because some items can be used on multiple days.
- **Diamond calculator:** instant completion modeling using the screenshot-fitted `ceil(180 × (remaining hours)^0.9)` curve, and available diamond-priced shop speedup alternatives.
- **Export:** the wide CSV includes Base-level Hero EXP per chest and the current research-adjusted scores and points-per-currency rates. Research levels, filters, and other previously saved local state persist via localStorage. Removing the old Compare, Rankings, Catalog, VIP, and Data tabs also removes their dedicated editing panels; legacy custom prices remain applied if already saved.

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
- The **Devourer event shop** uses Devourer coins and its reset or future availability are unknown. The displayed 50 Stamina offer had 0/3 remaining and cannot currently be redeemed; its 10-coin price is retained only for comparison. SSR Metal/Food/Oil Lv. Chests are treated as distinct from provisionally named VIP resource crates until exact identities can be established.
- The **VIP shop** is diamond-priced but weekly discounted; it isn't a separate currency. Source figures are not guaranteed to remain fixed after game updates.

## Data fields

`data/shop-data.js` holds `items` (stable IDs and labels), `offers` (`shop`, `currency`, `price`, `quantity`, `limit`, optional `minVip`, `evidence`, `source`), and `shops` (resets). Missing `price` means it could not be read, not zero. `reported` means not visually verified. `minVip=null` means *unknown*, not VIP 0.

The benchmark is the screenshot-observed Diamond item unit price (or best allowed VIP price). The comparison rate shown for another currency is: `benchmark diamond price per unit ÷ price in that currency per unit × 1000`. Matching names/items are required; items without a diamond benchmark cannot be scored unless the user supplies one. **No price ratio alone establishes which purchase is most useful for gameplay.**


## Combat Lab integration (1 Nov 2026)

The third tab embeds the dependency-free simulator in `combat/`; its full-page link is available when more room is useful. Matchups, boost entries and battle comparisons use a separate browser storage key from the shop tools. JSON export/import preserves the full matchup. Existing Combat Lab version-1 saves remain compatible.

Each squad supports named, enabled/disabled boost rows for decorations/statues, decor buffs, fighter buffs, individual fighter components, Hall of Fame, technology and hero gear. Target the entire squad, a faction, the front/back row, or a specific hero. HP/ATK/DEF accept flat values and percentages. Critical chance/damage accept percentage points; physical/radiation damage, damage reduction and cooldown speed accept percentages. These combat modifier stacking assumptions remain experimental.

Choose **fighter totals** or **individual fighter/component rows**. Only one contributes, preventing summary/component duplication. Fighter power is recorded for reference and is not converted into invented stats or damage. Gear procs and fighter attack skills are not simulated. For account boost rows, item levels/counts are notes and effects are entered. Configure Hero now also offers regular gear catalog items and levels with automatic stat calculation. Quick tech/decor totals and detailed rows are additive, so enter any given effect in only one place.

A per-hero breakdown shows base/entered stats, account percentages, separate flat boosts, and composed stats. Flat gear, decor and fighter values are outside the growth-percentage group, following recovered client display grouping. Lineup/talent combat stacking remains approximate. Final combat HP/ATK/DEF entry bypasses all account stat additions; crit, resistance and damage modifiers are separate inputs and still apply. Soldier-power conversion remains an adjustable hypothesis.

Recovered-source calculators and a browser for 646 historical monster records remain separate from the newer reference combat dataset. The site includes two anonymized battle summaries, with no screenshots or raw client code. The full authoritative damage formula has not been recovered; the simulator is not calibrated to produce accurate win probabilities.

Run both checks from this repository root:

```sh
node tests/smoke.cjs
node tests/combat.mjs
```

`master` was created from `main` at `a70b17bbb337ce5872dbbc91cc70ed795d1e464f` for this integration, as requested. The default branch and any GitHub Pages configuration are unchanged. To serve this branch with GitHub Pages, select `master` and the root directory in the repository's Pages settings.


## Configure Hero: skills and equipped gear (v0.4)

The hero dialog now includes editable skill levels, four gear slots (Weapon, Helmet, Scope, Bulletproof Vest), upgrade levels and Mythic promotions. A live preview uses the same `combatStats` function as the simulator for battle-start HP/ATK/DEF. Applying the dialog persists the complete configuration and invalidates any prior simulation result. JSON export/import includes it.

Entering a skill level chooses the recovered June `V202606032030` coefficients; the selector can restore the newer reference star-cap values. The two sources differ for several UR heroes, so the formula set stays visible. Thirty heroes have recovered coefficients; Aria UR is absent from that catalog and retains reference caps/custom coefficient support. Specialty skills capped at level 1 and locked skills are not presented as level-30 skills. Primary/secondary coefficients use the recovered formula; target counts, durations and timing still use sandbox assumptions. Passive ATK/DEF bonuses and modeled damage/resistance passives use the selected level, not the star cap. Custom damage overrides retain precedence.

Regular gear stats come from JeffxLabs `data/equipment.json` at revision `52e32f60ad85564b0dcf7c060b054054d2186bf3`, catalog `V202608062022`. Strengthening and promotion main effects use the selected total, while additional effects accumulate through completed milestones. The 16-item catalog has explicit available levels, with no extrapolation. Flat and percentage stats, crit chance/avoidance, physical/radiation/general resistance and countered bonuses flow into the model. Monster-only effects are excluded in PvP. Exclusive weapons, gear procs, server equipment gates and exact combat modifier stacking remain unverified/unmodeled.

For each hero, equipped catalog gear and manual account gear rows are alternative input sources. Catalog gear excludes those manual rows, preventing duplication. Final HP/ATK/DEF overrides bypass stat additions while separate crit/resistance effects remain. Provenance hashes for the gear and skill tables accompany matchup exports. Static module URLs are versioned and the hero dataset is revalidated on load so older cached data cannot break the new editor.
