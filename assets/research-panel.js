/* Collapsible Alliance Competition tech controls and per-day illustrative score breakdown. */
window.ZR_RESEARCH_PANEL = (() => {
  "use strict";
  function render({state,base,competition,research,fmt,esc,selectOptions}){
    if(!research)return "";
    const levels=state.researchLevels;
    const techCards=research.techs.map(t=>{
      const level=research.clampLevel(t.id,levels[t.id]);
      const percent=research.percent(t.id,levels);
      const unknown=level>0 && percent==null && t.kind!=="reward";
      const label=t.kind==="reward" ? "Chest unlock; no points modifier" :
        !t.percentages.length ? "Numeric benefit unavailable" :
        "Current +"+fmt((percent||0)*100)+"% · max +"+fmt(t.percentages.at(-1)*100)+"%";
      return '<div class="research-tech'+(percent>0?' research-tech-active':'')+
        (unknown?' research-tech-unknown':'')+'">'+
        '<label for="research-'+t.id+'"><strong>'+esc(t.name)+'</strong>'+
        '<span class="research-tech-note">'+esc(t.description||"Reward unlock")+'</span></label>'+
        '<div class="research-tech-controls"><select id="research-'+t.id+'" data-research-level="'+t.id+
        '" aria-label="'+esc(t.name)+' level">'+
        selectOptions(Array.from({length:t.max+1},(_,n)=>({value:n,label:"Level "+n})),level)+'</select>'+
        '<span class="'+(percent>0?'research-bonus':unknown?'wide-unavailable':'research-tech-note')+'">'+
        esc(unknown?"Unverified · excluded from calculations":label)+'</span></div></div>';
    }).join("");
    const days=competition.days.map(d=>{
      const items=base.items.flatMap(item=>{
        const raw=competition.scorePerItem(item,d.day),calc=research.model(raw,levels);
        return calc?[{item,calc}]:[];
      });
      const baseTotal=items.reduce((v,e)=>v+e.calc.base,0);
      const bonusTotal=items.reduce((v,e)=>v+e.calc.bonus,0);
      const detail=items.map(({item,calc})=>{
        const buffLabels=calc.active.map(t=>t.name+" Lv."+t.level+" (+"+fmt(t.percent*100)+"%)").join(", ");
        return '<tr title="'+esc(buffLabels||"No modeled research bonus")+'"><td>'+esc(item.name)+'</td>'+
          '<td class="mono">'+fmt(calc.base)+'</td>'+
          '<td class="mono '+(calc.bonus>0?'research-bonus':'')+'">'+
          (calc.bonus>0?'+'+fmt(calc.bonus):'—')+'</td>'+
          '<td class="mono '+(calc.bonus>0?'research-bonus':'')+'">'+fmt(calc.total)+'</td></tr>';
      }).join("");
      const activeTechs=[...new Map(items.flatMap(x=>x.calc.active).map(b=>[b.id,b])).values()];
      return '<article class="research-day-card"><div class="research-day-top">'+
        '<div><span class="section-kicker">DAY '+d.day+' / '+esc(d.weekday)+'</span>'+
        '<h4>'+esc(d.name)+'</h4></div>'+
        '<strong class="mono '+(bonusTotal>0?'research-bonus':'')+'">'+fmt(baseTotal+bonusTotal)+' pts</strong></div>'+
        '<div class="research-day-math"><span>Base <b>'+fmt(baseTotal)+'</b></span>'+
        '<span class="'+(bonusTotal>0?'research-bonus':'')+'">Research <b>+'+fmt(bonusTotal)+'</b></span></div>'+
        '<p class="research-tech-note">'+(activeTechs.length?'Active: '+esc(activeTechs.map(x=>x.name+' +'+fmt(x.percent*100)+'%').join(' · ')):'No active modeled bonuses')+'</p>'+
        '<details class="research-day-details"><summary>Item breakdown ('+items.length+')</summary>'+
        '<div class="table-wrap"><table><thead><tr><th>Item (1 unit)</th><th>Base</th><th>Research</th><th>Total</th></tr></thead>'+
        '<tbody>'+detail+'</tbody></table></div></details></article>';
    }).join("");
    const equipped=research.techs.filter(t=>research.clampLevel(t.id,levels[t.id])>0).length;
    return '<div class="research-settings"><button type="button" data-research-toggle class="research-toggle" aria-expanded="'+
      (state.researchOpen?'true':'false')+'" aria-controls="research-settings-body">'+
      '<span><strong>Alliance Competition research</strong><small>'+equipped+
      ' techs configured · customize point bonuses</small></span>'+
      '<span aria-hidden="true">'+(state.researchOpen?'▴ Hide':'▾ Expand')+'</span></button>'+
      (state.researchOpen?'<div id="research-settings-body" class="research-settings-body">'+
      '<p class="note">Choose your researched levels. Boosted values are green in the Wide Table. Verified client benefits are added to the base score; actual server stacking and rounding may differ. Techs without numeric client benefit rows can be recorded, but are excluded from calculations. Settings stay in this browser.</p>'+
      '<div class="research-tech-grid">'+techCards+'</div>'+
      '<h3>Points by day — research breakdown</h3>'+
      '<p class="note">Illustrative comparison: <strong>one unit of every eligible catalog item</strong> used on the indicated day (not a forecast of your purchases, and not shop bundle amounts). Items usable on multiple days appear multiple times, so <strong>do not add daily totals</strong>. Expand each day to see its base points, researched bonus, and adjusted total for every item.</p>'+
      '<div class="research-day-grid">'+days+'</div>'+
      '<p class="notice">Sources: <a target="_blank" rel="noopener" href="'+esc(research.source)+'">client research benefits</a> · <a target="_blank" rel="noopener" href="'+esc(competition.source)+'">stage scoring</a>. General Points Buff applies to modeled actions except diamond purchases. Speedup and hero-recruitment buffs apply only to matching actions. Radar, building power, research power, training power, kill and convoy buffs affect tasks not directly scored by the current shop-item dataset.</p>'+
      '</div>':'')+'</div>';
  }
  return {render};
})();
