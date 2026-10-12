// Run with: node tests/smoke.cjs (Node 18+; no dependencies).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const text = file => fs.readFileSync(path.join(root, file), "utf8");
const handlers = {}, elements = {}, saved = {};
const page = {
  getElementById(id) { return elements[id] || (elements[id] = {innerHTML: ""}); },
  querySelectorAll() { return []; },
  addEventListener(type, fn) { handlers[type] = fn; }
};
const sandbox = {
  window: {},
  document: page,
  localStorage: {
    getItem(k) { return saved[k] || null; },
    setItem(k, v) { saved[k] = v; }
  }
};
vm.runInNewContext(text("data/shop-data.js"), sandbox, {filename: "shop-data.js"});
const {items, offers, shops} = sandbox.window.ZR_DATA;
assert.equal(shops.length, 5);
assert.equal(offers.length, 77);
assert.equal(items.length, 52); // one native sprite tile per unique item
assert.deepEqual(Array.from(items.map(item => item.iconIndex)),Array.from({length:52},(_,i)=>i));
assert.equal(new Set(offers.map(x => x.id)).size, offers.length);
const knownItems = new Set(items.map(x => x.id));
for (const o of offers) {
  assert(knownItems.has(o.item), "Unknown item: " + o.item);
  assert(shops.some(s => s.id === o.shop), "Unknown shop: " + o.shop);
  assert(o.price === null || (Number.isFinite(o.price) && o.price >= 0), "Bad price");
  assert(Number.isFinite(o.quantity) && o.quantity > 0, "Bad quantity");
}
const relocate = item => offers.filter(o => o.item === item).map(o => o.shop);
assert.deepEqual(Array.from(relocate("purple_reloc_alt")).sort(), ["Alliance", "Diamond", "VIP"]);
assert.deepEqual(Array.from(relocate("blue_reloc_flag")).sort(), ["Alliance", "Diamond"]);
const universal = offers.filter(o => o.item === "universal_1h").map(o => o.shop).sort();
assert.deepEqual(Array.from(universal), ["Trial", "VIP"]);
assert(offers.some(o => o.item === "fighter_part" && o.shop === "Alliance" && o.evidence === "reported"));
const gates = offers.filter(o => o.shop === "VIP" && o.minVip !== null).map(o => o.minVip).sort((a,b) => a-b);
assert.deepEqual(Array.from(gates), [8, 9, 10, 11]);
const official = Object.fromEntries(items.map(item => [item.id,item]));
assert.equal(official.hero_gold.name, "UR Omni Hero Shard");
assert.equal(official.gold_ticket.name, "Recruit Card");
assert.equal(official.orange_chest.name, "UR Decoration Chest");
assert.equal(official.orange_map.name, "UR Gear Blueprint");
assert.equal(official.fancy_chest.name, "Mythic Trial Chest");
assert.equal(official.card_10k.name, "Combat Chip");
assert.equal(official.logs.name, "Conductive Crystal");
assert.equal(official.purple_coil.name, "Composite Material");
assert.equal(official.blue_hex.name, "Heat-Resistant Gold");
assert.equal(official.hero_purple.name, "Toxina Shard");
assert.equal(official.blue_ticket.name, "Survivor Recruit Ticket");
assert.equal(official.honor_blue_crate.name, "UR Resource Selection Chest");
assert.equal(official.purple_resource_crate.name, "SSR Resource Selection Chest");
assert.equal(official.blue_crate_small.name, "Resource Chest");
assert.equal(official.fighter_chest_3.name, "Lv.3 Fighter Component Chest");
assert.equal(offers.find(o => o.item === "card_10k" && o.shop === "Trial").quantity, 10000);
const stamina = offers.find(o => o.item === "dark_cans_10" && o.shop === "VIP");
assert.equal(official.dark_cans_10.name, "10 Stamina");
assert.equal(stamina.price, 36);
assert.equal(stamina.evidence, "reported");
assert.equal(offers.filter(o => o.item === "dark_cans_10").length, 1);
const vip8 = offers.find(o => o.item === "vip_3h" && o.shop === "VIP");
assert.equal(vip8.price, 192);
assert.equal(vip8.minVip, 8);
assert.equal(official.vip_3h.name, "3-hr Speedup");
assert.equal(offers.find(o => o.item === "metal_disc" && o.shop === "Trial").quantity,1000);
assert.equal(offers.find(o => o.item === "logs" && o.shop === "VIP").price,64);
assert.equal(offers.find(o => o.item === "logs" && o.shop === "Alliance").price,800);
assert.equal(official.build_1h.speedupMinutes,60);
assert.equal(official.build_8h.speedupMinutes,480);
assert.equal(official.speed_5m.speedupMinutes,5);
assert.equal(official.vip_3h.speedupMinutes,180);
assert.equal(official.universal_1h.speedupMinutes,60);
assert.equal(official.universal_8h.speedupMinutes,480);
assert.equal(items.filter(i => i.speedupMinutes != null).length,12);
assert.equal(official.shield_24h.speedupMinutes,null);
assert.equal(official.dark_cans_10.speedupMinutes,null);

