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
vm.runInNewContext(text("assets/app.js"), sandbox, {filename: "app.js"});
const rendered = () => elements.workspace.innerHTML;
assert.match(rendered(), /Fighter Parts/);
assert.match(rendered(), /class="item-icon"/);
assert.match(rendered(), /500/); // 400 VIP diamonds / 800 honor medals * 1000
const tab = name => handlers.click({
  target: {closest(selector) { return selector === "[data-tab]" ? {dataset: {tab:name}} : null; }}
});
tab("rankings");
assert.match(rendered(), /Best value by currency/);
assert.match(rendered(), /class="item-icon"/);
handlers.change({target:{id:"rank-shop",value:"Honor",dataset:{}}});
assert.match(rendered(), /Fighter Parts/);
tab("catalog");
assert.match(rendered(), /Shop price catalog/);
assert.match(rendered(), /class="item-icon"/);
tab("vip");
assert.match(rendered(), /VIP 11/);
assert.match(rendered(), /class="item-icon"/);
tab("data");
assert.match(rendered(), /Download JSON/);
console.log("ZR Shop Ledger smoke tests passed.");
