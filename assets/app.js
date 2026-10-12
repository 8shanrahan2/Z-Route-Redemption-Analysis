/* ZR Shop Ledger — no framework, no build step, no remote runtime dependencies. */
(() => {
  "use strict";
  const base = window.ZR_DATA;
  if (!base) { document.getElementById("workspace").textContent = "Shop dataset did not load."; return; }
  const storageKey = "zr-shop-ledger-v1";
  const defaults = {
    tab:"compare", selected:"fighter_part", vip:7, mode:"all", rankShop:"Alliance",
    rates:{Alliance:"",Trial:"",Honor:""}, manual:{},
    changes:{}, additions:[], shop:"All", search:"", category:"All",
    includeReported:true
  };
  let state = {...defaults};
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey)||"{}");
    state = {...defaults,...stored,rates:{...defaults.rates,...(stored.rates||{})},
      manual:stored.manual||{},changes:stored.changes||{},
      additions:Array.isArray(stored.additions)?stored.additions:[]};
  } catch(e) {}
  const q = id => document.getElementById(id);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g,
    ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const fmt = value => value == null || !Number.isFinite(value) ? "—" :
    Number(value).toLocaleString("en-US",{maximumFractionDigits:2});
  const fixed = value => value == null || !Number.isFinite(value) ? "—" :
    Number(value).toLocaleString("en-US",{maximumFractionDigits:1});
  const itemById = id => base.items.find(i=>i.id===id) || {id,name:id,category:"Other",confidence:"unidentified"};
  const shopById = id => base.shops.find(s=>s.id===id);
  const save = () => { try { localStorage.setItem(storageKey,JSON.stringify(state)); } catch(e) {} };
  const allOffers = () => [...base.offers,...state.additions].map(o => {
    const patch=state.changes[o.id]||{};
    return {...o,...patch};
  });
  const eligible = o => o.shop!=="VIP" || o.minVip==null || o.minVip<=state.vip;
  const priceUnit = o => o.price!=null && +o.price>=0 && +o.quantity>0 ? +o.price/+o.quantity : null;
  const anchor = itemId => {
    const manual = +state.manual[itemId];
    if (state.manual[itemId] !== undefined && state.manual[itemId] !== "" && Number.isFinite(manual) && manual>0)
      return {price:manual,source:"Custom benchmark"};
    const candidates = allOffers().filter(o=>o.item===itemId &&
      (o.shop==="Diamond" || (state.mode==="all" && o.shop==="VIP" && eligible(o))) &&
      priceUnit(o)!=null);
    if (!candidates.length) return null;
    candidates.sort((a,b)=>priceUnit(a)-priceUnit(b));
    return {price:priceUnit(candidates[0]),source:candidates[0].shop+" shop",offer:candidates[0]};
  };
  const perThousand = (o,benchmark) => {
    const per=priceUnit(o);
    return benchmark && per>0 && o.currency!=="Diamonds" ? 1000*benchmark.price/per : null;
  };
  const rate = currency => currency==="Diamonds" ? 1000 :
    ({ "Alliance coins":"Alliance", "Trial medals":"Trial", "Honor medals":"Honor" }[currency] || "");
  const modeledCost = o => {
    const per=priceUnit(o);
    if(per==null) return null;
    const key=rate(o.currency), r = typeof key==="number" ? key : +state.rates[key];
    if (typeof key!=="number" && (state.rates[key]==="" || !Number.isFinite(r) || r<0)) return null;
    return per*r/1000;
  };
  const evid = o => o.evidence==="reported" ? '<span class="badge reported">Reported, unverified</span>' :
    o.evidence==="edited" ? '<span class="badge provisional">User edited</span>' :
    '<span class="badge verified">Screenshot</span>';
  const access = o => o.shop!=="VIP" ? "" : o.minVip!=null ?
    (o.minVip>state.vip ? '<span class="badge locked">VIP '+o.minVip+' locked</span>' :
    '<span class="badge verified">VIP '+o.minVip+' unlocked</span>') :
    '<span class="badge">Gate not shown</span>';
  const selectOptions = (list,selected) => list.map(o => {
    const id=typeof o==="string"?o:o.value, name=typeof o==="string"?o:o.label;
    return '<option value="'+esc(id)+'"'+(String(id)===String(selected)?" selected":"")+'>'+esc(name)+'</option>';
  }).join("");
  function renderOverview(){
    const offers=allOffers();
    q("overview").innerHTML = [
      ["5","Shops tracked","3 different non-diamond currencies"],
      [String(offers.length),"Shop offers","Including reported/hidden prices"],
      [String(new Set(offers.map(o=>o.item)).size),"Unique items","Some icon names provisional"],
      ["4","Confirmed VIP gates","VIP 8 · 9 · 10 · 11"]
    ].map(x=>'<div class="stat"><div class="label">'+x[1]+'</div><div class="num">'+x[0]+'</div><div class="detail">'+x[2]+'</div></div>').join("");
  }
  function compare(){
    const item=itemById(state.selected), benchmark=anchor(item.id);
    const relevant=allOffers().filter(o=>o.item===item.id && (state.includeReported || o.evidence!=="reported"));
    const effective=relevant.filter(eligible).map(o=>({...o,effective:modeledCost(o)}))
      .filter(o=>o.effective!=null).sort((a,b)=>a.effective-b.effective);
    const best=effective[0], bestValue=best?.effective;
    const maxRatio=Math.max(1,...relevant.map(o=>perThousand(o,benchmark)||0));
    let rows=relevant.slice().sort((a,b)=>(shopById(a.shop)?.order||0)-(shopById(b.shop)?.order||0));
    const tableRows=rows.map(o=>{
      const per=priceUnit(o), r=perThousand(o,benchmark), cost=modeledCost(o);
      const isBest=best && o.id===best.id && eligible(o);
      return '<tr><td><strong>'+esc(o.shop)+'</strong><div class="notice">'+esc(o.source)+'</div></td>'+
        '<td class="mono">'+fmt(o.price)+'</td>'+
        '<td class="mono">'+(per==null?"—":fmt(per))+'</td>'+
        '<td>'+(r==null ? (o.currency==="Diamonds" ? '<span class="muted">Diamond-priced</span>' : '<span class="muted">No benchmark</span>') :
          '<div class="ratio-bar"><div class="ratio-track"><div class="ratio-fill" style="width:'+Math.max(2,100*r/maxRatio)+'%"></div></div><strong class="ratio-number mono">'+fixed(r)+'</strong></div>')+'</td>'+
        '<td class="mono '+(isBest?"positive":"")+'">'+(cost==null?"—":fixed(cost))+(isBest?' ★':'')+'</td>'+
        '<td>'+access(o)+(access(o)?"<br>":"")+evid(o)+'</td>'+
        '<td><button class="linklike" data-edit="'+esc(o.id)+'" aria-label="Edit price for '+esc(o.shop)+'">Edit</button></td></tr>';
    }).join("");
    const options=base.items.filter(i=>allOffers().some(o=>o.item===i.id))
      .sort((a,b)=>a.name.localeCompare(b.name)).map(i=>({value:i.id,label:i.name}));
    const rateInputs=["Alliance","Trial","Honor"].map(s=>
      '<div class="rate-box"><label for="rate-'+s+'">'+s+' — diamonds per 1,000 '+esc(shopById(s).currency)+'</label>'+
      '<input id="rate-'+s+'" data-rate="'+s+'" type="number" min="0" step="any" placeholder="Your estimate (optional)" value="'+esc(state.rates[s])+'"></div>'
    ).join("");
    return '<div class="layout"><div class="stack">'+
      '<section class="panel"><p class="section-kicker">01 / SIDE-BY-SIDE PRICING</p><h2>Compare the same item</h2><p class="note">An item\'s diamond benchmark provides an implied currency rate; only your own currency valuations can determine a modeled cheapest shop.</p>'+
      '<div class="controls-grid">'+
        '<div class="field"><label for="item-select">Select item</label><select id="item-select">'+selectOptions(options,item.id)+'</select></div>'+
        '<div class="field"><label for="mode-select">Diamond benchmark source</label><select id="mode-select">'+selectOptions([{value:"all",label:"Cheapest Diamond or eligible VIP price"},{value:"diamond",label:"Diamond shop only"}],state.mode)+'</select></div>'+
        '<div class="field"><label for="vip-select">Your VIP level (known locked items)</label><select id="vip-select">'+selectOptions(Array.from({length:19},(_,i)=>({value:i,label:"VIP "+i})),state.vip)+'</select></div>'+
        '<div class="field"><label for="manual-anchor">Custom diamond price per unit</label><input id="manual-anchor" type="number" step="any" min="0.01" placeholder="Use observed price" value="'+esc(state.manual[item.id]??"")+'"></div>'+
      '</div><div class="value-hero"><div><p class="eyebrow">BENCHMARK / 1 ITEM</p><div class="bigval">'+(benchmark?fmt(benchmark.price)+" ◇":"Not available")+'</div><p class="note">'+esc(benchmark?.source||"Add a custom price or enable VIP benchmarks")+'</p></div>'+
      '<div><span class="badge '+(item.confidence==="confirmed"?"verified":"provisional")+'">Name: '+esc(item.confidence)+'</span></div></div>'+
      '<p class="note" style="margin-bottom:12px">'+esc(item.description||"No verified in-game tooltip yet.")+'</p>'+
      '<div class="table-wrap"><table><thead><tr><th>Shop</th><th>Price</th><th>Per unit</th><th>◇ / 1K coins</th><th>Modeled ◇ / item</th><th>Access / proof</th><th></th></tr></thead><tbody>'+
      (tableRows||'<tr><td colspan="7">No offers yet.</td></tr>')+'</tbody></table></div>'+
      '<p class="notice">★ = lowest modeled cost among eligible listings with a known currency valuation. Purchase limits and currency availability still matter. The "◇ / 1K coins" column compares each shop price against the diamond benchmark, not a transferable exchange rate.</p>'+
      '</section>'+
      '<section class="panel"><h3>How the ratio works</h3><p class="note">Example: Fighter Part = 400 diamonds in the VIP shop and 800 Honor medals in the Honor shop. That implies <strong>500 diamonds of this item\'s buying power per 1,000 Honor medals</strong>. It does not mean Honor medals can be converted into diamonds. All prices are per displayed item quantity.</p></section>'+
    '</div><aside class="stack">'+
      '<section class="panel"><p class="section-kicker">02 / YOUR CURRENCY VALUES</p><h2>Opportunity cost</h2><p class="note">Enter what spending 1,000 coins/medals is worth <em>to you</em> in diamonds. Leave blank to avoid an unsupported exchange-rate claim.</p><div class="rates">'+rateInputs+'</div><div class="divider"></div>'+
      '<div class="metric-row"><div class="metric"><div class="label">Modeled best shop</div><b>'+esc(best?.shop||"—")+'</b></div><div class="metric"><div class="label">Cost in diamonds</div><b>'+(bestValue==null?"—":fixed(bestValue))+'</b></div></div>'+
      '<p class="notice">Your valuations are saved only on this device. VIP discounts are diamond prices, not a separate currency.</p></section>'+
      '<section class="panel"><p class="section-kicker">DATA QUALITY</p><h3>What\'s verified?</h3><div class="kv"><span>Screenshot price</span><span class="badge verified">Green</span></div><div class="kv"><span>Reported, not visible</span><span class="badge reported">Amber</span></div><div class="kv"><span>Locked VIP item</span><span class="badge locked">Red</span></div>'+
      '<div class="divider"></div><label class="field"><span>Include reported prices</span><select id="include-reported">'+selectOptions([{value:"yes",label:"Yes, clearly marked"},{value:"no",label:"No, screenshot only"}],state.includeReported?"yes":"no")+'</select></label></section>'+
      '</aside></div>';
  }

  function rankings(){
    const offers=allOffers().filter(o=>o.shop===state.rankShop && (state.includeReported||o.evidence!=="reported"));
    const values=offers.map(o=>({o,benchmark:anchor(o.item)}))
      .map(v=>({...v,ratio:perThousand(v.o,v.benchmark)}))
      .filter(v=>v.ratio!=null && v.ratio>=0).sort((a,b)=>b.ratio-a.ratio);
    const rows=values.map((v,index)=>{
      const o=v.o, item=itemById(o.item);
      return '<tr><td class="mono">'+(index+1)+'</td>'+
        '<td><button class="linklike" data-select="'+esc(item.id)+'">'+esc(item.name)+'</button>'+
        '<div class="notice">'+esc(item.category)+(item.confidence!=="confirmed"?' · '+esc(item.confidence):'')+'</div></td>'+
        '<td class="mono">'+fmt(o.price)+' / '+fmt(o.quantity)+'</td>'+
        '<td class="mono">'+fixed(v.benchmark.price)+' <span class="muted">('+esc(v.benchmark.source)+')</span></td>'+
        '<td class="mono positive"><strong>'+fixed(v.ratio)+'</strong></td>'+
        '<td class="mono">'+(o.limit==null?'—':fmt(o.limit))+'</td>'+
        '<td>'+evid(o)+'</td></tr>';
    }).join("");
    return '<section class="panel"><p class="section-kicker">OPPORTUNITY COST / PURCHASE EFFICIENCY</p>'+
      '<h2>Best value by currency</h2>'+
      '<p class="note">Rank what 1,000 shop coins could buy, measured against the same item’s diamond listing. Higher numbers mean stronger implied diamond purchasing power, not a real exchange rate or an item priority recommendation.</p>'+
      '<div class="controls-grid">'+
      '<div class="field"><label for="rank-shop">Currency to analyze</label><select id="rank-shop">'+
        selectOptions(["Alliance","Trial","Honor"],state.rankShop)+'</select></div>'+
      '<div class="field"><label for="mode-select">Diamond benchmark</label><select id="mode-select">'+
        selectOptions([{value:"all",label:"Cheapest Diamond or eligible VIP price"},{value:"diamond",label:"Regular Diamond Shop only"}],state.mode)+
        '</select></div><div class="field"><label for="vip-select">Your VIP level</label><select id="vip-select">'+
        selectOptions(Array.from({length:19},(_,i)=>({value:i,label:"VIP "+i})),state.vip)+
        '</select></div><div class="field"><label for="include-reported">Reported prices</label><select id="include-reported">'+
        selectOptions([{value:"yes",label:"Include, with warning"},{value:"no",label:"Exclude unverified"}],state.includeReported?"yes":"no")+
        '</select></div></div>'+
      '<div class="hint">For example, a Fighter Part at 400 diamonds in the VIP shop versus 800 Honor medals yields 500 diamond-equivalent buying power per 1,000 Honor medals. For another item, the ratio can be completely different. These rankings compare <strong>purchasing opportunities</strong>, not the intrinsic value of currencies.</div>'+
      '<p class="notice">'+values.length+' entries with a comparable diamond benchmark · '+
        (offers.length-values.length)+' offer(s) without a diamond reference or visible price.</p>'+
      '<div class="table-wrap"><table><thead><tr><th>#</th><th>Item</th><th>Shop price / qty</th>'+
        '<th>Diamond reference / item</th><th>◇ per 1,000 coins</th><th>Limit</th><th>Evidence</th></tr></thead>'+
        '<tbody>'+(rows||'<tr><td colspan="7" class="empty">No comparable items. Select a different reference or add custom prices in Compare value.</td></tr>')+
        '</tbody></table></div>'+
      '<p class="notice">Some icon identifications and offer contents are provisional. A large ratio can simply mean the diamond-listed version is overpriced. Check quantity and actual item utility before purchasing.</p>'+
      '</section>';
  }
  function catalog(){
    const list=allOffers().filter(o=>{
      const item=itemById(o.item);
      return (state.shop==="All"||o.shop===state.shop) &&
        (state.category==="All"||item.category===state.category) &&
        (item.name+" "+o.shop+" "+o.item).toLowerCase().includes(state.search.toLowerCase()) &&
        (state.includeReported||o.evidence!=="reported");
    });
    const rows=list.map(o=>{
      const item=itemById(o.item), bench=anchor(o.item), ratio=perThousand(o,bench);
      return '<tr><td><button class="linklike" data-select="'+esc(o.item)+'">'+esc(item.name)+'</button><div class="notice">'+esc(item.category)+' · '+esc(item.confidence)+'</div></td>'+
        '<td>'+esc(o.shop)+'</td><td class="mono">'+fmt(o.price)+' <span class="muted">/ '+fmt(o.quantity)+'</span></td>'+
        '<td class="mono">'+esc(o.currency)+'</td><td class="mono">'+(o.limit==null?"—":fmt(o.limit))+'</td>'+
        '<td class="mono">'+(ratio==null?"—":fixed(ratio))+'</td><td>'+access(o)+(access(o)?" ":"")+evid(o)+'</td>'+
        '<td class="muted">'+esc(o.source)+'</td></tr>';
    }).join("");
    return '<section class="panel"><p class="section-kicker">ALL OBSERVED INVENTORY</p><h2>Shop price catalog</h2><p class="note">Search every captured offer. Tap an item name for its cross-shop comparison. Limits are the screenshot-displayed total, not an estimate of future inventory.</p>'+
      '<div class="filterbar"><div class="field"><label for="search-field">Search by item</label><input id="search-field" placeholder="Fighter part, speedup, shard…" value="'+esc(state.search)+'"></div>'+
      '<div class="field"><label for="shop-filter">Shop</label><select id="shop-filter">'+selectOptions(["All",...base.shops.map(s=>s.id)],state.shop)+'</select></div>'+
      '<div class="field"><label for="category-filter">Category</label><select id="category-filter">'+selectOptions(["All",...new Set(base.items.map(i=>i.category))],state.category)+'</select></div></div>'+
      '<p class="notice">'+list.length+' matching offers · VIP locked rows remain visible</p><div class="table-wrap"><table><thead><tr><th>Item</th><th>Shop</th><th>Price / qty</th><th>Currency</th><th>Limit</th><th>◇/1K</th><th>Proof</th><th>Image</th></tr></thead><tbody>'+
      (rows||'<tr><td colspan="8" class="empty">No matching offers</td></tr>')+'</tbody></table></div></section>';
  }
  function vip(){
    const unlocks=allOffers().filter(o=>o.shop==="VIP" && o.minVip!=null).sort((a,b)=>a.minVip-b.minVip);
    return '<section class="panel"><p class="section-kicker">CONFIRMED SCREENSHOT UNLOCKS</p><h2>VIP Shop level gates</h2>'+
      '<p class="note">Only visible padlock labels are treated as established minimum VIP levels. Other VIP items showed no padlock in these screenshots, but that <strong>does not establish they unlock at VIP 0</strong>.</p>'+
      '<div class="controls-grid"><div class="field"><label for="vip-select">Preview your VIP level</label><select id="vip-select">'+selectOptions(Array.from({length:19},(_,i)=>({value:i,label:"VIP "+i})),state.vip)+'</select></div></div>'+
      '<div class="level-grid">'+unlocks.map(o=>'<article class="level-card"><div class="section-kicker">VIP UNLOCK</div><div class="level">'+o.minVip+'</div>'+
        '<h3>'+esc(itemById(o.item).name)+'</h3><p class="desc">'+esc(itemById(o.item).description||"Tooltip not transcribed.")+'</p><p class="desc">'+esc(o.source)+' · screenshot confirmation</p>'+
        '<p class="price">'+fmt(o.price)+' diamonds</p><p style="margin-top:10px">'+access(o)+'</p></article>').join("")+'</div>'+
      '<div class="hint">A Japanese client guide (v1.37.07) reports VIP Shop items gated between levels 4 and 11, but does not list each item\'s gate. Missing VIP 4–7 entries are deliberately unfilled. <a href="https://gamesakidori.com/z-route/vip-guide/" target="_blank" rel="noopener">Read guide ↗</a></div></section>';
  }
  function dataPage(){
    const custom=state.additions;
    return '<div class="layout"><div class="stack"><section class="panel"><p class="section-kicker">AUDIT TRAIL</p><h2>Sources &amp; limitations</h2>'+
      '<p class="note">Prices are derived from the initial shop screenshots and item names from additional player-supplied official tooltips. Some labels remain provisional. The VIP item contains 10 Stamina; its 36-diamond price is user-reported and the purchase limit is unknown. Screenshot prices and unlock observations are stronger evidence than third-party guides.</p>'+
      '<div class="table-wrap"><table><thead><tr><th>Shop</th><th>Currency</th><th>Restock</th><th>Images</th></tr></thead><tbody>'+
      base.shops.map(s=>'<tr><td>'+esc(s.id)+'</td><td>'+esc(s.currency)+'</td><td>'+esc(s.reset)+'</td><td>'+esc(({Diamond:"D1",Alliance:"A2–A4",VIP:"V5–V7",Trial:"T8–T9",Honor:"H10"})[s.id])+'</td></tr>').join("")+'</tbody></table></div>'+
      '<div class="hint">The Alliance Fighter Part is sold out, so its price is not readable. The 1,000 Alliance Coin value comes from the user\'s example and a prior community claim; it is marked as <strong>reported</strong>. The game\'s item tooltip is needed to confirm some icon-only labels. Golden fighter tickets and gear-shaped Fighter Parts are separate items.</div>'+
      '<p class="note">Related sources: <a href="https://github.com/JeffxLabs/zrouteredemption" target="_blank" rel="noopener">ZR:Reference data ↗</a> · <a href="https://gamesakidori.com/z-route/vip-guide/" target="_blank" rel="noopener">Japanese VIP shop guide ↗</a>.</p></section>'+
      '<section class="panel"><h2>Export, import &amp; restore</h2><p class="note">Download editable data as JSON. Import JSON exported from this app to restore custom additions, manual benchmarks and currency valuations. Local edits do not modify the GitHub repository.</p>'+
      '<div class="actions"><button class="btn primary" id="export">Download JSON</button><label class="btn ghost" for="import-file" style="cursor:pointer">Import JSON</label><input type="file" id="import-file" accept=".json,application/json" hidden><button class="btn ghost" id="reset">Reset local edits</button></div>'+
      '<p class="notice">'+custom.length+' locally added offer(s). Prices changed: '+Object.keys(state.changes).length+'.</p></section></div>'+
      '<aside class="stack"><section class="panel"><p class="section-kicker">GROW THE DATABASE</p><h2>Add a shop offer</h2><p class="note">Add a new offer or an observed price that is not yet in the screenshots. It is stored locally until exported or added to the GitHub dataset.</p>'+
      '<form id="add-form" class="rates"><div class="field"><label for="add-item">Item</label><select id="add-item">'+selectOptions(base.items.map(i=>({value:i.id,label:i.name})),state.selected)+'</select></div>'+
      '<div class="field"><label for="add-shop">Shop</label><select id="add-shop">'+selectOptions(base.shops.map(s=>s.id),"Alliance")+'</select></div>'+
      '<div class="field"><label for="add-price">Currency price</label><input id="add-price" type="number" min="0" step="any" required></div>'+
      '<div class="field"><label for="add-qty">Quantity in offer</label><input id="add-qty" type="number" min="0.001" step="any" value="1" required></div>'+
      '<div class="field"><label for="add-limit">Purchase limit (optional)</label><input id="add-limit" type="number" min="0" step="1"></div>'+
      '<div class="field"><label for="add-vip">Required VIP (optional)</label><input id="add-vip" type="number" min="0" max="18" step="1" placeholder="Unknown"></div>'+
      '<button class="btn primary" type="submit">Add local offer</button></form></section></aside></div>';
  }
  function render(){
    renderOverview();
    document.querySelectorAll("[data-tab]").forEach(b=>{
      b.classList.toggle("active",b.dataset.tab===state.tab);
      b.setAttribute("aria-current",b.dataset.tab===state.tab?"page":"false");
    });
    q("workspace").innerHTML = state.tab==="compare" ? compare() : state.tab==="rankings" ? rankings() : state.tab==="catalog" ? catalog() : state.tab==="vip" ? vip() : dataPage();
  }
  document.addEventListener("click", e=>{
    const tab=e.target.closest("[data-tab]");
    if(tab){state.tab=tab.dataset.tab;save();render();return;}
    const selected=e.target.closest("[data-select]");
    if(selected){state.selected=selected.dataset.select;state.tab="compare";save();render();window.scrollTo({top:0,behavior:"smooth"});return;}
    const edit=e.target.closest("[data-edit]");
    if(edit){
      const o=allOffers().find(x=>x.id===edit.dataset.edit);
      if(!o)return;
      const entered=window.prompt("New price for "+itemById(o.item).name+" at "+o.shop+" (blank = hidden):",o.price??"");
      if(entered===null)return;
      const clean=entered.trim(), n=clean===""?null:Number(clean);
      if(n!==null && (!Number.isFinite(n)||n<0)){window.alert("Enter a valid non-negative number.");return;}
      state.changes[o.id]={price:n,evidence:"edited",note:"Locally edited by user; original "+o.source+" price: "+String(base.offers.find(x=>x.id===o.id)?.price??"not visible")};
      save();render();return;
    }
    if(e.target.id==="export"){
      const data={format:"zr-shop-ledger-export",version:1,exported:new Date().toISOString(),customizations:{
        rates:state.rates,manual:state.manual,changes:state.changes,additions:state.additions},base};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      const href=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=href;a.download="zr-shop-ledger-export.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);return;
    }
    if(e.target.id==="reset" && window.confirm("Clear locally entered prices, rates, benchmarks and offers?")){
      const tab=state.tab;state={...defaults,tab,rates:{...defaults.rates},manual:{},changes:{},additions:[]};
      save();render();
    }
  });
  document.addEventListener("change",async e=>{
    const t=e.target;
    if(t.id==="item-select")state.selected=t.value;
    else if(t.id==="mode-select")state.mode=t.value;
    else if(t.id==="vip-select")state.vip=Number(t.value);
    else if(t.id==="include-reported")state.includeReported=t.value==="yes";
    else if(t.id==="rank-shop")state.rankShop=t.value;
    else if(t.id==="shop-filter")state.shop=t.value;
    else if(t.id==="category-filter")state.category=t.value;
    else if(t.id==="manual-anchor"){
      if(t.value==="")delete state.manual[state.selected];
      else if(Number(t.value)>0)state.manual[state.selected]=Number(t.value);
    }else if(t.dataset.rate){
      state.rates[t.dataset.rate]=t.value;
    }else if(t.id==="import-file"){
      const f=t.files?.[0];if(!f)return;
      try{
        const parsed=JSON.parse(await f.text());
        if(parsed.format!=="zr-shop-ledger-export"||parsed.version!==1||!parsed.customizations)throw new Error("Not a compatible export");
        const c=parsed.customizations;
        state.rates={...defaults.rates,...(c.rates||{})};
        state.manual=c.manual&&typeof c.manual==="object"?c.manual:{};
        state.changes=c.changes&&typeof c.changes==="object"?c.changes:{};
        state.additions=Array.isArray(c.additions)?c.additions.filter(o=>o&&base.shops.some(s=>s.id===o.shop)&&base.items.some(i=>i.id===o.item)): [];
        save();render();window.alert("Local customizations imported.");
      }catch(error){window.alert("Import failed: "+error.message);}
      return;
    }else return;
    save();render();
  });
  document.addEventListener("input",e=>{
    if(e.target.id==="search-field"){state.search=e.target.value;save();
      // Re-render only the data table to keep the search field focused.
      const pos=e.target.selectionStart;
      render();
      const el=q("search-field");if(el){el.focus();el.setSelectionRange(pos,pos);}
    }
  });
  document.addEventListener("submit",e=>{
    if(e.target.id!=="add-form")return;
    e.preventDefault();
    const item=q("add-item").value, shop=q("add-shop").value;
    const price=Number(q("add-price").value),quantity=Number(q("add-qty").value);
    if(!Number.isFinite(price)||price<0||!Number.isFinite(quantity)||quantity<=0)return;
    const limit=q("add-limit").value===""?null:Number(q("add-limit").value);
    const minVip=q("add-vip").value===""?null:Number(q("add-vip").value);
    state.additions.push({id:"custom-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),
      item,shop,currency:shopById(shop).currency,price,quantity,limit,minVip,source:"Local entry",
      evidence:"edited",note:"User-entered locally"});
    state.selected=item;save();render();
  });
  render();
})();