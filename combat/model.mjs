export const defaults = {shieldScale:10, shieldAbsorb:80, soldierHP:0.1, soldierATK:0.001,
  critChance:5, critDamage:150, damageScale:1, firstCast:1, duration:120, perHit:true, seed:42};
export const statKeys = ['hp','attack','defense'];
export const boostSources={decoration:'Decorations / statues',decorBuff:'Decor buffs',fighter:'Fighter buffs',component:'Fighter components',hallOfFame:'Hall of Fame',tech:'Technology',gear:'Hero gear'};
export const boostStats={hp:'HP',attack:'ATK',defense:'DEF',critChance:'Critical chance (points)',critDamage:'Critical damage (points)',physical:'Physical damage',radiation:'Radiation damage',resist:'Damage reduction',speed:'Cooldown speed'};
const cap = (n, lo, hi) => Math.min(hi, Math.max(lo,n));
const pct = value => parseFloat(value || 0) / 100;
const sum = rows => Object.fromEntries(statKeys.map((k,i) => [k, rows.find(r=>r.type===10002+i)?.value || 0]));
export const heroById = (data,id) => data.heroes.find(h=>h.id===id);
export function lineup(data, slots) {
  const counts = Object.values(slots.reduce((o,h)=>{const c=heroById(data,h.id).camp_type;o[c]=(o[c]||0)+1;return o;},{})).sort((a,b)=>b-a);
  return Math.max(0,...data.lineup.filter(r=>counts[0]>=r.same_faction && (!r.second_faction || counts[1]>=r.second_faction)).map(r=>r.percent));
}
export function makeHero(id) {return {id,level:100,stars:3,starStep:15,power:0,stats:null,finalStats:false,auto:null,active:null};}
export function makeSquad(ids,name) {return {name,soldierPower:0,moraleDamage:100,fighterPower:0,fighterMode:'total',boosts:[],fighter:{hp:0,attack:0,defense:0},tech:{hp:0,attack:0,defense:0},decor:{hp:0,attack:0,defense:0},heroes:ids.map(makeHero)};}
export function initialState() {return {version:1,squads:[makeSquad([10007,50001,30006,20009,10005],'Squad A'),makeSquad([50004,50005,50006,50007,50008],'Squad B')],model:{...defaults},reports:[]};}
export function skillRow(skill, stars) {return skill?.by_star?.find(r=>r.star===stars);}
export function skillCap(skill,hero){return skillRow(skill,hero.stars)?.skill_level||1;}
export function heroSkill(skill,hero){
  const row=skillRow(skill,hero.stars);
  if(!row||hero.skillModel!=='recovered')return row;
  const source=skill.recovered;if(!source)throw Error('No recovered skill formula for this hero.');
  const level=hero.skillLevels?.[skill.slot-1]??skillCap(skill,hero),args=[...row.args];
  const value=params=>{const p=params[hero.stars];return p?(p.starBase+p.starGrow*level)*p.starFactor*100:null;};
  const primary=value(source.skillDescParams),secondary=value(source.skillDescParams2);
  if(primary!==null)args[0]=`${Math.floor(primary*100+.5)/100}%`;
  if(secondary!==null)args[source.skillCD>0?2:1]=`${Math.floor(secondary*100+.5)/100}%`;
  return {...row,skill_level:level,args,cooldown_s:source.skillCD,text:skill.template?skill.template.replace(/\{(\d+)\}/g,(_,i)=>args[i]??'—'):row.text};
}
export const usesEquipment=hero=>hero.gearMode==='items'||(hero.gearMode!=='rows'&&hero.gear?.some(Boolean));
export function equipmentStats(data,hero){
  const flat={hp:0,attack:0,defense:0},percent={hp:0,attack:0,defense:0},modifiers={},ignored=[],benefits=[];
  for(const entry of hero.gear||[]){
    if(!entry)continue;
    const item=data.equipment.items.find(r=>r.id===entry.id),level=item.strengthen_levels.find(r=>r.level===entry.level);
    benefits.push(...level.benefits,...item.strengthen_levels.filter(r=>r.level<=entry.level).flatMap(r=>r.additional_benefits));
    if(entry.promotion){
      const [lv,stage]=entry.promotion,p=item.promotion_levels.find(r=>r.level===lv&&r.stage===stage);
      benefits.push(...p.benefits,...item.promotion_levels.filter(r=>r.level<lv||(r.level===lv&&r.stage<=stage)).flatMap(r=>r.additional_benefits));
    }
  }
  const flatIds={10002:'hp',10003:'attack',10004:'defense'},pctIds={10005:'hp',10006:'attack',10007:'defense'};
  const extraIds={10030:'critChance',10031:'critAvoid',10033:'critResist',10035:'physicalResist',10036:'radiationResist',10037:'resist',10028:'counteredDamage',10029:'counteredResist'};
  for(const b of benefits){
    if(flatIds[b.type])flat[flatIds[b.type]]+=b.value;
    else if(pctIds[b.type])percent[pctIds[b.type]]+=b.value*100;
    else if(extraIds[b.type]){const key=extraIds[b.type];modifiers[key]=(modifiers[key]||0)+b.value*100;}
    else ignored.push({...b,reason:[10026,10027].includes(b.type)?'Monster-only effect; this is a PvP simulation':'Effect not modeled'});
  }
  return {flat,percent,modifiers,ignored};
}
export function isUnlocked(skill,hero) {return !!skill && hero.level>=skill.unlock_level && hero.stars>=skill.unlock_star;}
export function heroStats(data, hero) {
  const ref=heroById(data,hero.id);
  if(hero.stats) return {...hero.stats};
  const level=sum(data.levels[ref.level_curve_id].find(r=>r.level===hero.level).benefits);
  const star=sum(data.stars.find(r=>r.step===(hero.starStep??hero.stars*5)).benefits);
  // Recovered HeroUtils equation; values remain pinned to this dataset's catalog.
  return Object.fromEntries(statKeys.map(k=>[k,(level[k]+star[k])*ref.base_stats[k]/10000]));
}
export function accountStats(data,squad,hero) {
  const ref=heroById(data,hero.id),base=heroStats(data,hero),slot=squad.heroes.findIndex(h=>h.id===hero.id);
  const flat=Object.fromEntries(statKeys.map(k=>[k,(squad.fighterMode??'total')==='total'?(squad.fighter?.[k]||0):0]));
  const percent=Object.fromEntries(statKeys.map(k=>[k,squad.tech[k]+squad.decor[k]]));
  const modifiers=Object.fromEntries(Object.keys(boostStats).filter(k=>!statKeys.includes(k)).map(k=>[k,0]));
  const gear=equipmentStats(data,hero),equipped=usesEquipment(hero);
  if(equipped){for(const k of statKeys){flat[k]+=gear.flat[k];percent[k]+=gear.percent[k];}for(const [k,v] of Object.entries(gear.modifiers))modifiers[k]=(modifiers[k]||0)+v;}
  const applied=[];
  for(const row of squad.boosts||[]) {
    if(row.source==='gear'&&equipped)continue;
    if(!row.enabled||(['fighter','component'].includes(row.source)&&(squad.fighterMode??'total')!=='components'))continue;
    const on=row.target==='all'||row.target===`hero:${hero.id}`||row.target===`camp:${ref.camp_type}`||(row.target==='front'&&slot>=0&&slot<2)||(row.target==='back'&&slot>=2);
    if(!on)continue;
    applied.push(row);
    if(statKeys.includes(row.stat)){flat[row.stat]+=row.flat;percent[row.stat]+=row.percent;}
    else modifiers[row.stat]+=row.percent;
  }
  const specialty=ref.skills.find(sk=>['Doomsday Judgment','Wasteland Wanderer','Survival Expert'].includes(sk.name));
  const talent=isUnlocked(specialty,hero)?({UR:.2,SSR:.1,SR:.05}[ref.quality_name]||0):0;
  const pass=ref.skills.find(sk=>sk.slot===3&&sk.name!=='Survival Expert');
  const args=isUnlocked(pass,hero)?(heroSkill(pass,hero)?.args||[]):[];
  const passive=Object.fromEntries(statKeys.map(k=>[k,0]));
  if([10005,20009,30004,50007].includes(hero.id))passive.attack=parseFloat(args[0])||0;
  if(hero.id===10008)passive.defense=parseFloat(args[0])||0;
  const lineupBonus=lineup(data,squad.heroes)*100;
  // Recovered display grouping keeps gear/fighter/decor flat stats outside growth percentages.
  // ponytail: lineup/talent combat stacking is still combined here; replace with validated battle-source groups when known.
  const stats=Object.fromEntries(statKeys.map(k=>[k,hero.finalStats?base[k]:base[k]*(1+(percent[k]+passive[k]+lineupBonus+talent*100)/100)+flat[k]]));
  return {stats,base,flat,percent,passive,lineupBonus,talent,modifiers,applied,gear};
}
export function combatStats(data,squad,hero,model){
  const account=accountStats(data,squad,hero),soldiers=hero.finalStats?0:squad.soldierPower/5;
  const start={hp:account.stats.hp+soldiers*model.soldierHP,attack:account.stats.attack+soldiers*model.soldierATK,defense:account.stats.defense};
  return {...account,start,shield:start.defense*model.shieldScale};
}
function number(value,lo,hi,name,integer=false) {
  if(typeof value!=='number'||!Number.isFinite(value)||value<lo||value>hi||(integer&&!Number.isInteger(value))) throw Error(`${name} must be ${integer?'a whole number ':''}between ${lo} and ${hi}.`);
}
export function validate(data,state) {
  if(!state||state.version!==1||!Array.isArray(state.squads)||state.squads.length!==2) throw Error('Expected a version 1 matchup with two squads.');
  if(!state.model||!Array.isArray(state.reports)||state.reports.length>500) throw Error('Invalid model or report history (maximum 500 reports).');
  for(const s of state.squads) {
    if(typeof s.name!=='string'||s.name.length>60||!Array.isArray(s.heroes)||s.heroes.length!==5) throw Error('Each squad needs a name and five heroes.');
    if(new Set(s.heroes.map(h=>h.id)).size!==5) throw Error('A hero cannot occupy two slots in the same squad.');
    number(s.soldierPower,0,1e10,'Soldier power');
    if(s.moraleDamage!==undefined)number(s.moraleDamage,0,1000,'Reported morale damage %');
    if(s.fighter!==undefined)for(const k of statKeys)number(s.fighter[k],0,1e10,`Fighter ${k}`);
    if(s.fighterPower!==undefined)number(s.fighterPower,0,1e10,'Fighter reference power');
    if(s.fighterMode!==undefined&&!['total','components'].includes(s.fighterMode))throw Error('Choose fighter totals or component rows.');
    if(s.boosts!==undefined){
      if(!Array.isArray(s.boosts)||s.boosts.length>100)throw Error('Maximum 100 boost rows per squad.');
      const targets=['all','front','back','camp:1','camp:2','camp:3',...data.heroes.map(h=>`hero:${h.id}`)];
      for(const row of s.boosts){
        if(!row||!Object.hasOwn(boostSources,row.source)||!Object.hasOwn(boostStats,row.stat)||!targets.includes(row.target)||typeof row.enabled!=='boolean'||typeof row.name!=='string'||row.name.length>80)throw Error('Invalid account boost row.');
        number(row.flat,0,1e10,'Flat boost');number(row.percent,0,10000,'Boost percent');
        if(!statKeys.includes(row.stat)&&row.flat!==0)throw Error('Only HP, ATK and DEF support flat boost values.');
      }
    }
    for(const group of ['tech','decor']) for(const k of statKeys) number(s[group]?.[k],0,10000,`${group} ${k}`);
    for(const h of s.heroes) {
      if(!heroById(data,h.id)) throw Error('Unknown hero.');
      if(h.skillModel!==undefined&&!['reference','recovered'].includes(h.skillModel))throw Error('Invalid skill formula set.');
      if(h.skillModel==='recovered'&&heroById(data,h.id).skills.some(sk=>sk.slot<=3&&!sk.recovered))throw Error('Recovered formulas are unavailable for this hero.');
      if(h.skillLevels!==undefined){
        if(!Array.isArray(h.skillLevels)||h.skillLevels.length!==4)throw Error('Expected four skill level entries.');
        h.skillLevels.forEach((lv,i)=>{if(lv!==null)number(lv,1,skillCap(heroById(data,h.id).skills.find(sk=>sk.slot===i+1),h),'Skill level',true);});
      }
      if(h.gearMode!==undefined&&!['items','rows'].includes(h.gearMode))throw Error('Choose equipped gear or account gear rows.');
      if(h.gear!==undefined){
        if(!Array.isArray(h.gear)||h.gear.length!==4)throw Error('Expected four gear slots.');
        h.gear.forEach((entry,slot)=>{
          if(entry===null)return;
          const item=data.equipment?.items.find(r=>r.id===entry?.id&&r.slot===slot);
          if(!item||!item.strengthen_levels.some(r=>r.level===entry.level))throw Error('Invalid gear item or upgrade level for this slot.');
          if(entry.promotion!==null&&(!Array.isArray(entry.promotion)||entry.promotion.length!==2||!item.promotion_levels.some(r=>r.level===entry.promotion[0]&&r.stage===entry.promotion[1])))throw Error('Invalid gear promotion.');
        });
      }
      number(h.level,1,150,'Hero level',true);number(h.stars,0,5,'Stars',true);number(h.power,0,1e10,'Hero power');
      if(h.starStep!==undefined){number(h.starStep,0,25,'Star step',true);if(Math.floor(h.starStep/5)!==h.stars)throw Error('Star step must match the selected whole stars.');}
      if(h.finalStats!==undefined&&typeof h.finalStats!=='boolean')throw Error('Invalid final combat stat setting.');
      if(h.finalStats&&!h.stats)throw Error('Final combat stats require entered HP, ATK and DEF.');
      if(h.stats!==null) for(const k of statKeys) number(h.stats?.[k],k==='hp'?1:0,1e10,`Displayed ${k}`);
      for(const k of ['auto','active']) if(h[k]!==null) number(h[k],0,100000,'Skill coefficient');
    }
  }
  const limits={shieldScale:[0,1000],shieldAbsorb:[0,100],soldierHP:[0,1000],soldierATK:[0,100],critChance:[0,100],critDamage:[100,1000],damageScale:[0.001,100],firstCast:[0,30],duration:[10,300],seed:[1,2147483647]};
  for(const [k,[lo,hi]] of Object.entries(limits)) number(state.model[k],lo,hi,k,['seed','duration'].includes(k));
  if(typeof state.model.perHit!=='boolean') throw Error('Invalid multi-hit setting.');
  for(const r of state.reports) if(!r||typeof r.note!=='string'||r.note.length>500||!['A','B','draw'].includes(r.actual)||!['A','B','draw'].includes(r.predicted)) throw Error('Invalid battle report.');
  return state;
}
function random(seed) {let s=seed>>>0;return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
const activeDamage = {
  10005:['random',4],10006:['front',1],20009:['random',2],30001:['front',2],30003:['front',1],
  30004:['front',2],30005:['random',5],30006:['random','arg'],30011:['front',2],31003:['front',1],
  40001:['front',2],40002:['front',2],40010:['front',1],50003:['random','arg'],50004:['all',5],
  50006:['all',5],50007:['back','arg'],50008:['random','arg'],50011:['back',3],50012:['random',3],50013:['all',5]
};
const unsupported = {30001:'Venom ATK debuff',50004:'Radiation damage debuff',50007:'Stun',50008:'Stacking DEF shred',50009:'Guard counterattacks and doubled Guard passive',50010:'Taunt and ATK debuff'};
export function coverage(data,state) {
  const notes=new Set(['Growth percentages and flat boosts are separated. Lineup/talent stacking still needs battle validation. Final HP/ATK/DEF entry bypasses these additions.','Soldier power conversion, DEF shield behavior, target selection, timing, stacking and critical hits are hypotheses.','Hero editors support actual skill levels using recovered June coefficients; the reference-cap option preserves earlier values. Hit counts, targeting, durations and authoritative timing remain approximate.','Morale uses the damage percentage you enter from a report; no formula is inferred from rounded morale totals.','Temporary DEF is approximated as added shield that does not expire. Passive auras persist after their source dies.','Displayed decoration, fighter/component, Hall of Fame, tech and gear boosts can be entered with targets. Equipped gear levels derive stat effects from the pinned August catalog; other account boosts remain entered values. Fighter/gear procs, exclusive weapons and seasonal mechanics remain unmodeled.']);
  state.squads.forEach(s=>s.heroes.forEach(h=>{const ref=heroById(data,h.id);if(unsupported[h.id])notes.add(`${ref.display_name}: ${unsupported[h.id]} not simulated.`);}));
  return [...notes];
}
export function simulate(data,state,seed=state.model.seed) {
  validate(data,state);
  const m=state.model,rng=random(seed),teams=[],log=[],timeline=[];
  const logEvent=(time,text)=>{if(log.length<160)log.push({time:+time.toFixed(1),text});};
  for(let side=0;side<2;side++) {
    const s=state.squads[side];
    teams.push(s.heroes.map((h,slot)=>{
      const ref=heroById(data,h.id),skills=ref.skills,account=combatStats(data,s,h,m),stats=account.start;
      const pass=skills.find(sk=>sk.slot===3&&sk.name!=='Survival Expert');
      const args=isUnlocked(pass,h)?(heroSkill(pass,h)?.args||[]):[];
      const talent=account.talent,extra=account.modifiers;
      let atk=stats.attack,def=stats.defense,crit=m.critChance/100,resist=0,physical=0,radiation=0,physicalResist=0,radiationResist=0,speed=talent===.2?.1:0;
      if([50003,50006,50012].includes(h.id))crit+=pct(args[0]);
      if([30006,50011].includes(h.id))radiation=pct(args[0]);
      if([50008,50013].includes(h.id))physical=pct(args[0]);
      if([50001,50010].includes(h.id))resist=pct(args[0]);
      if(h.id===50004)radiationResist=pct(args[0]);
      if(h.id===50002)speed+=pct(args[0]);
      crit+=extra.critChance/100;physical+=extra.physical/100;radiation+=extra.radiation/100;speed+=extra.speed/100;
      resist=1-(1-resist)*(1-cap(extra.resist/100,0,.95));
      physicalResist=cap(physicalResist+(extra.physicalResist||0)/100,0,.95);radiationResist=cap(radiationResist+(extra.radiationResist||0)/100,0,.95);
      const hp=stats.hp;
      return {...h,ref,side,slot,maxHP:hp,hp,shield:account.shield,atk:atk,morale:(s.moraleDamage??100)/100,critMultiplier:(m.critDamage+extra.critDamage)/100,critAvoid:cap((extra.critAvoid||0)/100,0,1),critResist:cap((extra.critResist||0)/100,0,.95),counteredDamage:(extra.counteredDamage||0)/100,counteredResist:cap((extra.counteredResist||0)/100,0,.95),account,def,crit:cap(crit,0,1),resist:cap(resist,0,.95),physical,radiation,physicalResist,radiationResist,speed,passArgs:args,effects:[],nextAuto:0,nextSkill:m.firstCast,damage:0};
    }));
  }
  // ponytail: passives persist after their source dies; replace when battle evidence establishes aura lifetime.
  for(const team of teams) for(const source of team) {
    const a=source.passArgs;
    if([10007,50005,50009].includes(source.id))for(const target of team.filter(x=>x.slot<2)){target.resist=1-(1-target.resist)*(1-pct(a[0]));if(source.id===50005)target.radiationResist=1-(1-target.radiationResist)*(1-pct(a[1]));}
    if(source.id===50002){const target=team.reduce((a,b)=>a.atk>b.atk?a:b);target.resist=1-(1-target.resist)*(1-pct(a[1]));}
  }
  for(const team of teams)for(const h of team){h.resist=cap(h.resist,0,.95);h.physicalResist=cap(h.physicalResist,0,.95);h.radiationResist=cap(h.radiationResist,0,.95);}
  const alive = side => teams[side].filter(h=>h.hp>0);
  const effect = (h,key,time) => h.effects.filter(e=>e.key===key&&e.until>time).reduce((n,e)=>n+e.value,0);
  function pick(enemies,mode,count) {
    if(!enemies.length)return [];
    const front=enemies.filter(h=>h.slot<2),back=enemies.filter(h=>h.slot>=2);
    const pool=mode==='front'?(front.length?front:enemies):mode==='back'?(back.length?back:enemies):enemies;
    if(mode==='lowest')return [pool.reduce((a,b)=>a.hp/a.maxHP<b.hp/b.maxHP?a:b)];
    if(mode==='all')return pool;
    if(mode==='random')return Array.from({length:count},()=>pool[Math.floor(rng()*pool.length)]);
    return pool.slice(0,count); // deterministic row priority
  }
  function hit(attacker,target,coefficient,type,time,pending) {
    const counter=data.counters.find(c=>c.camp===target.ref.camp_type&&c.beats_camp===attacker.ref.camp_type)?.damage_reduction||0;
    const rad=type==='Radiation DMG',bonus=rad?attacker.radiation:attacker.physical;
    const resistance=rad?target.radiationResist:target.physicalResist;
    const tempResist=effect(target,'resist',time)+effect(target,rad?'radiationResist':'physicalResist',time);
    const critical=rng()<cap(attacker.crit-target.critAvoid,0,1)?attacker.critMultiplier*(1-target.critResist):1;
    const targetCountered=data.counters.some(c=>c.camp===attacker.ref.camp_type&&c.beats_camp===target.ref.camp_type);
    const damage=attacker.atk*(1+effect(attacker,'attack',time))*coefficient*(1+bonus)*critical*(1-counter)*(1-target.resist)*(1-resistance)*(1-cap(tempResist,0,.95))*m.damageScale*attacker.morale*(counter?1+attacker.counteredDamage:1)*(targetCountered?1-target.counteredResist:1);
    pending.push({attacker,target,damage});
  }
  function buff(source,key,value,seconds,time,targets) {for(const h of targets){h.effects=h.effects.filter(e=>e.source!==source.slot||e.key!==key);h.effects.push({source:source.slot,key,value,until:time+seconds});}}
  const initial=teams.map(t=>t.reduce((n,h)=>n+h.maxHP,0));
  let end=0;
  for(let tick=0;tick<=m.duration*10;tick++) {
    const time=tick/10,pending=[],living=[alive(0),alive(1)];end=time;
    if(!living[0].length||!living[1].length)break;
    for(const team of living) for(const h of team) {
      const auto=h.ref.skills.find(s=>s.slot===1),active=h.ref.skills.find(s=>s.slot===2),enemies=living[1-h.side];
      if(time+1e-8>=h.nextAuto){
        const autoRow=heroSkill(auto,h),coefficient=h.auto===null?pct(autoRow?.args[0]):h.auto/100;
        const mode=h.id===10006||h.id===50009?'random':h.id===50012?'lowest':'front';
        const targets=pick(enemies,mode,h.id===10006?2:1);
        for(const target of targets)hit(h,target,coefficient/(m.perHit?1:targets.length),auto.effect_type,time,pending);
        h.nextAuto=time+Math.max(.1,(autoRow?.cooldown_s??auto.cooldown_s)/(1+h.speed));
      }
      if(!isUnlocked(active,h)||time+1e-8<h.nextSkill)continue;
      const row=heroSkill(active,h),a=row?.args||[],recipe=activeDamage[h.id];
      if(recipe){
        const count=recipe[1]==='arg'?Math.max(1,parseInt(a[2])||1):recipe[1];
        const targets=pick(enemies,recipe[0],count),coefficient=h.active===null?pct(a[0]):h.active/100;
        for(const target of targets)hit(h,target,coefficient/(m.perHit?1:targets.length),active.effect_type==='Debuff'?'Physical DMG':active.effect_type,time,pending);
        logEvent(time,`${h.side?'B':'A'} · ${h.ref.display_name}: ${active.name} (${targets.length} hit${targets.length===1?'':'s'})`);
      } else {
        let targets=living[h.side],key=null,value=pct(a[0]),seconds=parseFloat(a[2])||6;
        if(h.id===10007){key='physicalResist';if(h.stars<4)targets=targets.filter(x=>x.slot<2);}
        if(h.id===50005)key='radiationResist';
        if(h.id===50002)key='attack';
        if([20006,50001].includes(h.id)){
          // ponytail: temporary DEF grants a shield once per cast; restoration/stacking requires battle calibration.
          for(const target of targets.filter(x=>x.slot<2))target.shield+=target.def*value*m.shieldScale;
          logEvent(time,`${h.side?'B':'A'} · ${h.ref.display_name}: temporary DEF modeled as shield`);
        }
        if(key){buff(h,key,value,seconds,time,targets);logEvent(time,`${h.side?'B':'A'} · ${h.ref.display_name}: ${active.name}`);}
      }
      h.nextSkill=time+Math.max(.1,(row?.cooldown_s??active.cooldown_s)/(1+h.speed));
    }
    // Resolve both squads' attacks together, so simultaneous lethal hits can draw.
    for(const {attacker,target,damage} of pending) {
      const absorbed=Math.min(target.shield,damage*m.shieldAbsorb/100);
      target.shield-=absorbed;target.hp=Math.max(0,target.hp-(damage-absorbed));attacker.damage+=damage;
    }
    for(const team of living) for(const h of team)if(h.hp<=0)logEvent(time,`${h.side?'B':'A'} · ${h.ref.display_name} defeated`);
    if(tick%10===0)timeline.push({time,A:teams[0].reduce((n,h)=>n+h.hp,0)/initial[0]*100,B:teams[1].reduce((n,h)=>n+h.hp,0)/initial[1]*100});
    if(teams.some(team=>team.every(h=>h.hp<=0)))break;
  }
  const remaining=teams.map(t=>t.reduce((n,h)=>n+h.hp,0)),survivors=teams.map(t=>t.filter(h=>h.hp>0).length);
  const winner=survivors[0]&&!survivors[1]?'A':survivors[1]&&!survivors[0]?'B':'draw';
  timeline.push({time:end,A:remaining[0]/initial[0]*100,B:remaining[1]/initial[1]*100});
  return {winner,time:end,timedOut:survivors.every(n=>n>0),teams,remaining,survivors,timeline,log};
}