vm.runInNewContext(text("assets/app.js"), sandbox, {filename: "app.js"});
const rendered = () => elements.workspace.innerHTML;
assert.match(rendered(), /Fighter Parts/);
assert.match(rendered(), /class="item-icon"/);
assert.match(rendered(), /class="currency-icon"/);
assert.match(rendered(), /500/); // 400 VIP diamonds / 800 honor medals * 1000
const tab = name => handlers.click({
  target: {closest(selector) { return selector === "[data-tab]" ? {dataset: {tab:name}} : null; }}
});
tab("rankings");
assert.match(rendered(), /Best value by currency/);
assert.match(rendered(), /<th>Currency<\/th>/);
assert.match(rendered(), /class="item-icon"/);
handlers.change({target:{id:"rank-shop",value:"Honor",dataset:{}}});
assert.match(rendered(), /Fighter Parts/);
const wideClasses=new Set();
elements["app-container"]={classList:{toggle(name,enabled){
  if(enabled)wideClasses.add(name); else wideClasses.delete(name);
}}};
tab("wide");
assert(wideClasses.has("wide-layout"),"Wide tab should expand container to viewport width");
assert.match(text("index.html"), /id="app-container"/);
assert.match(text("assets/style.css"), /\.container\.wide-layout\s*\{/);
assert.match(rendered(), /id="wide-scroll"/);
assert.match(rendered(), /Wide price table/);
assert.match(rendered(), /id="wide-table"/);
assert.match(rendered(), /id="wide-download"/);
for (const label of ["Diamonds / min","Alliance coins / min","Trial medals / min"]) {
  assert(rendered().includes(label),"Missing currency-specific rate header: "+label);
}
assert.equal((rendered().match(/data-wide-sort=/g)||[]).length,4);
assert.equal((rendered().match(/data-wide-item=/g)||[]).length,52);
for (const label of ["Alliance coins","Diamond shop","VIP shop","Trial medals","Honor medals"]) {
  assert(rendered().includes(label), "Missing original shop column "+label);
}
const getWideRow = item => rendered().split('data-wide-item="'+item+'"')[1]?.split('</tr>')[0] ?? "";
const wideCells = item => [...getWideRow(item).matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m=>m[1]);
const heroWideRow=getWideRow("hero_gold");
assert(heroWideRow,"Missing UR Omni Hero Shard");
assert.equal(wideCells("hero_gold").length,8); // 5 shop columns + 3 rate columns
assert(heroWideRow.includes("3,000") && heroWideRow.includes("VIP 11 · locked"));
assert(heroWideRow.includes("wide-empty") && heroWideRow.includes('wide-amount mono">200'));
const c1=wideCells("build_1h"), c8=wideCells("build_8h");
assert(c1[6].includes('>15</span>') && c1[6].includes('aria-label="Alliance coins"'),
  "1-hour construction costs 15 Alliance coins/min");
assert(c8[6].includes('>12.5</span>'),"8-hour construction costs 12.5 Alliance coins/min");
assert(c1[5].trim()==="—" && c1[7].trim()==="—","Absent currency rates should be blank");
const fiveMinute=wideCells("speed_5m");
assert(fiveMinute[5].includes('>1.6</span>') && fiveMinute[5].includes('aria-label="Diamonds"'),"5-minute speedup diamond rate");
assert(fiveMinute[6].includes('>15</span>') && fiveMinute[6].includes('aria-label="Alliance coins"'),"5-minute speedup Alliance rate");
assert.equal(fiveMinute[7].trim()==="—",true);
const oneHour=wideCells("universal_1h");
assert(oneHour[5].includes('>1.2</span>') && oneHour[7].includes('>8.333</span>'),"Universal 1h rate comparisons");
const threeHour=wideCells("vip_3h");
assert(threeHour[5].includes('>1.067</span>') && threeHour[5].includes('VIP 8 (locked)'),
  "VIP 8 3-hour speedup rate and gate");
for(const notSpeedup of ["shield_8h","dark_cans_10"]){
  assert(wideCells(notSpeedup).slice(5).every(cell=>cell.trim()==="—"),"Non-speedup rate cells must be blank");
}
const fighterWideRow=getWideRow("fighter_part");
assert(fighterWideRow.includes("reported price"));
assert(getWideRow("card_10k").includes("for 10,000 units"));
for (const lvl of [8,9,10]) assert(rendered().includes("VIP "+lvl+" · locked"));
// Simulate the browser replacing the scroller node when innerHTML changes.
let currentHTML=elements.workspace.innerHTML, focusPreserved=false, lastPageScroll=null;
Object.defineProperty(elements.workspace,"innerHTML",{
  configurable:true,
  get(){return currentHTML;},
  set(html){
    currentHTML=html;
    elements["wide-scroll"]={scrollTop:0,scrollLeft:0};
    elements["wide-table"]={querySelector:()=>({focus:opts=>{focusPreserved=opts.preventScroll===true;}})};
  }
});
elements["wide-scroll"]={scrollTop:176,scrollLeft:292};
sandbox.window.scrollY=685;
sandbox.window.scrollX=0;
sandbox.window.scrollTo=opts=>{lastPageScroll=opts;};
const visibleRows = () => [...rendered().matchAll(/data-wide-item="([^"]+)"/g)].map(m=>m[1]);
const clickSort=key => handlers.click({target:{closest(selector){
  return selector==="[data-wide-sort]" ? {dataset:{wideSort:key}}:null;
}}});
clickSort("alliance");
assert.equal(elements["wide-scroll"].scrollTop,176,"Vertical scroll position should survive sorting");
assert.equal(elements["wide-scroll"].scrollLeft,292,"Horizontal scroll position should survive sorting");
assert.equal(lastPageScroll.top,685,"Page scroll position should survive sorting");
assert(focusPreserved,"Sorting should restore focused header without scrolling it into view");
assert(rendered().includes('aria-sort="ascending"'));
assert.equal(visibleRows()[0],"build_8h"); // 12.5 coins/min, first of tied 8h speeds
assert(wideCells(visibleRows().at(-1)).slice(5).every(cell=>cell.trim()==="—"),"No-rate items must sort last");
clickSort("alliance");
assert(rendered().includes('aria-sort="descending"'));
assert.equal(visibleRows()[0],"build_1h"); // 15 coins/min, first of tied 1h speeds
clickSort("diamonds");
assert.equal(visibleRows()[0],"universal_8h"); // 1 diamond/min
assert(rendered().includes('data-wide-sort="diamonds"'));
clickSort("trial");
assert.equal(visibleRows()[0],"universal_1h"); // 8.333 trial medals/min
tab("catalog");
assert(!wideClasses.has("wide-layout"),"Other tabs should use the narrower reading layout");
assert.match(rendered(), /Shop price catalog/);
assert.match(rendered(), /class="item-icon"/);
assert.match(rendered(), /VIP level-gated offers/);
assert.match(rendered(), /<th>VIP required<\/th>/);
for (const [level,price] of [[8,192],[9,64],[10,480],[11,300]]) {
  assert.match(rendered(), new RegExp("Requires VIP "+level));
  assert.match(rendered(), new RegExp("VIP "+level));
}
assert.equal((rendered().match(/class="catalog-vip-offer"/g)||[]).length,4);
for (const currency of ["Diamonds","Alliance coins","Trial medals","Honor medals"]) {
  assert(rendered().includes('aria-label="'+currency+'"'),"No icon for "+currency);
}
assert.match(rendered(), /<th>Currency<\/th>/);
tab("vip");
assert.match(rendered(), /VIP 11/);
assert.match(rendered(), /class="item-icon"/);
tab("data");
assert.match(rendered(), /Download JSON/);
console.log("ZR Shop Ledger smoke tests passed.");
