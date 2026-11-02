export function skillValue(row,starStep,level) {
  const p=row.params[Math.floor(starStep/5)];
  if(!p)return null;
  const value=(p.starBase+p.starGrow*level)*p.starFactor*100;
  const q=row.params2[Math.floor(starStep/5)];
  return {percent:value,secondPercent:q?(q.starBase+q.starGrow*level)*q.starFactor*100:0};
}
export function soldierStats(row,flat,percent,factors) {
  const ids=[10093,10094,10095,10096];
  const stats=ids.map((id,i)=>(row.soldierBenefit.find(b=>b.Type===id)?.Value||0)+flat[i]).map((n,i)=>n*(1+percent[i]/100));
  return {stats,power:Math.ceil(stats.reduce((n,v,i)=>n+v*factors[ids[i]],0))};
}
const $=s=>document.querySelector(s);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n.toLocaleString(undefined,{maximumFractionDigits:2});
export async function renderResearch(){
  const response=await fetch('research.json');if(!response.ok)throw Error('Research data could not be loaded.');
  const data=await response.json();
  $('#research-catalog').textContent=`Recovered Android catalog ${data.catalog} · analyzed ${data.analysis_date}. Older than your iPhone reports. English hero labels come from JeffxLabs.`;
  $('#source-star').innerHTML=Array.from({length:26},(_,n)=>`<option value="${n}">${Math.floor(n/5)} stars + ${n%5} steps</option>`).join('');
  $('#source-skill').innerHTML=data.skills.map((r,i)=>`<option value="${i}">${esc(r.hero_name)} / ${r.slot}: ${esc(r.name)}</option>`).join('');
  function renderSkill(){
    const row=data.skills[Number($('#source-skill').value)],step=Number($('#source-star').value),cap=data.skill_caps[step][row.slot-1],input=$('#source-level');
    input.max=cap;if(Number(input.value)>cap)input.value=cap;
    if(!input.checkValidity()||!$('#source-star').checkValidity()){ $('#source-skill-result').textContent='Enter a valid star step and skill level.';return; }
    const result=skillValue(row,step,Number(input.value));
    $('#source-skill-result').textContent=result?`Parameter 1: ${fmt(result.percent)}% · Parameter 2: ${fmt(result.secondPercent)}% · Base cooldown: ${fmt(row.base_cd)}s · Skill level cap: ${cap}`:'No parameter row in this catalog.';
  }
  for(const id of ['source-skill','source-star','source-level'])$('#'+id).addEventListener('change',renderSkill);
  renderSkill();
  $('#source-soldier').innerHTML=data.soldiers.map((r,i)=>`<option value="${i}">T${r.level} / ID ${r.id}</option>`).join('');
  function renderSoldier(){
    const form=$('#soldier-calculator');if(!form.checkValidity()){ $('#source-soldier-result').textContent='Enter valid soldier inputs.';return; }
    const flat=[...form.querySelectorAll('[data-flat]')].map(el=>Number(el.value)),percent=[...form.querySelectorAll('[data-percent]')].map(el=>Number(el.value));
    const r=soldierStats(data.soldiers[Number($('#source-soldier').value)],flat,percent,data.power_factors),count=Number($('#source-count').value);
    $('#source-soldier-result').textContent=`Per soldier — HP ${fmt(r.stats[0])} · ATK ${fmt(r.stats[1])} · DEF ${fmt(r.stats[2])} · morale ${fmt(r.stats[3])}. Calculated power ${r.power}; ${fmt(count)} soldiers = ${fmt(r.power*count)} power. This does not derive combat damage.`;
  }
  $('#soldier-calculator').addEventListener('submit',e=>e.preventDefault());
  $('#soldier-calculator').addEventListener('change',renderSoldier);renderSoldier();
  function renderEnemy(){
    const term=$('#enemy-search').value.trim().toLowerCase();
    const rows=data.monsters.filter(r=>`${r.id} ${r.attrId} ${r.clientShowlevel} ${r.name}`.toLowerCase().includes(term));
    $('#enemy-list').innerHTML=rows.map(r=>`<option value="${r.id}">ID ${r.id} / shown Lv ${r.clientShowlevel} / ${esc(r.name)}</option>`).join('');
    $('#enemy-count').textContent=`${rows.length} of 646 records · 165 unresolved template references`;
    showEnemy();
  }
  function showEnemy(){
    const row=data.monsters.find(r=>r.id===Number($('#enemy-list').value));
    if(!row){$('#enemy-detail').textContent='No matching enemy record.';return;}
    const template=data.templates[row.attrId];
    $('#enemy-detail').textContent=JSON.stringify({catalog:data.catalog,monster:row,status:template?'Historical client template; not verified live stats':'Unresolved template reference; no stats substituted',template:template||null,hero_factors:template?Object.fromEntries(template.hero.map(h=>[h.id,data.npc_heroes[h.id]])):null},null,2);
  }
  $('#enemy-search').addEventListener('input',renderEnemy);$('#enemy-list').addEventListener('change',showEnemy);renderEnemy();
  $('#pvp-evidence').innerHTML=`<p>Report ${esc(data.pvp.id)} · ${esc(data.pvp.duration)} · Blue lost despite higher power. Both sides have five Warriors and +20% HP/ATK/DEF; red has a reported 103% morale damage modifier.</p><div class="table-scroll"><table class="damage-table"><thead><tr><th>HERO</th><th>BLUE LEVEL</th><th>BLUE DAMAGE</th><th>RED LEVEL</th><th>RED DAMAGE</th></tr></thead><tbody>${data.pvp.blue.heroes.map((h,i)=>`<tr><td>${esc(h.name)}</td><td>${h.level}</td><td>${fmt(h.damage_dealt)}</td><td>${data.pvp.red.heroes[i].level}</td><td>${fmt(data.pvp.red.heroes[i].damage_dealt)}</td></tr>`).join('')}</tbody></table></div><p>Power: blue ${fmt(data.pvp.blue.power)} / red ${fmt(data.pvp.red.power)}. Exact outgoing versus opposing incoming totals differ by 147,251 and 146,399. Green/pink map to client fields dmgInc/dmgRed; their precise accounting is unverified.</p>`;
  $('#research-download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='z-route-research-facts.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
