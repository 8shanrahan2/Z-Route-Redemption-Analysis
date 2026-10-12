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
vm.runInNewContext(text("assets/app.js"), sandbox, {filename: "app.js"});
const rendered = () => elements.workspace.innerHTML;
assert.match(rendered(), /Fighter part/);
assert.match(rendered(), /500/); // 400 VIP diamonds / 800 honor medals * 1000
const tab = name => handlers.click({
  target: {closest(selector) { return selector === "[data-tab]" ? {dataset: {tab:name}} : null; }}
});
tab("rankings");
assert.match(rendered(), /Best value by currency/);
handlers.change({target:{id:"rank-shop",value:"Honor",dataset:{}}});
assert.match(rendered(), /Fighter part/);
tab("catalog");
assert.match(rendered(), /Shop price catalog/);
tab("vip");
assert.match(rendered(), /VIP 11/);
tab("data");
assert.match(rendered(), /Download JSON/);
console.log("ZR Shop Ledger smoke tests passed.");
