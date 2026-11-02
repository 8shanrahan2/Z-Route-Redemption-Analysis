import {renderResearch} from './research.mjs';
import {initialState,validate,heroById,heroStats,lineup,statKeys,skillRow,isUnlocked,simulate,coverage,accountStats,boostSources,boostStats} from './model.mjs';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n).toLocaleString(),short=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);
const key='z-route-combat-lab-v1';
let data,state,result=null,editing=null;
const message=text=>{$('#message').textContent=text;};
function save(){try{localStorage.setItem(key,JSON.stringify(state));$('#save-status').textContent='Saved on this device';}catch{$('#save-status').textContent='Browser storage unavailable — export JSON to keep changes';}}
function invalidate(){result=null;$('#battle').hidden=true;$('#result').innerHTML='<h2>The field is set.</h2><p>Inputs changed. Run the matchup for a fresh estimate.</p><div class="versus"><b>A</b><span>VS</span><b>B</b></div>';save();}
function input(label,value,attrs=''){return `<label>${label}<input value="${esc(value)}" ${attrs}></label>`;}
const numeric='type="number" required step="any"';
function percent(label,value,attrs){return `<div class="percent">${input(label,value,`${numeric} min="0" max="10000" ${attrs}`)}</div>`;}
function renderBoosts(s,side){
  const targets={all:'All heroes',front:'Front row',back:'Back row','camp:3':'Warrior','camp:1':'Tactical','camp:2':'Assault',...Object.fromEntries(data.heroes.map(h=>['hero:'+h.id,h.display_name]))};
  const select=(label,value,choices,i,field)=>`<label>${label}<select data-boost="${side},${i},${field}">${Object.entries(choices).map(([k,v])=>`<option value="${esc(k)}" ${String(value)===k?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
  return `<details class="account-boosts"><summary>Account boosts · ${(s.boosts||[]).length} entries</summary><p class="fine">Enter displayed boosts for each decoration, decor buff, Hall of Fame entry, tech node or gear item. Use one row per stat. Enter either detailed rows or the quick tech/decor totals below for the same bonus, never both. Levels and owned counts are notes; enter the resulting total effect.</p>
  ${(s.boosts||[]).map((r,i)=>`<div class="boost-row"><div class="section-heading"><label class="check"><input type="checkbox" data-boost="${side},${i},enabled" ${r.enabled?'checked':''}> Include boost</label><button type="button" class="quiet" data-remove-boost="${side},${i}">Remove boost ${i+1}</button></div><div class="editor-grid two">${select('Source',r.source,boostSources,i,'source')}${input('Name / level / component',r.name,`type="text" maxlength="80" data-boost="${side},${i},name"`)}${select('Applies to',r.target,targets,i,'target')}${select('Stat',r.stat,boostStats,i,'stat')}${input('Flat boost',r.flat,`${numeric} min="0" max="10000000000" data-boost="${side},${i},flat" ${statKeys.includes(r.stat)?'':'disabled'}`)}${input('Boost % / percentage points',r.percent,`${numeric} min="0" max="10000" data-boost="${side},${i},percent"`)}</div>${['fighter','component'].includes(r.source)&&(s.fighterMode??'total')==='total'?'<p class="fine">Excluded while fighter summary mode is selected. Choose component mode above to apply this row.</p>':''}</div>`).join('')}
  <button type="button" class="secondary" data-add-boost="${side}">+ Add account boost</button><p class="fine">Critical chance/damage use percentage points; physical/radiation bonuses and cooldown speed use percentages. Reduction is capped at 95% in this sandbox. Stacking of combat modifiers still needs validation.</p></details>
  <details class="account-boosts"><summary>Stat breakdown for each hero</summary><p class="fine">Growth × (1 + account %, lineup, specialty and static passive %) + flat boosts. Flat gear, decor and fighter stats stay outside growth percentages. Lineup/talent combat stacking is still an approximation. Soldier-power conversion is added afterward. Final-stat heroes bypass these HP/ATK/DEF additions.</p><div class="table-scroll"><table class="damage-table"><thead><tr><th>HERO / STAT</th><th>GROWTH / ENTERED</th><th>ACCOUNT %</th><th>FLAT</th><th>COMPOSED</th></tr></thead><tbody>${s.heroes.flatMap(h=>{const a=accountStats(data,s,h);return statKeys.map(k=>`<tr><td>${esc(heroById(data,h.id).display_name)} / ${k==='hp'?'HP':k==='attack'?'ATK':'DEF'}${h.finalStats?' (final)':''}</td><td>${fmt(a.base[k])}</td><td>${h.finalStats?'bypassed':a.percent[k]+'%'}</td><td>${h.finalStats?'bypassed':fmt(a.flat[k])}</td><td>${fmt(a.stats[k])}</td></tr>`);}).join('')}</tbody></table></div></details>`;
}
function renderSquads(){
  const openPanels=[...$('#squads').querySelectorAll('details')].map(el=>el.open);
  $('#squads').innerHTML=state.squads.map((s,side)=>{
    const bonus=lineup(data,s.heroes),counts={};s.heroes.forEach(h=>{const camp=heroById(data,h.id).camp_name;counts[camp]=(counts[camp]||0)+1;});
    const card=(h,slot)=>{const ref=heroById(data,h.id);return `<button class="hero-card faction-${ref.camp_type}" data-edit="${side},${slot}" aria-label="Edit ${esc(ref.display_name)}, slot ${slot+1}, ${h.stars} stars, step ${h.starStep??h.stars*5}"><div class="portrait"><img src="portraits/${h.id}.webp" alt="" loading="lazy"><span class="rarity">${ref.quality_name}</span><span class="slot-num">0${slot+1}</span></div><div class="hero-meta"><div class="hero-name">${esc(ref.display_name)}</div><div class="hero-faction">${ref.camp_name}</div><div class="stars" aria-hidden="true">${'★'.repeat(h.stars)}${'☆'.repeat(5-h.stars)}</div><div class="hero-level">Lv ${h.level} · step ${h.starStep??h.stars*5}/25</div></div></button>`;};
    const hp=s.heroes.reduce((n,h)=>n+heroStats(data,h).hp,0),power=s.heroes.reduce((n,h)=>n+h.power,0);
    return `<section class="squad ${side?'squad-b':''}"><div class="squad-heading"><span class="squad-letter">${side?'B':'A'}</span><div class="grow"><input class="name" aria-label="Squad ${side?'B':'A'} name" maxlength="60" value="${esc(s.name)}" data-side="${side}" data-field="name"><div class="squad-sub">${Object.entries(counts).map(([k,v])=>`${v} ${k}`).join(' · ')}</div></div></div><div class="lineup"><span>${bonus===.2?'Full faction lineup':bonus===.1?'3 + 2 faction split':'Faction lineup'}</span><b>+${Math.round(bonus*100)}% HP / ATK / DEF</b></div><div class="formation"><div class="row-label">FRONT ROW <span>02</span></div><div class="hero-row front">${s.heroes.slice(0,2).map((h,i)=>card(h,i)).join('')}</div><div class="row-label">BACK ROW <span>03</span></div><div class="hero-row">${s.heroes.slice(2).map((h,i)=>card(h,i+2)).join('')}</div><p class="card-hint">Select a hero to change lineup, stars, stats & skills ↗</p></div><div class="squad-stats"><span>Hero power · reference only<b>${power?short(power):'—'}</b></span><span>Entered / growth HP<b>${short(hp)}</b></span></div><div class="bonus-title">Soldier power <small>experimental conversion</small></div>${input('Displayed soldier power',s.soldierPower,`${numeric} min="0" max="10000000000" data-side="${side}" data-field="soldierPower"`)}${input('Reported morale damage % (100 = neutral)',s.moraleDamage??100,`${numeric} min="0" max="1000" data-side="${side}" data-field="moraleDamage"`)}<p class="fine">Enter the report’s damage percentage, such as 103. Do not use rounded morale totals or tech-tree progress here.</p><details><summary>Fighter power, components &amp; boosts</summary>${input('Fighter power (reference only)',s.fighterPower??0,`${numeric} min="0" max="10000000000" data-side="${side}" data-field="fighterPower"`)}<label>Fighter boost entry<select data-side="${side}" data-field="fighterMode"><option value="total" ${(s.fighterMode??'total')==='total'?'selected':''}>Use displayed all-hero boost totals</option><option value="components" ${s.fighterMode==='components'?'selected':''}>Use individual fighter/component rows</option></select></label><div class="bonus-grid">${statKeys.map(k=>input(k==='hp'?'HP':k==='attack'?'ATK':'DEF',s.fighter?.[k]??0,`${numeric} min="0" max="10000000000" data-side="${side}" data-field="fighter.${k}" ${s.fighterMode==='components'?'disabled':''}`)).join('')}</div><p class="fine">Choose totals or component rows, so the same boosts are counted once. Fighter power is reference only. Fighter procs and equivalent output are not independent extra damage.</p></details>${renderBoosts(s,side)}${['tech','decor'].map(group=>`<div class="bonus-title">${group==='tech'?'Technology':'Decor & statues'}<small>combat-stat bonuses, not tree progress</small></div><div class="bonus-grid">${statKeys.map(k=>percent(k==='hp'?'HP':k==='attack'?'ATK':'DEF',s[group][k],`data-side="${side}" data-field="${group}.${k}"`)).join('')}</div>`).join('')}</section>`;
  }).join('');
  [...$('#squads').querySelectorAll('details')].forEach((el,i)=>el.open=openPanels[i]??false);
  $('#coverage').innerHTML=coverage(data,state).map(n=>`<li>${esc(n)}</li>`).join('');
}
const modelFields=[
  ['shieldScale','DEF → shield multiplier',0,1000,'Shield = DEF × multiplier. Unverified.'],
  ['shieldAbsorb','Damage absorbed by shield %',0,100,'The remainder bypasses the shield.'],
  ['soldierHP','HP per soldier-power point',0,1000,'Squad total, divided among five heroes.'],
  ['soldierATK','ATK per soldier-power point',0,100,'Squad total, divided among five heroes.'],
  ['critChance','Base critical chance %',0,100,'Hero crit passives are added.'],
  ['critDamage','Critical damage %',100,1000,'150 = 1.5× normal damage.'],
  ['damageScale','Global damage multiplier',.001,100,'Use to investigate battle duration.'],
  ['firstCast','First active cast (seconds)',0,30,'Active skills start after this delay.'],
  ['duration','Battle time limit (seconds)',10,300,'Survivors on both sides = unresolved.'],
  ['seed','Random seed',1,2147483647,'Repeatable targeting and critical rolls.']
];
function renderModel(){$('#model-fields').innerHTML=modelFields.map(([k,label,min,max,note])=>`<div>${input(label,state.model[k],`type="number" required min="${min}" max="${max}" step="${['duration','seed'].includes(k)?1:'any'}" data-model="${k}"`)}<small>${note}</small></div>`).join('');$('#per-hit').checked=state.model.perHit;}
function renderReports(){
  $('#report-count').textContent=`${state.reports.length} report${state.reports.length===1?'':'s'}`;
  $('#reports').innerHTML=state.reports.length?state.reports.slice().reverse().map(r=>`<div class="report"><strong>${r.actual===r.predicted?'Match':'Mismatch'}</strong> · actual ${esc(r.actual)} / model ${esc(r.predicted)} <small>· ${esc(r.date||'')}</small><p>${esc(r.note)}</p></div>`).join(''):'<div class="empty">No saved model comparisons yet. The two reviewed reports are in the research section.</div>';
}
function editorHero(){
  return {id:Number($('#hero-id').value),level:Number($('#hero-level').value),stars:Number($('#hero-stars').value),starStep:Number($('#hero-stars').value)*5+Number($('#hero-substep').value),power:Number($('#hero-power').value),stats:$('#override').checked?Object.fromEntries(statKeys.map(k=>[k,Number($(`#stat-${k}`).value)])):null,finalStats:$('#override').checked&&$('#final-stats').checked,auto:$('#custom-auto').value===''?null:Number($('#custom-auto').value),active:$('#custom-active').value===''?null:Number($('#custom-active').value)};
}
function renderEditor(){
  const [side,slot]=editing,h=state.squads[side].heroes[slot],ref=heroById(data,h.id),stats=heroStats(data,h);
  $('#slot-label').textContent=`SQUAD ${side?'B':'A'} / ${slot<2?'FRONT':'BACK'} ROW / SLOT ${slot+1}`;
  $('#editor-fields').innerHTML=`<div class="editor-grid"><label class="full">Hero<select id="hero-id">${data.heroes.map(r=>`<option value="${r.id}" ${h.id===r.id?'selected':''} ${state.squads[side].heroes.some((x,i)=>i!==slot&&x.id===r.id)?'disabled':''}>${esc(r.display_name)} · ${r.quality_name} · ${r.camp_name} · ${r.role_short}</option>`).join('')}</select></label>${input('Level',h.level,'id="hero-level" type="number" required min="1" max="150" step="1"')}<label>Whole stars<select id="hero-stars">${[0,1,2,3,4,5].map(n=>`<option value="${n}" ${n===h.stars?'selected':''}>${n} ★</option>`).join('')}</select></label><label>Steps toward next star<select id="hero-substep">${Array.from({length:h.stars===5?1:5},(_,n)=>`<option value="${n}" ${n===(h.starStep??h.stars*5)%5?'selected':''}>${n} / 5</option>`).join('')}</select></label>${input('Displayed hero power',h.power,`${numeric} id="hero-power" min="0" max="10000000000"`)}</div>
  <p class="fine">Star step ${h.starStep??h.stars*5} / 25. Base growth uses the equation verified in recovered client code, with this sandbox’s pinned growth tables.</p>
  <label class="check"><input id="override" type="checkbox" ${h.stats?'checked':''}> Enter HP, ATK and DEF</label>
  <label class="check"><input id="final-stats" type="checkbox" ${h.finalStats?'checked':''} ${h.stats?'':'disabled'}> These are final combat stats, including account and lineup bonuses</label>
  <p class="fine">Final stats bypass all HP/ATK/DEF account boosts, lineup, specialty, static ATK/DEF passives and soldier-power conversion for this hero. Otherwise enter base stats before those bonuses. Active combat buffs still apply. DEF behavior remains hypothetical.</p>
  <div class="editor-grid">${statKeys.map(k=>input(k==='hp'?'HP':k==='attack'?'ATK':'DEF',Math.round(stats[k]),`${numeric} id="stat-${k}" min="${k==='hp'?1:0}" max="10000000000" ${h.stats?'':'disabled'}`)).join('')}</div>
  <div class="editor-grid two">${input('Custom auto ATK % (blank = star cap)',h.auto??'','id="custom-auto" type="number" min="0" max="100000" step="any"')}${input('Custom active ATK % (damage only)',h.active??'','id="custom-active" type="number" min="0" max="100000" step="any"')}</div>
  <p class="fine">Sandbox skills still use the newer reference star-cap values (1 / 1 / 5 / 10 / 20 / 30). Explore actual skill levels in the separate June source calculator below; its older values are not silently mixed into this model.</p>
  ${ref.skills.map(sk=>{const row=skillRow(sk,h.stars),on=isUnlocked(sk,h);return `<div class="skill-reference ${on?'':'locked'}"><strong>${esc(sk.name)}</strong><span class="type">${esc(sk.effect_type||'Passive / specialty')}</span><p>${row?esc(row.text):'Specialty: +'+({UR:20,SSR:10,SR:5}[ref.quality_name]||0)+'% HP / ATK / DEF'+(ref.quality_name==='UR'?', +10% cooldown speed':'')}</p><div class="skill-source">${on?'Unlocked':'Locked'} · requires Lv ${sk.unlock_level}${sk.unlock_star?' / '+sk.unlock_star+'★':''}${sk.cooldown_s?' · '+sk.cooldown_s+'s CD':''}${row?' · skill level '+row.skill_level:''}</div></div>`;}).join('')}
  <p class="fine">PvP sandbox: monster-only effects are excluded. Control effects and exclusive weapons remain incomplete. <a href="https://jeffxlabs.github.io/zrouteredemption/heroes/" target="_blank" rel="noreferrer">Source hero directory ↗</a></p>`;
}
function showEditor(side,slot){editing=[side,slot];renderEditor();$('#editor').showModal();}
function chart(points,time){
  const X=t=>45+t/Math.max(1,time)*610,Y=v=>220-v*1.9;
  return `<svg class="chart" viewBox="0 0 680 252" role="img" aria-label="Squad HP as a percentage of starting HP over time"><title>Remaining squad HP over time</title>${[0,25,50,75,100].map(v=>`<line x1="45" y1="${Y(v)}" x2="655" y2="${Y(v)}" stroke="#303a31"/><text x="5" y="${Y(v)+4}">${v}%</text>`).join('')}${['A','B'].map((key,i)=>`<polyline fill="none" stroke="${i?'#94bded':'#d3ed7a'}" stroke-width="2.5" points="${points.map(p=>`${X(p.time).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(' ')}"/>`).join('')}<text x="45" y="245">0s</text><text x="625" y="245">${time.toFixed(1)}s</text></svg>`;
}
function renderBattle(trials){
  const r=result,draws=trials.filter(x=>x==='draw').length,a=trials.filter(x=>x==='A').length,b=trials.length-a-draws;
  $('#result').innerHTML=`<span class="tag">UNCALIBRATED</span><h2 class="result-winner">${r.winner==='draw'?(r.timedOut?'Unresolved at time limit':'Mutual elimination'):'Squad '+r.winner+' wins this run.'}</h2><p>${r.time.toFixed(1)} seconds · seed ${state.model.seed}<br>${r.survivors[0]} A / ${r.survivors[1]} B heroes survive</p><div class="result-score"><span>24 trial seeds</span><b>A ${a} · B ${b} · draw ${draws}</b></div><div class="result-score"><span>Model status</span><b>2 reports · not calibrated</b></div>`;
  $('#battle').hidden=false;
  $('#battle').innerHTML=`<div class="section-heading"><div><div class="eyebrow">BATTLE TRACE</div><h2>How the sample played out</h2></div><span class="pill">Seed ${state.model.seed}</span></div><div class="battle-grid"><div><div class="legend"><span>● Squad A HP</span><span>● Squad B HP</span></div>${chart(r.timeline,r.time)}<p class="fine">HP only; DEF shields are separate. Simultaneous damage resolves on 0.1-second ticks.</p></div><div><h3>Skill & defeat log</h3><div class="battle-log" tabindex="0" aria-label="Battle event log">${r.log.map(e=>`<div>${e.time.toFixed(1).padStart(5,'0')}s &nbsp; ${esc(e.text)}</div>`).join('')||'No active skill events.'}</div><p class="fine">First 160 events. Damage and shield behavior are hypothetical.</p></div></div><details><summary>Hero contribution in this sample</summary><table class="damage-table"><thead><tr><th>SIDE / HERO</th><th>DAMAGE*</th><th>HP LEFT</th><th>SHIELD LEFT</th></tr></thead><tbody>${r.teams.flat().map(h=>`<tr><td>${h.side?'B':'A'} · ${esc(h.ref.display_name)}</td><td>${short(h.damage)}</td><td>${short(h.hp)}</td><td>${short(h.shield)}</td></tr>`).join('')}</tbody></table><p class="fine">*Includes shield damage and overkill; not an in-game report statistic.</p></details>`;
}
document.addEventListener('click',e=>{
  const add=e.target.closest('[data-add-boost]'),remove=e.target.closest('[data-remove-boost]');
  if(add||remove){
    const next=structuredClone(state),[side,index]=(add?add.dataset.addBoost:remove.dataset.removeBoost).split(',').map(Number),s=next.squads[side];s.boosts??=[];
    if(add){if(s.boosts.length>=100){message('Maximum 100 boost rows per squad.');return;}s.boosts.push({source:'decoration',name:'',target:'all',stat:'hp',flat:0,percent:0,enabled:true});}
    else s.boosts.splice(index,1);
    validate(data,next);state=next;invalidate();renderSquads();const section=$('#squads').children[side].querySelector('.account-boosts');section.open=true;message('');return;
  }
  const b=e.target.closest('[data-edit]');if(b)showEditor(...b.dataset.edit.split(',').map(Number));
});
$('#squads').addEventListener('change',e=>{
  const el=e.target;if(el.dataset.boost){
    if(!el.checkValidity()){el.reportValidity();return;}
    const [side,index,field]=el.dataset.boost.split(','),next=structuredClone(state),s=next.squads[Number(side)],row=s.boosts[Number(index)];
    row[field]=field==='enabled'?el.checked:['flat','percent'].includes(field)?Number(el.value):el.value;
    if(field==='stat'&&!statKeys.includes(row.stat))row.flat=0;
    if(field==='source'&&['fighter','component'].includes(row.source))s.fighterMode='components';
    try{validate(data,next);state=next;invalidate();renderSquads();message('');}catch(err){message(err.message);}return;
  }
  if(!el.dataset.field)return;
  if(!el.checkValidity()){el.reportValidity();return;}
  const next=structuredClone(state),s=next.squads[Number(el.dataset.side)],[field,stat]=el.dataset.field.split('.');
  if(stat){s[field]??={hp:0,attack:0,defense:0};s[field][stat]=Number(el.value);}else s[field]=['name','fighterMode'].includes(field)?el.value:Number(el.value);
  try{validate(data,next);state=next;invalidate();renderSquads();message('');}catch(err){message(err.message);}
});
$('#model-fields').addEventListener('change',e=>{
  const el=e.target;if(!el.dataset.model)return;if(!el.checkValidity()){el.reportValidity();return;}
  const next=structuredClone(state);next.model[el.dataset.model]=Number(el.value);
  try{validate(data,next);state=next;invalidate();message('');}catch(err){message(err.message);}
});
$('#per-hit').addEventListener('change',e=>{state.model.perHit=e.target.checked;invalidate();});
$('#close-editor').onclick=()=>$('#editor').close();
$('#editor').addEventListener('change',e=>{
  if(e.target.id==='override'){
    for(const k of statKeys)$(`#stat-${k}`).disabled=!e.target.checked;
    $('#final-stats').disabled=!e.target.checked;
  }
  if(['hero-id','hero-level','hero-stars','hero-substep'].includes(e.target.id)){
    if(!$('#hero-level').checkValidity()){ $('#hero-level').reportValidity();return; }
    const [side,slot]=editing,original=state.squads[side].heroes[slot],draft=editorHero();
    if(e.target.id==='hero-stars')draft.starStep=draft.stars*5;
    if(e.target.id==='hero-id'){draft.stats=null;draft.finalStats=false;draft.auto=null;draft.active=null;draft.power=0;}
    state.squads[side].heroes[slot]=draft;renderEditor();state.squads[side].heroes[slot]=original;
  }
});
$('#hero-form').onsubmit=e=>{
  e.preventDefault();const [side,slot]=editing,next=structuredClone(state);
  next.squads[side].heroes[slot]=editorHero();
  try{validate(data,next);state=next;$('#editor').close();invalidate();renderSquads();message('');}catch(err){message(err.message);}
};
$('#run').onclick=async()=>{
  if(!Array.from($('#squads').querySelectorAll('input')).every(el=>el.checkValidity())){message('Fix invalid squad inputs before running.');return;}
  if(!Array.from($('#model-fields').querySelectorAll('input')).every(el=>el.checkValidity())){message('Fix invalid model inputs before running.');return;}
  const button=$('#run');button.disabled=true;message('Running seeded trials…');
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try{result=simulate(data,state);const trials=Array.from({length:24},(_,i)=>simulate(data,state,state.model.seed+i+1).winner);renderBattle(trials);message('Sample complete. Results reflect the current assumptions; two real reports are documented; the damage model remains uncalibrated.');}catch(err){message(err.message);}finally{button.disabled=false;}
};
$('#swap').onclick=()=>{state.squads.reverse();invalidate();renderSquads();message('Squads swapped. A and B now refer to their new sides. Notebook snapshots retain their original sides.');};
$('#reset').onclick=()=>{const reports=state.reports;state=initialState();state.reports=reports;invalidate();renderSquads();renderModel();message('Demo squads and model reset. Battle notebook retained.');};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({...state,provenance:data.source},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='z-route-matchup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>2000000)throw Error('JSON exceeds the 2 MB limit.');const next=JSON.parse(await file.text());validate(data,next);state=next;invalidate();renderSquads();renderModel();renderReports();message('Imported matchup and notebook.');}catch(err){message('Import rejected: '+err.message+' Existing data retained.');}finally{e.target.value='';}
};
$('#report-form').onsubmit=e=>{e.preventDefault();if(!result){message('Run the current matchup before saving a comparison.');return;}if(state.reports.length>=500){message('Notebook is full (500 reports). Export your data before starting a new notebook.');return;}state.reports.push({date:new Date().toISOString(),actual:$('#actual').value,predicted:result.winner,note:$('#note').value,source:data.source.revision,snapshot:{version:1,squads:structuredClone(state.squads),model:{...state.model},reports:[]},sample:{time:result.time,survivors:result.survivors,remaining:result.remaining}});save();renderReports();$('#note').value='';message('Battle comparison saved on this device. Export JSON for a backup.');};
try{
  const response=await fetch('data.json');if(!response.ok)throw Error('Hero dataset could not be loaded.');data=await response.json();state=initialState();
  try{const raw=localStorage.getItem(key);if(raw){state=validate(data,JSON.parse(raw));}}catch(err){message('Saved data could not be loaded; showing the demo. '+err.message+' Import a JSON backup to restore.');$('#save-status').textContent='Previous saved data retained until you make a change';}
  renderSquads();renderModel();renderReports();$('#provenance').textContent=`Pinned revision ${data.source.revision.slice(0,12)}. ${data.source.catalogs}. Source files and their SHA-256 hashes are included in every export.`;
}catch(err){message('Unable to start: '+err.message+' Serve this folder over HTTP (see README).');$('#run').disabled=true;}

renderResearch().catch(err=>{$('#research-catalog').textContent='Research view unavailable: '+err.message;});
