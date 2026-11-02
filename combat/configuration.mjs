export const scenarios={arena:'Arena / neutral matchup',baseAttack:'A attacks B’s base',baseDefense:'A defends against B',gatherAttack:'A attacks B at a gathering site',gatherDefense:'A defends a gathering site',field:'A attacks B in the field',convoyAttack:'A attacks B’s convoy',convoyDefense:'A defends a convoy',monster:'A attacks a monster / horde'};
export function battleContext(state,side){
  const b=state.battle||{},scenario=b.scenario||'arena';
  const scene=scenario.startsWith('base')?'base':scenario.startsWith('gather')?'gather':scenario.startsWith('convoy')?'convoy':scenario;
  const attacker=scenario.endsWith('Defense')?1:0;
  return {scene,role:scene==='arena'?'neutral':side===attacker?'attack':'defend',squadBonuses:b.squadBonuses!==false,defenses:b.defenses!==false,lineup:b.lineup!==false,monster:scene==='monster'&&side===attacker};
}
const add=(map,rows)=>{for(const [type,value] of rows)map[type]=(map[type]||0)+value;};
export function fighterStats(data,squad){
  const f=squad.fighterConfig||{level:1,components:[0,0,0,0,0,0],other:[0,0,0]},catalog=data.configuration.fighter;
  const level=catalog.levels.find(r=>r.id===f.level),components={},fighter={},hero={};
  for(const id of f.components)if(id)add(components,catalog.components[id].benefits);
  add(fighter,level.benefits);add(hero,level.converted);
  level.benefits.forEach(([type],i)=>{const extra=(components[type]||0)+(f.other?.[i]||0);fighter[type]+=extra;const heroType=level.converted[i][0];hero[heroType]+=(extra*level.uavConv[i]/10000);});
  for(const [type,value] of Object.entries(components))if(![10156,10157,10158].includes(+type))hero[type]=(hero[type]||0)+value;
  return {level,fighter,hero,components,power:level.power+f.components.reduce((sum,id)=>sum+(catalog.components[id]?.power||0),0)};
}
// Benefit IDs, rather than translated name matching, define targeting and battle conditions.
export function benefitRule(id){
  const flat={10002:'hp',10003:'attack',10004:'defense',10093:'soldierHP',10094:'soldierATK',10095:'soldierDEF',10096:'soldierMorale'};
  const common={10005:'hp',10006:'attack',10007:'defense',10017:'damage',10018:'physical',10019:'radiation',10023:'resist',10024:'physicalResist',10025:'radiationResist',10028:'counteredDamage',10029:'counteredResist',10030:'critChance',10031:'critAvoid',10032:'critDamage',10033:'critResist',10034:'speed',10035:'physicalResist',10036:'radiationResist',10037:'resist',10097:'soldierHP',10098:'soldierATK',10099:'soldierDEF',10100:'soldierMorale'};
  if(flat[id])return {stat:flat[id],flat:true};
  if(common[id])return {stat:common[id]};
  if(id>=10008&&id<=10016)return {stat:['hp','attack','defense'][(id-10008)%3],camp:1+Math.floor((id-10008)/3)};
  if(id>=10020&&id<=10022)return {stat:'damage',camp:id-10019};
  if(id===10026||id===10027)return {stat:id===10026?'damage':'resist',monster:true};
  if(id===6102||id===6103)return {stat:'allStats',scene:'convoy',role:id===6102?'attack':'defend'};
  if(id>=10041&&id<=10052){const n=id-10041;return {stat:['attack','defense','hp'][n%3],scene:n<6?'convoy':'pvp',role:Math.floor(n/3)%2?'defend':'attack'};}
  if(id>=10053&&id<=10092){const n=id-10053,part=n%10;return {stat:['attack','attack','defense','defense','hp','hp','damage','resist','physical','radiation'][part],squad:1+Math.floor(n/10),...(part<6?{scene:'base',role:part%2?'defend':'attack'}:part<8?{monster:true}:{})};}
  if(id>=10128&&id<=10155){const n=id-10128;if(n%7<3)return {stat:['attack','defense','hp'][n%7],squad:1+Math.floor(n/7)};}
  return null;
}
export function researchEffects(data,squad,context={scene:'arena',role:'neutral',squadBonuses:true,defenses:true}){
  const r=squad.research||{},effects=[],excluded=[];
  if(r.mode!=='nodes')return {effects,excluded};
  for(const tree of data.configuration.research)for(const tech of tree.techs){
    const level=r.levels?.[tech.id]||0;if(!level)continue;
    for(const b of tech.levels.find(l=>l.level===level).benefits){
      const rule=benefitRule(b.type),name=data.configuration.benefits[b.type]?.name||`Benefit ${b.type}`;
      let reason=!rule?'Effect not simulated':rule.squad&&(rule.squad!==(r.squad||1)||!context.squadBonuses)?'Squad bonus inactive':rule.monster&&!context.monster?'Monster target required':rule.scene==='pvp'&&['arena','convoy','monster'].includes(context.scene)?'World PvP required':rule.scene&&rule.scene!=='pvp'&&rule.scene!==context.scene?'Different battle scenario':rule.role&&rule.role!==context.role?'Different attacking / defending role':rule.role==='defend'&&!context.defenses?'Defense bonuses disabled':null;
      if(reason)excluded.push({name,tech:tech.name,reason,value:b.value,type:b.type});
      else effects.push({...b,...rule,name,tech:tech.name});
    }
  }
  return {effects,excluded};
}
export function troopStats(data,squad,context){
  if(squad.soldierMode!=='troops')return {power:squad.soldierPower,stats:null};
  const row=data.configuration.soldiers.find(r=>r.id===squad.troops.id),effects=researchEffects(data,squad,context).effects;
  const stats=['soldierHP','soldierATK','soldierDEF','soldierMorale'].map((stat,i)=>{
    const flat=effects.filter(e=>e.stat===stat&&e.flat).reduce((n,e)=>n+e.value,0),percent=effects.filter(e=>e.stat===stat&&!e.flat).reduce((n,e)=>n+e.value,0);
    return ((row.soldierBenefit.find(b=>b.Type===10093+i)?.Value||0)+flat)*(1+percent);
  });
  const perSoldier=Math.ceil(stats[0]*.5+stats[1]*12.5+stats[2]*35);
  return {power:perSoldier*squad.troops.count,perSoldier,stats};
}
